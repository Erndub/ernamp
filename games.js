// ================================================
// games.js – ERNDUB arcade catalog + inline engines
//
// Types:
//   html + inline:true  → built-in canvas engines (Tetris, Mario, …)
//   emu                 → EmulatorJS (gb / gbc / segaMD / …)
//                         set src to ROM url OR leave empty to pick a local file
//   iframe / itch / url / embed
//                       → <iframe> embed (itch.io, retrogames.cc, any HTML5 page)
//                         required: src  (HTTPS preferred)
//                         optional: sandbox, referrerPolicy
//   swf                 → Ruffle Flash
//
// Legal: only use ROMs / games you have the right to run.
// ================================================

window.GAMES = [
  // —— Built-in ——
  {
    id: 'tetris',
    title: 'TETRIS',
    genre: 'PUZZLE',
    type: 'html',
    inline: true,
    description: 'Classic tetromino stacker.',
    controls: '← → move · ↑/X rotate · ↓ soft · Space hard drop · Start pause'
  },
  {
    id: 'demo-breakout',
    title: 'BREAKOUT',
    genre: 'ARCADE',
    type: 'html',
    inline: true,
    description: 'Paddle + bricks.',
    controls: '← → / stick'
  },
  {
    id: 'demo-snake',
    title: 'SNAKE',
    genre: 'ARCADE',
    type: 'html',
    inline: true,
    description: 'Classic snake.',
    controls: 'D-pad / stick'
  },
  {
    id: 'sandpit',
    title: 'SANDPIT 107',
    genre: 'SANDBOX',
    type: 'html',
    inline: true,
    description: 'Falling-sand reactor. Wind field, heat, cloners, mites, fungus bombs, rockets, thermite, void, plasma.',
    controls: 'LMB paint · RMB erase · MMB sample · Wheel brush · Q/E material · 1-0 hotkeys · C clear · P pause · G gravity · D demo · F fireworks'
  },

  // —— Emulation (EmulatorJS) ——
  {
    id: 'emu-gb',
    title: 'GAME BOY',
    genre: 'EMU · GB',
    type: 'emu',
    core: 'gb',
    src: '', // e.g. './roms/game.gb' or https://...
    extensions: '.gb,.GB',
    description: 'Nintendo Game Boy. Load a .gb ROM (local file or URL in src).',
    controls: 'EmulatorJS virtual gamepad · keyboard · real pad'
  },
  {
    id: 'emu-gbc',
    title: 'GAME BOY COLOR',
    genre: 'EMU · GBC',
    type: 'emu',
    core: 'gb', // GBC ROMs (.gbc) use same core family in EmulatorJS
    src: '',
    extensions: '.gbc,.GBC,.gb,.GB',
    description: 'Game Boy Color. Load a .gbc ROM.',
    controls: 'EmulatorJS virtual gamepad · keyboard · real pad'
  },
  {
    id: 'emu-genesis',
    title: 'SEGA GENESIS / MD',
    genre: 'EMU · GENESIS',
    type: 'emu',
    core: 'segaMD',
    src: '',
    extensions: '.md,.bin,.gen,.sms,.zip',
    description: 'Sega Genesis / Mega Drive. Load a ROM (or .zip).',
    controls: 'EmulatorJS virtual gamepad · keyboard · real pad'
  },

  // —— iframe / itch / browser embeds ——
  // Any HTTPS page that allows framing. Prefer official embed URLs.
  {
    id: 'iframe-retrogames-skidmarks',
    title: 'SUPER SKIDMARKS (BETA)',
    genre: 'RETRO · IFRAME',
    type: 'iframe',
    src: 'https://www.retrogames.cc/embed/29791-super-skidmarks-europe-beta.html',
    description: 'retrogames.cc embed. type:iframe + src → full-stage iframe.',
    controls: 'Click to focus · keyboard / pad if the embed supports it'
  },
  {
    id: 'itch-hexagonal',
    title: 'ITCH: SAMPLE SLOT A',
    genre: 'ITCH.IO',
    type: 'itch',
    src: 'https://html-classic.itch.zone/html/11559920/index.html',
    description: 'Example HTML5 itch upload host. Replace src with any itch embed game URL.',
    controls: 'Focus frame · gamepad if the game supports it'
  },
  {
    id: 'itch-slot-b',
    title: 'ITCH: SAMPLE SLOT B',
    genre: 'ITCH.IO',
    type: 'itch',
    src: 'https://html-classic.itch.zone/html/11904168/index.html',
    description: 'Another itch HTML5 slot — edit src in games.js.',
    controls: 'Click to focus'
  },
  {
    id: 'iframe-custom',
    title: 'IFRAME / WEB (CUSTOM URL)',
    genre: 'WEB',
    type: 'iframe',
    src: '',
    description: 'Set src in games.js to any playable HTTPS page (itch embed, retrogames, self-hosted HTML5, …).',
    controls: 'Depends on game'
  },

  {
    id: 'ruffle-placeholder',
    title: 'SWF SLOT (Ruffle)',
    genre: 'FLASH',
    type: 'swf',
    src: '',
    description: 'Set src to a .swf URL/path.',
    controls: 'Depends on game'
  }
];

window.GAMEPAD_KEYMAP = {
  12: 'ArrowUp', 13: 'ArrowDown', 14: 'ArrowLeft', 15: 'ArrowRight',
  0: ' ', 1: 'Escape', 9: 'Enter', 8: 'Shift'
};

// ============================================================
// Inline game engines — called by player mountInlineGame
// API: start(canvas, api) where api = { keys, axes, running: fn, onExit }
// Returns { stop() }
// ============================================================
window.InlineGames = window.InlineGames || {};

