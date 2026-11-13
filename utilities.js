/**
 * utilities.js — UTILITIES viz mode for erndub
 * Tabs: Dork Search · Custom Links · Note Pad · Local · Browser · Tools
 */
(function () {
  'use strict';

  const LINKS_KEY = 'erndub_util_links';
  const DORK_KEY = 'erndub_util_dork_prefs';
  const NOTES_KEY = 'erndub_util_notes';
  const TAB_KEY = 'erndub_util_tab';
  const BROWSER_KEY = 'erndub_util_browser_url';

  const DEFAULT_LINKS = [
    { url: 'https://radio-browser.info/', label: 'Radio Browser' },
    { url: 'https://archive.org/details/audio', label: 'Internet Archive · Audio' },
    { url: 'https://www.somafm.com/', label: 'SomaFM' },
    { url: 'https://directory.musicbrainz.org/', label: 'MusicBrainz' },
    { url: 'https://duckduckgo.com/', label: 'DuckDuckGo' },
    { url: 'https://www.google.com/', label: 'Google' },
    { url: 'https://web.archive.org/', label: 'Wayback Machine' }
  ];

  const TABS = [
    { id: 'dork', label: 'Dork Search' },
    { id: 'links', label: 'Custom Links' },
    { id: 'notes', label: 'Note Pad' },
    { id: 'local', label: 'Local' },
    { id: 'browser', label: 'Browser' },
    { id: 'tools', label: 'Tools' }
  ];

  function loadLinks() {
    try {
      const raw = localStorage.getItem(LINKS_KEY);
      if (!raw) return DEFAULT_LINKS.slice();
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : DEFAULT_LINKS.slice();
    } catch (e) { return DEFAULT_LINKS.slice(); }
  }
  function saveLinks(list) {
    try { localStorage.setItem(LINKS_KEY, JSON.stringify(list.slice(0, 60))); } catch (e) {}
  }
  function loadPrefs() {
    try { return JSON.parse(localStorage.getItem(DORK_KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function savePrefs(p) {
    try { localStorage.setItem(DORK_KEY, JSON.stringify(p)); } catch (e) {}
  }
  function loadNotes() {
    try { return localStorage.getItem(NOTES_KEY) || ''; } catch (e) { return ''; }
  }
  function saveNotes(text) {
    try { localStorage.setItem(NOTES_KEY, text); } catch (e) {}
  }

  const ENGINES = {
    google: { label: 'Google', url: (q) => 'https://www.google.com/search?udm=14&q=' + encodeURIComponent(q) },
    ddg: { label: 'DuckDuckGo', url: (q) => 'https://duckduckgo.com/?q=' + encodeURIComponent(q) },
    bing: { label: 'Bing', url: (q) => 'https://www.bing.com/search?q=' + encodeURIComponent(q) },
    yandex: { label: 'Yandex', url: (q) => 'https://yandex.com/search/?text=' + encodeURIComponent(q) },
    startpage: { label: 'Startpage', url: (q) => 'https://www.startpage.com/sp/search?query=' + encodeURIComponent(q) },
    brave: { label: 'Brave Search', url: (q) => 'https://search.brave.com/search?q=' + encodeURIComponent(q) },
    searx: { label: 'SearXNG', url: (q) => 'https://searx.be/search?q=' + encodeURIComponent(q) },
    mojeek: { label: 'Mojeek', url: (q) => 'https://www.mojeek.com/search?q=' + encodeURIComponent(q) }
  };

  const FILETYPES = [
    { value: '', label: 'Anything' },
    { value: 'mp3', label: 'MP3' },
    { value: 'flac', label: 'FLAC' },
    { value: 'ogg', label: 'OGG' },
    { value: 'opus', label: 'Opus' },
    { value: 'wav', label: 'WAV' },
    { value: 'aac', label: 'AAC / M4A', clause: '(aac OR m4a OR .m4a)' },
    { value: 'audio', label: 'Any audio', clause: '(mp3 OR flac OR ogg OR opus OR wav OR aac OR m4a)' },
    { value: 'playlist', label: 'Playlists', clause: '(m3u OR m3u8 OR pls OR xspf)' },
    { value: 'zip', label: 'ZIP / archives', clause: '(zip OR rar OR 7z OR tar OR gz)' },
    { value: 'iso', label: 'ISO / images', clause: '(iso OR img OR dmg)' },
    { value: 'pdf', label: 'PDF' },
    { value: 'ebook', label: 'E-books', clause: '(pdf OR epub OR mobi OR djvu)' },
    { value: 'video', label: 'Video', clause: '(mp4 OR mkv OR avi OR webm OR mov)' },
    { value: 'software', label: 'Software', clause: '(exe OR dmg OR apk OR deb OR rpm)' }
  ];

  const DIR_KINDS = {
    auto: {
      label: 'Auto (best mix)',
      build(kw, ft) {
        return unique([
          ...DIR_KINDS.indexof.build(kw, ft).slice(0, 2),
          ...DIR_KINDS.ftp.build(kw, ft).slice(0, 1),
          ...DIR_KINDS.pub.build(kw, ft).slice(0, 1)
        ]);
      }
    },
    indexof: {
      label: 'Open web dirs (Index of)',
      build(kw, ft) {
        const k = kw ? kw + ' ' : '', f = ft ? ft + ' ' : '';
        return [
          `intitle:"index of" "parent directory" ${k}${f}`.trim(),
          `intitle:"index of /" ${k}${f}-html -htm -php -asp`.trim(),
          `intitle:"index of" ${k}${f}`.trim(),
          `"last modified" "parent directory" ${k}${f}-inurl:htm`.trim(),
          `intitle:"directory listing for" ${k}${f}`.trim()
        ];
      }
    },
    ftp: {
      label: 'FTP indexes / gateways',
      build(kw, ft) {
        const k = kw ? kw + ' ' : '', f = ft ? ft + ' ' : '';
        return [
          `intitle:"index of" inurl:ftp ${k}${f}`.trim(),
          `intitle:"index of" inurl:/ftp/ ${k}${f}`.trim(),
          `inurl:ftp:// ${k}${f}`.trim(),
          `"anonymous" ftp intitle:"index of" ${k}${f}`.trim(),
          `intitle:"index of" inurl:ftproot ${k}${f}`.trim()
        ];
      }
    },
    pub: {
      label: 'Pub / mirror trees',
      build(kw, ft) {
        const k = kw ? kw + ' ' : '', f = ft ? ft + ' ' : '';
        return [
          `intitle:"index of" inurl:/pub/ ${k}${f}`.trim(),
          `intitle:"index of" inurl:mirror ${k}${f}`.trim(),
          `intitle:"index of" inurl:files ${k}${f}`.trim(),
          `intitle:"index of" inurl:download ${k}${f}`.trim()
        ];
      }
    },
    media: {
      label: 'Music / media folders',
      build(kw, ft) {
        const k = kw ? kw + ' ' : '';
        const f = ft || '(mp3 OR flac OR ogg OR opus)';
        return [
          `intitle:"index of" inurl:music ${k}${f}`.trim(),
          `intitle:"index of" inurl:audio ${k}${f}`.trim(),
          `intitle:"index of" (album OR discography) ${k}${f}`.trim(),
          `intitle:"index of" inurl:mp3 ${k}`.trim()
        ];
      }
    },
    data: {
      label: 'Datasets / dumps',
      build(kw, ft) {
        const k = kw ? kw + ' ' : '';
        const f = ft || '(csv OR json OR xml OR sql OR zip)';
        return [
          `intitle:"index of" ${k}${f}`.trim(),
          `intitle:"index of" inurl:data ${k}${f}`.trim(),
          `intitle:"index of" inurl:backup ${k}${f}`.trim(),
          `intitle:"index of" (dump OR export OR archive) ${k}${f}`.trim()
        ];
      }
    },
    cloud: {
      label: 'Exposed buckets / shares',
      build(kw, ft) {
        const k = kw ? kw + ' ' : '', f = ft ? ft + ' ' : '';
        return [
          `site:s3.amazonaws.com ${k}${f}`.trim(),
          `site:storage.googleapis.com ${k}${f}`.trim(),
          `site:blob.core.windows.net ${k}${f}`.trim(),
          `intitle:"index of" inurl:shared ${k}${f}`.trim()
        ];
      }
    },
    server: {
      label: 'Server listing signatures',
      build(kw, ft) {
        const k = kw ? kw + ' ' : '', f = ft ? ft + ' ' : '';
        return [
          `"Apache Server at" intitle:"index of" ${k}${f}`.trim(),
          `"nginx" "Index of" ${k}${f}`.trim(),
          `"Microsoft-IIS" intitle:"index of" ${k}${f}`.trim(),
          `"Directory Listing For" ${k}${f}`.trim()
        ];
      }
    }
  };

  function unique(arr) {
    return Array.from(new Set(arr.map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean)));
  }
  function filetypeClause(value) {
    const ft = FILETYPES.find(f => f.value === value);
    if (!ft || !ft.value) return '';
    if (ft.clause) return ft.clause;
    return `(${ft.value} OR .${ft.value})`;
  }
  function buildQueries(kind, kw, ftValue) {
    const builder = DIR_KINDS[kind] || DIR_KINDS.auto;
    return unique(builder.build((kw || '').trim(), filetypeClause(ftValue)));
  }
  function openQueries(queries, engine, limit) {
    const eng = ENGINES[engine] || ENGINES.google;
    const list = queries.slice(0, limit || 5);
    list.forEach((q, i) => {
      setTimeout(() => window.open(eng.url(q), '_blank', 'noopener,noreferrer'), i * 320);
    });
    return list;
  }

  function ensureLayer() {
    let layer = document.getElementById('utilities-layer');
    const stage = document.getElementById('stage');
    if (layer && layer.querySelector('.util-panel')) return layer;
    if (!layer) {
      if (!stage) return null;
      layer = document.createElement('div');
      layer.id = 'utilities-layer';
      layer.className = 'utilities-layer';
      layer.setAttribute('aria-hidden', 'true');
      stage.appendChild(layer);
    }

    const engOpts = Object.entries(ENGINES).map(([id, e]) => `<option value="${id}">${e.label}</option>`).join('');
    const ftOpts = FILETYPES.map(f => `<option value="${f.value}">${f.label}</option>`).join('');
    const kindOpts = Object.entries(DIR_KINDS).map(([id, k]) => `<option value="${id}">${k.label}</option>`).join('');
    const tabBtns = TABS.map(t => `<button type="button" class="util-tab" data-tab="${t.id}">${t.label}</button>`).join('');

    layer.innerHTML = `
      <div class="util-panel util-panel-wide">
        <div class="util-head-row">
          <div class="util-head">UTILITIES</div>
          <div class="util-tabs" id="util-tabs">${tabBtns}</div>
        </div>

        <div class="util-tab-pane" data-pane="dork">
          <div class="util-section">
            <div class="util-label">Dork search — open directories &amp; FTP indexes</div>
            <div class="util-grid">
              <label class="util-field"><span>Engine</span>
                <select id="util-engine" class="util-select">${engOpts}</select></label>
              <label class="util-field"><span>File type</span>
                <select id="util-filetype" class="util-select">${ftOpts}</select></label>
              <label class="util-field util-field-span"><span>Directory / source</span>
                <select id="util-dirkind" class="util-select">${kindOpts}</select></label>
            </div>
            <div class="util-row" style="margin-top:8px">
              <input type="text" id="util-dork-kw" class="util-input util-input-grow"
                placeholder="keywords (artist, topic, year…)" />
            </div>
            <div class="util-row" style="margin-top:8px">
              <button type="button" class="util-btn util-btn-accent" id="util-dork-go">Search</button>
              <button type="button" class="util-btn" id="util-dork-more">More queries</button>
              <button type="button" class="util-btn" id="util-dork-copy">Copy queries</button>
            </div>
            <div class="util-dork-out" id="util-dork-out"></div>
            <div class="util-hint">Index of + parent directory + filetype · FTP indexes · /pub mirrors. Opens in new tabs.</div>
          </div>
        </div>

        <div class="util-tab-pane" data-pane="links" hidden>
          <div class="util-section">
            <div class="util-label">Custom links</div>
            <div class="util-row">
              <input type="text" id="util-link-input" class="util-input util-input-grow"
                placeholder="https://…  optional label after space" />
              <button type="button" class="util-btn" id="util-link-add">Add</button>
              <button type="button" class="util-btn" id="util-link-defaults">Restore defaults</button>
              <button type="button" class="util-btn" id="util-clear-links">Clear</button>
            </div>
            <div class="util-links" id="util-links"></div>
            <div class="util-hint">Stored in this browser · click to open</div>
          </div>
        </div>

        <div class="util-tab-pane util-pane-fill" data-pane="notes" hidden>
          <div class="util-row" style="margin-bottom:8px">
            <span class="util-label" style="margin:0">Note pad</span>
            <span style="flex:1"></span>
            <button type="button" class="util-btn" id="util-notes-clear">Clear</button>
            <button type="button" class="util-btn" id="util-notes-copy">Copy</button>
            <button type="button" class="util-btn" id="util-notes-download">Download .txt</button>
          </div>
          <textarea id="util-notes" class="util-notes" spellcheck="true"
            placeholder="Scratch pad — auto-saves in this browser…"></textarea>
        </div>

        <div class="util-tab-pane" data-pane="local" hidden>
          <div class="util-section">
            <div class="util-label">Local files</div>
            <div class="util-row">
              <button type="button" class="util-btn util-btn-accent" id="util-open-files">Open files…</button>
              <button type="button" class="util-btn util-btn-accent" id="util-open-folder">Open folder…</button>
              <button type="button" class="util-btn" id="util-copy-path">Copy location tip</button>
            </div>
            <input type="file" id="util-file-input" multiple accept="audio/*,video/*,image/*" hidden />
            <input type="file" id="util-folder-input" webkitdirectory directory multiple hidden />
            <div class="util-hint" id="util-hint">Loads into player library/playlist when supported. Skin tiles: pic/ next to ernamp.html.</div>
          </div>
        </div>

        <div class="util-tab-pane util-pane-fill" data-pane="browser" hidden>
          <div class="util-browser-bar">
            <button type="button" class="util-btn" id="util-browser-blank">Blank</button>
            <input type="text" id="util-browser-url" class="util-input util-input-grow"
              placeholder="https://…  (many sites block embedding)" />
            <button type="button" class="util-btn util-btn-accent" id="util-browser-go">Go</button>
            <button type="button" class="util-btn" id="util-browser-ext" title="Open externally">↗</button>
          </div>
          <iframe id="util-browser-frame" class="util-browser-frame" title="Utilities browser"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            referrerpolicy="no-referrer-when-downgrade" src="about:blank"></iframe>
          <div class="util-hint">Blank page or URL. Use ↗ if the site blocks iframes.</div>
        </div>

                <div class="util-tab-pane util-pane-scroll" data-pane="tools" hidden>
          <div class="util-section">
            <div class="util-label">Tools by category</div>

            <div class="util-cat">Time &amp; date</div>
            <div class="util-tools-grid">
              <div class="util-tool"><div class="util-tool-title">UTC / local</div><div class="util-tool-desc">Live local and UTC clock; copy ISO timestamp.</div><div id="util-clock" class="util-tool-body">—</div><button type="button" class="util-btn" id="util-clock-copy">Copy ISO</button></div>
              <div class="util-tool"><div class="util-tool-title">Unix timestamp</div><div class="util-tool-desc">Convert between Unix seconds and human dates.</div><input type="text" id="util-unix-in" class="util-input" placeholder="seconds or ms"/><div class="util-row" style="margin-top:6px"><button type="button" class="util-btn" id="util-unix-now">Now</button><button type="button" class="util-btn" id="util-unix-to">→ Date</button><button type="button" class="util-btn" id="util-date-to-unix">→ Unix</button></div><div id="util-unix-out" class="util-tool-body util-mono" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Stopwatch</div><div class="util-tool-desc">Measure elapsed time with start, stop, and reset.</div><div id="util-sw-disp" class="util-tool-body" style="font-size:20px">0.0s</div><div class="util-row"><button type="button" class="util-btn" id="util-sw-start">Start</button><button type="button" class="util-btn" id="util-sw-stop">Stop</button><button type="button" class="util-btn" id="util-sw-reset">Reset</button></div></div>
              <div class="util-tool"><div class="util-tool-title">Countdown</div><div class="util-tool-desc">Count down from a set number of seconds.</div><div class="util-row"><input type="number" id="util-cd-sec" class="util-input" style="max-width:80px" value="60"/><span class="util-hint">sec</span><button type="button" class="util-btn" id="util-cd-start">Start</button><button type="button" class="util-btn" id="util-cd-stop">Stop</button></div><div id="util-cd-disp" class="util-tool-body" style="margin-top:6px;font-size:20px">—</div></div>
              <div class="util-tool"><div class="util-tool-title">Week number</div><div class="util-tool-desc">ISO-style week number and weekday for today.</div><div id="util-week-out" class="util-tool-body">—</div><button type="button" class="util-btn" id="util-week-go">Today</button></div>
              <div class="util-tool"><div class="util-tool-title">Age / days between</div><div class="util-tool-desc">Days and years between two calendar dates.</div><div class="util-row"><input type="date" id="util-age-a" class="util-input"/><input type="date" id="util-age-b" class="util-input"/></div><button type="button" class="util-btn" id="util-age-go" style="margin-top:6px">Diff</button><div id="util-age-out" class="util-tool-body" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">World clock offsets</div><div class="util-tool-desc">Current time in several common time zones.</div><div id="util-world-out" class="util-tool-body util-mono">—</div><button type="button" class="util-btn" id="util-world-go">Refresh</button></div>
            </div>

            <div class="util-cat">Text</div>
            <div class="util-tools-grid">
              <div class="util-tool"><div class="util-tool-title">Text stats</div><div class="util-tool-desc">Character, word, and line counts for pasted text.</div><textarea id="util-stats-in" class="util-input" rows="3" placeholder="Paste text…"></textarea><div id="util-stats-out" class="util-tool-body" style="margin-top:6px">chars 0 · words 0 · lines 0</div></div>
              <div class="util-tool"><div class="util-tool-title">Case convert</div><div class="util-tool-desc">Switch between upper, lower, title, snake, kebab, camel.</div><input type="text" id="util-case-in" class="util-input" placeholder="Your Text"/><div class="util-row" style="margin-top:6px"><button type="button" class="util-btn" id="util-case-upper">UPPER</button><button type="button" class="util-btn" id="util-case-lower">lower</button><button type="button" class="util-btn" id="util-case-title">Title</button><button type="button" class="util-btn" id="util-case-snake">snake</button><button type="button" class="util-btn" id="util-case-kebab">kebab</button><button type="button" class="util-btn" id="util-case-camel">camel</button></div><div id="util-case-out" class="util-tool-body util-mono" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Slugify</div><div class="util-tool-desc">Converts text into a clean string for safe web URLs.</div><input type="text" id="util-slug-in" class="util-input"/><button type="button" class="util-btn" id="util-slug-go" style="margin-top:6px">Slugify</button><div id="util-slug-out" class="util-tool-body util-mono" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Lorem ipsum</div><div class="util-tool-desc">Generate placeholder filler text of a chosen length.</div><div class="util-row"><input type="number" id="util-lorem-n" class="util-input" style="max-width:80px" value="40"/><button type="button" class="util-btn" id="util-lorem-go">Words</button><button type="button" class="util-btn" id="util-lorem-copy">Copy</button></div><div id="util-lorem-out" class="util-tool-body" style="margin-top:6px;max-height:80px;overflow:auto"></div></div>
              <div class="util-tool"><div class="util-tool-title">Sort lines</div><div class="util-tool-desc">Sort, reverse, or uniquify a list one item per line.</div><textarea id="util-sort-in" class="util-input" rows="3"></textarea><div class="util-row" style="margin-top:6px"><button type="button" class="util-btn" id="util-sort-asc">A→Z</button><button type="button" class="util-btn" id="util-sort-desc">Z→A</button><button type="button" class="util-btn" id="util-sort-uniq">Unique</button><button type="button" class="util-btn" id="util-sort-rev">Reverse</button></div></div>
              <div class="util-tool"><div class="util-tool-title">Diff lines</div><div class="util-tool-desc">Show line-by-line differences between two texts.</div><textarea id="util-diff-a" class="util-input" rows="2" placeholder="A"></textarea><textarea id="util-diff-b" class="util-input" rows="2" style="margin-top:4px" placeholder="B"></textarea><button type="button" class="util-btn" id="util-diff-go" style="margin-top:6px">Diff</button><div id="util-diff-out" class="util-tool-body util-mono" style="margin-top:6px;max-height:90px;overflow:auto"></div></div>
              <div class="util-tool"><div class="util-tool-title">Word frequency</div><div class="util-tool-desc">Rank the most common words in a passage.</div><textarea id="util-freq-in" class="util-input" rows="3"></textarea><button type="button" class="util-btn" id="util-freq-go" style="margin-top:6px">Count</button><div id="util-freq-out" class="util-tool-body util-mono" style="margin-top:6px;max-height:90px;overflow:auto"></div></div>
              <div class="util-tool"><div class="util-tool-title">Reverse / palindrome</div><div class="util-tool-desc">Reverse a string or test for palindrome.</div><input type="text" id="util-rev-in" class="util-input"/><div class="util-row" style="margin-top:6px"><button type="button" class="util-btn" id="util-rev-go">Reverse</button><button type="button" class="util-btn" id="util-pal-go">Palindrome?</button></div><div id="util-rev-out" class="util-tool-body util-mono" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Line numbers</div><div class="util-tool-desc">Prefix each line with its line number.</div><textarea id="util-ln-in" class="util-input" rows="3"></textarea><button type="button" class="util-btn" id="util-ln-go" style="margin-top:6px">Number</button><div id="util-ln-out" class="util-tool-body util-mono" style="margin-top:6px;max-height:80px;overflow:auto"></div></div>
              <div class="util-tool"><div class="util-tool-title">Trim / collapse space</div><div class="util-tool-desc">Strip line edges or collapse extra whitespace.</div><textarea id="util-trim-in" class="util-input" rows="2"></textarea><div class="util-row" style="margin-top:6px"><button type="button" class="util-btn" id="util-trim-go">Trim lines</button><button type="button" class="util-btn" id="util-collapse-go">Collapse</button></div></div>
            </div>

            <div class="util-cat">Encode · crypto</div>
            <div class="util-tools-grid">
              <div class="util-tool"><div class="util-tool-title">Encode / decode</div><div class="util-tool-desc">Base64 and URL encode or decode a string.</div><input type="text" id="util-codec-in" class="util-input"/><div class="util-row" style="margin-top:6px"><button type="button" class="util-btn" id="util-b64-enc">B64 enc</button><button type="button" class="util-btn" id="util-b64-dec">B64 dec</button><button type="button" class="util-btn" id="util-url-enc">URL enc</button><button type="button" class="util-btn" id="util-url-dec">URL dec</button></div><div id="util-codec-out" class="util-tool-body util-mono" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Hash SHA-256</div><div class="util-tool-desc">One-way SHA-256 fingerprint of any text.</div><input type="text" id="util-hash-in" class="util-input"/><button type="button" class="util-btn" id="util-hash-go" style="margin-top:6px">Hash</button><div id="util-hash-out" class="util-tool-body util-mono" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">UUID v4</div><div class="util-tool-desc">Generate a random version-4 unique identifier.</div><div id="util-uuid" class="util-tool-body util-mono">—</div><button type="button" class="util-btn" id="util-uuid-gen">Generate</button></div>
              <div class="util-tool"><div class="util-tool-title">HTML entities</div><div class="util-tool-desc">Escape or unescape HTML special characters.</div><input type="text" id="util-ent-in" class="util-input"/><div class="util-row" style="margin-top:6px"><button type="button" class="util-btn" id="util-ent-enc">Escape</button><button type="button" class="util-btn" id="util-ent-dec">Unescape</button></div><div id="util-ent-out" class="util-tool-body util-mono" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Hex ↔ text</div><div class="util-tool-desc">Convert between UTF-8 text and hex bytes.</div><input type="text" id="util-hex-in" class="util-input"/><div class="util-row" style="margin-top:6px"><button type="button" class="util-btn" id="util-hex-enc">→ Hex</button><button type="button" class="util-btn" id="util-hex-dec">→ Text</button></div><div id="util-hex-out" class="util-tool-body util-mono" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">ROT13 / Caesar</div><div class="util-tool-desc">Simple letter-shift ciphers for quick obfuscation.</div><input type="text" id="util-rot-in" class="util-input"/><div class="util-row" style="margin-top:6px"><button type="button" class="util-btn" id="util-rot13">ROT13</button><input type="number" id="util-caesar-n" class="util-input" style="max-width:60px" value="3"/><button type="button" class="util-btn" id="util-caesar">Caesar</button></div><div id="util-rot-out" class="util-tool-body util-mono" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Password</div><div class="util-tool-desc">Create a random password of chosen length.</div><div class="util-row"><input type="number" id="util-pw-len" class="util-input" style="max-width:70px" value="16"/><label class="util-hint"><input type="checkbox" id="util-pw-sym" checked> sym</label><button type="button" class="util-btn" id="util-pw-go">Generate</button></div><div id="util-pw-out" class="util-tool-body util-mono" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">JWT peek (no verify)</div><div class="util-tool-desc">Decode JWT header and payload without verifying.</div><textarea id="util-jwt-in" class="util-input" rows="2" placeholder="header.payload.sig"></textarea><button type="button" class="util-btn" id="util-jwt-go" style="margin-top:6px">Decode</button><div id="util-jwt-out" class="util-tool-body util-mono" style="margin-top:6px;max-height:90px;overflow:auto"></div></div>
            </div>

            <div class="util-cat">Math · units</div>
            <div class="util-tools-grid">
              <div class="util-tool"><div class="util-tool-title">Random number</div><div class="util-tool-desc">Pick a random integer in an inclusive range.</div><div class="util-row"><input type="number" id="util-rnd-min" class="util-input" style="max-width:70px" value="1"/><span class="util-hint">–</span><input type="number" id="util-rnd-max" class="util-input" style="max-width:70px" value="100"/><button type="button" class="util-btn" id="util-rnd-go">Roll</button></div><div id="util-rnd-out" class="util-tool-body" style="margin-top:6px;font-size:18px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Dice</div><div class="util-tool-desc">Roll one or more polyhedral dice and sum them.</div><div class="util-row"><select id="util-dice" class="util-select" style="max-width:90px"><option>d4</option><option selected>d6</option><option>d8</option><option>d10</option><option>d12</option><option>d20</option><option>d100</option></select><input type="number" id="util-dice-n" class="util-input" style="max-width:55px" value="1"/><button type="button" class="util-btn" id="util-dice-go">Roll</button></div><div id="util-dice-out" class="util-tool-body" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Percentage</div><div class="util-tool-desc">Compute a percentage of a value and the inverse ratio.</div><div class="util-row"><input type="number" id="util-pct-a" class="util-input" style="max-width:80px" value="25"/><span class="util-hint">% of</span><input type="number" id="util-pct-b" class="util-input" style="max-width:80px" value="200"/><button type="button" class="util-btn" id="util-pct-go">=</button></div><div id="util-pct-out" class="util-tool-body" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Length</div><div class="util-tool-desc">Convert between metric and imperial length units.</div><div class="util-row"><input type="number" id="util-len-in" class="util-input" style="max-width:80px" value="1" step="any"/><select id="util-len-from" class="util-select" style="max-width:70px"><option value="m">m</option><option value="km">km</option><option value="cm">cm</option><option value="mi">mi</option><option value="ft">ft</option><option value="in">in</option></select><span class="util-hint">→</span><select id="util-len-to" class="util-select" style="max-width:70px"><option value="km">km</option><option value="m" selected>m</option><option value="ft">ft</option><option value="mi">mi</option></select></div><div id="util-len-out" class="util-tool-body" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Temperature</div><div class="util-tool-desc">Convert between Celsius, Fahrenheit, and Kelvin.</div><div class="util-row"><input type="number" id="util-temp-in" class="util-input" style="max-width:80px" value="20"/><select id="util-temp-from" class="util-select" style="max-width:70px"><option value="C">°C</option><option value="F">°F</option><option value="K">K</option></select><button type="button" class="util-btn" id="util-temp-go">Convert</button></div><div id="util-temp-out" class="util-tool-body" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Data size</div><div class="util-tool-desc">Expand a size into B, KB, MB, GB, and TB.</div><div class="util-row"><input type="number" id="util-size-in" class="util-input" style="max-width:80px" value="1"/><select id="util-size-from" class="util-select" style="max-width:70px"><option>B</option><option>KB</option><option selected>MB</option><option>GB</option><option>TB</option></select><button type="button" class="util-btn" id="util-size-go">Expand</button></div><div id="util-size-out" class="util-tool-body util-mono" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Calculator</div><div class="util-tool-desc">Evaluate a basic arithmetic expression safely.</div><input type="text" id="util-calc-in" class="util-input" placeholder="(1+2)*3/4"/><button type="button" class="util-btn" id="util-calc-go" style="margin-top:6px">Evaluate</button><div id="util-calc-out" class="util-tool-body" style="margin-top:6px;font-size:18px"></div></div>
              <div class="util-tool"><div class="util-tool-title">BMI</div><div class="util-tool-desc">Body mass index from weight (kg) and height (cm).</div><div class="util-row"><input type="number" id="util-bmi-kg" class="util-input" style="max-width:70px" placeholder="kg"/><input type="number" id="util-bmi-cm" class="util-input" style="max-width:70px" placeholder="cm"/><button type="button" class="util-btn" id="util-bmi-go">BMI</button></div><div id="util-bmi-out" class="util-tool-body" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Rule of three</div><div class="util-tool-desc">Solve a:b = c:x for the missing term x.</div><div class="util-row"><input type="number" id="util-r3-a" class="util-input" style="max-width:60px" value="2"/><span class="util-hint">:</span><input type="number" id="util-r3-b" class="util-input" style="max-width:60px" value="5"/><span class="util-hint">=</span><input type="number" id="util-r3-c" class="util-input" style="max-width:60px" value="4"/><span class="util-hint">:x</span><button type="button" class="util-btn" id="util-r3-go">x</button></div><div id="util-r3-out" class="util-tool-body" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Prime check</div><div class="util-tool-desc">Test whether an integer is a prime number.</div><div class="util-row"><input type="number" id="util-prime-in" class="util-input" style="max-width:120px" value="97"/><button type="button" class="util-btn" id="util-prime-go">Check</button></div><div id="util-prime-out" class="util-tool-body" style="margin-top:6px"></div></div>
            </div>

            <div class="util-cat">Media · audio</div>
            <div class="util-tools-grid">
              <div class="util-tool"><div class="util-tool-title">Bitrate · duration</div><div class="util-tool-desc">Estimate play time from file size and bitrate.</div><div class="util-row"><input type="number" id="util-br-mb" class="util-input" style="max-width:70px" value="10"/><span class="util-hint">MB @</span><input type="number" id="util-br-kbps" class="util-input" style="max-width:70px" value="320"/><span class="util-hint">kbps</span><button type="button" class="util-btn" id="util-br-go">Time</button></div><div id="util-br-out" class="util-tool-body" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Aspect ratio</div><div class="util-tool-desc">Simplify pixel dimensions to a reduced ratio.</div><div class="util-row"><input type="number" id="util-ar-w" class="util-input" style="max-width:70px" value="1920"/><span class="util-hint">×</span><input type="number" id="util-ar-h" class="util-input" style="max-width:70px" value="1080"/><button type="button" class="util-btn" id="util-ar-go">Ratio</button></div><div id="util-ar-out" class="util-tool-body" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Sample size</div><div class="util-tool-desc">Raw PCM byte size from rate, bit depth, and channels.</div><div class="util-row"><input type="number" id="util-smp-sec" class="util-input" style="max-width:60px" value="180" title="seconds"/><input type="number" id="util-smp-rate" class="util-input" style="max-width:70px" value="44100"/><select id="util-smp-bit" class="util-select" style="max-width:70px"><option>16</option><option>24</option><option>32</option></select><select id="util-smp-ch" class="util-select" style="max-width:70px"><option value="2">stereo</option><option value="1">mono</option></select><button type="button" class="util-btn" id="util-smp-go">Bytes</button></div><div id="util-smp-out" class="util-tool-body" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">BPM tap</div><div class="util-tool-desc">Tap along to estimate beats per minute.</div><div id="util-bpm-out" class="util-tool-body" style="font-size:22px">—</div><button type="button" class="util-btn" id="util-bpm-tap">Tap</button><button type="button" class="util-btn" id="util-bpm-reset">Reset</button></div>
              <div class="util-tool"><div class="util-tool-title">Note → frequency</div><div class="util-tool-desc">Concert pitch frequency for a note name (e.g. A4).</div><div class="util-row"><input type="text" id="util-note-in" class="util-input" style="max-width:80px" value="A4"/><button type="button" class="util-btn" id="util-note-go">Hz</button></div><div id="util-note-out" class="util-tool-body" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Semitone shift</div><div class="util-tool-desc">Shift a frequency up or down by N semitones.</div><div class="util-row"><input type="number" id="util-semi-hz" class="util-input" style="max-width:90px" value="440"/><input type="number" id="util-semi-n" class="util-input" style="max-width:60px" value="12"/><button type="button" class="util-btn" id="util-semi-go">Shift</button></div><div id="util-semi-out" class="util-tool-body" style="margin-top:6px"></div></div>
            </div>

            <div class="util-cat">Web · dev</div>
            <div class="util-tools-grid">
              <div class="util-tool"><div class="util-tool-title">JSON format</div><div class="util-tool-desc">Pretty-print or minify JSON and validate it.</div><textarea id="util-json-in" class="util-input" rows="3" placeholder='{"a":1}'></textarea><div class="util-row" style="margin-top:6px"><button type="button" class="util-btn" id="util-json-fmt">Format</button><button type="button" class="util-btn" id="util-json-min">Minify</button></div><div id="util-json-status" class="util-hint"></div></div>
              <div class="util-tool"><div class="util-tool-title">CSV → JSON</div><div class="util-tool-desc">Turn a headered CSV table into a JSON array.</div><textarea id="util-csv-in" class="util-input" rows="3"></textarea><button type="button" class="util-btn" id="util-csv-go" style="margin-top:6px">Convert</button><div id="util-csv-out" class="util-tool-body util-mono" style="margin-top:6px;max-height:80px;overflow:auto"></div></div>
              <div class="util-tool"><div class="util-tool-title">Regex test</div><div class="util-tool-desc">Run a regular expression against sample text.</div><input type="text" id="util-re-pat" class="util-input" placeholder="pattern"/><input type="text" id="util-re-flags" class="util-input" style="margin-top:4px;max-width:70px" value="g"/><textarea id="util-re-text" class="util-input" rows="2" style="margin-top:4px"></textarea><button type="button" class="util-btn" id="util-re-go" style="margin-top:6px">Test</button><div id="util-re-out" class="util-tool-body util-mono" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Colour</div><div class="util-tool-desc">Pick a colour and copy its hex value.</div><div class="util-row"><input type="color" id="util-color" value="#cc8844"/><input type="text" id="util-color-hex" class="util-input" style="max-width:100px" value="#cc8844"/><button type="button" class="util-btn" id="util-color-copy">Copy</button></div></div>
              <div class="util-tool"><div class="util-tool-title">Contrast</div><div class="util-tool-desc">WCAG contrast ratio between two colours.</div><div class="util-row"><input type="color" id="util-cx-a" value="#ffffff"/><input type="color" id="util-cx-b" value="#000000"/><button type="button" class="util-btn" id="util-cx-go">Check</button></div><div id="util-cx-out" class="util-tool-body" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">QR code</div><div class="util-tool-desc">Render a QR code image for a URL or string.</div><input type="text" id="util-qr-in" class="util-input" placeholder="https://…"/><button type="button" class="util-btn" id="util-qr-go" style="margin-top:6px">Show QR</button><div id="util-qr-out" style="margin-top:8px"></div></div>
              <div class="util-tool"><div class="util-tool-title">User-Agent</div><div class="util-tool-desc">Show and copy this browser’s user-agent string.</div><div id="util-ua-out" class="util-tool-body util-mono" style="max-height:60px;overflow:auto"></div><button type="button" class="util-btn" id="util-ua-copy">Copy</button></div>
              <div class="util-tool"><div class="util-tool-title">Screen / viewport</div><div class="util-tool-desc">Screen size, viewport size, and device pixel ratio.</div><div id="util-vp-out" class="util-tool-body util-mono">—</div><button type="button" class="util-btn" id="util-vp-refresh">Refresh</button></div>
              <div class="util-tool"><div class="util-tool-title">Query string parse</div><div class="util-tool-desc">Parse ?a=1&b=2 (or a full URL) into JSON.</div><input type="text" id="util-qs-in" class="util-input" placeholder="?a=1&b=two"/><button type="button" class="util-btn" id="util-qs-go" style="margin-top:6px">Parse</button><div id="util-qs-out" class="util-tool-body util-mono" style="margin-top:6px;max-height:80px;overflow:auto"></div></div>
              <div class="util-tool"><div class="util-tool-title">Cron fields</div><div class="util-tool-desc">Label the five standard cron schedule fields.</div><input type="text" id="util-cron-in" class="util-input" placeholder="0 9 * * 1-5"/><button type="button" class="util-btn" id="util-cron-go" style="margin-top:6px">Explain</button><div id="util-cron-out" class="util-tool-body" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">URL parts</div><div class="util-tool-desc">Split a URL into protocol, host, path, query, hash.</div><input type="text" id="util-urlp-in" class="util-input" placeholder="https://user:pass@host:8080/path?q=1#hash"/><button type="button" class="util-btn" id="util-urlp-go" style="margin-top:6px">Parse</button><div id="util-urlp-out" class="util-tool-body util-mono" style="margin-top:6px;max-height:90px;overflow:auto"></div></div>
              <div class="util-tool"><div class="util-tool-title">Markdown → HTML</div><div class="util-tool-desc">Light conversion of headings, bold, italic, code.</div><textarea id="util-md-in" class="util-input" rows="3" placeholder="# hi **bold**"></textarea><button type="button" class="util-btn" id="util-md-go" style="margin-top:6px">Convert</button><div id="util-md-out" class="util-tool-body" style="margin-top:6px;max-height:80px;overflow:auto"></div></div>
            </div>

            <div class="util-cat">Fun · misc</div>
            <div class="util-tools-grid">
              <div class="util-tool"><div class="util-tool-title">Morse code</div><div class="util-tool-desc">Encode text to Morse or decode Morse to text.</div><input type="text" id="util-morse-in" class="util-input" placeholder="SOS"/><div class="util-row" style="margin-top:6px"><button type="button" class="util-btn" id="util-morse-enc">→ Morse</button><button type="button" class="util-btn" id="util-morse-dec">→ Text</button></div><div id="util-morse-out" class="util-tool-body util-mono" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Coin flip</div><div class="util-tool-desc">Random heads or tails.</div><div id="util-coin-out" class="util-tool-body" style="font-size:22px">—</div><button type="button" class="util-btn" id="util-coin-go">Flip</button></div>
              <div class="util-tool"><div class="util-tool-title">Yes / No / Maybe</div><div class="util-tool-desc">Random three-way answer.</div><div id="util-yn-out" class="util-tool-body" style="font-size:20px">—</div><button type="button" class="util-btn" id="util-yn-go">Ask</button></div>
              <div class="util-tool"><div class="util-tool-title">Pick from list</div><div class="util-tool-desc">Choose one random line from a list.</div><textarea id="util-pick-in" class="util-input" rows="3" placeholder="one&#10;two&#10;three"></textarea><button type="button" class="util-btn" id="util-pick-go" style="margin-top:6px">Pick</button><div id="util-pick-out" class="util-tool-body" style="margin-top:6px;font-size:18px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Colour name guess</div><div class="util-tool-desc">Nearest basic CSS colour name to a swatch.</div><input type="color" id="util-cn-in" value="#336699"/><div id="util-cn-out" class="util-tool-body" style="margin-top:6px"></div><button type="button" class="util-btn" id="util-cn-go">Nearest CSS</button></div>
              <div class="util-tool"><div class="util-tool-title">NATO alphabet</div><div class="util-tool-desc">Spell text with the NATO phonetic alphabet.</div><input type="text" id="util-nato-in" class="util-input" placeholder="ern"/><button type="button" class="util-btn" id="util-nato-go" style="margin-top:6px">Spell</button><div id="util-nato-out" class="util-tool-body" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Roman numerals</div><div class="util-tool-desc">Convert an integer (1–3999) to Roman numerals.</div><div class="util-row"><input type="number" id="util-roman-in" class="util-input" style="max-width:100px" value="2026"/><button type="button" class="util-btn" id="util-roman-go">→ Roman</button></div><div id="util-roman-out" class="util-tool-body" style="margin-top:6px;font-size:18px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Progress quota</div><div class="util-tool-desc">Visual progress bar from current vs total.</div><div class="util-row"><input type="number" id="util-prog-a" class="util-input" style="max-width:70px" value="7"/><span class="util-hint">of</span><input type="number" id="util-prog-b" class="util-input" style="max-width:70px" value="10"/><button type="button" class="util-btn" id="util-prog-go">Bar</button></div><div id="util-prog-out" class="util-tool-body util-mono" style="margin-top:6px"></div></div>
            </div>

            <div class="util-cat">Media · player</div>
            <div class="util-tools-grid">
              <div class="util-tool"><div class="util-tool-title">Playlist duration sum</div><div class="util-tool-desc">Sum track lengths (mm:ss or seconds) into total runtime.</div><textarea id="util-pldur-in" class="util-input" rows="3" placeholder="3:45&#10;4:02&#10;210"></textarea><button type="button" class="util-btn" id="util-pldur-go" style="margin-top:6px">Sum</button><div id="util-pldur-out" class="util-tool-body" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Crossfade calculator</div><div class="util-tool-desc">Overlap time from BPM and beats-per-phrase.</div><div class="util-row"><input type="number" id="util-xf-bpm" class="util-input" style="max-width:70px" value="120"/><span class="util-hint">BPM</span><input type="number" id="util-xf-beats" class="util-input" style="max-width:60px" value="4"/><span class="util-hint">beats</span><button type="button" class="util-btn" id="util-xf-go">Overlap</button></div><div id="util-xf-out" class="util-tool-body" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Loudness guide</div><div class="util-tool-desc">Rough perceived loudness change from a dB gain value.</div><div class="util-row"><input type="number" id="util-loud-db" class="util-input" style="max-width:80px" value="6" step="any"/><span class="util-hint">dB</span><button type="button" class="util-btn" id="util-loud-go">Guide</button></div><div id="util-loud-out" class="util-tool-body" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Gapless frame hint</div><div class="util-tool-desc">Samples to trim at a join for seamless gapless playback.</div><div class="util-row"><input type="number" id="util-gap-rate" class="util-input" style="max-width:90px" value="44100"/><span class="util-hint">Hz</span><input type="number" id="util-gap-ms" class="util-input" style="max-width:70px" value="5" step="any"/><span class="util-hint">ms</span><button type="button" class="util-btn" id="util-gap-go">Samples</button></div><div id="util-gap-out" class="util-tool-body" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Stream URL tester</div><div class="util-tool-desc">Probe a stream URL (CORS permitting) for status and type.</div><input type="text" id="util-stream-in" class="util-input" placeholder="https://…/stream.mp3"/><button type="button" class="util-btn" id="util-stream-go" style="margin-top:6px">Probe</button><div id="util-stream-out" class="util-tool-body util-mono" style="margin-top:6px"></div></div>
            </div>

            <div class="util-cat">Search · library</div>
            <div class="util-tools-grid">
              <div class="util-tool"><div class="util-tool-title">Saved dork presets</div><div class="util-tool-desc">Name and store the current dork form as a reusable preset.</div><div class="util-row"><input type="text" id="util-preset-name" class="util-input" placeholder="preset name"/><button type="button" class="util-btn" id="util-preset-save">Save</button></div><div id="util-preset-list" class="util-tool-body" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Recent dork history</div><div class="util-tool-desc">Last dork searches — click to restore and re-run.</div><div id="util-hist-list" class="util-tool-body" style="max-height:120px;overflow:auto"></div><button type="button" class="util-btn" id="util-hist-clear">Clear history</button></div>
              <div class="util-tool"><div class="util-tool-title">Link checker</div><div class="util-tool-desc">Test URLs (one per line) for reachability where CORS allows.</div><textarea id="util-linkchk-in" class="util-input" rows="3" placeholder="https://…"></textarea><button type="button" class="util-btn" id="util-linkchk-go" style="margin-top:6px">Check</button><div id="util-linkchk-out" class="util-tool-body util-mono" style="margin-top:6px;max-height:100px;overflow:auto"></div></div>
            </div>

            <div class="util-cat">Text · data</div>
            <div class="util-tools-grid">
              <div class="util-tool"><div class="util-tool-title">Duplicate-line finder</div><div class="util-tool-desc">List lines that appear more than once.</div><textarea id="util-dup-in" class="util-input" rows="3"></textarea><button type="button" class="util-btn" id="util-dup-go" style="margin-top:6px">Find</button><div id="util-dup-out" class="util-tool-body util-mono" style="margin-top:6px;max-height:90px;overflow:auto"></div></div>
              <div class="util-tool"><div class="util-tool-title">Column extract</div><div class="util-tool-desc">Pull the Nth field from CSV/TSV-style lines.</div><div class="util-row"><input type="number" id="util-col-n" class="util-input" style="max-width:60px" value="1" min="1"/><select id="util-col-sep" class="util-select" style="max-width:90px"><option value=",">comma</option><option value="\t">tab</option><option value=";">semi</option><option value=" ">space</option></select></div><textarea id="util-col-in" class="util-input" rows="3" style="margin-top:4px"></textarea><button type="button" class="util-btn" id="util-col-go" style="margin-top:6px">Extract</button><div id="util-col-out" class="util-tool-body util-mono" style="margin-top:6px;max-height:80px;overflow:auto"></div></div>
              <div class="util-tool"><div class="util-tool-title">Template fill</div><div class="util-tool-desc">Replace {keys} in a template using a JSON object.</div><textarea id="util-tpl-t" class="util-input" rows="2" placeholder="Hello {name}"></textarea><textarea id="util-tpl-j" class="util-input" rows="2" style="margin-top:4px" placeholder='{"name":"Ern"}'></textarea><button type="button" class="util-btn" id="util-tpl-go" style="margin-top:6px">Fill</button><div id="util-tpl-out" class="util-tool-body util-mono" style="margin-top:6px"></div></div>
            </div>

            <div class="util-cat">Dev · system</div>
            <div class="util-tools-grid">
              <div class="util-tool"><div class="util-tool-title">localStorage browser</div><div class="util-tool-desc">List, export, or clear erndub_* keys in this browser.</div><div id="util-ls-out" class="util-tool-body util-mono" style="max-height:100px;overflow:auto">—</div><div class="util-row"><button type="button" class="util-btn" id="util-ls-refresh">Refresh</button><button type="button" class="util-btn" id="util-ls-export">Export JSON</button><button type="button" class="util-btn" id="util-ls-clear">Clear erndub_*</button></div></div>
              <div class="util-tool"><div class="util-tool-title">Colour palette from image</div><div class="util-tool-desc">Sample dominant colours from a dropped or chosen image.</div><input type="file" id="util-pal-file" accept="image/*"/><div id="util-pal-out" class="util-row" style="margin-top:8px;flex-wrap:wrap;gap:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Easing preview</div><div class="util-tool-desc">Visualise a CSS cubic-bezier timing curve.</div><input type="text" id="util-ease-in" class="util-input" value="0.25, 0.1, 0.25, 1"/><canvas id="util-ease-c" width="200" height="120" style="margin-top:6px;width:100%;max-width:220px;background:#111;border:1px solid #444"></canvas><button type="button" class="util-btn" id="util-ease-go" style="margin-top:6px">Draw</button></div>
              <div class="util-tool"><div class="util-tool-title">Port cheat sheet</div><div class="util-tool-desc">Common service ports (HTTP, FTP, Icecast, etc.).</div><div id="util-ports-out" class="util-tool-body util-mono" style="max-height:120px;overflow:auto"></div></div>
            </div>

            <div class="util-cat">Everyday</div>
            <div class="util-tools-grid">
              <div class="util-tool"><div class="util-tool-title">Tip / split bill</div><div class="util-tool-desc">Bill total with tip percent, split across people.</div><div class="util-row"><input type="number" id="util-tip-bill" class="util-input" style="max-width:80px" value="60" step="any"/><input type="number" id="util-tip-pct" class="util-input" style="max-width:60px" value="12"/><span class="util-hint">%</span><input type="number" id="util-tip-n" class="util-input" style="max-width:50px" value="2"/><span class="util-hint">ppl</span><button type="button" class="util-btn" id="util-tip-go">Split</button></div><div id="util-tip-out" class="util-tool-body" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Timezone convert</div><div class="util-tool-desc">Show a local instant in several time zones.</div><input type="datetime-local" id="util-tz-in" class="util-input"/><button type="button" class="util-btn" id="util-tz-go" style="margin-top:6px">Convert</button><div id="util-tz-out" class="util-tool-body util-mono" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Fuel / trip cost</div><div class="util-tool-desc">Estimate trip cost from distance, economy, and price.</div><div class="util-row"><input type="number" id="util-fuel-dist" class="util-input" style="max-width:70px" value="120" step="any" title="distance"/><input type="number" id="util-fuel-kpl" class="util-input" style="max-width:70px" value="14" step="any" title="km per litre"/><input type="number" id="util-fuel-price" class="util-input" style="max-width:70px" value="1.45" step="any" title="price per litre"/><button type="button" class="util-btn" id="util-fuel-go">Cost</button></div><div id="util-fuel-out" class="util-tool-body" style="margin-top:6px"></div></div>
              <div class="util-tool"><div class="util-tool-title">Weight &amp; volume</div><div class="util-tool-desc">Convert kg↔lb and litres↔gallons.</div><div class="util-row"><input type="number" id="util-wv-in" class="util-input" style="max-width:80px" value="1" step="any"/><select id="util-wv-from" class="util-select" style="max-width:90px"><option value="kg">kg</option><option value="lb">lb</option><option value="L">L</option><option value="gal">gal (US)</option></select><button type="button" class="util-btn" id="util-wv-go">Convert</button></div><div id="util-wv-out" class="util-tool-body" style="margin-top:6px"></div></div>
            </div>
          </div>
        </div>
      </div>
    `;

    injectStyles();
    wire(layer);
    restorePrefs(layer);
    renderLinks();
    loadNotesInto(layer);
    startClock(layer);
    let tab = 'dork';
    try { tab = localStorage.getItem(TAB_KEY) || 'dork'; } catch (e) {}
    // migrate old tab ids
    if (tab === 'search') tab = 'dork';
    setTab(layer, tab);
    return layer;
  }

  function injectStyles() {
    if (document.getElementById('util-dork-styles')) return;
    const s = document.createElement('style');
    s.id = 'util-dork-styles';
    s.textContent = `
      .util-panel-wide {
        max-width: none; max-height: none; width: 100%; height: 100%;
        overflow: auto; display: flex; flex-direction: column;
      }
      .util-head-row {
        display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px;
        margin-bottom: 12px; border-bottom: 1px solid var(--skin-border, #444);
        padding-bottom: 8px;
      }
      .util-head { margin-bottom: 0; }
      .util-tabs { display: flex; flex-wrap: wrap; gap: 4px; }
      .util-tab {
        font: 11px "Share Tech Mono", monospace;
        letter-spacing: 0.05em; text-transform: uppercase;
        padding: 6px 11px; cursor: pointer;
        background: transparent;
        border: 1px solid var(--skin-border, #444);
        color: var(--skin-text-dim, #aaa);
        border-radius: 3px 3px 0 0;
      }
      .util-tab:hover { color: var(--skin-accent, #c84); border-color: var(--skin-accent, #c84); }
      .util-tab.active {
        color: var(--skin-accent, #c84);
        border-color: var(--skin-accent, #c84);
        background: color-mix(in srgb, var(--skin-accent, #c84) 12%, transparent);
        font-weight: 800;
      }
      .util-tab-pane { flex: 0 0 auto; }
      .util-pane-fill { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
      .util-pane-scroll {
        flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden;
        padding-right: 4px;
      }
      .util-tab-pane[hidden] { display: none !important; }
      .util-input-grow { flex: 1; min-width: 120px; }
      .util-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .util-field {
        display: flex; flex-direction: column; gap: 3px;
        font: 10px "Share Tech Mono", monospace;
        color: var(--skin-text-dim, #aaa);
      }
      .util-field-span { grid-column: 1 / -1; }
      .util-select, .util-input, .util-notes {
        font: 12px "Share Tech Mono", monospace;
        background: var(--skin-bg, #111);
        color: var(--skin-text, #ddd);
        border: 1px solid var(--skin-border, #444);
        padding: 6px 8px; width: 100%; box-sizing: border-box;
      }
      .util-btn-accent {
        border-color: var(--skin-accent, #c84) !important;
        color: var(--skin-accent, #c84) !important;
      }
      .util-dork-out {
        margin-top: 8px; font: 10px "Share Tech Mono", monospace;
        color: var(--skin-text-dim, #888); max-height: 120px; overflow: auto;
        white-space: pre-wrap; word-break: break-word;
      }
      .util-dork-out button {
        display: block; width: 100%; text-align: left;
        background: transparent; border: none; color: var(--skin-accent, #c84);
        font: inherit; cursor: pointer; padding: 3px 0;
      }
      .util-dork-out button:hover { text-decoration: underline; }
      .util-browser-bar { display: flex; gap: 6px; align-items: center; margin-bottom: 8px; }
      .util-browser-frame {
        flex: 1 1 auto; min-height: 200px; width: 100%;
        border: 1px solid var(--skin-border, #444);
        background: #fff; border-radius: 3px;
      }
      .util-notes { flex: 1 1 auto; min-height: 220px; resize: vertical; line-height: 1.45; }
      .util-cat {
        font: 11px "Share Tech Mono", monospace;
        letter-spacing: 0.12em; text-transform: uppercase;
        color: var(--skin-accent, #c84);
        margin: 16px 0 8px;
        padding-bottom: 4px;
        border-bottom: 1px solid var(--skin-border, #444);
      }
      .util-cat:first-of-type { margin-top: 4px; }
      .util-tools-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 12px;
      }
      .util-tool {
        border: 1px solid var(--skin-border, #444);
        border-radius: 4px; padding: 10px;
        background: rgba(0,0,0,0.2);
      }
      .util-tool-title {
        font: 10px "Share Tech Mono", monospace;
        letter-spacing: 0.08em; text-transform: uppercase;
        color: var(--skin-accent, #c84); margin-bottom: 2px;
      }
      .util-tool-desc {
        font: 10px "Share Tech Mono", monospace;
        color: var(--skin-text-dim, #888);
        line-height: 1.35;
        margin-bottom: 8px;
      }
      .util-tool-body { font: 12px "Share Tech Mono", monospace; color: var(--skin-text, #ddd); margin-bottom: 8px; }
      .util-mono { word-break: break-all; }
    `;
    document.head.appendChild(s);
  }

  function setTab(layer, id) {
    if (!TABS.some(t => t.id === id)) id = 'dork';
    layer.querySelectorAll('.util-tab').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === id);
    });
    layer.querySelectorAll('.util-tab-pane').forEach(pane => {
      const on = pane.getAttribute('data-pane') === id;
      if (on) pane.removeAttribute('hidden');
      else pane.setAttribute('hidden', '');
    });
    try { localStorage.setItem(TAB_KEY, id); } catch (e) {}
  }

  function restorePrefs(layer) {
    const p = loadPrefs();
    const set = (id, val) => {
      const el = layer.querySelector('#' + id);
      if (el && val != null) el.value = val;
    };
    set('util-engine', p.engine);
    set('util-filetype', p.filetype);
    set('util-dirkind', p.dirkind);
    set('util-dork-kw', p.kw);
    try {
      const u = localStorage.getItem(BROWSER_KEY);
      const inp = layer.querySelector('#util-browser-url');
      if (u && inp) inp.value = u;
    } catch (e) {}
  }

  function readForm(layer) {
    return {
      engine: layer.querySelector('#util-engine')?.value || 'google',
      filetype: layer.querySelector('#util-filetype')?.value || '',
      dirkind: layer.querySelector('#util-dirkind')?.value || 'auto',
      kw: layer.querySelector('#util-dork-kw')?.value || ''
    };
  }
  function persistForm(layer) { savePrefs(readForm(layer)); }

  function showOut(layer, queries, eng) {
    const out = layer.querySelector('#util-dork-out');
    if (!out) return;
    out.innerHTML = '';
    const head = document.createElement('div');
    head.textContent = 'Queries · ' + (ENGINES[eng]?.label || eng) + ' · click to open';
    out.appendChild(head);
    queries.forEach(q => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = q;
      b.addEventListener('click', () => openQueries([q], eng, 1));
      out.appendChild(b);
    });
  }

  function runSearch(layer, more) {
    const form = readForm(layer);
    persistForm(layer);
    const qs = buildQueries(form.dirkind, form.kw, form.filetype);
    openQueries(qs, form.engine, more ? Math.min(qs.length, 8) : Math.min(qs.length, 4));
    showOut(layer, qs, form.engine);
    pushDorkHistory(form, qs[0] || '');
    renderrenderDorkHistory(layer);
  }

  const DORK_HIST_KEY = 'erndub_util_dork_hist';
  const DORK_PRE_KEY = 'erndub_util_dork_presets';

  function loadDorkHist() {
    try { return JSON.parse(localStorage.getItem(DORK_HIST_KEY) || '[]') || []; } catch (e) { return []; }
  }
  function pushDorkHistory(form, sampleQ) {
    const list = loadDorkHist().filter(h => h.sampleQ !== sampleQ || h.kw !== form.kw);
    list.unshift({ ...form, sampleQ, ts: Date.now() });
    try { localStorage.setItem(DORK_HIST_KEY, JSON.stringify(list.slice(0, 20))); } catch (e) {}
  }
  function loadDorkPresets() {
    try { return JSON.parse(localStorage.getItem(DORK_PRE_KEY) || '[]') || []; } catch (e) { return []; }
  }
  function saveDorkPresets(list) {
    try { localStorage.setItem(DORK_PRE_KEY, JSON.stringify(list.slice(0, 30))); } catch (e) {}
  }
  function renderrenderDorkHistory(layer) {
    const box = layer.querySelector('#util-hist-list');
    if (!box) return;
    const list = loadDorkHist();
    box.innerHTML = '';
    if (!list.length) { box.textContent = 'No history yet — run a dork search.'; return; }
    list.forEach((h, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'util-btn';
      b.style.cssText = 'display:block;width:100%;text-align:left;margin:2px 0;font-size:10px';
      b.textContent = (h.kw || '(no kw)') + ' · ' + (h.dirkind || '') + ' · ' + (h.filetype || 'any');
      b.title = h.sampleQ || '';
      b.addEventListener('click', () => {
        const set = (id, v) => { const el = layer.querySelector('#' + id); if (el && v != null) el.value = v; };
        set('util-engine', h.engine); set('util-filetype', h.filetype);
        set('util-dirkind', h.dirkind); set('util-dork-kw', h.kw);
        runSearch(layer, false);
      });
      box.appendChild(b);
    });
  }
  function renderDorkPresets(layer) {
    const box = layer.querySelector('#util-preset-list');
    if (!box) return;
    const list = loadDorkPresets();
    box.innerHTML = '';
    if (!list.length) { box.textContent = 'No presets saved.'; return; }
    list.forEach((h, i) => {
      const row = document.createElement('div');
      row.className = 'util-row';
      row.style.marginTop = '4px';
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'util-btn';
      b.textContent = h.name || 'preset';
      b.addEventListener('click', () => {
        const set = (id, v) => { const el = layer.querySelector('#' + id); if (el && v != null) el.value = v; };
        set('util-engine', h.engine); set('util-filetype', h.filetype);
        set('util-dirkind', h.dirkind); set('util-dork-kw', h.kw);
        runSearch(layer, false);
      });
      const x = document.createElement('button');
      x.type = 'button';
      x.className = 'util-btn util-btn-x';
      x.textContent = '×';
      x.addEventListener('click', () => {
        saveDorkPresets(loadDorkPresets().filter((_, j) => j !== i));
        renderDorkPresets(layer);
      });
      row.appendChild(b); row.appendChild(x);
      box.appendChild(row);
    });
  }

  function copyQueries(layer) {
    const form = readForm(layer);
    const qs = buildQueries(form.dirkind, form.kw, form.filetype);
    showOut(layer, qs, form.engine);
    try { navigator.clipboard.writeText(qs.join('\n')); } catch (e) { prompt('Copy:', qs.join('\n')); }
  }

  function loadNotesInto(layer) {
    const ta = layer.querySelector('#util-notes');
    if (ta) ta.value = loadNotes();
  }

  function browserGo(layer, blank) {
    const frame = layer.querySelector('#util-browser-frame');
    const inp = layer.querySelector('#util-browser-url');
    if (!frame) return;
    if (blank) {
      frame.src = 'about:blank';
      if (inp) inp.value = 'about:blank';
      return;
    }
    let url = (inp && inp.value || '').trim() || 'about:blank';
    if (url !== 'about:blank' && !/^https?:\/\//i.test(url) && !/^about:/i.test(url)) {
      url = 'https://' + url;
      if (inp) inp.value = url;
    }
    try { localStorage.setItem(BROWSER_KEY, url); } catch (e) {}
    frame.src = url;
  }

  function startClock(layer) {
    const el = layer.querySelector('#util-clock');
    if (!el) return;
    const tick = () => {
      const d = new Date();
      el.textContent = 'Local ' + d.toLocaleString() + '\nUTC    ' + d.toISOString();
    };
    tick();
    if (layer._clockTmr) clearInterval(layer._clockTmr);
    layer._clockTmr = setInterval(tick, 1000);
  }

  function wire(layer) {
    layer.querySelectorAll('.util-tab').forEach(btn => {
      btn.addEventListener('click', () => setTab(layer, btn.getAttribute('data-tab')));
    });

    const fileInp = layer.querySelector('#util-file-input');
    const folderInp = layer.querySelector('#util-folder-input');
    layer.querySelector('#util-open-files')?.addEventListener('click', () => fileInp?.click());
    layer.querySelector('#util-open-folder')?.addEventListener('click', () => folderInp?.click());
    if (fileInp) fileInp.addEventListener('change', () => {
      if (fileInp.files?.length && window.app?.handleFiles) window.app.handleFiles(fileInp.files);
    });
    if (folderInp) folderInp.addEventListener('change', () => {
      if (folderInp.files?.length && window.app?.handleFiles) window.app.handleFiles(folderInp.files);
    });

    layer.querySelector('#util-dork-go')?.addEventListener('click', () => runSearch(layer, false));
    layer.querySelector('#util-dork-more')?.addEventListener('click', () => runSearch(layer, true));
    layer.querySelector('#util-dork-copy')?.addEventListener('click', () => copyQueries(layer));
    layer.querySelector('#util-dork-kw')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') runSearch(layer, false);
    });
    ['util-engine', 'util-filetype', 'util-dirkind'].forEach(id => {
      layer.querySelector('#' + id)?.addEventListener('change', () => persistForm(layer));
    });

    layer.querySelector('#util-link-add')?.addEventListener('click', addLink);
    layer.querySelector('#util-link-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addLink();
    });
    layer.querySelector('#util-clear-links')?.addEventListener('click', () => { saveLinks([]); renderLinks(); });
    layer.querySelector('#util-link-defaults')?.addEventListener('click', () => {
      saveLinks(DEFAULT_LINKS.slice()); renderLinks();
    });

    layer.querySelector('#util-copy-path')?.addEventListener('click', () => {
      const tip = 'Keep media under the same folder as ernamp.html (or use Open folder). pic/ for skin tiles.';
      try { navigator.clipboard.writeText(tip); } catch (e) { alert(tip); }
    });

    layer.querySelector('#util-browser-go')?.addEventListener('click', () => browserGo(layer, false));
    layer.querySelector('#util-browser-blank')?.addEventListener('click', () => browserGo(layer, true));
    layer.querySelector('#util-browser-ext')?.addEventListener('click', () => {
      const inp = layer.querySelector('#util-browser-url');
      let url = (inp && inp.value || '').trim() || 'about:blank';
      if (url !== 'about:blank' && !/^https?:\/\//i.test(url) && !/^about:/i.test(url)) url = 'https://' + url;
      window.open(url, '_blank', 'noopener,noreferrer');
    });
    layer.querySelector('#util-browser-url')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') browserGo(layer, false);
    });

    const ta = layer.querySelector('#util-notes');
    if (ta) {
      let tmr;
      ta.addEventListener('input', () => {
        clearTimeout(tmr);
        tmr = setTimeout(() => saveNotes(ta.value), 200);
      });
    }
    layer.querySelector('#util-notes-clear')?.addEventListener('click', () => {
      if (ta) { ta.value = ''; saveNotes(''); }
    });
    layer.querySelector('#util-notes-copy')?.addEventListener('click', () => {
      try { navigator.clipboard.writeText(ta ? ta.value : ''); } catch (e) {}
    });
    layer.querySelector('#util-notes-download')?.addEventListener('click', () => {
      const blob = new Blob([ta ? ta.value : ''], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'erndub-notes.txt';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });

    // Tools
    layer.querySelector('#util-clock-copy')?.addEventListener('click', () => {
      try { navigator.clipboard.writeText(new Date().toISOString()); } catch (e) {}
    });
    layer.querySelector('#util-uuid-gen')?.addEventListener('click', () => {
      const el = layer.querySelector('#util-uuid');
      const id = (crypto.randomUUID && crypto.randomUUID()) ||
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
      if (el) el.textContent = id;
    });
    const codecIn = layer.querySelector('#util-codec-in');
    const codecOut = layer.querySelector('#util-codec-out');
    const setOut = (s) => { if (codecOut) codecOut.textContent = s; };
    layer.querySelector('#util-b64-enc')?.addEventListener('click', () => {
      try { setOut(btoa(unescape(encodeURIComponent(codecIn.value || '')))); }
      catch (e) { setOut('error: ' + e.message); }
    });
    layer.querySelector('#util-b64-dec')?.addEventListener('click', () => {
      try { setOut(decodeURIComponent(escape(atob(codecIn.value || '')))); }
      catch (e) { setOut('error: ' + e.message); }
    });
    layer.querySelector('#util-url-enc')?.addEventListener('click', () => setOut(encodeURIComponent(codecIn.value || '')));
    layer.querySelector('#util-url-dec')?.addEventListener('click', () => {
      try { setOut(decodeURIComponent(codecIn.value || '')); }
      catch (e) { setOut('error: ' + e.message); }
    });
    layer.querySelector('#util-json-fmt')?.addEventListener('click', () => {
      const ta = layer.querySelector('#util-json-in');
      const st = layer.querySelector('#util-json-status');
      try {
        ta.value = JSON.stringify(JSON.parse(ta.value), null, 2);
        if (st) st.textContent = 'OK — formatted';
      } catch (e) { if (st) st.textContent = 'Invalid JSON: ' + e.message; }
    });
    layer.querySelector('#util-json-min')?.addEventListener('click', () => {
      const ta = layer.querySelector('#util-json-in');
      const st = layer.querySelector('#util-json-status');
      try {
        ta.value = JSON.stringify(JSON.parse(ta.value));
        if (st) st.textContent = 'OK — minified';
      } catch (e) { if (st) st.textContent = 'Invalid JSON: ' + e.message; }
    });
    const col = layer.querySelector('#util-color');
    const hex = layer.querySelector('#util-color-hex');
    col?.addEventListener('input', () => { if (hex) hex.value = col.value; });
    hex?.addEventListener('change', () => {
      if (/^#[0-9a-fA-F]{6}$/.test(hex.value) && col) col.value = hex.value;
    });
    layer.querySelector('#util-color-copy')?.addEventListener('click', () => {
      try { navigator.clipboard.writeText(hex?.value || col?.value || ''); } catch (e) {}
    });
    const statsIn = layer.querySelector('#util-stats-in');
    const statsOut = layer.querySelector('#util-stats-out');
    const updStats = () => {
      const t = statsIn?.value || '';
      const lines = t.length ? t.split(/\r\n|\r|\n/).length : 0;
      const words = (t.match(/\S+/g) || []).length;
      if (statsOut) statsOut.textContent = `chars ${t.length} · words ${words} · lines ${lines}`;
    };
    statsIn?.addEventListener('input', updStats);

    // —— extra tools ——
    const $ = (id) => layer.querySelector(id);

    $('#util-unix-now')?.addEventListener('click', () => {
      if ($('#util-unix-in')) $('#util-unix-in').value = String(Math.floor(Date.now() / 1000));
      $('#util-unix-out').textContent = new Date().toISOString();
    });
    $('#util-unix-to')?.addEventListener('click', () => {
      let n = parseFloat($('#util-unix-in')?.value || '0');
      if (n > 1e12) n /= 1000;
      const d = new Date(n * 1000);
      $('#util-unix-out').textContent = isNaN(d.getTime()) ? 'invalid' : d.toISOString() + ' · ' + d.toLocaleString();
    });
    $('#util-date-to-unix')?.addEventListener('click', () => {
      const n = Math.floor(Date.now() / 1000);
      if ($('#util-unix-in')) $('#util-unix-in').value = String(n);
      $('#util-unix-out').textContent = String(n);
    });

    $('#util-hash-go')?.addEventListener('click', async () => {
      try {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode($('#util-hash-in')?.value || ''));
        $('#util-hash-out').textContent = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) { $('#util-hash-out').textContent = 'error'; }
    });

    const LOREM = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua'.split(' ');
    $('#util-lorem-go')?.addEventListener('click', () => {
      const n = Math.max(1, Math.min(500, parseInt($('#util-lorem-n')?.value || '40', 10)));
      const out = Array.from({ length: n }, (_, i) => LOREM[i % LOREM.length]);
      out[0] = out[0][0].toUpperCase() + out[0].slice(1);
      $('#util-lorem-out').textContent = out.join(' ') + '.';
    });
    $('#util-lorem-copy')?.addEventListener('click', () => { try { navigator.clipboard.writeText($('#util-lorem-out')?.textContent || ''); } catch (e) {} });

    const setCase = (fn) => { $('#util-case-out').textContent = fn($('#util-case-in')?.value || ''); };
    $('#util-case-upper')?.addEventListener('click', () => setCase(s => s.toUpperCase()));
    $('#util-case-lower')?.addEventListener('click', () => setCase(s => s.toLowerCase()));
    $('#util-case-title')?.addEventListener('click', () => setCase(s => s.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase())));
    $('#util-case-snake')?.addEventListener('click', () => setCase(s => s.trim().replace(/\s+/g, '_').replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()));
    $('#util-case-kebab')?.addEventListener('click', () => setCase(s => s.trim().replace(/\s+/g, '-').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()));
    $('#util-case-camel')?.addEventListener('click', () => setCase(s => s.trim().replace(/(?:^\w|[A-Z]|\b\w)/g, (c, i) => i ? c.toUpperCase() : c.toLowerCase()).replace(/\s+/g, '')));

    $('#util-slug-go')?.addEventListener('click', () => {
      $('#util-slug-out').textContent = ($('#util-slug-in')?.value || '').toLowerCase().normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    });

    $('#util-pw-go')?.addEventListener('click', () => {
      const len = Math.max(4, Math.min(64, parseInt($('#util-pw-len')?.value || '16', 10)));
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' + ($('#util-pw-sym')?.checked ? '!@#$%^&*-_=+' : '');
      const arr = new Uint32Array(len); crypto.getRandomValues(arr);
      $('#util-pw-out').textContent = Array.from(arr, n => chars[n % chars.length]).join('');
    });

    $('#util-rnd-go')?.addEventListener('click', () => {
      let a = parseFloat($('#util-rnd-min')?.value ?? '1'), b = parseFloat($('#util-rnd-max')?.value ?? '100');
      if (a > b) [a, b] = [b, a];
      $('#util-rnd-out').textContent = String(Math.floor(Math.random() * (b - a + 1)) + a);
    });

    $('#util-dice-go')?.addEventListener('click', () => {
      const sides = parseInt((($('#util-dice')?.value || 'd6').slice(1)), 10) || 6;
      const n = Math.max(1, Math.min(20, parseInt($('#util-dice-n')?.value || '1', 10)));
      const rolls = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * sides));
      $('#util-dice-out').textContent = rolls.join(' + ') + (n > 1 ? ' = ' + rolls.reduce((a, b) => a + b, 0) : '');
    });

    const LEN = { m: 1, km: 1000, cm: 0.01, mi: 1609.344, ft: 0.3048, in: 0.0254 };
    const lenConv = () => {
      const m = parseFloat($('#util-len-in')?.value || '0') * (LEN[$('#util-len-from')?.value] || 1);
      const out = m / (LEN[$('#util-len-to')?.value] || 1);
      $('#util-len-out').textContent = out.toPrecision(8).replace(/\.?0+$/, '') + ' ' + ($('#util-len-to')?.value || '');
    };
    $('#util-len-in')?.addEventListener('input', lenConv);
    $('#util-len-from')?.addEventListener('change', lenConv);
    $('#util-len-to')?.addEventListener('change', lenConv);

    $('#util-temp-go')?.addEventListener('click', () => {
      const v = parseFloat($('#util-temp-in')?.value || '0'), f = $('#util-temp-from')?.value || 'C';
      let C = v; if (f === 'F') C = (v - 32) * 5 / 9; if (f === 'K') C = v - 273.15;
      $('#util-temp-out').textContent = `${C.toFixed(2)} °C · ${(C * 9 / 5 + 32).toFixed(2)} °F · ${(C + 273.15).toFixed(2)} K`;
    });

    $('#util-size-go')?.addEventListener('click', () => {
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      const bytes = parseFloat($('#util-size-in')?.value || '0') * Math.pow(1024, units.indexOf($('#util-size-from')?.value || 'MB'));
      $('#util-size-out').textContent = units.map((u, i) => (bytes / Math.pow(1024, i)).toPrecision(6).replace(/\.?0+$/, '') + ' ' + u).join(' · ');
    });

    $('#util-br-go')?.addEventListener('click', () => {
      const sec = (parseFloat($('#util-br-mb')?.value || '0') * 8 * 1024) / (parseFloat($('#util-br-kbps')?.value || '1') || 1);
      const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60);
      $('#util-br-out').textContent = `${h}h ${m}m ${s}s · ${sec.toFixed(1)}s`;
    });

    $('#util-re-go')?.addEventListener('click', () => {
      try {
        const re = new RegExp($('#util-re-pat')?.value || '', $('#util-re-flags')?.value || '');
        const m = ($('#util-re-text')?.value || '').match(re);
        $('#util-re-out').textContent = m ? `match (${m.length}): ${m.slice(0, 20).join(' | ')}` : 'no match';
      } catch (e) { $('#util-re-out').textContent = 'error: ' + e.message; }
    });

    $('#util-diff-go')?.addEventListener('click', () => {
      const a = ($('#util-diff-a')?.value || '').split(/\r?\n/);
      const b = ($('#util-diff-b')?.value || '').split(/\r?\n/);
      const lines = [];
      for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const A = a[i] ?? '', B = b[i] ?? '';
        if (A === B) lines.push('  ' + A);
        else { if (A) lines.push('- ' + A); if (B) lines.push('+ ' + B); }
      }
      $('#util-diff-out').textContent = lines.join('\n') || '(empty)';
    });

    const sortLines = (fn) => { const ta = $('#util-sort-in'); if (ta) ta.value = fn(ta.value.split(/\r?\n/)).join('\n'); };
    $('#util-sort-asc')?.addEventListener('click', () => sortLines(l => l.slice().sort((a, b) => a.localeCompare(b))));
    $('#util-sort-desc')?.addEventListener('click', () => sortLines(l => l.slice().sort((a, b) => b.localeCompare(a))));
    $('#util-sort-uniq')?.addEventListener('click', () => sortLines(l => Array.from(new Set(l))));
    $('#util-sort-rev')?.addEventListener('click', () => sortLines(l => l.slice().reverse()));

    $('#util-csv-go')?.addEventListener('click', () => {
      const rows = ($('#util-csv-in')?.value || '').trim().split(/\r?\n/).map(r => r.split(',').map(c => c.trim()));
      if (rows.length < 2) { $('#util-csv-out').textContent = 'need header + row'; return; }
      const headers = rows[0];
      $('#util-csv-out').textContent = JSON.stringify(rows.slice(1).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? '']))), null, 2);
    });

    $('#util-ent-enc')?.addEventListener('click', () => { const d = document.createElement('div'); d.textContent = $('#util-ent-in')?.value || ''; $('#util-ent-out').textContent = d.innerHTML; });
    $('#util-ent-dec')?.addEventListener('click', () => { const d = document.createElement('div'); d.innerHTML = $('#util-ent-in')?.value || ''; $('#util-ent-out').textContent = d.textContent || ''; });

    $('#util-qr-go')?.addEventListener('click', () => {
      const data = ($('#util-qr-in')?.value || '').trim();
      const box = $('#util-qr-out');
      if (!box) return;
      box.innerHTML = data ? '<img alt="QR" width="140" height="140" style="background:#fff;padding:4px" src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=' + encodeURIComponent(data) + '"/>' : '';
    });

    $('#util-cron-go')?.addEventListener('click', () => {
      const p = ($('#util-cron-in')?.value || '').trim().split(/\s+/);
      $('#util-cron-out').textContent = p.length < 5 ? 'need 5 fields: m h dom mon dow' : `minute=${p[0]} hour=${p[1]} dom=${p[2]} month=${p[3]} dow=${p[4]}`;
    });

    let swT0 = 0, swAcc = 0, swTimer = 0;
    const swDisp = () => { $('#util-sw-disp').textContent = ((swAcc + (swT0 ? performance.now() - swT0 : 0)) / 1000).toFixed(1) + 's'; };
    $('#util-sw-start')?.addEventListener('click', () => { if (swT0) return; swT0 = performance.now(); swTimer = setInterval(swDisp, 100); });
    $('#util-sw-stop')?.addEventListener('click', () => { if (!swT0) return; swAcc += performance.now() - swT0; swT0 = 0; clearInterval(swTimer); swDisp(); });
    $('#util-sw-reset')?.addEventListener('click', () => { swT0 = 0; swAcc = 0; clearInterval(swTimer); swDisp(); });

    let cdTimer = 0, cdLeft = 0;
    $('#util-cd-start')?.addEventListener('click', () => {
      clearInterval(cdTimer);
      cdLeft = Math.max(1, parseInt($('#util-cd-sec')?.value || '60', 10));
      $('#util-cd-disp').textContent = cdLeft + 's';
      cdTimer = setInterval(() => { cdLeft--; $('#util-cd-disp').textContent = cdLeft <= 0 ? 'DONE' : cdLeft + 's'; if (cdLeft <= 0) clearInterval(cdTimer); }, 1000);
    });
    $('#util-cd-stop')?.addEventListener('click', () => clearInterval(cdTimer));

    $('#util-pct-go')?.addEventListener('click', () => {
      const a = parseFloat($('#util-pct-a')?.value || '0'), b = parseFloat($('#util-pct-b')?.value || '0');
      $('#util-pct-out').textContent = ((a / 100) * b).toPrecision(8).replace(/\.?0+$/, '') + ` · ${b ? ((a / b) * 100).toFixed(2) : '∞'}% ratio`;
    });

    $('#util-ar-go')?.addEventListener('click', () => {
      let w = Math.abs(parseInt($('#util-ar-w')?.value || '0', 10)), h = Math.abs(parseInt($('#util-ar-h')?.value || '0', 10));
      const gcd = (a, b) => b ? gcd(b, a % b) : a; const g = gcd(w, h) || 1;
      $('#util-ar-out').textContent = `${w}:${h} → ${w / g}:${h / g} · ${(w / (h || 1)).toFixed(4)}`;
    });

    const lum = (hex) => {
      const n = parseInt(hex.slice(1), 16);
      const s = [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
    };
    $('#util-cx-go')?.addEventListener('click', () => {
      const ratio = (Math.max(lum($('#util-cx-a').value), lum($('#util-cx-b').value)) + 0.05) / (Math.min(lum($('#util-cx-a').value), lum($('#util-cx-b').value)) + 0.05);
      $('#util-cx-out').textContent = `${ratio.toFixed(2)}:1 · AA ${ratio >= 4.5 ? '✓' : '✗'} · AAA ${ratio >= 7 ? '✓' : '✗'}`;
    });

    if ($('#util-ua-out')) $('#util-ua-out').textContent = navigator.userAgent;
    $('#util-ua-copy')?.addEventListener('click', () => { try { navigator.clipboard.writeText(navigator.userAgent); } catch (e) {} });
    const vpRefresh = () => { $('#util-vp-out').textContent = `screen ${screen.width}×${screen.height}\nviewport ${innerWidth}×${innerHeight}\ndpr ${devicePixelRatio}`; };
    $('#util-vp-refresh')?.addEventListener('click', vpRefresh); vpRefresh();

    const MORSE = { A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..','0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.',' ':'/' };
    const RM = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));
    $('#util-morse-enc')?.addEventListener('click', () => { $('#util-morse-out').textContent = ($('#util-morse-in')?.value || '').toUpperCase().split('').map(c => MORSE[c] || c).join(' '); });
    $('#util-morse-dec')?.addEventListener('click', () => { $('#util-morse-out').textContent = ($('#util-morse-in')?.value || '').trim().split(/\s+/).map(p => RM[p] || p).join(''); });

    // NEW tools handlers
    $('#util-week-go')?.addEventListener('click', () => {
      const d = new Date();
      const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
      const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
      const week = Math.ceil((((t - y) / 86400000) + 1) / 7);
      $('#util-week-out').textContent = `Week ${week} · ${d.getFullYear()} · day ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]}`;
    });

    $('#util-age-go')?.addEventListener('click', () => {
      const a = new Date($('#util-age-a')?.value || Date.now());
      const b = new Date($('#util-age-b')?.value || Date.now());
      const days = Math.round((b - a) / 86400000);
      const years = (days / 365.25).toFixed(2);
      $('#util-age-out').textContent = `${days} days · ~${years} years`;
    });

    $('#util-world-go')?.addEventListener('click', () => {
      const zones = ['UTC', 'America/New_York', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney'];
      $('#util-world-out').textContent = zones.map(z => {
        try { return z + '  ' + new Date().toLocaleString('en-GB', { timeZone: z, hour12: false }); }
        catch (e) { return z + '  ?'; }
      }).join('\n');
    });

    $('#util-freq-go')?.addEventListener('click', () => {
      const words = (($('#util-freq-in')?.value || '').toLowerCase().match(/[a-z0-9']+/g) || []);
      const map = {};
      words.forEach(w => { map[w] = (map[w] || 0) + 1; });
      const top = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 15);
      $('#util-freq-out').textContent = top.map(([w, n]) => n + '  ' + w).join('\n') || '(empty)';
    });

    $('#util-rev-go')?.addEventListener('click', () => {
      const s = $('#util-rev-in')?.value || '';
      $('#util-rev-out').textContent = [...s].reverse().join('');
    });
    $('#util-pal-go')?.addEventListener('click', () => {
      const s = ($('#util-rev-in')?.value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      $('#util-rev-out').textContent = s && s === [...s].reverse().join('') ? 'YES — palindrome' : 'no';
    });

    $('#util-ln-go')?.addEventListener('click', () => {
      const lines = ($('#util-ln-in')?.value || '').split(/\r?\n/);
      $('#util-ln-out').textContent = lines.map((l, i) => String(i + 1).padStart(3) + '  ' + l).join('\n');
    });

    $('#util-trim-go')?.addEventListener('click', () => {
      const ta = $('#util-trim-in');
      if (ta) ta.value = ta.value.split(/\r?\n/).map(l => l.trim()).join('\n');
    });
    $('#util-collapse-go')?.addEventListener('click', () => {
      const ta = $('#util-trim-in');
      if (ta) ta.value = ta.value.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    });

    $('#util-hex-enc')?.addEventListener('click', () => {
      const s = $('#util-hex-in')?.value || '';
      $('#util-hex-out').textContent = Array.from(new TextEncoder().encode(s)).map(b => b.toString(16).padStart(2, '0')).join(' ');
    });
    $('#util-hex-dec')?.addEventListener('click', () => {
      try {
        const bytes = ($('#util-hex-in')?.value || '').trim().split(/\s+/).map(h => parseInt(h, 16));
        $('#util-hex-out').textContent = new TextDecoder().decode(Uint8Array.from(bytes));
      } catch (e) { $('#util-hex-out').textContent = 'error'; }
    });

    const caesar = (s, n) => s.replace(/[a-z]/gi, c => {
      const base = c <= 'Z' ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base + n) % 26 + 26) % 26 + base);
    });
    $('#util-rot13')?.addEventListener('click', () => { $('#util-rot-out').textContent = caesar($('#util-rot-in')?.value || '', 13); });
    $('#util-caesar')?.addEventListener('click', () => { $('#util-rot-out').textContent = caesar($('#util-rot-in')?.value || '', parseInt($('#util-caesar-n')?.value || '3', 10)); });

    $('#util-jwt-go')?.addEventListener('click', () => {
      try {
        const parts = ($('#util-jwt-in')?.value || '').trim().split('.');
        const dec = (p) => JSON.stringify(JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/').padEnd(p.length + (4 - p.length % 4) % 4, '='))), null, 2);
        $('#util-jwt-out').textContent = parts.length >= 2 ? ('HDR\n' + dec(parts[0]) + '\n\nPAY\n' + dec(parts[1])) : 'need header.payload';
      } catch (e) { $('#util-jwt-out').textContent = 'error: ' + e.message; }
    });

    $('#util-calc-go')?.addEventListener('click', () => {
      const expr = ($('#util-calc-in')?.value || '').replace(/[^0-9+\-*/().%\s]/g, '');
      try { $('#util-calc-out').textContent = String(Function('"use strict";return (' + expr + ')')()); }
      catch (e) { $('#util-calc-out').textContent = 'error'; }
    });

    $('#util-bmi-go')?.addEventListener('click', () => {
      const kg = parseFloat($('#util-bmi-kg')?.value || '0'), cm = parseFloat($('#util-bmi-cm')?.value || '0');
      const bmi = kg / Math.pow(cm / 100, 2);
      const label = bmi < 18.5 ? 'under' : bmi < 25 ? 'normal' : bmi < 30 ? 'over' : 'obese';
      $('#util-bmi-out').textContent = isFinite(bmi) ? bmi.toFixed(1) + ' · ' + label : '—';
    });

    $('#util-r3-go')?.addEventListener('click', () => {
      const a = parseFloat($('#util-r3-a')?.value || '0'), b = parseFloat($('#util-r3-b')?.value || '0'), c = parseFloat($('#util-r3-c')?.value || '0');
      $('#util-r3-out').textContent = a ? String((b * c) / a) : '÷0';
    });

    $('#util-prime-go')?.addEventListener('click', () => {
      const n = parseInt($('#util-prime-in')?.value || '0', 10);
      let ok = n > 1;
      for (let i = 2; i * i <= n && ok; i++) if (n % i === 0) ok = false;
      $('#util-prime-out').textContent = n + (ok ? ' is prime' : ' is not prime');
    });

    $('#util-smp-go')?.addEventListener('click', () => {
      const sec = parseFloat($('#util-smp-sec')?.value || '0');
      const rate = parseFloat($('#util-smp-rate')?.value || '44100');
      const bit = parseInt($('#util-smp-bit')?.value || '16', 10);
      const ch = parseInt($('#util-smp-ch')?.value || '2', 10);
      const bytes = sec * rate * (bit / 8) * ch;
      $('#util-smp-out').textContent = (bytes / 1048576).toFixed(2) + ' MB · ' + Math.round(bytes) + ' bytes';
    });

    let bpmTaps = [];
    $('#util-bpm-tap')?.addEventListener('click', () => {
      const now = performance.now();
      bpmTaps.push(now);
      bpmTaps = bpmTaps.filter(t => now - t < 4000).slice(-8);
      if (bpmTaps.length >= 2) {
        const intervals = [];
        for (let i = 1; i < bpmTaps.length; i++) intervals.push(bpmTaps[i] - bpmTaps[i - 1]);
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        $('#util-bpm-out').textContent = Math.round(60000 / avg) + ' BPM';
      } else $('#util-bpm-out').textContent = 'tap…';
    });
    $('#util-bpm-reset')?.addEventListener('click', () => { bpmTaps = []; $('#util-bpm-out').textContent = '—'; });

    $('#util-note-go')?.addEventListener('click', () => {
      const m = /^([A-G])([#b]?)(-?\d+)$/i.exec(($('#util-note-in')?.value || 'A4').trim());
      if (!m) { $('#util-note-out').textContent = 'use A4, C#3…'; return; }
      const map = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
      const name = m[1].toUpperCase() + (m[2] || '');
      const n = map[name];
      if (n == null) { $('#util-note-out').textContent = 'unknown note'; return; }
      const midi = (parseInt(m[3], 10) + 1) * 12 + n;
      const hz = 440 * Math.pow(2, (midi - 69) / 12);
      $('#util-note-out').textContent = hz.toFixed(2) + ' Hz · MIDI ' + midi;
    });

    $('#util-semi-go')?.addEventListener('click', () => {
      const hz = parseFloat($('#util-semi-hz')?.value || '440');
      const n = parseFloat($('#util-semi-n')?.value || '0');
      $('#util-semi-out').textContent = (hz * Math.pow(2, n / 12)).toFixed(3) + ' Hz';
    });

    $('#util-qs-go')?.addEventListener('click', () => {
      let s = ($('#util-qs-in')?.value || '').trim();
      if (s.startsWith('http')) { try { s = new URL(s).search; } catch (e) {} }
      if (s.startsWith('?')) s = s.slice(1);
      const obj = Object.fromEntries(new URLSearchParams(s));
      $('#util-qs-out').textContent = JSON.stringify(obj, null, 2);
    });

    $('#util-urlp-go')?.addEventListener('click', () => {
      try {
        const u = new URL($('#util-urlp-in')?.value || '');
        $('#util-urlp-out').textContent = ['protocol', 'username', 'password', 'hostname', 'port', 'pathname', 'search', 'hash']
          .map(k => k + ': ' + (u[k] || '')).join('\n');
      } catch (e) { $('#util-urlp-out').textContent = 'invalid URL'; }
    });

    $('#util-md-go')?.addEventListener('click', () => {
      let s = $('#util-md-in')?.value || '';
      s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      s = s.replace(/^### (.*)$/gm, '<h3>$1</h3>').replace(/^## (.*)$/gm, '<h2>$1</h2>').replace(/^# (.*)$/gm, '<h1>$1</h1>');
      s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
      s = s.replace(/`(.+?)`/g, '<code>$1</code>').replace(/\n/g, '<br>');
      $('#util-md-out').innerHTML = s;
    });

    $('#util-coin-go')?.addEventListener('click', () => { $('#util-coin-out').textContent = Math.random() < 0.5 ? 'HEADS' : 'TAILS'; });
    $('#util-yn-go')?.addEventListener('click', () => { $('#util-yn-out').textContent = ['YES', 'NO', 'MAYBE'][Math.floor(Math.random() * 3)]; });
    $('#util-pick-go')?.addEventListener('click', () => {
      const items = ($('#util-pick-in')?.value || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      $('#util-pick-out').textContent = items.length ? items[Math.floor(Math.random() * items.length)] : '—';
    });

    const CSS_COLORS = { black:'#000000',white:'#ffffff',red:'#ff0000',green:'#008000',blue:'#0000ff',yellow:'#ffff00',cyan:'#00ffff',magenta:'#ff00ff',orange:'#ffa500',purple:'#800080',pink:'#ffc0cb',brown:'#a52a2a',gray:'#808080',navy:'#000080',teal:'#008080',olive:'#808000',maroon:'#800000',lime:'#00ff00',aqua:'#00ffff',silver:'#c0c0c0',gold:'#ffd700',coral:'#ff7f50',salmon:'#fa8072',khaki:'#f0e68c',violet:'#ee82ee',indigo:'#4b0082',crimson:'#dc143c',tomato:'#ff6347',wheat:'#f5deb3',tan:'#d2b48c' };
    $('#util-cn-go')?.addEventListener('click', () => {
      const hex = ($('#util-cn-in')?.value || '#000000').slice(1);
      const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
      let best = 'black', bestD = 1e9;
      for (const [name, h] of Object.entries(CSS_COLORS)) {
        const rr = parseInt(h.slice(1, 3), 16), gg = parseInt(h.slice(3, 5), 16), bb = parseInt(h.slice(5, 7), 16);
        const d = (r - rr) ** 2 + (g - gg) ** 2 + (b - bb) ** 2;
        if (d < bestD) { bestD = d; best = name; }
      }
      $('#util-cn-out').textContent = best + ' · ' + CSS_COLORS[best];
    });

    const NATO = { A:'Alpha',B:'Bravo',C:'Charlie',D:'Delta',E:'Echo',F:'Foxtrot',G:'Golf',H:'Hotel',I:'India',J:'Juliett',K:'Kilo',L:'Lima',M:'Mike',N:'November',O:'Oscar',P:'Papa',Q:'Quebec',R:'Romeo',S:'Sierra',T:'Tango',U:'Uniform',V:'Victor',W:'Whiskey',X:'X-ray',Y:'Yankee',Z:'Zulu','0':'Zero','1':'One','2':'Two','3':'Three','4':'Four','5':'Five','6':'Six','7':'Seven','8':'Eight','9':'Nine' };
    $('#util-nato-go')?.addEventListener('click', () => {
      $('#util-nato-out').textContent = ($('#util-nato-in')?.value || '').toUpperCase().split('').map(c => NATO[c] || c).join(' ');
    });

    $('#util-roman-go')?.addEventListener('click', () => {
      let n = Math.max(0, Math.min(3999, parseInt($('#util-roman-in')?.value || '0', 10)));
      const map = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
      let out = '';
      for (const [v, s] of map) { while (n >= v) { out += s; n -= v; } }
      $('#util-roman-out').textContent = out || '—';
    });

    $('#util-prog-go')?.addEventListener('click', () => {
      const a = parseFloat($('#util-prog-a')?.value || '0'), b = parseFloat($('#util-prog-b')?.value || '1') || 1;
      const p = Math.max(0, Math.min(1, a / b));
      const filled = Math.round(p * 20);
      $('#util-prog-out').textContent = '[' + '#'.repeat(filled) + '-'.repeat(20 - filled) + '] ' + (p * 100).toFixed(1) + '%';
    });

    // —— batch: media / search / text / dev / everyday ——
    const parseDur = (s) => {
      s = String(s).trim();
      if (!s) return 0;
      if (/^\d+(\.\d+)?$/.test(s)) return parseFloat(s);
      const p = s.split(':').map(Number);
      if (p.some(isNaN)) return 0;
      if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
      if (p.length === 2) return p[0] * 60 + p[1];
      return p[0] || 0;
    };
    $('#util-pldur-go')?.addEventListener('click', () => {
      const lines = ($('#util-pldur-in')?.value || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const secs = lines.map(parseDur);
      const total = secs.reduce((a, b) => a + b, 0);
      const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = Math.round(total % 60);
      $('#util-pldur-out').textContent = `${lines.length} tracks · ${h}h ${m}m ${s}s · ${total.toFixed(1)}s`;
    });
    $('#util-xf-go')?.addEventListener('click', () => {
      const bpm = parseFloat($('#util-xf-bpm')?.value || '120') || 120;
      const beats = parseFloat($('#util-xf-beats')?.value || '4') || 4;
      const sec = (beats * 60) / bpm;
      $('#util-xf-out').textContent = sec.toFixed(3) + 's overlap · ' + (sec * 1000).toFixed(0) + ' ms';
    });
    $('#util-loud-go')?.addEventListener('click', () => {
      const db = parseFloat($('#util-loud-db')?.value || '0');
      const factor = Math.pow(10, db / 20);
      const approx = Math.pow(2, db / 10);
      $('#util-loud-out').textContent = `${db} dB → ×${factor.toFixed(2)} amplitude · ~×${approx.toFixed(2)} perceived (rule-of-thumb)`;
    });
    $('#util-gap-go')?.addEventListener('click', () => {
      const rate = parseFloat($('#util-gap-rate')?.value || '44100');
      const ms = parseFloat($('#util-gap-ms')?.value || '0');
      const samples = Math.round(rate * ms / 1000);
      $('#util-gap-out').textContent = samples + ' samples @ ' + rate + ' Hz';
    });
    $('#util-stream-go')?.addEventListener('click', async () => {
      const url = ($('#util-stream-in')?.value || '').trim();
      const out = $('#util-stream-out');
      if (!url) { out.textContent = 'enter URL'; return; }
      out.textContent = 'probing…';
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 8000);
        const res = await fetch(url, { method: 'GET', mode: 'cors', signal: ctrl.signal, headers: { 'Range': 'bytes=0-0' } });
        clearTimeout(t);
        out.textContent = `status ${res.status} ${res.statusText}\ntype ${res.headers.get('content-type') || '?'}\nlength ${res.headers.get('content-length') || res.headers.get('content-range') || '?'}\naccept-ranges ${res.headers.get('accept-ranges') || '?'}`;
      } catch (e) {
        out.textContent = 'failed (CORS or network): ' + e.message;
      }
    });

    renderDorkPresets(layer);
   renderDorkHistory(layer);
    $('#util-preset-save')?.addEventListener('click', () => {
      const name = ($('#util-preset-name')?.value || '').trim() || 'preset';
      const form = readForm(layer);
      const list = loadDorkPresets();
      list.unshift({ name, ...form, ts: Date.now() });
      saveDorkPresets(list);
      renderDorkPresets(layer);
    });
    $('#util-hist-clear')?.addEventListener('click', () => {
      try { localStorage.removeItem(DORK_HIST_KEY); } catch (e) {}
      renderrenderDorkHistory(layer);
    });

    $('#util-linkchk-go')?.addEventListener('click', async () => {
      const urls = ($('#util-linkchk-in')?.value || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean).slice(0, 15);
      const out = $('#util-linkchk-out');
      out.textContent = 'checking…';
      const lines = [];
      for (const url of urls) {
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 6000);
          const res = await fetch(url, { method: 'GET', mode: 'cors', signal: ctrl.signal });
          clearTimeout(t);
          lines.push(`${res.status} ${url}`);
        } catch (e) {
          lines.push(`FAIL ${url} (${e.message})`);
        }
      }
      out.textContent = lines.join('\n') || 'no urls';
    });

    $('#util-dup-go')?.addEventListener('click', () => {
      const lines = ($('#util-dup-in')?.value || '').split(/\r?\n/);
      const map = {};
      lines.forEach(l => { map[l] = (map[l] || 0) + 1; });
      const dups = Object.entries(map).filter(([, n]) => n > 1);
      $('#util-dup-out').textContent = dups.length ? dups.map(([l, n]) => n + '×  ' + l).join('\n') : 'no duplicates';
    });

    $('#util-col-go')?.addEventListener('click', () => {
      const n = Math.max(1, parseInt($('#util-col-n')?.value || '1', 10)) - 1;
      let sep = $('#util-col-sep')?.value ?? ',';
      if (sep === '\\t') sep = '\t';
      const lines = ($('#util-col-in')?.value || '').split(/\r?\n/);
      $('#util-col-out').textContent = lines.map(l => (l.split(sep)[n] || '').trim()).join('\n');
    });

    $('#util-tpl-go')?.addEventListener('click', () => {
      try {
        const data = JSON.parse($('#util-tpl-j')?.value || '{}');
        const out = ($('#util-tpl-t')?.value || '').replace(/\{(\w+)\}/g, (_, k) => data[k] != null ? String(data[k]) : '');
        $('#util-tpl-out').textContent = out;
      } catch (e) { $('#util-tpl-out').textContent = 'bad JSON: ' + e.message; }
    });

    const lsRefresh = () => {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('erndub_')) keys.push(k);
      }
      keys.sort();
      $('#util-ls-out').textContent = keys.length
        ? keys.map(k => k + '  (' + (localStorage.getItem(k) || '').length + 'b)').join('\n')
        : 'no erndub_* keys';
    };
    $('#util-ls-refresh')?.addEventListener('click', lsRefresh);
    lsRefresh();
    $('#util-ls-export')?.addEventListener('click', () => {
      const obj = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('erndub_')) obj[k] = localStorage.getItem(k);
      }
      const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'erndub-localstorage.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });
    $('#util-ls-clear')?.addEventListener('click', () => {
      if (!confirm('Clear all erndub_* localStorage keys?')) return;
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('erndub_')) keys.push(k);
      }
      keys.forEach(k => localStorage.removeItem(k));
      lsRefresh();
    });

    $('#util-pal-file')?.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      const box = $('#util-pal-out');
      if (!file || !box) return;
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const c = document.createElement('canvas');
        const w = 64, h = 64;
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        const buckets = new Map();
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue;
          const r = data[i] >> 4, g = data[i + 1] >> 4, b = data[i + 2] >> 4;
          const key = (r << 8) | (g << 4) | b;
          buckets.set(key, (buckets.get(key) || 0) + 1);
        }
        const top = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
        box.innerHTML = '';
        top.forEach(([key]) => {
          const r = ((key >> 8) & 15) * 17, g = ((key >> 4) & 15) * 17, b = (key & 15) * 17;
          const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
          const sw = document.createElement('button');
          sw.type = 'button';
          sw.title = hex;
          sw.style.cssText = `width:36px;height:36px;border:1px solid #666;background:${hex};cursor:pointer`;
          sw.addEventListener('click', () => { try { navigator.clipboard.writeText(hex); } catch (e) {} });
          box.appendChild(sw);
        });
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });

    const drawEase = () => {
      const canvas = $('#util-ease-c');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width, h = canvas.height;
      ctx.fillStyle = '#111'; ctx.fillRect(0, 0, w, h);
      const parts = ($('#util-ease-in')?.value || '0.25,0.1,0.25,1').split(',').map(s => parseFloat(s.trim()));
      const [x1, y1, x2, y2] = parts.length === 4 && parts.every(n => isFinite(n)) ? parts : [0.25, 0.1, 0.25, 1];
      const bez = (t) => {
        const u = 1 - t;
        return {
          x: 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t,
          y: 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t
        };
      };
      ctx.strokeStyle = '#333'; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(w, 0); ctx.stroke();
      ctx.strokeStyle = '#c84'; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 50; i++) {
        const p = bez(i / 50);
        const X = p.x * w, Y = h - p.y * h;
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      }
      ctx.stroke();
    };
    $('#util-ease-go')?.addEventListener('click', drawEase);
    drawEase();

    $('#util-ports-out').textContent = [
      '20/21  FTP', '22  SSH', '23  Telnet', '25  SMTP', '53  DNS',
      '80  HTTP', '110  POP3', '143  IMAP', '443  HTTPS',
      '445  SMB', '3306  MySQL', '5432  PostgreSQL',
      '8000  Icecast/dev', '8080  alt-HTTP', '8443  alt-HTTPS',
      '8888  Jupyter/dev', '27017  MongoDB'
    ].join('\n');

    $('#util-tip-go')?.addEventListener('click', () => {
      const bill = parseFloat($('#util-tip-bill')?.value || '0');
      const pct = parseFloat($('#util-tip-pct')?.value || '0');
      const n = Math.max(1, parseInt($('#util-tip-n')?.value || '1', 10));
      const tip = bill * pct / 100;
      const total = bill + tip;
      $('#util-tip-out').textContent = `tip ${tip.toFixed(2)} · total ${total.toFixed(2)} · each ${(total / n).toFixed(2)}`;
    });

    $('#util-tz-go')?.addEventListener('click', () => {
      const raw = $('#util-tz-in')?.value;
      const d = raw ? new Date(raw) : new Date();
      if (isNaN(d.getTime())) { $('#util-tz-out').textContent = 'invalid'; return; }
      const zones = ['UTC', 'America/New_York', 'Europe/London', 'Europe/Berlin', 'Asia/Tokyo', 'Australia/Sydney'];
      $('#util-tz-out').textContent = zones.map(z => {
        try { return z + '  ' + d.toLocaleString('en-GB', { timeZone: z, hour12: false }); }
        catch (e) { return z + '  ?'; }
      }).join('\n');
    });

    $('#util-fuel-go')?.addEventListener('click', () => {
      const dist = parseFloat($('#util-fuel-dist')?.value || '0');
      const kpl = parseFloat($('#util-fuel-kpl')?.value || '1') || 1;
      const price = parseFloat($('#util-fuel-price')?.value || '0');
      const litres = dist / kpl;
      $('#util-fuel-out').textContent = `${litres.toFixed(2)} L · ${(litres * price).toFixed(2)} cost · ${(100 / kpl).toFixed(1)} L/100km`;
    });

    $('#util-wv-go')?.addEventListener('click', () => {
      const v = parseFloat($('#util-wv-in')?.value || '0');
      const f = $('#util-wv-from')?.value || 'kg';
      if (f === 'kg') $('#util-wv-out').textContent = v + ' kg = ' + (v * 2.2046226218).toFixed(4) + ' lb';
      else if (f === 'lb') $('#util-wv-out').textContent = v + ' lb = ' + (v / 2.2046226218).toFixed(4) + ' kg';
      else if (f === 'L') $('#util-wv-out').textContent = v + ' L = ' + (v * 0.2641720524).toFixed(4) + ' gal (US)';
      else $('#util-wv-out').textContent = v + ' gal (US) = ' + (v / 0.2641720524).toFixed(4) + ' L';
    });
  }

  function addLink() {
    const inp = document.getElementById('util-link-input');
    const raw = (inp && inp.value || '').trim();
    if (!raw) return;
    let url = raw, label = '';
    const sp = raw.indexOf(' ');
    if (sp > 0 && /^https?:\/\//i.test(raw.slice(0, sp))) {
      url = raw.slice(0, sp);
      label = raw.slice(sp + 1).trim();
    }
    if (!/^https?:\/\//i.test(url) && !/^about:/i.test(url) && !/^file:/i.test(url)) url = 'https://' + url;
    const list = loadLinks();
    list.unshift({ url, label: label || url.replace(/^https?:\/\//, '').slice(0, 48), ts: Date.now() });
    saveLinks(list);
    if (inp) inp.value = '';
    renderLinks();
  }

  function renderLinks() {
    const box = document.getElementById('util-links');
    if (!box) return;
    const list = loadLinks();
    box.innerHTML = '';
    if (!list.length) {
      box.innerHTML = '<div class="util-hint">No links yet</div>';
      return;
    }
    list.forEach((item, i) => {
      const row = document.createElement('div');
      row.className = 'util-link-row';
      const a = document.createElement('a');
      a.href = item.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = item.label || item.url;
      a.className = 'util-link';
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'util-btn util-btn-x';
      del.textContent = '×';
      del.onclick = () => { saveLinks(loadLinks().filter((_, j) => j !== i)); renderLinks(); };
      row.appendChild(a);
      row.appendChild(del);
      box.appendChild(row);
    });
  }

  function sync(active) {
    const layer = ensureLayer();
    const stage = document.getElementById('stage');
    if (stage) stage.classList.toggle('utilities-mode-active', !!active);
    if (layer) {
      if (active) {
        layer.style.display = 'flex';
        startClock(layer);
      } else {
        layer.style.removeProperty('display');
        if (layer._clockTmr) clearInterval(layer._clockTmr);
      }
      layer.setAttribute('aria-hidden', active ? 'false' : 'true');
      if (active) renderLinks();
    }
  }

  window.UtilitiesMode = { sync, ensureLayer, buildQueries };
})();
