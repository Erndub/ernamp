#!/usr/bin/env python3
"""
Compatibility launcher — DAB/RF APIs now live inside remote_server.py.

  python3 dab_rf_bridge.py        → same as remote_server.py on port 8080
  python3 dab_rf_bridge.py 8090   → custom port

Prefer:  python3 remote_server.py
"""
import runpy
import sys

# Re-exec unified server (same argv port handling)
sys.argv[0] = "remote_server.py"
runpy.run_path(
    __import__("os").path.join(__import__("os").path.dirname(__file__), "remote_server.py"),
    run_name="__main__",
)