// ---------- TETRIS ----------
window.InlineGames.tetris = function (canvas, api) {
  const ctx = canvas.getContext('2d');
  const COLS = 10, ROWS = 20, SIZE = 16;
  canvas.width = 220;
  canvas.height = 340;
  const COLORS = {
    I: '#00f0f0', O: '#f0f000', T: '#a000f0', S: '#00f000',
    Z: '#f00000', J: '#0000f0', L: '#f0a000', G: '#333'
  };
  const SHAPES = {
    I: [[1,1,1,1]],
    O: [[1,1],[1,1]],
    T: [[0,1,0],[1,1,1]],
    S: [[0,1,1],[1,1,0]],
    Z: [[1,1,0],[0,1,1]],
    J: [[1,0,0],[1,1,1]],
    L: [[0,0,1],[1,1,1]]
  };
  const BAG_TYPES = Object.keys(SHAPES);
  let board, piece, next, score, lines, level, dropMs, acc, over, paused, bag;
  let raf = 0, last = 0;

  function newBag() {
    if (!bag || bag.length === 0) {
      bag = BAG_TYPES.slice();
      for (let i = bag.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
    }
    return bag.pop();
  }
  function spawn() {
    const type = next || newBag();
    next = newBag();
    const shape = SHAPES[type].map(r => r.slice());
    piece = { type, shape, x: ((COLS - shape[0].length) / 2) | 0, y: 0 };
    if (collide(piece.x, piece.y, piece.shape)) over = true;
  }
  function collide(x, y, shape) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nx = x + c, ny = y + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
    }
    return false;
  }
  function merge() {
    piece.shape.forEach((row, r) => row.forEach((v, c) => {
      if (v && piece.y + r >= 0) board[piece.y + r][piece.x + c] = piece.type;
    }));
  }
  function clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every(Boolean)) {
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(0));
        cleared++;
        r++;
      }
    }
    if (cleared) {
      const pts = [0, 100, 300, 500, 800];
      score += (pts[cleared] || 800) * level;
      lines += cleared;
      level = 1 + ((lines / 10) | 0);
      dropMs = Math.max(80, 600 - (level - 1) * 50);
    }
  }
  function rotate(shape) {
    const h = shape.length, w = shape[0].length;
    const out = Array.from({ length: w }, () => Array(h).fill(0));
    for (let r = 0; r < h; r++)
      for (let c = 0; c < w; c++)
        out[c][h - 1 - r] = shape[r][c];
    return out;
  }
  function tryRotate() {
    const nextShape = rotate(piece.shape);
    const kicks = [0, -1, 1, -2, 2];
    for (const k of kicks) {
      if (!collide(piece.x + k, piece.y, nextShape)) {
        piece.x += k; piece.shape = nextShape; return;
      }
    }
  }
  function hardDrop() {
    while (!collide(piece.x, piece.y + 1, piece.shape)) piece.y++;
    merge(); clearLines(); spawn();
  }
  function reset() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    score = 0; lines = 0; level = 1; dropMs = 600; acc = 0;
    over = false; paused = false; bag = null; next = null;
    spawn();
  }
  reset();

  // input edge detection
  const prev = Object.create(null);
  function edge(k) {
    const down = !!(api.keys[k] || api.keys[k.toLowerCase()]);
    const e = down && !prev[k];
    prev[k] = down;
    return e;
  }
  let moveAcc = 0;

  function frame(now) {
    if (!api.running()) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(40, now - last); last = now;

    if (edge('Enter') || edge('p') || edge('P')) paused = !paused;
    if (over) {
      draw();
      if (edge(' ') || edge('Enter') || edge('r') || edge('R')) reset();
      return;
    }
    if (paused) { draw(); return; }

    // horizontal DAS
    const left = api.keys['ArrowLeft'] || api.keys['a'] || (api.axes && api.axes[0] < -0.4);
    const right = api.keys['ArrowRight'] || api.keys['d'] || (api.axes && api.axes[0] > 0.4);
    if (left || right) {
      moveAcc += dt;
      if (moveAcc > 120 || edge('ArrowLeft') || edge('ArrowRight') || edge('a') || edge('d')) {
        const dx = left ? -1 : 1;
        if (!collide(piece.x + dx, piece.y, piece.shape)) piece.x += dx;
        moveAcc = moveAcc > 120 ? 40 : 0;
      }
    } else moveAcc = 0;

    if (edge('ArrowUp') || edge('x') || edge('X') || edge('w') || edge('W')) tryRotate();
    if (edge(' ') || edge('Enter') && false) hardDrop();
    if (edge(' ')) hardDrop();

    const soft = api.keys['ArrowDown'] || api.keys['s'] || (api.axes && api.axes[1] > 0.5);
    acc += dt * (soft ? 8 : 1);
    if (acc >= dropMs) {
      acc = 0;
      if (!collide(piece.x, piece.y + 1, piece.shape)) piece.y++;
      else { merge(); clearLines(); spawn(); }
    }
    draw();
  }

  function cell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * SIZE + 1, y * SIZE + 1, SIZE - 2, SIZE - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x * SIZE + 1, y * SIZE + 1, SIZE - 2, 3);
  }
  function draw() {
    ctx.fillStyle = '#0a0c12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // playfield frame
    const ox = 12, oy = 12;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, COLS * SIZE, ROWS * SIZE);
    ctx.strokeStyle = '#2a3344';
    ctx.strokeRect(0.5, 0.5, COLS * SIZE - 1, ROWS * SIZE - 1);
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (board[r][c]) cell(c, r, COLORS[board[r][c]] || '#888');
    if (piece) {
      // ghost
      let gy = piece.y;
      while (!collide(piece.x, gy + 1, piece.shape)) gy++;
      piece.shape.forEach((row, r) => row.forEach((v, c) => {
        if (v) {
          ctx.globalAlpha = 0.2;
          cell(piece.x + c, gy + r, COLORS[piece.type]);
          ctx.globalAlpha = 1;
          if (piece.y + r >= 0) cell(piece.x + c, piece.y + r, COLORS[piece.type]);
        }
      }));
    }
    ctx.restore();
    // sidebar
    const sx = ox + COLS * SIZE + 12;
    ctx.fillStyle = '#9ab';
    ctx.font = '10px monospace';
    ctx.fillText('SCORE', sx, 24);
    ctx.fillStyle = '#fff';
    ctx.fillText(String(score), sx, 38);
    ctx.fillStyle = '#9ab';
    ctx.fillText('LINES', sx, 58);
    ctx.fillStyle = '#fff';
    ctx.fillText(String(lines), sx, 72);
    ctx.fillStyle = '#9ab';
    ctx.fillText('LEVEL', sx, 92);
    ctx.fillStyle = '#fff';
    ctx.fillText(String(level), sx, 106);
    ctx.fillStyle = '#9ab';
    ctx.fillText('NEXT', sx, 130);
    if (next) {
      const ns = SHAPES[next];
      ns.forEach((row, r) => row.forEach((v, c) => {
        if (v) {
          ctx.fillStyle = COLORS[next];
          ctx.fillRect(sx + c * 12, 140 + r * 12, 11, 11);
        }
      }));
    }
    if (paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '16px monospace';
      ctx.fillText('PAUSED', 70, 170);
    }
    if (over) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f66';
      ctx.font = '16px monospace';
      ctx.fillText('GAME OVER', 55, 160);
      ctx.fillStyle = '#ccc';
      ctx.font = '11px monospace';
      ctx.fillText('SPACE / ENTER retry', 40, 180);
    }
  }

  last = performance.now();
  raf = requestAnimationFrame(frame);
  try { canvas.focus(); } catch (e) {}
  return {
    stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  };
};

