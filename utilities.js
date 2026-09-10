/* utilities.js
   In-CRT Utilities layer for UTILITIES viz mode.
   Tabs:
     1. Open Directory Search (Google dorks for open dirs / indexes)
     2. Google Drive (iframe)
     3. My Links (editable, persisted)
     4. Blank
     5. Blank
*/

(function () {
  "use strict";

  const LINKS_KEY = "erndub_util_links_v1";

  let layer = null;
  let activeTab = "opendir";

  function ensureStyles() {
    if (document.getElementById("utilities-layer-styles")) return;
    const style = document.createElement("style");
    style.id = "utilities-layer-styles";
    style.textContent = `
      .utilities-layer {
        display: none !important;
        position: absolute;
        inset: 0;
        z-index: 35;
        background: rgba(4, 6, 16, 0.94);
        color: var(--skin-text, #e8f0ff);
        font-family: 'Share Tech Mono', 'VT323', monospace;
        pointer-events: auto;
        flex-direction: column;
        overflow: hidden;
      }
      .stage.utilities-mode-active .utilities-layer {
        display: flex !important;
      }
      .stage.utilities-mode-active #vis-canvas {
        opacity: 0.08;
      }
      .utilities-layer .util-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        border-bottom: 1px solid var(--skin-border, #333);
        background: rgba(0,0,0,0.45);
        flex-shrink: 0;
      }
      .utilities-layer .util-title {
        font-family: 'VT323', monospace;
        font-size: 20px;
        letter-spacing: 4px;
        color: var(--skin-accent);
        text-shadow: 0 0 10px var(--skin-accent);
      }
      .utilities-layer .util-tabs {
        display: flex;
        gap: 2px;
        padding: 0 10px;
        background: rgba(0,0,0,0.35);
        border-bottom: 1px solid var(--skin-border, #333);
        flex-shrink: 0;
      }
      .utilities-layer .util-tab {
        flex: 1;
        min-width: 0;
        padding: 9px 6px;
        background: transparent;
        border: none;
        color: var(--skin-text-dim, #8a8a9a);
        font-family: inherit;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        cursor: pointer;
        border-radius: 4px 4px 0 0;
        transition: all 0.15s;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .utilities-layer .util-tab:hover {
        color: var(--skin-text);
        background: rgba(255,255,255,0.05);
      }
      .utilities-layer .util-tab.active {
        color: var(--skin-accent);
        background: rgba(0,0,0,0.4);
        box-shadow: inset 0 -2px 0 var(--skin-accent);
      }
      .utilities-layer .util-body {
        flex: 1;
        overflow: hidden;
        position: relative;
        min-height: 0;
      }
      .utilities-layer .util-panel {
        display: none;
        position: absolute;
        inset: 0;
        overflow: auto;
        padding: 14px;
      }
      .utilities-layer .util-panel.active {
        display: block;
      }
      .utilities-layer .util-panel.util-panel-iframe {
        padding: 0;
        overflow: hidden;
      }
      .utilities-layer .util-panel-iframe iframe {
        width: 100%;
        height: 100%;
        border: 0;
        background: #111;
      }
      .utilities-layer .util-input,
      .utilities-layer .util-select,
      .utilities-layer .util-textarea {
        width: 100%;
        padding: 9px 12px;
        background: rgba(0,0,0,0.45);
        border: 1px solid var(--skin-border, #444);
        border-radius: 6px;
        color: var(--skin-text, #eee);
        font-family: inherit;
        font-size: 12px;
        outline: none;
        box-sizing: border-box;
      }
      .utilities-layer .util-input:focus,
      .utilities-layer .util-select:focus,
      .utilities-layer .util-textarea:focus {
        border-color: var(--skin-accent);
      }
      .utilities-layer .util-btn {
        padding: 8px 16px;
        background: var(--skin-accent);
        border: none;
        border-radius: 6px;
        color: #fff;
        font-family: inherit;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        transition: opacity 0.15s, transform 0.1s;
      }
      .utilities-layer .util-btn:hover { opacity: 0.9; }
      .utilities-layer .util-btn:active { transform: scale(0.97); }
      .utilities-layer .util-btn.ghost {
        background: transparent;
        border: 1px solid var(--skin-border);
        color: var(--skin-text);
      }
      .utilities-layer .util-label {
        display: block;
        font-size: 11px;
        color: var(--skin-text-dim, #8a8a9a);
        margin-bottom: 5px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }
      .utilities-layer .util-row {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
        align-items: center;
      }
      .utilities-layer .dork-chip {
        display: inline-block;
        margin: 3px 4px 3px 0;
        padding: 4px 8px;
        background: rgba(0,0,0,0.35);
        border: 1px solid var(--skin-border, #444);
        border-radius: 4px;
        color: var(--skin-accent, #7c5cff);
        font-size: 11px;
        cursor: pointer;
        transition: 0.12s;
      }
      .utilities-layer .dork-chip:hover {
        border-color: var(--skin-accent);
        background: rgba(255,255,255,0.06);
      }
      .utilities-layer .blank-panel {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--skin-text-dim);
        font-size: 13px;
        letter-spacing: 2px;
        opacity: 0.5;
      }
      .utilities-layer .links-editor {
        display: flex;
        flex-direction: column;
        height: 100%;
        gap: 10px;
      }
      .utilities-layer .links-editor textarea {
        flex: 1;
        min-height: 160px;
        resize: none;
        font-family: 'Share Tech Mono', monospace;
        line-height: 1.55;
      }
      .utilities-layer .links-preview {
        flex: 1;
        overflow: auto;
        padding: 10px 12px;
        background: rgba(0,0,0,0.35);
        border: 1px solid var(--skin-border, #333);
        border-radius: 6px;
        font-size: 13px;
        line-height: 1.7;
      }
      .utilities-layer .links-preview a {
        color: var(--skin-accent);
        text-decoration: none;
      }
      .utilities-layer .links-preview a:hover {
        text-decoration: underline;
      }
      .utilities-layer .links-preview .link-line {
        margin: 2px 0;
      }
      .utilities-layer .links-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
        flex-wrap: wrap;
      }
      .utilities-layer .util-hint {
        font-size: 11px;
        color: var(--skin-text-dim);
        margin-top: 4px;
        line-height: 1.4;
      }
      .utilities-layer .drive-fallback {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 20px;
        text-align: center;
        background: rgba(0,0,0,0.85);
        z-index: 2;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s;
      }
      .utilities-layer .drive-fallback.visible {
        opacity: 1;
        pointer-events: auto;
      }
    `;
    document.head.appendChild(style);
  }

  function createLayer() {
    if (layer) return layer;
    ensureStyles();

    const stage = document.getElementById("stage") || document.querySelector(".stage");
    if (!stage) {
      console.warn("[utilities] stage not found");
      return null;
    }

    layer = document.createElement("div");
    layer.id = "utilities-layer";
    layer.className = "utilities-layer";
    layer.setAttribute("aria-hidden", "true");
    layer.innerHTML = [
      '<div class="util-header">',
      '  <span class="util-title">UTILITIES</span>',
      "</div>",
      '<div class="util-tabs">',
      '  <button type="button" class="util-tab active" data-tab="opendir">Open Dir</button>',
      '  <button type="button" class="util-tab" data-tab="gdrive">Drive</button>',
      '  <button type="button" class="util-tab" data-tab="links">My Links</button>',
      '  <button type="button" class="util-tab" data-tab="blank4">Tab 4</button>',
      '  <button type="button" class="util-tab" data-tab="blank5">Tab 5</button>',
      "</div>",
      '<div class="util-body">',
      '  <div class="util-panel active" id="util-panel-opendir"></div>',
      '  <div class="util-panel util-panel-iframe" id="util-panel-gdrive"></div>',
      '  <div class="util-panel" id="util-panel-links"></div>',
      '  <div class="util-panel" id="util-panel-blank4"></div>',
      '  <div class="util-panel" id="util-panel-blank5"></div>',
      "</div>",
    ].join("\n");
    stage.appendChild(layer);

    layer.querySelectorAll(".util-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        switchTab(tab.dataset.tab);
      });
    });

    buildOpenDirPanel();
    buildDrivePanel();
    buildLinksPanel();
    buildBlankPanels();

    return layer;
  }

  function switchTab(id) {
    if (!layer) return;
    activeTab = id;
    layer.querySelectorAll(".util-tab").forEach(function (t) {
      t.classList.toggle("active", t.dataset.tab === id);
    });
    layer.querySelectorAll(".util-panel").forEach(function (p) {
      p.classList.toggle("active", p.id === "util-panel-" + id);
    });
  }

  function buildOpenDirPanel() {
    var panel = layer.querySelector("#util-panel-opendir");
    panel.innerHTML = [
      '<label class="util-label">Open directory / index search</label>',
      '<div class="util-row">',
      '  <input class="util-input" id="opendir-input" placeholder=\'e.g. intitle:"index of" mp3 OR "parent directory"\' />',
      "</div>",
      '<div class="util-row">',
      '  <select class="util-select" id="opendir-engine" style="flex:1">',
      '    <option value="google">Google</option>',
      '    <option value="duckduckgo">DuckDuckGo</option>',
      '    <option value="bing">Bing</option>',
      "  </select>",
      '  <button type="button" class="util-btn" id="opendir-go">Search</button>',
      "</div>",
      '<div style="margin-top:6px;">',
      '  <span class="util-label" style="margin-bottom:6px;">Quick open-dir dorks</span>',
      '  <span class="dork-chip" data-q=\'intitle:"index of" "parent directory"\'>Index of</span>',
      '  <span class="dork-chip" data-q=\'intitle:"index of" (mp3 OR flac OR wav)\'>Audio dirs</span>',
      '  <span class="dork-chip" data-q=\'intitle:"index of" (mkv OR mp4 OR avi)\'>Video dirs</span>',
      '  <span class="dork-chip" data-q=\'intitle:"index of" (pdf OR epub OR mobi)\'>Book dirs</span>',
      '  <span class="dork-chip" data-q=\'intitle:"index of" "last modified" filetype:zip\'>ZIP indexes</span>',
      '  <span class="dork-chip" data-q=\'inurl:/ftp/ intitle:"index of"\'>FTP indexes</span>',
      '  <span class="dork-chip" data-q=\'intitle:"index of" "backup"\'>Backup indexes</span>',
      '  <span class="dork-chip" data-q=\'intitle:"directory listing for"\'>Dir listing</span>',
      "</div>",
      '<div class="util-hint">',
      "  Opens results in a new tab. Use site:example.com to limit to one host.",
      "  Finds publicly listed open directories — respect site terms and local law.",
      "</div>",
    ].join("\n");

    panel.querySelectorAll(".dork-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        panel.querySelector("#opendir-input").value = chip.dataset.q || "";
      });
    });

    panel.querySelector("#opendir-go").addEventListener("click", function () {
      var q = panel.querySelector("#opendir-input").value.trim();
      if (!q) return;
      var engine = panel.querySelector("#opendir-engine").value;
      var url = "";
      if (engine === "google") url = "https://www.google.com/search?q=" + encodeURIComponent(q);
      else if (engine === "duckduckgo") url = "https://duckduckgo.com/?q=" + encodeURIComponent(q);
      else url = "https://www.bing.com/search?q=" + encodeURIComponent(q);
      window.open(url, "_blank", "noopener");
    });

    panel.querySelector("#opendir-input").addEventListener("keydown", function (e) {
      if (e.key === "Enter") panel.querySelector("#opendir-go").click();
    });
  }

  function buildDrivePanel() {
    var panel = layer.querySelector("#util-panel-gdrive");
    panel.innerHTML = [
      '<iframe id="util-gdrive-frame" src="https://drive.google.com/drive/my-drive" title="Google Drive" allow="fullscreen" referrerpolicy="no-referrer-when-downgrade" loading="lazy"></iframe>',
      '<div class="drive-fallback" id="util-drive-fallback">',
      '  <div style="font-size:13px;letter-spacing:1px;opacity:0.85;">Google Drive may block embedding in this frame.</div>',
      '  <button type="button" class="util-btn" id="util-drive-open">Open Drive in new tab</button>',
      "</div>",
    ].join("\n");

    var fallback = panel.querySelector("#util-drive-fallback");
    var frame = panel.querySelector("#util-gdrive-frame");
    setTimeout(function () {
      if (fallback) fallback.classList.add("visible");
    }, 2500);

    panel.querySelector("#util-drive-open").addEventListener("click", function () {
      window.open("https://drive.google.com/drive/my-drive", "_blank", "noopener");
    });

    frame.addEventListener("load", function () {
      if (fallback) fallback.style.opacity = "0.85";
    });
  }

  function defaultLinks() {
    return [
      "https://archive.org",
      "https://radio.garden",
      "https://www.radioreference.com",
      "https://github.com",
    ].join("\n");
  }

  function loadLinksText() {
    try {
      var raw = localStorage.getItem(LINKS_KEY);
      if (raw != null && String(raw).length) return String(raw);
    } catch (e) {}
    return defaultLinks();
  }

  function saveLinksText(text) {
    try {
      localStorage.setItem(LINKS_KEY, text);
    } catch (e) {}
  }

  function escHtml(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function escAttr(s) {
    return escHtml(s);
  }

  function renderLinksPreview(text, el) {
    if (!el) return;
    var lines = String(text || "").split(/\r?\n/);
    var html = lines
      .map(function (line) {
        var t = line.trim();
        if (!t) return '<div class="link-line">&nbsp;</div>';
        var md = t.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/i);
        if (md) {
          return (
            '<div class="link-line"><a href="' +
            escAttr(md[2]) +
            '" target="_blank" rel="noopener">' +
            escHtml(md[1]) +
            "</a></div>"
          );
        }
        if (/^https?:\/\//i.test(t)) {
          return (
            '<div class="link-line"><a href="' +
            escAttr(t) +
            '" target="_blank" rel="noopener">' +
            escHtml(t) +
            "</a></div>"
          );
        }
        return '<div class="link-line">' + escHtml(t) + "</div>";
      })
      .join("");
    el.innerHTML = html || '<div class="link-line" style="opacity:0.5">(empty)</div>';
  }

  function buildLinksPanel() {
    var panel = layer.querySelector("#util-panel-links");
    var initial = loadLinksText();
    panel.innerHTML = [
      '<div class="links-editor">',
      '  <label class="util-label">My links — one per line (plain URL or [label](url))</label>',
      '  <textarea class="util-textarea" id="links-textarea" spellcheck="false"></textarea>',
      '  <div class="links-actions">',
      '    <button type="button" class="util-btn" id="links-save">Save</button>',
      '    <button type="button" class="util-btn ghost" id="links-preview-toggle">Show preview</button>',
      '    <button type="button" class="util-btn ghost" id="links-reset">Reset defaults</button>',
      "  </div>",
      '  <div class="links-preview" id="links-preview" style="display:none;"></div>',
      '  <div class="util-hint">Saved in this browser only. Preview turns lines into clickable links.</div>',
      "</div>",
    ].join("\n");

    var ta = panel.querySelector("#links-textarea");
    ta.value = initial;
    var preview = panel.querySelector("#links-preview");
    var showingPreview = false;

    panel.querySelector("#links-save").addEventListener("click", function () {
      saveLinksText(ta.value);
      renderLinksPreview(ta.value, preview);
    });

    panel.querySelector("#links-preview-toggle").addEventListener("click", function () {
      showingPreview = !showingPreview;
      if (showingPreview) {
        ta.style.display = "none";
        preview.style.display = "block";
        renderLinksPreview(ta.value, preview);
        panel.querySelector("#links-preview-toggle").textContent = "Edit";
      } else {
        ta.style.display = "block";
        preview.style.display = "none";
        panel.querySelector("#links-preview-toggle").textContent = "Show preview";
      }
    });

    panel.querySelector("#links-reset").addEventListener("click", function () {
      if (!confirm("Reset links to defaults?")) return;
      var d = defaultLinks();
      ta.value = d;
      saveLinksText(d);
      renderLinksPreview(d, preview);
    });
  }

  function buildBlankPanels() {
    layer.querySelector("#util-panel-blank4").innerHTML =
      '<div class="blank-panel">TAB 4 — EMPTY</div>';
    layer.querySelector("#util-panel-blank5").innerHTML =
      '<div class="blank-panel">TAB 5 — EMPTY</div>';
  }

  function open() {
    createLayer();
    if (!layer) return;
    // Visibility driven only by .utilities-mode-active on stage (CSS).
    // Avoid inline display — it can leave the layer stuck when the class is removed.
    layer.style.removeProperty("display");
    layer.setAttribute("aria-hidden", "false");
    var stage = document.getElementById("stage") || document.querySelector(".stage");
    if (stage) stage.classList.add("utilities-mode-active");
  }

  function close() {
    var stage = document.getElementById("stage") || document.querySelector(".stage");
    if (stage) stage.classList.remove("utilities-mode-active");
    var el = layer || document.getElementById("utilities-layer");
    if (el) {
      el.style.removeProperty("display");
      el.setAttribute("aria-hidden", "true");
    }
  }

  function toggle() {
    var stage = document.getElementById("stage") || document.querySelector(".stage");
    var active = stage && stage.classList.contains("utilities-mode-active");
    if (active) close();
    else open();
  }

  function sync(active) {
    if (active) open();
    else close();
  }

  window.UtilitiesMode = {
    open: open,
    close: close,
    toggle: toggle,
    sync: sync,
    isOpen: function () {
      var stage = document.getElementById("stage") || document.querySelector(".stage");
      return !!(stage && stage.classList.contains("utilities-mode-active"));
    },
  };
})();
