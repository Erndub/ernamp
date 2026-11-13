#!/usr/bin/env python3
"""
erndub unified server — phone remote + DAB/RF (RTL-SDR) on one port.

Usage:
  python3 remote_server.py           # port 8080
  python3 remote_server.py 9090

PC:    http://localhost:8080/ernamp.html
Phone: http://<PC-LAN-IP>:8080/remote.html

APIs:
  Remote:  /api/ping  /api/state  /api/cmd  /api/host/poll  /api/host/hello
  RF/DAB:  /api/status  /api/mode  /api/rf/*  /api/dab/*  /dab/stream
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080

_lock = threading.Lock()

# ── Phone remote relay ──────────────────────────────────────────────
_cmds = []
_media_state = {
    "title": "—",
    "playing": False,
    "vol": 0.7,
    "muted": False,
    "mode": "",
    "playlistLen": 0,
    "host": False,
    "ts": 0,
    "rfAlert": None,
}
_host_seen = 0.0

# ── RTL / DAB ───────────────────────────────────────────────────────
_rtl = {
    "mode": "idle",  # idle | rf | dab
    "dongle": "unknown",
    "tools": {},
    "tools_paths": {},
    "rf": {
        "busy": False,
        "last_sweep": None,
        "last_peak": None,
        "last_points": None,  # compact bins for CRT
        "last_433": None,
        "error": None,
    },
    "dab": {
        "stream_url": os.environ.get("ERNDUB_DAB_STREAM", ""),
        "label": os.environ.get("ERNDUB_DAB_LABEL", ""),
        "note": "Point stream_url at a local DAB decoder HTTP audio output.",
    },
    "ts": 0.0,
}

RF_PRESETS = [
    {"id": "433", "label": "433 MHz ISM (fobs / sensors)", "start_mhz": 433.0, "end_mhz": 434.0, "bin_khz": 2},
    {"id": "434", "label": "434 MHz narrow", "start_mhz": 433.8, "end_mhz": 434.1, "bin_khz": 1},
    {"id": "315", "label": "315 MHz (some regions)", "start_mhz": 314.5, "end_mhz": 315.5, "bin_khz": 2},
    {"id": "868", "label": "868 MHz ISM", "start_mhz": 868.0, "end_mhz": 869.0, "bin_khz": 2},
    {"id": "fm", "label": "Broadcast FM", "start_mhz": 88.0, "end_mhz": 108.0, "bin_khz": 50},
]


def _json_response(handler, code, obj):
    body = json.dumps(obj).encode("utf-8")
    handler.send_response(code)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.end_headers()
    handler.wfile.write(body)


def _read_json(handler):
    length = int(handler.headers.get("Content-Length") or 0)
    if length <= 0:
        return {}
    try:
        return json.loads(handler.rfile.read(length).decode("utf-8") or "{}")
    except Exception:
        return {}


def _which(name):
    return shutil.which(name)


def detect_tools():
    tools = {
        "rtl_test": _which("rtl_test"),
        "rtl_power": _which("rtl_power"),
        "rtl_433": _which("rtl_433"),
        "rtl_fm": _which("rtl_fm"),
        "rtl_tcp": _which("rtl_tcp"),
    }
    dongle = "unknown"
    if tools["rtl_test"]:
        try:
            r = subprocess.run([tools["rtl_test"], "-t"], capture_output=True, text=True, timeout=8)
            out = (r.stdout or "") + (r.stderr or "")
            if "No supported devices" in out:
                dongle = "missing"
            elif r.returncode == 0 or "Found" in out or "Using device" in out:
                dongle = "present"
        except Exception:
            pass
    with _lock:
        _rtl["tools"] = {k: bool(v) for k, v in tools.items()}
        _rtl["tools_paths"] = {k: v or "" for k, v in tools.items()}
        _rtl["dongle"] = dongle
        _rtl["ts"] = time.time()
    return tools


def parse_rtl_power_csv(text: str):
    points = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = [p.strip() for p in line.split(",")]
        if len(parts) < 7:
            continue
        try:
            hz_low = float(parts[2])
            step = float(parts[4])
            samples = parts[6:]
            for i, s in enumerate(samples):
                if s == "":
                    continue
                points.append({
                    "freq_mhz": (hz_low + i * step) / 1e6,
                    "power_db": float(s),
                })
        except Exception:
            continue
    peak = max(points, key=lambda p: p["power_db"]) if points else None
    return points, peak


def _compact_bins(points, n=64):
    """Downsample sweep points for CRT / phone viz."""
    if not points:
        return []
    if len(points) <= n:
        return [{"f": round(p["freq_mhz"], 4), "p": round(p["power_db"], 2)} for p in points]
    out = []
    step = len(points) / n
    for i in range(n):
        chunk = points[int(i * step):int((i + 1) * step)]
        if not chunk:
            continue
        best = max(chunk, key=lambda p: p["power_db"])
        out.append({"f": round(best["freq_mhz"], 4), "p": round(best["power_db"], 2)})
    return out


def _set_rf_alert(kind, peak=None, events=None):
    """Push visual confirmation payload for phone + CRT."""
    alert = {
        "kind": kind,
        "ts": time.time(),
        "message": "",
        "freq_mhz": None,
        "power_db": None,
        "events": 0,
    }
    if peak:
        alert["freq_mhz"] = peak.get("freq_mhz")
        alert["power_db"] = peak.get("power_db")
        alert["message"] = "Peak %.3f MHz @ %.1f dB" % (
            peak.get("freq_mhz") or 0, peak.get("power_db") or 0
        )
    if events is not None:
        alert["events"] = len(events) if isinstance(events, list) else int(events or 0)
        if alert["events"] and isinstance(events, list) and events:
            ev = events[0]
            model = ev.get("model") or ev.get("protocol") or "device"
            alert["message"] = "Fob/sensor: %s (%d event%s)" % (
                model, alert["events"], "s" if alert["events"] != 1 else ""
            )
        elif alert["events"]:
            alert["message"] = "%d RF event(s)" % alert["events"]
        else:
            alert["message"] = "No RF events in window"
    with _lock:
        _media_state["rfAlert"] = alert
        _media_state["ts"] = time.time()


def run_sweep(start_mhz, end_mhz, bin_khz=2.0, gain=20.0, interval_s=1.0):
    tools = detect_tools()
    path = tools.get("rtl_power")
    if not path:
        return {"ok": False, "error": "rtl_power not found — install rtl-sdr tools"}

    with _lock:
        if _rtl["mode"] == "dab":
            return {"ok": False, "error": "Dongle in DAB mode — switch to RF first"}
        if _rtl["rf"]["busy"]:
            return {"ok": False, "error": "Sweep already running"}
        _rtl["mode"] = "rf"
        _rtl["rf"]["busy"] = True
        _rtl["rf"]["error"] = None

    freq = "%sM:%sM:%sk" % (start_mhz, end_mhz, bin_khz)
    cmd = [path, "-f", freq, "-g", str(gain), "-i", str(interval_s), "-1"]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        points, peak = parse_rtl_power_csv(r.stdout or "")
        if not points:
            points, peak = parse_rtl_power_csv((r.stdout or "") + "\n" + (r.stderr or ""))
        bins = _compact_bins(points, 96)
        result = {
            "ok": bool(points),
            "cmd": cmd,
            "returncode": r.returncode,
            "points": points[:5000],
            "bins": bins,
            "point_count": len(points),
            "peak": peak,
            "stderr_tail": (r.stderr or "")[-400:],
            "error": None if points else "No power bins parsed — check antenna/driver/band",
        }
        with _lock:
            _rtl["rf"]["last_sweep"] = {
                "start_mhz": start_mhz,
                "end_mhz": end_mhz,
                "bin_khz": bin_khz,
                "point_count": len(points),
                "peak": peak,
                "ts": time.time(),
            }
            _rtl["rf"]["last_peak"] = peak
            _rtl["rf"]["last_points"] = bins
            _rtl["rf"]["error"] = result.get("error")
            _rtl["rf"]["busy"] = False
            _rtl["ts"] = time.time()
        if peak:
            _set_rf_alert("sweep", peak=peak)
        return result
    except subprocess.TimeoutExpired:
        with _lock:
            _rtl["rf"]["busy"] = False
            _rtl["rf"]["error"] = "Sweep timed out"
        return {"ok": False, "error": "Sweep timed out"}
    except Exception as e:
        with _lock:
            _rtl["rf"]["busy"] = False
            _rtl["rf"]["error"] = str(e)
        return {"ok": False, "error": str(e)}


def run_rtl_433(seconds=20):
    tools = detect_tools()
    path = tools.get("rtl_433")
    if not path:
        return {"ok": False, "error": "rtl_433 not found — install rtl_433"}

    with _lock:
        if _rtl["mode"] == "dab":
            return {"ok": False, "error": "Dongle in DAB mode — switch to RF first"}
        if _rtl["rf"]["busy"]:
            return {"ok": False, "error": "RF busy"}
        _rtl["mode"] = "rf"
        _rtl["rf"]["busy"] = True

    cmd = [path, "-F", "json", "-T", str(int(seconds))]
    events = []
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=int(seconds) + 30)
        for line in (r.stdout or "").splitlines():
            line = line.strip()
            if not line.startswith("{"):
                continue
            try:
                events.append(json.loads(line))
            except Exception:
                continue
        summary = {
            "ok": True,
            "seconds": seconds,
            "event_count": len(events),
            "events": events[:100],
            "returncode": r.returncode,
            "stderr_tail": (r.stderr or "")[-400:],
        }
        with _lock:
            _rtl["rf"]["last_433"] = {
                "event_count": len(events),
                "ts": time.time(),
                "sample": events[0] if events else None,
            }
            _rtl["rf"]["busy"] = False
            _rtl["ts"] = time.time()
        _set_rf_alert("fob", events=events)
        return summary
    except Exception as e:
        with _lock:
            _rtl["rf"]["busy"] = False
            _rtl["rf"]["error"] = str(e)
        return {"ok": False, "error": str(e)}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        msg = fmt % args
        if "/api/" in msg or "/dab/" in msg:
            sys.stderr.write("%s - %s\n" % (self.address_string(), msg))

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        global _host_seen
        path = urlparse(self.path).path

        # ── unified ping ──
        if path == "/api/ping":
            with _lock:
                host_alive = (time.time() - _host_seen) < 3.0
            return _json_response(self, 200, {
                "ok": True,
                "service": "erndub-unified",
                "features": ["remote", "rf", "dab"],
                "host": host_alive,
                "port": PORT,
            })

        # ── phone remote ──
        if path == "/api/state":
            with _lock:
                host_alive = (time.time() - _host_seen) < 3.0
                payload = dict(_media_state)
                payload["host"] = host_alive
                # attach latest RF snapshot for phone viz
                payload["rfPeak"] = _rtl["rf"].get("last_peak")
                payload["rfBins"] = _rtl["rf"].get("last_points")
                payload["rfBusy"] = _rtl["rf"].get("busy")
            return _json_response(self, 200, payload)

        if path == "/api/host/poll":
            with _lock:
                _host_seen = time.time()
                batch = list(_cmds)
                _cmds.clear()
            return _json_response(self, 200, {"cmds": batch})

        # ── RTL status (compat with old dab_rf paths) ──
        if path == "/api/status":
            detect_tools()
            with _lock:
                payload = {
                    "mode": _rtl["mode"],
                    "dongle": _rtl["dongle"],
                    "tools": dict(_rtl["tools"]),
                    "tools_paths": dict(_rtl.get("tools_paths") or {}),
                    "rf": {
                        "busy": _rtl["rf"]["busy"],
                        "last_sweep": _rtl["rf"]["last_sweep"],
                        "last_peak": _rtl["rf"]["last_peak"],
                        "last_points": _rtl["rf"]["last_points"],
                        "last_433": _rtl["rf"]["last_433"],
                        "error": _rtl["rf"]["error"],
                    },
                    "dab": dict(_rtl["dab"]),
                    "ts": _rtl["ts"],
                }
            return _json_response(self, 200, payload)

        if path == "/api/rf/presets":
            return _json_response(self, 200, {"presets": RF_PRESETS})

        if path == "/api/rf/last_sweep":
            with _lock:
                return _json_response(self, 200, {
                    "last_sweep": _rtl["rf"]["last_sweep"],
                    "last_peak": _rtl["rf"]["last_peak"],
                    "bins": _rtl["rf"]["last_points"],
                    "busy": _rtl["rf"]["busy"],
                    "error": _rtl["rf"]["error"],
                })

        if path == "/api/dab/status":
            with _lock:
                return _json_response(self, 200, dict(_rtl["dab"], mode=_rtl["mode"]))

        if path == "/dab/stream":
            with _lock:
                url = (_rtl["dab"].get("stream_url") or "").strip()
            if not url:
                return _json_response(self, 404, {
                    "ok": False,
                    "error": "No DAB stream configured. POST /api/dab/config with stream_url.",
                })
            self.send_response(302)
            self.send_header("Location", url)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            return

        return super().do_GET()

    def do_POST(self):
        global _host_seen
        path = urlparse(self.path).path
        data = _read_json(self)

        if path == "/api/cmd":
            cmd = str(data.get("cmd") or "").strip().lower()
            if not cmd:
                return _json_response(self, 400, {"ok": False, "error": "missing cmd"})
            entry = {"cmd": cmd, "data": data.get("data"), "ts": time.time()}
            with _lock:
                host_alive = (time.time() - _host_seen) < 3.0
                if len(_cmds) > 50:
                    _cmds.pop(0)
                _cmds.append(entry)
            return _json_response(self, 200, {"ok": True, "host": host_alive})

        if path == "/api/state":
            with _lock:
                for k in ("title", "playing", "vol", "muted", "mode", "playlistLen", "rfAlert", "bins"):
                    if k in data:
                        _media_state[k] = data[k]
                _media_state["ts"] = time.time()
                _media_state["host"] = True
            return _json_response(self, 200, {"ok": True})

        if path == "/api/host/hello":
            with _lock:
                _host_seen = time.time()
                _media_state["host"] = True
            return _json_response(self, 200, {"ok": True})

        if path == "/api/mode":
            mode = str(data.get("mode") or "idle").lower()
            if mode not in ("idle", "rf", "dab"):
                return _json_response(self, 400, {"ok": False, "error": "mode must be idle|rf|dab"})
            with _lock:
                _rtl["mode"] = mode
                _rtl["ts"] = time.time()
            return _json_response(self, 200, {"ok": True, "mode": mode})

        if path == "/api/rf/sweep":
            start = float(data.get("start_mhz", 433.0))
            end = float(data.get("end_mhz", 434.0))
            bin_khz = float(data.get("bin_khz", 2))
            gain = float(data.get("gain", 20))
            interval_s = float(data.get("interval_s", 1))
            if end <= start:
                return _json_response(self, 400, {"ok": False, "error": "end_mhz must be > start_mhz"})
            result = run_sweep(start, end, bin_khz, gain, interval_s)
            return _json_response(self, 200 if result.get("ok") else 500, result)

        if path == "/api/rf/listen433":
            seconds = int(data.get("seconds", 20))
            seconds = max(5, min(120, seconds))
            result = run_rtl_433(seconds)
            return _json_response(self, 200 if result.get("ok") else 500, result)

        if path == "/api/dab/config":
            with _lock:
                if "stream_url" in data:
                    _rtl["dab"]["stream_url"] = str(data.get("stream_url") or "")
                if "label" in data:
                    _rtl["dab"]["label"] = str(data.get("label") or "")
                _rtl["mode"] = "dab"
                _rtl["ts"] = time.time()
                payload = dict(_rtl["dab"])
            return _json_response(self, 200, {"ok": True, "dab": payload})

        return _json_response(self, 404, {"ok": False, "error": "not found"})


def main():
    os.chdir(ROOT)
    detect_tools()
    # 0.0.0.0 so phone can reach remote.html on LAN
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print("erndub unified server (remote + DAB/RF)")
    print("  player:  http://127.0.0.1:%d/ernamp.html" % PORT)
    print("  phone:   http://<PC-LAN-IP>:%d/remote.html" % PORT)
    print("  status:  http://127.0.0.1:%d/api/status" % PORT)
    with _lock:
        print("  dongle:  %s" % _rtl.get("dongle"))
        print("  tools:   %s" % ", ".join(
            "%s=%s" % (k, "yes" if v else "no") for k, v in (_rtl.get("tools") or {}).items()
        ))
    print("Ctrl+C to stop")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")
        server.server_close()


if __name__ == "__main__":
    main()