// ---------- SUPER MARIO LAND (GB-style homage) ----------
window.InlineGames['mario-gb'] = function (canvas, api) {
  const ctx = canvas.getContext('2d');
  const W = 160, H = 144; // Game Boy resolution, scaled by CSS
  canvas.width = W;
  canvas.height = H;
  // GB greens + accents
  const PAL = ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'];
  // tile size
  const T = 8;
  let raf = 0, last = 0, paused = false, dead = false, win = false, lives = 3;
  let levelIdx = 0, coins = 0, score = 0, invuln = 0, cameraX = 0;

  // Simple level maps: 1 solid, 2 brick, 3 question, 4 pipe, 5 flag, 6 coin, 9 spawn
  // '.' empty 'G' goomba
  const LEVELS = [
    // World 1-1 style
    [
      '................................................................',
      '................................................................',
      '................................................................',
      '.....................?..........................................',
      '................................................................',
      '..............####.........##...................................',
      '..........................####.....................P............',
      '.........G.......................G...............PP.............',
      '################....################....########################',
      '################....################....########################'
    ],
    [
      '................................................................',
      '................................................................',
      '...................?....?.......................................',
      '................................................................',
      '...........##..............##...................................',
      '..........####............####.....................P............',
      '....G................G................G..........PP.............',
      '##############....########....##############....################',
      '##############....########....##############....################',
      '##############....########....##############....################'
    ],
    [
      '................................................................',
      '.................?..............................................',
      '................................................................',
      '........##......................................................',
      '.......####..............?.........####.........................',
      '......######.....................######............P............',
      '..G.........G.........G....................G.....PP.............',
      '################################################################',
      '################################################################',
      '################################################################'
    ]
  ];

  let tiles, goombas, player, flagX;

  function parseLevel(map) {
    tiles = [];
    goombas = [];
    flagX = 0;
    let spawn = { x: 16, y: 80 };
    for (let r = 0; r < map.length; r++) {
      tiles[r] = [];
      for (let c = 0; c < map[r].length; c++) {
        const ch = map[r][c];
        let t = 0;
        if (ch === '#') t = 1;
        else if (ch === '?') t = 3;
        else if (ch === 'P') t = 4;
        else if (ch === 'F') t = 5;
        else if (ch === 'C') t = 6;
        tiles[r][c] = t;
        if (ch === 'G') goombas.push({ x: c * T, y: r * T, vx: -0.35, dead: false, squish: 0 });
        if (ch === '9') spawn = { x: c * T, y: r * T };
      }
    }
    // flag at end
    flagX = (map[0].length - 3) * T;
    player = {
      x: spawn.x, y: spawn.y - 8,
      vx: 0, vy: 0, w: 7, h: 10,
      onGround: false, facing: 1
    };
    cameraX = 0;
  }

  function solidAt(px, py) {
    const c = (px / T) | 0, r = (py / T) | 0;
    if (r < 0 || c < 0 || r >= tiles.length || c >= tiles[0].length) return 1;
    const t = tiles[r][c];
    return t === 1 || t === 2 || t === 3 || t === 4 ? t : 0;
  }

  function resolvePlayer() {
    // horizontal
    player.x += player.vx;
    if (player.vx > 0) {
      if (solidAt(player.x + player.w, player.y + 1) || solidAt(player.x + player.w, player.y + player.h - 1)) {
        player.x = ((player.x + player.w) / T | 0) * T - player.w - 0.01;
        player.vx = 0;
      }
    } else if (player.vx < 0) {
      if (solidAt(player.x, player.y + 1) || solidAt(player.x, player.y + player.h - 1)) {
        player.x = ((player.x / T | 0) + 1) * T;
        player.vx = 0;
      }
    }
    // vertical
    player.vy += 0.18; // gravity
    if (player.vy > 3.2) player.vy = 3.2;
    player.y += player.vy;
    player.onGround = false;
    if (player.vy > 0) {
      if (solidAt(player.x + 1, player.y + player.h) || solidAt(player.x + player.w - 1, player.y + player.h)) {
        player.y = ((player.y + player.h) / T | 0) * T - player.h - 0.01;
        player.vy = 0;
        player.onGround = true;
      }
    } else if (player.vy < 0) {
      const hitL = solidAt(player.x + 1, player.y);
      const hitR = solidAt(player.x + player.w - 1, player.y);
      if (hitL || hitR) {
        const c = ((player.x + player.w / 2) / T) | 0;
        const r = (player.y / T) | 0;
        if (r >= 0 && r < tiles.length && c >= 0 && c < tiles[0].length && tiles[r][c] === 3) {
          tiles[r][c] = 2; // used block
          coins++;
          score += 100;
        }
        player.y = ((player.y / T | 0) + 1) * T;
        player.vy = 0;
      }
    }
  }

  function resetLevel() {
    parseLevel(LEVELS[levelIdx]);
    dead = false; win = false; invuln = 0;
  }
  resetLevel();

  const prev = Object.create(null);
  function edge(k) {
    const down = !!(api.keys[k] || api.keys[k.toLowerCase()]);
    const e = down && !prev[k];
    prev[k] = down;
    return e;
  }

  function killPlayer() {
    if (invuln > 0) return;
    lives--;
    if (lives <= 0) {
      dead = true;
    } else {
      invuln = 90;
      player.x = 16; player.y = 40; player.vx = 0; player.vy = 0;
    }
  }

  function frame(now) {
    if (!api.running()) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(40, now - last); last = now;

    if (edge('Enter') || edge('p')) paused = !paused;

    if (dead) {
      draw();
      if (edge(' ') || edge('Enter') || edge('r')) {
        lives = 3; coins = 0; score = 0; levelIdx = 0; resetLevel();
      }
      return;
    }
    if (win) {
      draw();
      if (edge(' ') || edge('Enter')) {
        levelIdx = (levelIdx + 1) % LEVELS.length;
        resetLevel();
      }
      return;
    }
    if (paused) { draw(); return; }

    // input
    let move = 0;
    if (api.keys['ArrowLeft'] || api.keys['a'] || (api.axes && api.axes[0] < -0.3)) move -= 1;
    if (api.keys['ArrowRight'] || api.keys['d'] || (api.axes && api.axes[0] > 0.3)) move += 1;
    const maxRun = 1.35;
    if (move !== 0) {
      player.vx += move * 0.12;
      player.facing = move;
      if (player.vx > maxRun) player.vx = maxRun;
      if (player.vx < -maxRun) player.vx = -maxRun;
    } else {
      player.vx *= 0.8;
      if (Math.abs(player.vx) < 0.05) player.vx = 0;
    }
    const jumpPressed = edge('ArrowUp') || edge('z') || edge('Z') || edge(' ') || edge('w');
    // gamepad A
    if (api.padButtons && api.padButtons[0] && !prev['_a']) {
      // handled via keys usually
    }
    if (jumpPressed && player.onGround) {
      player.vy = -2.85;
      player.onGround = false;
    }
    // variable jump height
    if (!(api.keys['ArrowUp'] || api.keys['z'] || api.keys['Z'] || api.keys[' '] || api.keys['w']) && player.vy < -1) {
      player.vy *= 0.85;
    }

    resolvePlayer();

    // goombas
    goombas.forEach(g => {
      if (g.dead) { if (g.squish > 0) g.squish--; return; }
      g.x += g.vx;
      // turn at edges / walls
      if (solidAt(g.x + (g.vx > 0 ? 8 : 0), g.y + 4) || !solidAt(g.x + (g.vx > 0 ? 9 : -1), g.y + 9)) {
        g.vx *= -1;
      }
      // stomp
      if (player.vy > 0 &&
          player.x + player.w > g.x && player.x < g.x + 8 &&
          player.y + player.h > g.y && player.y + player.h < g.y + 6) {
        g.dead = true; g.squish = 20;
        player.vy = -2.2;
        score += 200;
      } else if (
        invuln <= 0 &&
        player.x + player.w > g.x + 1 && player.x < g.x + 7 &&
        player.y + player.h > g.y + 2 && player.y < g.y + 8
      ) {
        killPlayer();
      }
    });

    // flag / end
    if (player.x > flagX) {
      win = true;
      score += 1000;
    }
    // pit death
    if (player.y > H + 20) killPlayer();

    if (invuln > 0) invuln--;

    // camera
    cameraX = Math.max(0, Math.min(player.x - 40, tiles[0].length * T - W));

    draw();
  }

  function drawTile(c, r, t, sx, sy) {
    if (t === 1) {
      ctx.fillStyle = PAL[1];
      ctx.fillRect(sx, sy, T, T);
      ctx.fillStyle = PAL[2];
      ctx.fillRect(sx + 1, sy + 1, T - 2, T - 2);
    } else if (t === 2) {
      ctx.fillStyle = PAL[1];
      ctx.fillRect(sx, sy, T, T);
      ctx.fillStyle = PAL[0];
      ctx.fillRect(sx + 2, sy + 2, 2, 2);
      ctx.fillRect(sx + 5, sy + 5, 2, 2);
    } else if (t === 3) {
      ctx.fillStyle = PAL[2];
      ctx.fillRect(sx, sy, T, T);
      ctx.fillStyle = PAL[3];
      ctx.fillRect(sx + 1, sy + 1, T - 2, T - 2);
      ctx.fillStyle = PAL[0];
      ctx.font = '7px monospace';
      ctx.fillText('?', sx + 2, sy + 7);
    } else if (t === 4) {
      ctx.fillStyle = PAL[1];
      ctx.fillRect(sx, sy, T, T);
      ctx.fillStyle = PAL[2];
      ctx.fillRect(sx + 1, sy, T - 2, T);
    }
  }

  function draw() {
    // sky
    ctx.fillStyle = PAL[3];
    ctx.fillRect(0, 0, W, H);

    // tiles
    const c0 = (cameraX / T) | 0;
    const c1 = c0 + ((W / T) | 0) + 2;
    for (let r = 0; r < tiles.length; r++) {
      for (let c = c0; c < c1 && c < tiles[0].length; c++) {
        if (c < 0) continue;
        const t = tiles[r][c];
        if (!t) continue;
        drawTile(c, r, t, c * T - cameraX, r * T);
      }
    }

    // flag pole
    const fx = flagX - cameraX;
    if (fx > -10 && fx < W) {
      ctx.fillStyle = PAL[0];
      ctx.fillRect(fx + 3, 20, 2, 56);
      ctx.fillStyle = PAL[2];
      ctx.beginPath();
      ctx.moveTo(fx + 5, 20);
      ctx.lineTo(fx + 18, 26);
      ctx.lineTo(fx + 5, 32);
      ctx.fill();
    }

    // goombas
    goombas.forEach(g => {
      if (g.dead && g.squish <= 0) return;
      const gx = g.x - cameraX, gy = g.y;
      if (gx < -10 || gx > W) return;
      ctx.fillStyle = PAL[0];
      if (g.dead) {
        ctx.fillRect(gx, gy + 5, 8, 3);
      } else {
        ctx.fillRect(gx, gy + 2, 8, 6);
        ctx.fillRect(gx + 1, gy, 6, 2);
        // eyes
        ctx.fillStyle = PAL[3];
        ctx.fillRect(gx + 1, gy + 3, 2, 2);
        ctx.fillRect(gx + 5, gy + 3, 2, 2);
      }
    });

    // player (Mario-ish)
    if (invuln <= 0 || ((invuln / 3) | 0) % 2 === 0) {
      const px = player.x - cameraX, py = player.y;
      // body
      ctx.fillStyle = PAL[0];
      ctx.fillRect(px + 1, py + 3, 5, 7);
      // hat / head
      ctx.fillStyle = PAL[1];
      ctx.fillRect(px, py, 7, 4);
      ctx.fillStyle = PAL[0];
      ctx.fillRect(px + 1, py + 1, 5, 2);
      // overalls accent
      ctx.fillStyle = PAL[2];
      ctx.fillRect(px + 2, py + 5, 3, 4);
    }

    // HUD
    ctx.fillStyle = PAL[0];
    ctx.font = '7px monospace';
    ctx.fillText('MARIO', 4, 8);
    ctx.fillText(String(score).padStart(6, '0'), 4, 16);
    ctx.fillText('x' + String(coins).padStart(2, '0'), 56, 16);
    ctx.fillText('WORLD ' + (levelIdx + 1), 100, 8);
    ctx.fillText('LIFE ' + lives, 100, 16);

    if (paused) {
      ctx.fillStyle = 'rgba(15,56,15,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = PAL[3];
      ctx.font = '10px monospace';
      ctx.fillText('PAUSED', 58, 76);
    }
    if (dead) {
      ctx.fillStyle = 'rgba(15,56,15,0.8)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = PAL[3];
      ctx.font = '10px monospace';
      ctx.fillText('GAME OVER', 48, 70);
      ctx.font = '7px monospace';
      ctx.fillText('PRESS START', 50, 86);
    }
    if (win) {
      ctx.fillStyle = 'rgba(15,56,15,0.75)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = PAL[3];
      ctx.font = '9px monospace';
      ctx.fillText('STAGE CLEAR!', 42, 70);
      ctx.font = '7px monospace';
      ctx.fillText('START = NEXT', 48, 86);
    }
  }

  last = performance.now();
  raf = requestAnimationFrame(frame);
  try { canvas.focus(); } catch (e) {}
  return {
    stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  };
};

// ---------- SANDPIT 107 — falling-sand / powder reactor ----------
window.InlineGames.sandpit = function (canvas, api) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const PAL_W = 96;
  const HUD_H = 22;
  const COLS = 200;
  const ROWS = 124;
  const SCALE = 3;
  canvas.width = PAL_W + COLS * SCALE;
  canvas.height = ROWS * SCALE + HUD_H;
  canvas.style.imageRendering = 'pixelated';
  canvas.style.cursor = 'crosshair';

  const N = COLS * ROWS;
  const type = new Uint8Array(N);
  const extra = new Uint8Array(N);
  const heat = new Uint8Array(N);
  const heat2 = new Uint8Array(N);
  const moved = new Uint8Array(N);
  const wx = new Float32Array(N);
  const wy = new Float32Array(N);

  const EMPTY = 0, WALL = 1, SAND = 2, WATER = 3, STONE = 4, ICE = 5, GAS = 6,
    CLONER = 7, MITE = 8, WOOD = 9, PLANT = 10, FUNGUS = 11, SEED = 12,
    FIRE = 13, LAVA = 14, ACID = 15, DUST = 16, OIL = 17, ROCKET = 18, WIND = 19,
    STEAM = 20, SMOKE = 21, EMBER = 22, GLASS = 23, NITRO = 24, THERMITE = 25,
    VOID = 26, SNOW = 27, SLIME = 28, PLASMA = 29, CATALYST = 30, FROSTFIRE = 31,
    CHRONO = 32;

  const NAME = [];
  const RGB = [];
  const DENS = new Float32Array(64);
  const KIND = new Uint8Array(64); // 0 empty 1 solid 2 powder 3 liquid 4 gas 5 actor
  function def(id, name, rgb, dens, kind) {
    NAME[id] = name;
    RGB[id] = rgb;
    DENS[id] = dens;
    KIND[id] = kind;
  }
  def(EMPTY, 'EMPTY', [8, 10, 16], 0, 0);
  def(WALL, 'WALL', [92, 96, 108], 99, 1);
  def(SAND, 'SAND', [212, 176, 90], 5, 2);
  def(WATER, 'WATER', [40, 110, 220], 3.0, 3);
  def(STONE, 'STONE', [78, 82, 88], 8, 2);
  def(ICE, 'ICE', [170, 220, 255], 2.6, 1);
  def(GAS, 'GAS', [180, 255, 120], 0.15, 4);
  def(CLONER, 'CLONER', [255, 70, 200], 99, 1);
  def(MITE, 'MITE', [210, 70, 50], 4.2, 5);
  def(WOOD, 'WOOD', [118, 72, 32], 99, 1);
  def(PLANT, 'PLANT', [46, 170, 62], 99, 1);
  def(FUNGUS, 'FUNGUS', [168, 70, 210], 99, 1);
  def(SEED, 'SEED', [90, 140, 40], 4.4, 2);
  def(FIRE, 'FIRE', [255, 140, 30], 0.2, 4);
  def(LAVA, 'LAVA', [255, 70, 18], 7.2, 3);
  def(ACID, 'ACID', [90, 255, 40], 3.1, 3);
  def(DUST, 'DUST', [196, 188, 168], 1.4, 2);
  def(OIL, 'OIL', [70, 48, 28], 2.2, 3);
  def(ROCKET, 'ROCKET', [240, 220, 70], 6, 5);
  def(WIND, 'WIND', [140, 210, 255], 0, 4);
  def(STEAM, 'STEAM', [200, 210, 220], 0.12, 4);
  def(SMOKE, 'SMOKE', [70, 70, 76], 0.1, 4);
  def(EMBER, 'EMBER', [200, 60, 20], 4.8, 2);
  def(GLASS, 'GLASS', [160, 210, 210], 99, 1);
  def(NITRO, 'NITRO', [40, 220, 90], 2.8, 3);
  def(THERMITE, 'THERMITE', [180, 90, 50], 6.4, 2);
  def(VOID, 'VOID', [28, 8, 40], 99, 1);
  def(SNOW, 'SNOW', [236, 244, 255], 1.6, 2);
  def(SLIME, 'SLIME', [90, 210, 70], 3.4, 3);
  def(PLASMA, 'PLASMA', [180, 80, 255], 0.18, 4);
  def(CATALYST, 'CATALYST', [255, 40, 160], 99, 1);
  def(FROSTFIRE, 'FROSTFIRE', [80, 220, 255], 0.2, 4);
  def(CHRONO, 'CHRONO', [90, 140, 255], 5.2, 2);

  const PALETTE = [
    WIND, EMPTY, WALL, SAND, WATER, STONE, ICE, GAS, CLONER, MITE,
    WOOD, PLANT, FUNGUS, SEED, FIRE, LAVA, ACID, DUST, OIL, ROCKET,
    STEAM, SMOKE, EMBER, GLASS, NITRO, THERMITE, VOID, SNOW, SLIME, PLASMA,
    CATALYST, FROSTFIRE, CHRONO
  ];

  const FLAM = new Uint8Array(64);
  [WOOD, PLANT, FUNGUS, SEED, OIL, DUST, GAS, MITE, ROCKET, NITRO, THERMITE, SLIME, SNOW].forEach(t => { FLAM[t] = 1; });

  const img = ctx.createImageData(COLS, ROWS);
  const pix = img.data;
  const off = document.createElement('canvas');
  off.width = COLS; off.height = ROWS;
  const octx = off.getContext('2d');

  let frame = 0, paused = false, raf = 0, last = 0;
  let sel = 3; // sand
  let brush = 4;
  let painting = 0; // 1 paint 2 erase
  let mx = COLS / 2, my = 10, pmx = mx, pmy = my;
  let windAimX = 1, windAimY = 0;
  let grav = 0; // 0 down 1 right 2 up 3 left 4 off
  const GVEC = [[0, 1], [1, 0], [0, -1], [-1, 0], [0, 0]];
  let count = 0;
  let boomFlash = 0;
  let demoCool = 0;
  const prevKey = Object.create(null);

  function idx(x, y) { return y * COLS + x; }
  function inb(x, y) { return x >= 0 && y >= 0 && x < COLS && y < ROWS; }
  function edgeKey(k) {
    const down = !!(api.keys[k] || api.keys[k.toLowerCase()]);
    const e = down && !prevKey[k];
    prevKey[k] = down;
    return e;
  }

  function setCell(i, t, e, h) {
    type[i] = t;
    extra[i] = e || 0;
    if (h != null) heat[i] = h;
  }

  function swap(a, b) {
    let t = type[a]; type[a] = type[b]; type[b] = t;
    t = extra[a]; extra[a] = extra[b]; extra[b] = t;
    t = heat[a]; heat[a] = heat[b]; heat[b] = t;
    moved[a] = 1; moved[b] = 1;
  }

  function explode(cx, cy, r, hot) {
    const r2 = r * r;
    boomFlash = Math.min(12, boomFlash + 4 + (r | 0));
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (!inb(x, y)) continue;
        const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        const i = idx(x, y);
        const d = Math.sqrt(d2) + 0.01;
        wx[i] += (dx / d) * (r * 0.9);
        wy[i] += (dy / d) * (r * 0.9);
        heat[i] = Math.min(255, heat[i] + hot);
        const t = type[i];
        if (t === WALL || t === CLONER || t === VOID) {
          if (r > 6 && t === WALL && Math.random() < 0.15) setCell(i, FIRE, 20, 230);
          continue;
        }
        if (t === NITRO || t === DUST || t === GAS || t === ROCKET) {
          extra[i] = 200; // delayed chain
        }
        if (Math.random() < 0.45) setCell(i, FIRE, 8 + ((Math.random() * 18) | 0), 240);
        else if (Math.random() < 0.5) setCell(i, SMOKE, 20, 80);
        else if (t !== LAVA) setCell(i, EMPTY, 0, heat[i]);
      }
    }
  }

  function ignite(i, x, y) {
    const t = type[i];
    if (t === OIL) { setCell(i, FIRE, 28, 230); return true; }
    if (t === DUST) { explode(x, y, 4, 180); return true; }
    if (t === GAS) { explode(x, y, 5, 160); return true; }
    if (t === NITRO) { explode(x, y, 7, 220); return true; }
    if (t === WOOD) { setCell(i, EMBER, 40, 200); return true; }
    if (t === PLANT || t === SEED) { setCell(i, FIRE, 14, 210); return true; }
    if (t === FUNGUS) { explode(x, y, 3, 90); setCell(i, FIRE, 10, 180); return true; }
    if (t === MITE) { setCell(i, FIRE, 8, 200); return true; }
    if (t === SLIME) { setCell(i, FIRE, 16, 190); return true; }
    if (t === THERMITE) { extra[i] = 80; heat[i] = 255; return true; }
    if (t === ROCKET && extra[i] === 0) { extra[i] = 1; return true; }
    if (t === SNOW) { setCell(i, WATER, 0, 40); return true; }
    return false;
  }

  function dissolve(i, x, y) {
    const t = type[i];
    if (t === WALL || t === GLASS || t === VOID || t === CLONER) return false;
    if (t === LAVA) { setCell(i, STEAM, 12, 200); return true; }
    if (t === ACID) return false;
    if (Math.random() < (t === STONE || t === SAND ? 0.08 : 0.35)) {
      setCell(i, t === ICE ? WATER : (Math.random() < 0.4 ? GAS : EMPTY), 0, heat[i]);
      return true;
    }
    return false;
  }

  // Walls around the world
  function walls() {
    for (let x = 0; x < COLS; x++) {
      type[idx(x, 0)] = WALL;
      type[idx(x, ROWS - 1)] = WALL;
    }
    for (let y = 0; y < ROWS; y++) {
      type[idx(0, y)] = WALL;
      type[idx(COLS - 1, y)] = WALL;
    }
  }
  walls();

  function tryMove(i, x, y, nx, ny) {
    if (!inb(nx, ny)) return false;
    const j = idx(nx, ny);
    if (moved[j]) return false;
    const a = type[i], b = type[j];
    if (b === EMPTY || b === WIND || b === SMOKE && KIND[a] !== 4) {
      if (b === SMOKE && KIND[a] >= 2 && KIND[a] <= 3) { setCell(j, a, extra[i], heat[i]); setCell(i, SMOKE, extra[j], 0); moved[i] = moved[j] = 1; return true; }
      swap(i, j);
      return true;
    }
    // density swap for liquids / powders into lighter fluids
    if ((KIND[a] === 3 || KIND[a] === 2) && (KIND[b] === 3 || b === STEAM || b === GAS || b === FIRE || b === FROSTFIRE || b === PLASMA)) {
      if (DENS[a] > DENS[b] + 0.15) { swap(i, j); return true; }
    }
    return false;
  }

  function powderStep(i, x, y, gdx, gdy) {
    // chrono inverts local gravity
    if (type[i] === CHRONO) { gdx = -gdx; gdy = -gdy; }
    const px = -gdy, py = gdx;
    const windBiasX = wx[i], windBiasY = wy[i];
    // primary fall
    if (tryMove(i, x, y, x + gdx, y + gdy)) return;
    const leftFirst = ((frame + x) & 1) === 0;
    const s = leftFirst ? -1 : 1;
    if (tryMove(i, x, y, x + gdx + px * s, y + gdy + py * s)) return;
    if (tryMove(i, x, y, x + gdx - px * s, y + gdy - py * s)) return;
    // wind slide
    if (Math.abs(windBiasX) > 0.6 || Math.abs(windBiasY) > 0.6) {
      const sx = Math.sign(windBiasX) | 0;
      const sy = Math.sign(windBiasY) | 0;
      if (sx || sy) tryMove(i, x, y, x + sx, y + sy);
    }
    // ice skating: extra lateral for sand/dust/snow on ice
    const below = inb(x + gdx, y + gdy) ? type[idx(x + gdx, y + gdy)] : WALL;
    if (below === ICE && Math.random() < 0.6) {
      tryMove(i, x, y, x + (leftFirst ? -1 : 1), y);
    }
  }

  function liquidStep(i, x, y, gdx, gdy) {
    const t = type[i];
    const spread = t === LAVA ? 2 : t === SLIME ? 1 : t === OIL ? 4 : t === ACID ? 4 : 5;
    if (tryMove(i, x, y, x + gdx, y + gdy)) return;
    const px = -gdy, py = gdx;
    const s = ((frame + y) & 1) ? 1 : -1;
    if (tryMove(i, x, y, x + gdx + px * s, y + gdy + py * s)) return;
    if (tryMove(i, x, y, x + gdx - px * s, y + gdy - py * s)) return;
    for (let k = 1; k <= spread; k++) {
      if (tryMove(i, x, y, x + px * s * k, y + py * s * k)) return;
      if (k === 1 && tryMove(i, x, y, x - px * s * k, y - py * s * k)) return;
    }
  }

  function gasStep(i, x, y, gdx, gdy) {
    // rise against gravity + wind
    const ux = -gdx, uy = -gdy;
    const s = ((frame + x) & 1) ? 1 : -1;
    const px = -gdy, py = gdx;
    if (tryMove(i, x, y, x + ux + (Math.sign(wx[i]) | 0), y + uy + (Math.sign(wy[i]) | 0))) return;
    if (tryMove(i, x, y, x + ux, y + uy)) return;
    if (tryMove(i, x, y, x + ux + px * s, y + uy + py * s)) return;
    if (tryMove(i, x, y, x + ux - px * s, y + uy - py * s)) return;
    if (tryMove(i, x, y, x + px * s, y + py * s)) return;
  }

  function miteStep(i, x, y, gdx, gdy) {
    const hunger = extra[i];
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
    // panic from heat/fire
    let fx = 0, fy = 0, food = -1, foodD = 99, empty = -1;
    for (let d = 0; d < 8; d++) {
      const nx = x + dirs[d][0], ny = y + dirs[d][1];
      if (!inb(nx, ny)) continue;
      const j = idx(nx, ny);
      const t = type[j];
      if (t === FIRE || t === LAVA || t === PLASMA || t === ACID) { fx -= dirs[d][0]; fy -= dirs[d][1]; }
      if (t === PLANT || t === WOOD || t === FUNGUS || t === SEED || t === SLIME) {
        if (d < foodD) { foodD = d; food = j; }
      }
      if (t === EMPTY && empty < 0) empty = j;
      if (t === FUNGUS && Math.random() < 0.04) { setCell(i, FUNGUS, 6, heat[i]); return; }
      if (t === WATER && Math.random() < 0.08) { setCell(i, EMPTY, 0, 0); return; } // drown
      if (t === OIL && heat[j] > 80) { setCell(i, FIRE, 10, 220); return; }
    }
    if (food >= 0) {
      extra[i] = Math.min(40, hunger + 6);
      const ft = type[food];
      setCell(food, EMPTY, 0, heat[food]);
      if (ft === FUNGUS && Math.random() < 0.2) extra[i] = 99; // gassed
      if (hunger > 14 && empty >= 0) {
        setCell(empty, MITE, 3, 40); // breed
        extra[i] = 4;
      }
      return;
    }
    if (hunger === 99) { // exploding gassed mite
      explode(x, y, 3, 120);
      setCell(i, FIRE, 8, 200);
      return;
    }
    extra[i] = hunger > 0 && (frame & 7) === 0 ? hunger - 1 : hunger;
    if (extra[i] === 0 && Math.random() < 0.002) { setCell(i, EMPTY, 0, 0); return; }
    // fall if unsupported
    if (tryMove(i, x, y, x + gdx, y + gdy)) return;
    // flee or wander
    const dx = Math.sign(fx) || (Math.random() < 0.5 ? -1 : 1);
    const dy = Math.sign(fy) || 0;
    tryMove(i, x, y, x + dx, y + dy) || tryMove(i, x, y, x + dx, y);
  }

  function rocketStep(i, x, y, gdx, gdy) {
    if (extra[i] === 0) {
      // sit as powder until ignited
      powderStep(i, x, y, gdx, gdy);
      return;
    }
    extra[i]++;
    const ux = -gdx, uy = -gdy;
    // leave exhaust
    const bx = x - ux, by = y - uy;
    if (inb(bx, by) && type[idx(bx, by)] === EMPTY) setCell(idx(bx, by), FIRE, 8, 230);
    wx[i] += ux * 1.4; wy[i] += uy * 1.4;
    const nx = x + ux + (Math.sign(wx[i]) | 0);
    const ny = y + uy + (Math.sign(wy[i]) | 0);
    if (!inb(nx, ny)) { explode(x, y, 6, 200); setCell(i, FIRE, 10, 240); return; }
    const j = idx(nx, ny);
    const hit = type[j];
    if (hit === EMPTY || hit === FIRE || hit === SMOKE || hit === STEAM || hit === GAS || hit === WIND) {
      swap(i, j);
      if (extra[i] > 55) { explode(nx, ny, 6, 210); setCell(j, FIRE, 12, 240); }
      return;
    }
    explode(nx, ny, hit === NITRO ? 9 : 6, 220);
    setCell(i, FIRE, 10, 240);
  }

  function clonerStep(i, x, y) {
    let spec = extra[i];
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    if (!spec) {
      for (let d = 0; d < 4; d++) {
        const nx = x + dirs[d][0], ny = y + dirs[d][1];
        if (!inb(nx, ny)) continue;
        const t = type[idx(nx, ny)];
        if (t && t !== CLONER && t !== WALL && t !== VOID && t !== WIND) {
          extra[i] = t; spec = t; break;
        }
      }
      return;
    }
    const cat = catalystNear(x, y) ? 0.7 : 0.28;
    for (let d = 0; d < 4; d++) {
      if (Math.random() > cat) continue;
      const nx = x + dirs[d][0], ny = y + dirs[d][1];
      if (!inb(nx, ny)) continue;
      const j = idx(nx, ny);
      if (type[j] === EMPTY || type[j] === WIND || type[j] === SMOKE) {
        setCell(j, spec, spec === ROCKET ? 0 : spec === FIRE ? 16 : 0, spec === LAVA || spec === FIRE ? 200 : 30);
        moved[j] = 1;
      }
    }
  }

  function catalystNear(x, y) {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      if (inb(x + dx, y + dy) && type[idx(x + dx, y + dy)] === CATALYST) return true;
    }
    return false;
  }

  function chronoNear(x, y) {
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      if (inb(x + dx, y + dy) && type[idx(x + dx, y + dy)] === CHRONO) return true;
    }
    return false;
  }

  function interact(i, x, y) {
    const t = type[i];
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const boost = catalystNear(x, y);
    const p = boost ? 2 : 1;

    if (t === FIRE || t === FROSTFIRE || t === PLASMA || t === EMBER) {
      extra[i] = extra[i] ? extra[i] - 1 : 0;
      heat[i] = Math.min(255, heat[i] + (t === PLASMA ? 18 : 8));
      if (t === FIRE) { wy[i] -= 0.35; wx[i] += (Math.random() - 0.5) * 0.2; }
      if (t === FROSTFIRE) { wy[i] -= 0.2; }
      if (t === PLASMA) { wx[i] += (Math.random() - 0.5); wy[i] += (Math.random() - 0.5); }
      for (let d = 0; d < 4; d++) {
        const nx = x + dirs[d][0], ny = y + dirs[d][1];
        if (!inb(nx, ny)) continue;
        const j = idx(nx, ny), n = type[j];
        heat[j] = Math.min(255, heat[j] + (t === PLASMA ? 24 : 10));
        if (FLAM[n] && Math.random() < 0.45 * p) ignite(j, nx, ny);
        if (n === WATER || n === SNOW) {
          if (t === FROSTFIRE) { setCell(j, ICE, 0, 0); extra[i] = Math.max(0, extra[i] - 4); }
          else { setCell(j, STEAM, 18, 160); extra[i] = Math.max(0, extra[i] - 8); if (Math.random() < 0.5) setCell(i, SMOKE, 12, 40); }
        }
        if (n === ICE && t !== FROSTFIRE) { setCell(j, WATER, 0, 50); extra[i]--; }
        if (n === OIL && Math.random() < 0.7) ignite(j, nx, ny);
        if (n === SAND && t === PLASMA && Math.random() < 0.2) setCell(j, GLASS, 0, 120);
      }
      if (t === EMBER) {
        if (extra[i] < 1) { setCell(i, Math.random() < 0.3 ? SMOKE : EMPTY, 0, 40); return; }
        if (Math.random() < 0.08) {
          const j = idx(x, Math.max(1, y - 1));
          if (type[j] === EMPTY) setCell(j, FIRE, 10, 220);
        }
      } else if (extra[i] < 1) {
        setCell(i, t === PLASMA ? FIRE : (Math.random() < 0.6 ? SMOKE : EMPTY), 10, 60);
        return;
      }
    }

    if (t === LAVA) {
      heat[i] = Math.min(255, heat[i] + 6);
      for (let d = 0; d < 4; d++) {
        const nx = x + dirs[d][0], ny = y + dirs[d][1];
        if (!inb(nx, ny)) continue;
        const j = idx(nx, ny), n = type[j];
        heat[j] = Math.min(255, heat[j] + 14);
        if (n === WATER) { setCell(j, STEAM, 22, 200); setCell(i, STONE, 0, 80); return; }
        if (n === ICE) { setCell(j, WATER, 0, 90); }
        if (n === SAND && Math.random() < 0.12 * p) setCell(j, GLASS, 0, 180);
        if (n === STONE && heat[j] > 200 && Math.random() < 0.04 * p) setCell(j, LAVA, 0, 240);
        if (n === WOOD || n === PLANT || n === OIL || n === DUST) ignite(j, nx, ny);
        if (n === ACID && Math.random() < 0.3) { setCell(j, GAS, 8, 180); setCell(i, STEAM, 10, 200); }
        if (n === NITRO) explode(nx, ny, 8, 230);
      }
      if (heat[i] < 70 && Math.random() < 0.02) setCell(i, STONE, 0, 40);
    }

    if (t === WATER) {
      heat[i] = heat[i] > 0 ? heat[i] - 1 : 0;
      if (heat[i] > 180) { setCell(i, STEAM, 20, 180); return; }
      for (let d = 0; d < 4; d++) {
        const nx = x + dirs[d][0], ny = y + dirs[d][1];
        if (!inb(nx, ny)) continue;
        const j = idx(nx, ny), n = type[j];
        if (n === FIRE || n === EMBER) { setCell(j, SMOKE, 10, 40); heat[i] += 8; }
        if (n === ICE && heat[i] < 40 && Math.random() < 0.08 * p) setCell(i, ICE, 0, 0);
        if (n === PLANT && Math.random() < 0.03 * p) {
          const ux = x, uy = y - 1;
          if (inb(ux, uy) && type[idx(ux, uy)] === EMPTY) setCell(idx(ux, uy), PLANT, 0, 0);
        }
      }
    }

    if (t === ICE) {
      if (heat[i] > 90) { setCell(i, WATER, 0, 40); return; }
      heat[i] = heat[i] > 2 ? heat[i] - 2 : 0;
    }

    if (t === ACID) {
      for (let d = 0; d < 4; d++) {
        const nx = x + dirs[d][0], ny = y + dirs[d][1];
        if (!inb(nx, ny)) continue;
        const j = idx(nx, ny), n = type[j];
        if (n === FUNGUS && Math.random() < 0.4 * p) { explode(nx, ny, 4, 70); setCell(j, GAS, 12, 90); }
        else if (n && n !== ACID && n !== GLASS && n !== WALL && n !== VOID && n !== CLONER) dissolve(j, nx, ny);
        if (n === WATER && Math.random() < 0.05) setCell(i, WATER, 0, 0);
        if (n === OIL && Math.random() < 0.04 * p) setCell(j, FIRE, 18, 220);
      }
    }

    if (t === PLANT) {
      if (heat[i] > 140 && Math.random() < 0.2) { ignite(i, x, y); return; }
      let wet = false, fungus = false;
      for (let d = 0; d < 4; d++) {
        const nx = x + dirs[d][0], ny = y + dirs[d][1];
        if (!inb(nx, ny)) continue;
        const n = type[idx(nx, ny)];
        if (n === WATER) wet = true;
        if (n === FUNGUS) fungus = true;
      }
      if (fungus && Math.random() < 0.08 * p) { setCell(i, FUNGUS, 4, 20); return; }
      if (wet && Math.random() < 0.05 * p) {
        const nx = x + ((Math.random() * 3) | 0) - 1;
        const ny = y - 1;
        if (inb(nx, ny) && type[idx(nx, ny)] === EMPTY) setCell(idx(nx, ny), Math.random() < 0.12 ? SEED : PLANT, 0, 0);
      }
    }

    if (t === FUNGUS) {
      extra[i]++;
      if (heat[i] > 160) { setCell(i, SMOKE, 8, 80); return; }
      for (let d = 0; d < 4; d++) {
        const nx = x + dirs[d][0], ny = y + dirs[d][1];
        if (!inb(nx, ny)) continue;
        const j = idx(nx, ny), n = type[j];
        if ((n === PLANT || n === WOOD || n === SEED) && Math.random() < 0.1 * p) setCell(j, FUNGUS, 2, 20);
        if (n === EMPTY && extra[i] > 12 && Math.random() < 0.03 * p) { setCell(j, FUNGUS, 0, 10); extra[i] = 0; }
        if (n === SLIME && Math.random() < 0.05) setCell(j, MITE, 8, 20);
      }
      if (extra[i] > 80) extra[i] = 0;
    }

    if (t === WOOD) {
      if (heat[i] > 150 && Math.random() < 0.15 * p) ignite(i, x, y);
    }

    if (t === SEED) {
      for (let d = 0; d < 4; d++) {
        const nx = x + dirs[d][0], ny = y + dirs[d][1];
        if (!inb(nx, ny)) continue;
        const n = type[idx(nx, ny)];
        if ((n === WATER || n === SAND || n === PLANT) && Math.random() < 0.08 * p) {
          setCell(i, PLANT, 0, 0); return;
        }
      }
    }

    if (t === STEAM) {
      extra[i]++;
      if (heat[i] < 30 && Math.random() < 0.04) { setCell(i, WATER, 0, 0); return; }
      if (extra[i] > 80) setCell(i, EMPTY, 0, 0);
    }
    if (t === SMOKE) {
      extra[i]++;
      if (extra[i] > 50) setCell(i, EMPTY, 0, 0);
    }
    if (t === WIND) {
      extra[i]++;
      wx[i] += windAimX * 2.2;
      wy[i] += windAimY * 2.2;
      if (extra[i] > 14) setCell(i, EMPTY, 0, 0);
    }
    if (t === GAS && heat[i] > 140 && Math.random() < 0.2) explode(x, y, 4, 150);
    if (t === NITRO && (heat[i] > 90 || extra[i] === 200)) explode(x, y, 7, 220);
    if (t === THERMITE) {
      if (extra[i] > 0) {
        extra[i]--;
        heat[i] = 255;
        for (let d = 0; d < 4; d++) {
          const nx = x + dirs[d][0], ny = y + dirs[d][1];
          if (!inb(nx, ny)) continue;
          const j = idx(nx, ny), n = type[j];
          heat[j] = 255;
          if (n === WALL || n === STONE || n === GLASS || n === SAND || n === ICE) {
            setCell(j, LAVA, 0, 255);
          } else if (n === WATER) setCell(j, STEAM, 20, 220);
          else if (FLAM[n]) ignite(j, nx, ny);
        }
        if (extra[i] < 1) setCell(i, LAVA, 0, 255);
      } else if (heat[i] > 180) extra[i] = 70;
    }
    if (t === VOID) {
      for (let d = 0; d < 4; d++) {
        const nx = x + dirs[d][0], ny = y + dirs[d][1];
        if (!inb(nx, ny)) continue;
        const j = idx(nx, ny);
        if (type[j] && type[j] !== VOID && type[j] !== WALL && Math.random() < 0.2 * p) {
          setCell(j, Math.random() < 0.3 ? SMOKE : EMPTY, 0, 0);
        }
      }
    }
    if (t === SNOW) {
      if (heat[i] > 50) setCell(i, WATER, 0, 20);
      else if (Math.random() < 0.01) {
        const j = idx(x, Math.min(ROWS - 2, y + 1));
        if (type[j] === SNOW && extra[i] > 3) setCell(i, ICE, 0, 0);
        extra[i]++;
      }
    }
    if (t === SLIME) {
      for (let d = 0; d < 4; d++) {
        const nx = x + dirs[d][0], ny = y + dirs[d][1];
        if (!inb(nx, ny)) continue;
        const n = type[idx(nx, ny)];
        if (n === MITE && extra[i] > 8 && Math.random() < 0.05) extra[idx(nx, ny)] = Math.min(40, extra[idx(nx, ny)] + 2);
        if (n === WATER && Math.random() < 0.02) setCell(idx(nx, ny), SLIME, 0, 10);
        if (n === FIRE) ignite(i, x, y);
      }
    }
    if (t === CATALYST) {
      heat[i] = 60;
      // pulses nearby fire hotter
      if ((frame & 7) === 0) {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!inb(x + dx, y + dy)) continue;
          const j = idx(x + dx, y + dy);
          if (type[j] === FIRE) extra[j] = Math.min(40, extra[j] + 4);
          if (type[j] === PLANT && Math.random() < 0.1) {
            const uy = y + dy - 1;
            if (inb(x + dx, uy) && type[idx(x + dx, uy)] === EMPTY) setCell(idx(x + dx, uy), PLANT, 0, 0);
          }
        }
      }
    }
    if (t === SAND && heat[i] > 210 && Math.random() < 0.08) setCell(i, GLASS, 0, 160);
    if (t === DUST && (Math.abs(wx[i]) + Math.abs(wy[i]) > 6) && Math.random() < 0.02) {
      // dust explosion from shock
      explode(x, y, 3, 80);
    }
  }

  function stepWind() {
    for (let y = 1; y < ROWS - 1; y++) {
      for (let x = 1; x < COLS - 1; x++) {
        const i = idx(x, y);
        const n = (
          wx[i] * 4 +
          wx[i - 1] + wx[i + 1] + wx[i - COLS] + wx[i + COLS]
        ) * 0.125;
        const m = (
          wy[i] * 4 +
          wy[i - 1] + wy[i + 1] + wy[i - COLS] + wy[i + COLS]
        ) * 0.125;
        wx[i] = n * 0.92;
        wy[i] = m * 0.92;
        const t = type[i];
        if (t === FIRE) wy[i] -= 0.25;
        if (t === PLASMA) { wx[i] += (Math.random() - 0.5) * 0.4; wy[i] -= 0.15; }
        if (t === LAVA) wy[i] += 0.05;
      }
    }
  }

  function stepHeat() {
    for (let y = 1; y < ROWS - 1; y++) {
      for (let x = 1; x < COLS - 1; x++) {
        const i = idx(x, y);
        const v = heat[i] * 4 + heat[i - 1] + heat[i + 1] + heat[i - COLS] + heat[i + COLS];
        let h = (v / 8) | 0;
        if (h > 0) h -= 1;
        heat2[i] = h > 255 ? 255 : h < 0 ? 0 : h;
      }
    }
    heat.set(heat2);
  }

  function step() {
    moved.fill(0);
    const [gdx, gdy] = GVEC[grav];
    stepWind();
    stepHeat();

    // rising gases top-down
    for (let y = 1; y < ROWS - 1; y++) {
      const ltr = ((frame + y) & 1) === 0;
      const x0 = ltr ? 1 : COLS - 2;
      const x1 = ltr ? COLS - 1 : 0;
      const xs = ltr ? 1 : -1;
      for (let x = x0; x !== x1; x += xs) {
        const i = idx(x, y);
        if (moved[i]) continue;
        const t = type[i];
        if (KIND[t] === 4) {
          interact(i, x, y);
          if (type[i] !== t || moved[i]) continue;
          gasStep(i, x, y, chronoNear(x, y) ? -gdx : gdx, chronoNear(x, y) ? -gdy : gdy);
        }
      }
    }

    // solids / powders / liquids / actors bottom-up
    for (let y = ROWS - 2; y >= 1; y--) {
      const ltr = ((frame + y) & 1) === 0;
      const x0 = ltr ? 1 : COLS - 2;
      const x1 = ltr ? COLS - 1 : 0;
      const xs = ltr ? 1 : -1;
      for (let x = x0; x !== x1; x += xs) {
        const i = idx(x, y);
        if (moved[i]) continue;
        const t = type[i];
        if (!t || KIND[t] === 4) continue;
        interact(i, x, y);
        if (moved[i] || type[i] !== t) continue;
        const cgx = chronoNear(x, y) ? -gdx : gdx;
        const cgy = chronoNear(x, y) ? -gdy : gdy;
        if (t === CLONER) clonerStep(i, x, y);
        else if (t === MITE) miteStep(i, x, y, cgx, cgy);
        else if (t === ROCKET) rocketStep(i, x, y, cgx, cgy);
        else if (KIND[t] === 2) powderStep(i, x, y, cgx, cgy);
        else if (KIND[t] === 3) liquidStep(i, x, y, cgx, cgy);
      }
    }
    walls();
    frame++;
  }

  function paintAt(x, y, erase) {
    const r = brush;
    const t = erase ? EMPTY : PALETTE[sel];
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const px = x + dx, py = y + dy;
        if (!inb(px, py)) continue;
        if (px === 0 || py === 0 || px === COLS - 1 || py === ROWS - 1) continue;
        const i = idx(px, py);
        if (t === EMPTY) { setCell(i, EMPTY, 0, 0); wx[i] = wy[i] = 0; continue; }
        if (t === WIND) {
          setCell(i, WIND, 0, 0);
          wx[i] += windAimX * 4;
          wy[i] += windAimY * 4;
          continue;
        }
        if (type[i] === WALL && t !== WALL && t !== VOID && t !== THERMITE) continue;
        setCell(i, t,
          t === FIRE || t === FROSTFIRE || t === PLASMA ? 18 : 0,
          t === LAVA || t === FIRE || t === PLASMA ? 220 : t === ICE || t === SNOW ? 0 : 30);
      }
    }
  }

  function paintLine(x0, y0, x1, y1, erase) {
    let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy, x = x0, y = y0;
    for (;;) {
      paintAt(x, y, erase);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  }

  function clearWorld() {
    type.fill(0); extra.fill(0); heat.fill(0); wx.fill(0); wy.fill(0);
    walls();
  }

  function demoWorld() {
    clearWorld();
    // bedrock
    for (let x = 1; x < COLS - 1; x++) {
      for (let y = ROWS - 8; y < ROWS - 1; y++) setCell(idx(x, y), y > ROWS - 4 ? STONE : SAND, 0, 10);
    }
    // lake
    for (let x = 18; x < 70; x++) for (let y = ROWS - 18; y < ROWS - 8; y++) setCell(idx(x, y), WATER, 0, 8);
    // oil slick
    for (let x = 22; x < 40; x++) for (let y = ROWS - 22; y < ROWS - 18; y++) setCell(idx(x, y), OIL, 0, 8);
    // forest
    for (let x = 80; x < 130; x++) {
      if (x % 3 === 0) {
        const h = 6 + (x % 7);
        for (let k = 0; k < h; k++) setCell(idx(x, ROWS - 9 - k), WOOD, 0, 10);
        for (let dx = -2; dx <= 2; dx++) for (let dy = -3; dy <= 1; dy++) {
          const px = x + dx, py = ROWS - 9 - h + dy;
          if (inb(px, py)) setCell(idx(px, py), PLANT, 0, 0);
        }
      }
    }
    // mites
    for (let i = 0; i < 12; i++) setCell(idx(90 + i * 2, ROWS - 10), MITE, 8, 20);
    // fungus patch
    for (let x = 132; x < 150; x++) for (let y = ROWS - 14; y < ROWS - 8; y++) {
      if (Math.random() < 0.4) setCell(idx(x, y), FUNGUS, 4, 10);
    }
    // volcano
    for (let y = 30; y < ROWS - 8; y++) {
      const w = 6 + ((y - 30) / 8) | 0;
      for (let x = COLS - 40 - w; x < COLS - 40 + w; x++) {
        if (!inb(x, y)) continue;
        if (x < COLS - 40 - w + 2 || x > COLS - 40 + w - 3) setCell(idx(x, y), STONE, 0, 20);
        else if (y > 40) setCell(idx(x, y), LAVA, 0, 230);
      }
    }
    // ice cave
    for (let x = 4; x < 24; x++) for (let y = 20; y < 40; y++) {
      if ((x + y) % 5 !== 0) setCell(idx(x, y), ICE, 0, 0);
    }
    // cloner lab
    setCell(idx(50, 20), CLONER, SEED, 0);
    setCell(idx(52, 20), CLONER, 0, 0);
    for (let x = 48; x < 58; x++) setCell(idx(x, 24), WALL, 0, 0);
    // nitro cache
    for (let x = 60; x < 66; x++) for (let y = 18; y < 22; y++) setCell(idx(x, y), NITRO, 0, 0);
    // rocket rack
    for (let x = 160; x < 168; x++) setCell(idx(x, ROWS - 12), ROCKET, 0, 0);
  }

  function fireworks(n) {
    for (let k = 0; k < (n || 6); k++) {
      const x = 20 + ((Math.random() * (COLS - 40)) | 0);
      setCell(idx(x, ROWS - 10), ROCKET, 1, 40);
    }
  }

  function sample(x, y) {
    if (!inb(x, y)) return;
    const t = type[idx(x, y)];
    if (!t) { sel = PALETTE.indexOf(EMPTY); return; }
    const p = PALETTE.indexOf(t);
    if (p >= 0) sel = p;
  }

  function toCell(ev) {
    const r = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width;
    const sy = canvas.height / r.height;
    const x = (ev.clientX - r.left) * sx;
    const y = (ev.clientY - r.top) * sy;
    if (x < PAL_W) return { pal: true, x, y };
    return {
      pal: false,
      x: Math.max(1, Math.min(COLS - 2, ((x - PAL_W) / SCALE) | 0)),
      y: Math.max(1, Math.min(ROWS - 2, (y / SCALE) | 0))
    };
  }

  function onDown(ev) {
    ev.preventDefault();
    const c = toCell(ev);
    if (c.pal) {
      const rowH = (canvas.height - HUD_H) / PALETTE.length;
      const i = Math.max(0, Math.min(PALETTE.length - 1, (c.y / rowH) | 0));
      sel = i;
      return;
    }
    if (ev.button === 1) { sample(c.x, c.y); return; }
    painting = ev.button === 2 ? 2 : 1;
    pmx = mx = c.x; pmy = my = c.y;
    paintAt(mx, my, painting === 2);
  }
  function onMove(ev) {
    const c = toCell(ev);
    if (c.pal) return;
    const dx = c.x - mx, dy = c.y - my;
    if (dx || dy) {
      const len = Math.hypot(dx, dy) || 1;
      windAimX = dx / len;
      windAimY = dy / len;
    }
    pmx = mx; pmy = my; mx = c.x; my = c.y;
    if (painting) paintLine(pmx, pmy, mx, my, painting === 2);
  }
  function onUp() { painting = 0; }
  function onWheel(ev) {
    ev.preventDefault();
    brush = Math.max(1, Math.min(18, brush + (ev.deltaY > 0 ? -1 : 1)));
  }
  function onContext(ev) { ev.preventDefault(); }

  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('contextmenu', onContext);

  const keysHot = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  function handleKeys() {
    if (edgeKey('p') || edgeKey('P')) paused = !paused;
    if (edgeKey('c') || edgeKey('C')) clearWorld();
    if (edgeKey('g') || edgeKey('G')) grav = (grav + 1) % 5;
    if (edgeKey('d') || edgeKey('D')) { if (demoCool <= 0) { demoWorld(); demoCool = 30; } }
    if (edgeKey('f') || edgeKey('F')) fireworks(8);
    if (edgeKey('q') || edgeKey('Q')) sel = (sel + PALETTE.length - 1) % PALETTE.length;
    if (edgeKey('e') || edgeKey('E')) sel = (sel + 1) % PALETTE.length;
    if (edgeKey('[') || edgeKey('-')) brush = Math.max(1, brush - 1);
    if (edgeKey(']') || edgeKey('=')) brush = Math.min(18, brush + 1);
    keysHot.forEach((k, i) => { if (edgeKey(k)) sel = i; });
    if (api.keys['Shift'] && keysHot.some(k => api.keys[k])) {
      // already handled as edge; extra: Shift+1-0 = 10-19
    }
    ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'].forEach((k, i) => {
      if (edgeKey(k)) sel = Math.min(PALETTE.length - 1, 10 + i);
    });
    if (demoCool > 0) demoCool--;
    // gamepad
    if (api.axes) {
      if (Math.abs(api.axes[0]) > 0.5 && frame % 8 === 0) sel = (sel + (api.axes[0] > 0 ? 1 : -1) + PALETTE.length) % PALETTE.length;
    }
  }

  function draw() {
    let n = 0;
    for (let i = 0; i < N; i++) {
      const t = type[i];
      if (t) n++;
      let r, g, b;
      if (!t) {
        r = 10; g = 12; b = 18;
        // faint wind vis
        const mag = Math.min(1, Math.hypot(wx[i], wy[i]) / 8);
        if (mag > 0.08) { r += mag * 30; g += mag * 50; b += mag * 70; }
      } else {
        const base = RGB[t];
        const jitter = ((i * 1103515245) >>> 19) & 7;
        r = base[0] + jitter - 3;
        g = base[1] + ((i >> 3) & 7) - 3;
        b = base[2] + ((i >> 5) & 7) - 3;
        if (heat[i] > 40 && t !== FIRE && t !== LAVA && t !== PLASMA) {
          const h = (heat[i] - 40) / 215;
          r = r + (255 - r) * h * 0.55;
          g = g * (1 - h * 0.35);
        }
        if (t === FIRE) {
          r = 220 + jitter * 4; g = 40 + extra[i] * 6; b = 10;
        }
        if (t === PLASMA) {
          r = 160 + jitter * 10; g = 40; b = 220 + (frame * 3 + i) % 35;
        }
        if (t === CLONER && extra[i] && RGB[extra[i]]) {
          // tint toward cloned
          const c = RGB[extra[i]];
          r = (r + c[0]) >> 1; g = (g + c[1]) >> 1; b = (b + c[2]) >> 1;
        }
      }
      const p = i * 4;
      pix[p] = r < 0 ? 0 : r > 255 ? 255 : r;
      pix[p + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
      pix[p + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
      pix[p + 3] = 255;
    }
    count = n;
    if (boomFlash) {
      const a = Math.min(80, boomFlash * 8);
      for (let i = 0; i < N; i++) {
        pix[i * 4] = Math.min(255, pix[i * 4] + a);
        pix[i * 4 + 1] = Math.min(255, pix[i * 4 + 1] + a * 0.6);
      }
      boomFlash--;
    }
    octx.putImageData(img, 0, 0);

    ctx.fillStyle = '#07080d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, PAL_W, 0, COLS * SCALE, ROWS * SCALE);

    // brush ghost
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(PAL_W + mx * SCALE, my * SCALE, brush * SCALE, 0, Math.PI * 2);
    ctx.stroke();

    // palette
    const rowH = (ROWS * SCALE) / PALETTE.length;
    ctx.font = '9px "Share Tech Mono", monospace';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < PALETTE.length; i++) {
      const t = PALETTE[i];
      const y = i * rowH;
      const col = RGB[t];
      ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
      ctx.fillRect(0, y, PAL_W, rowH);
      if (i === sel) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, y + 1, PAL_W - 2, rowH - 2);
        ctx.lineWidth = 1;
      }
      const lum = col[0] * 0.3 + col[1] * 0.5 + col[2] * 0.2;
      ctx.fillStyle = lum > 140 ? '#111' : '#f4f4f4';
      ctx.fillText(NAME[t], 6, y + rowH / 2);
    }

    // hud
    const hy = ROWS * SCALE;
    ctx.fillStyle = '#0c0e16';
    ctx.fillRect(0, hy, canvas.width, HUD_H);
    ctx.fillStyle = '#9ab';
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.textBaseline = 'middle';
    const gName = ['DOWN', 'RIGHT', 'UP', 'LEFT', 'OFF'][grav];
    const mat = NAME[PALETTE[sel]] || '?';
    ctx.fillText(
      `${mat}  BRUSH ${brush}  PART ${count}  GRAV ${gName}${paused ? '  PAUSED' : ''}   LMB paint  RMB erase  MMB sample  Q/E mat  C clear  D demo  F rockets  G grav  P pause`,
      8, hy + HUD_H / 2
    );
  }

  function tick(now) {
    if (!api.running()) return;
    raf = requestAnimationFrame(tick);
    const dt = Math.min(40, now - last); last = now;
    handleKeys();
    if (painting && !paused) paintAt(mx, my, painting === 2);
    if (!paused) {
      // 2 sim steps when enough dt for juicy density
      step();
      if (dt > 20) step();
    }
    draw();
  }

  demoWorld();
  last = performance.now();
  raf = requestAnimationFrame(tick);
  try { canvas.focus(); } catch (e) {}

  return {
    stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('contextmenu', onContext);
    }
  };
};

// Keep legacy demo engines available for HTML fallback if needed
window.InlineGames['demo-breakout'] = window.InlineGames['demo-breakout'] || null;
window.InlineGames['demo-snake'] = window.InlineGames['demo-snake'] || null;
