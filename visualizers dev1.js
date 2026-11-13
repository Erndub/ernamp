// ================================================
// visualizers.js – Curated Edition v2.0
// Culled near-duplicates · genre-aware · colour heatmaps
// Voice / Techno / Trance / Pop / DnB / Lo-fi / Metal / Ambient
// ================================================

window.MODES = [
  // Utility / media / tools (selector cluster)
  'INFO-HUD', 'LIBRARY', 'PIC', 'VIDEO_MODE', 'VIS_OFF',
  'DEBUG-HUD', 'UTILITIES', 'AI-VIDEO', 'GAMES', 'RF-SWEEP',

  // Classics
  'GLISTEN', 'RUMPLE', 'POLAR', 'VU-METER', 'SINGULARITY', 'LED-BAR',
  'SPIRALS', 'PARTICLES', 'PARTICLES2', 'UNKNOWN-PLEASURES',
  'THOREAU-MESH', 'RIDGE-RUN', 'SPECTRAL-FALL', 'LISSAJOUS-SCOPE',
  'RADIAL-RIBS', 'HELIX-LADDER', 'STRING-FIELD', 'MOIRE-WAVE',

  // Colour analysis
  'SPECTRUM-HEATMAP', 'SPECTRO-WATERFALL', 'HEAT-SPIRAL', 'CIRCULAR-EQ', 'PEAK-HOLD-BARS',

  // Genre-tuned
  'VOCAL-AURORA', 'PHONEME-RINGS', 'TECHNO-KICK-GRID', 'TRANCE-TUNNEL',
  'POP-BOUNCE-BARS', 'DNB-STREAKS', 'LOFI-DUST', 'SYNTHWAVE-SUN',
  'METAL-LIGHTNING', 'RAVE-STROBE', 'JAZZ-SMOKE', 'AMBIENT-CHLADNI',

  // Signature uniques
  'NEON-TUNNEL', 'PLASMA-STORM', 'KALEIDO-BLOOM', 'REACTION-DIFFUSION',
  'CRT-SCOPE', 'HYPERSPACE', 'AURA-ORB', 'LAVA-LAMP',
  'NEURAL-NET', 'SOLAR-FLARE', 'THE-EYE', 'DARK-MATTER',
  'MATRIX-RAIN', 'FERROFLUID', 'OSCILLOSCOPE-XY', 'WINAMP-HYPERSPACE',
  'TRON', 'KOI-POND', 'GEOMETRIC-BLOOM', 'VOLUMETRIC-LED-FIELD',
  'ENERGY-UNLOCKED', 'BITLESS', 'POINT-CLOUD', 'UKG-SKYLINE-PULSE'
];

const VisHelpers = {
  bass(fData) { return (fData[2] || 0) / 255; },
  mid(fData)  { return (fData[40] || 0) / 255; },
  treble(fData){ return (fData[100] || 0) / 255; },
  avg(fData)  {
    let s = 0;
    for (let i = 0; i < fData.length; i++) s += fData[i];
    return s / (fData.length * 255);
  },
  beat(fData, threshold = 0.65) { return this.bass(fData) > threshold; },
  hexToRgb(hex) {
    hex = (hex || '#ffffff').replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  },
  heatColor(t, alpha = 1) {
    t = Math.max(0, Math.min(1, t));
    let r, g, b;
    if (t < 0.25) { const u = t / 0.25; r = 0; g = (u * 180) | 0; b = 255; }
    else if (t < 0.5) { const u = (t - 0.25) / 0.25; r = 0; g = (180 + u * 75) | 0; b = (255 - u * 255) | 0; }
    else if (t < 0.75) { const u = (t - 0.5) / 0.25; r = (u * 255) | 0; g = 255; b = 0; }
    else { const u = (t - 0.75) / 0.25; r = 255; g = (255 - u * 255) | 0; b = (u * 200) | 0; }
    return `rgba(${r},${g},${b},${alpha})`;
  },
  hue(h, s = 70, l = 55, a = 1) {
    return `hsla(${((h % 360) + 360) % 360},${s}%,${l}%,${a})`;
  },
  ensureParticles(app, key, count, factory) {
    if (!app[key] || !Array.isArray(app[key]) || app[key].length === 0) {
      app[key] = Array.from({ length: count }, factory);
    }
    return app[key];
  },
  clearSoft(ctx, w, h, alpha = 0.12, bgColor) {
    // Soft trail only — stage --crt-bg is painted by the player each frame
    if (bgColor) {
      const rgb = this.hexToRgb(bgColor);
      ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
    } else {
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    }
    ctx.fillRect(0, 0, w, h);
  },
  stageBg(fallback) {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--crt-bg').trim();
      if (v) return v;
    } catch (e) {}
    return fallback || null;
  },

  /** Shared smoothed spectrum for multi-layer / faceted modes */
  smoothSpec(app, fData, bins = 96, key = '_vizSmooth') {
    const N = fData && fData.length ? fData.length : bins;
    if (!app[key] || app[key].length !== bins) {
      app[key] = new Float32Array(bins);
      app[key + 'Pk'] = new Float32Array(bins);
    }
    const s = app[key], pk = app[key + 'Pk'];
    for (let i = 0; i < bins; i++) {
      const v = (fData[Math.floor(i * N / bins)] || 0) / 255;
      s[i] += (v - s[i]) * 0.32;
      pk[i] *= 0.96;
      if (s[i] > pk[i]) pk[i] = s[i];
    }
    return { s, pk, bins };
  },

  /** Faceted multi-stroke path (outline stack) */
  facetStroke(ctx, buildPath, layers) {
    // layers: [{ color, width, alpha, dash? }]
    for (let i = layers.length - 1; i >= 0; i--) {
      const L = layers[i];
      ctx.save();
      ctx.globalAlpha = L.alpha != null ? L.alpha : 1;
      ctx.strokeStyle = L.color;
      ctx.lineWidth = L.width || 1;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      if (L.dash) ctx.setLineDash(L.dash);
      ctx.beginPath();
      buildPath(ctx);
      ctx.stroke();
      ctx.restore();
    }
  },

  /** Radial spectrum shells: multi-layer polar contour + optional rays */
  drawFacetPolar(ctx, w, h, fData, app, opts) {
    const o = opts || {};
    const accent = o.accent || '#bb8844';
    const shells = o.shells != null ? o.shells : 4;
    const rays = o.rays != null ? o.rays : 72;
    const steps = o.steps || 100;
    const hue0 = o.hue0 != null ? o.hue0 : 200;
    const { s, pk, bins } = this.smoothSpec(app, fData, 96, o.smoothKey || '_facetPolar');
    const bass = this.bass(fData), mid = this.mid(fData), tre = this.treble(fData);
    const cx = w * 0.5, cy = h * 0.5;
    const minDim = Math.min(w, h);
    const baseR = minDim * (o.baseR != null ? o.baseR : 0.14) * (1 + bass * 0.25);
    const t = Date.now() * 0.001;

    this.clearSoft(ctx, w, h, o.trail != null ? o.trail : 0.16);

    const sample = (ang) => {
      let u = ((ang / (Math.PI * 2)) % 1 + 1) % 1;
      const idx = u * (bins - 1);
      const i0 = idx | 0, f = idx - i0, i1 = (i0 + 1) % bins;
      let v = s[i0] * (1 - f) + s[i1] * f;
      v = v * 0.75 + pk[i0] * 0.25;
      v += 0.08 * Math.sin(ang * 3 + t * 0.9);
      v += 0.05 * Math.sin(ang * 5 - t);
      return Math.max(0, Math.min(1.4, v));
    };
    const rad = (ang, shell) => {
      const v = sample(ang + shell * 0.12);
      return baseR * (1 + shell * 0.5) + v * minDim * (0.2 + shell * 0.05) * (1 + bass * 0.35);
    };

    // rays under
    if (rays > 0) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < rays; i++) {
        const ang = (i / rays) * Math.PI * 2 + t * 0.04;
        const v = sample(ang);
        if (v < 0.06) continue;
        const r0 = baseR * 0.9, r1 = baseR + v * minDim * 0.42;
        ctx.strokeStyle = this.hue(hue0 + (i / rays) * 70 + v * 30, 85, 55, 0.06 + v * 0.3);
        ctx.lineWidth = 0.5 + v * 1.6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0);
        ctx.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.globalCompositeOperation = 'lighter';
    for (let shell = shells - 1; shell >= 0; shell--) {
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const ang = (i / steps) * Math.PI * 2;
        const r = rad(ang, shell * 0.55);
        pts.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]);
      }
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
      const hue = hue0 + shell * 26 + mid * 20;
      const g = ctx.createRadialGradient(cx, cy, baseR * 0.3, cx, cy, minDim * 0.5);
      g.addColorStop(0, this.hue(hue + 30, 80, 55, 0.03 + shell * 0.02));
      g.addColorStop(0.6, this.hue(hue, 90, 48, 0.05 + shell * 0.03));
      g.addColorStop(1, this.hue(hue - 20, 80, 30, 0));
      ctx.fillStyle = g;
      ctx.fill();

      // faceted rim: outer glow + sharp edge + inner hairline
      ctx.strokeStyle = this.hue(hue + 40, 100, 60, 0.2 + shell * 0.08);
      ctx.lineWidth = 3.5 + bass;
      ctx.stroke();
      ctx.strokeStyle = this.hue(hue + 10, 90, 70, 0.45);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.08 + tre * 0.15) + ')';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';

    // core disc
    if (o.core !== false) {
      const cr = baseR * 0.75;
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
      cg.addColorStop(0, 'rgba(255,255,255,0.35)');
      cg.addColorStop(0.35, accent);
      cg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(cx, cy, cr * 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, cr * 0.55, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
};

const VisRegistry = {};
VisRegistry['PIC'] = function(ctx, w, h, fData, app, accent, textColor, panelColor) {
  ctx.clearRect(0, 0, w, h);
  const bass = (fData[2] / 255) || 0;
  const img = app.currentAlbumArt || app.curTrack?.imageEl;
  if (img && img.complete) {
    const scale = 0.6 + (bass * 0.15);
    const imgW = w * scale;
    const imgH = h * scale;
    const x = (w - imgW) / 2;
    const y = (h - imgH) / 2;
    ctx.save();
    ctx.shadowBlur = 25 * bass;
    ctx.shadowColor = accent;
    ctx.drawImage(img, x, y, imgW, imgH);
    ctx.restore();
  } else {
    ctx.fillStyle = panelColor || '#111111';
    ctx.fillRect(20, 20, w - 40, h - 40);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, w - 40, h - 40);
    ctx.fillStyle = textColor || '#FFFFFF';
    ctx.font = '900 12px "JetBrains Mono"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NO IMAGE AVAILABLE', w / 2, h / 2);
  }
};;


// LIBRARY — dual-pane desk (HTML layer); canvas stays quiet
VisRegistry['LIBRARY'] = function(ctx, w, h, fData, app, accent) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(0, 0, w, h);
};


// RF-SWEEP — spectrum from RTL bridge (app._rfSweepBins)
VisRegistry['RF-SWEEP'] = function(ctx, w, h, fData, app, accent, textColor, panelColor) {
  ctx.fillStyle = '#0a0c10';
  ctx.fillRect(0, 0, w, h);
  const bins = (app && app._rfSweepBins) || [];
  const peak = app && app._rfSweepPeak;
  const alert = app && app._rfAlert;
  const pad = 16;
  const graphH = h - pad * 2 - 28;
  const graphW = w - pad * 2;
  const now = Date.now() / 1000;

  // grid
  ctx.strokeStyle = 'rgba(100,140,180,0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = pad + (graphH * i) / 4;
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(pad + graphW, y); ctx.stroke();
  }

  if (!bins.length) {
    ctx.fillStyle = textColor || 'rgba(200,220,240,0.5)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RF-SWEEP — run SYSTEM → RF Sweep', w / 2, h / 2);
    return;
  }

  // normalize powers
  let minP = Infinity, maxP = -Infinity;
  for (let i = 0; i < bins.length; i++) {
    const p = bins[i].p;
    if (p < minP) minP = p;
    if (p > maxP) maxP = p;
  }
  if (!(maxP > minP)) { minP = maxP - 20; }

  const barW = graphW / bins.length;
  for (let i = 0; i < bins.length; i++) {
    const t = (bins[i].p - minP) / (maxP - minP);
    const bh = Math.max(1, t * graphH);
    const x = pad + i * barW;
    const y = pad + graphH - bh;
    const g = ctx.createLinearGradient(0, y, 0, pad + graphH);
    g.addColorStop(0, accent || '#5cf');
    g.addColorStop(1, 'rgba(20,40,60,0.8)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, Math.max(1, barW - 1), bh);
  }

  // peak marker
  if (peak && peak.freq_mhz != null) {
    const f0 = bins[0].f, f1 = bins[bins.length - 1].f;
    const span = (f1 - f0) || 1;
    const px = pad + ((peak.freq_mhz - f0) / span) * graphW;
    ctx.strokeStyle = '#f84';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, pad); ctx.lineTo(px, pad + graphH); ctx.stroke();
    ctx.fillStyle = '#f84';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(peak.freq_mhz.toFixed(3) + ' MHz  ' + (peak.power_db != null ? peak.power_db.toFixed(1) + ' dB' : ''), pad, h - 10);
  }

  // fob flash banner
  if (alert && alert.ts && (now - alert.ts) < 4) {
    const a = 1 - (now - alert.ts) / 4;
    ctx.fillStyle = 'rgba(255,80,40,' + (0.15 + a * 0.35) + ')';
    ctx.fillRect(0, 0, w, 36);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(alert.message || 'RF ACTIVITY', w / 2, 22);
  }

  ctx.fillStyle = textColor || 'rgba(180,200,220,0.7)';
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';
  const fLo = bins[0].f.toFixed(2);
  const fHi = bins[bins.length - 1].f.toFixed(2);
  ctx.fillText(fLo + ' — ' + fHi + ' MHz', pad, h - 10);
  ctx.textAlign = 'right';
  ctx.fillText('RF-SWEEP', w - pad, h - 10);
};

VisRegistry['VIDEO_MODE'] = function(ctx, w, h, fData, app) {
  ctx.clearRect(0, 0, w, h);
  const videoEl = document.querySelector('#audio-engine_html5_api') ||
                  document.querySelector('#audio-engine video') ||
                  document.querySelector('video');
  if (videoEl && videoEl.readyState >= 2) {
    try { ctx.drawImage(videoEl, 0, 0, w, h); } catch (e) {}
  }
};

VisRegistry['VIS_OFF'] = function(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
};;

VisRegistry['INFO-HUD'] = function(ctx, w, h, fData, app, accent, textColor) {
  ctx.fillStyle = accent;
  ctx.font = '900 16px "JetBrains Mono"';
  ctx.fillText(app.curTrack?.name?.toUpperCase() || 'NO SIGNAL', 80, 60);
  ctx.font = '900 11px "JetBrains Mono"';
  ctx.globalAlpha = 0.5;
  ctx.fillText(app.curTrack?.tags?.toUpperCase() || 'IDLE', 80, 82);
  ctx.globalAlpha = 1.0;
  ctx.fillStyle = textColor;
  ctx.font = '900 10px "JetBrains Mono"';
  const currentSkinName = Object.keys(window.SKINS || {})[app.sIdx] || 'UNKNOWN';
  ctx.fillText(`SKIN: ${currentSkinName.toUpperCase()}`, 5, h - 10);
  ctx.fillStyle = accent;
  ctx.font = '900 9px "JetBrains Mono"';
  const bitrate = app.curTrack?.bitrate ? `${app.curTrack.bitrate} KBPS` : '--- KBPS';
  ctx.fillText(`ENCODING: ${bitrate}`, 40, 105);
  ctx.fillText('SIGNAL:', 40, 125);
  for (let i = 0; i < 10; i++) {
    const level = (fData[i * 2] / 255);
    ctx.globalAlpha = level > 0.2 ? 1 : 0.2;
    ctx.fillRect(95 + (i * 7), 118, 4, 8);
  }
  ctx.globalAlpha = 1.0;
};;

VisRegistry['GLISTEN'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.1);
  const bass = VisHelpers.bass(fData), tre = VisHelpers.treble(fData);
  const { s } = VisHelpers.smoothSpec(app, fData, 48, '_glistenS');
  const cx = w / 2, cy = h / 2;
  // multi-layer orbs
  if (!app.glistenOrbs || app.glistenOrbs.length < 50) {
    app.glistenOrbs = Array.from({ length: 60 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 3 + 1, speed: Math.random() * 1.2 + 0.25,
      layer: (Math.random() * 3) | 0, op: Math.random() * 0.5 + 0.2
    }));
  }
  ctx.globalCompositeOperation = 'lighter';
  app.glistenOrbs.forEach(orb => {
    orb.y += orb.speed * (0.7 + bass);
    if (orb.y > h + 10) orb.y = -10;
    const g = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r * (2 + bass));
    g.addColorStop(0, `rgba(255,255,255,${orb.op})`);
    g.addColorStop(0.4, accent);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.r * (2 + bass + orb.layer * 0.5), 0, Math.PI * 2);
    ctx.fill();
  });
  // faceted core bloom
  for (let i = 3; i >= 0; i--) {
    const R = 40 + i * 35 + bass * 80;
    const g = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
    g.addColorStop(0, i === 0 ? 'rgba(255,255,255,0.45)' : `rgba(255,255,255,${0.08})`);
    g.addColorStop(0.35, accent);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${0.05 + tre * 0.08})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // spectrum sparkle ring
  for (let i = 0; i < s.length; i++) {
    if (s[i] < 0.5) continue;
    const a = (i / s.length) * Math.PI * 2;
    const r = 70 + bass * 40 + s[i] * 50;
    ctx.fillStyle = `rgba(255,255,255,${0.3 + s[i] * 0.5})`;
    ctx.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2, 2);
  }
  ctx.globalCompositeOperation = 'source-over';
};


VisRegistry['RUMPLE'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.14);
  const { s, bins } = VisHelpers.smoothSpec(app, fData, 128, '_rumpleS');
  const bass = VisHelpers.bass(fData), mid = VisHelpers.mid(fData);
  const cy = h * 0.5, t = Date.now() * 0.001;
  // dust layer
  if (!app.rumpleDust) {
    app.rumpleDust = Array.from({ length: 50 }, () => ({
      x: Math.random() * w, y: Math.random() * h, s: Math.random() * 1.2 + 0.3, o: Math.random() * 0.3
    }));
  }
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  app.rumpleDust.forEach(d => {
    d.y -= d.s * 0.4;
    if (d.y < 0) d.y = h;
    ctx.globalAlpha = d.o;
    ctx.fillRect(d.x, d.y, 1.5, 1.5);
  });
  ctx.globalAlpha = 1;
  // multi-layer waveform ribbons
  ctx.globalCompositeOperation = 'lighter';
  for (let layer = 0; layer < 4; layer++) {
    const yOff = (layer - 1.5) * 18;
    const amp = (0.55 + layer * 0.12) * h * 0.35 * (1 + bass * 0.35);
    ctx.beginPath();
    for (let i = 0; i < bins; i++) {
      const x = (i / (bins - 1)) * w;
      const v = s[i];
      const y = cy + yOff + Math.sin(i * 0.12 + t * (1 + layer * 0.2) + mid) * 8 + (v - 0.3) * amp;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = VisHelpers.hue(30 + layer * 25, 70, 55, 0.2 + layer * 0.08);
    ctx.lineWidth = 3.5 - layer * 0.5;
    ctx.stroke();
    ctx.strokeStyle = layer === 0 ? accent : 'rgba(255,255,255,0.12)';
    ctx.lineWidth = layer === 0 ? 1.5 : 0.6;
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
};


VisRegistry['POLAR'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.drawFacetPolar(ctx, w, h, fData, app, {
    accent, shells: 4, rays: 96, steps: 110, hue0: 280, trail: 0.14, baseR: 0.12, smoothKey: '_polarS'
  });
};


VisRegistry['VU-METER'] = function(ctx, w, h, fData, app, accent, textColor, panelColor) {
  const drawMeter = (x) => {
    const centerY = h * 0.85; const radius = 110;
    const grad = ctx.createRadialGradient(x, centerY - 30, 10, x, centerY - 30, radius + 20);
    grad.addColorStop(0, accent + '44'); grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(x, centerY, radius + 20, Math.PI, 0); ctx.fill();
    ctx.fillStyle = panelColor; ctx.beginPath(); ctx.arc(x, centerY, radius, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = textColor; ctx.fillStyle = textColor; ctx.lineWidth = 1.5; ctx.font = '800 9px "JetBrains Mono"';
    for (let i = 0; i <= 10; i++) {
      const angle = Math.PI + (i / 10) * Math.PI;
      const inner = radius - 10; const outer = radius - (i % 5 === 0 ? 25 : 18);
      ctx.beginPath(); ctx.moveTo(x + Math.cos(angle) * inner, centerY + Math.sin(angle) * inner);
      ctx.lineTo(x + Math.cos(angle) * outer, centerY + Math.sin(angle) * outer); ctx.stroke();
      if (i % 2 === 0) {
        const textVal = -20 + (i * 2.3);
        const tx = x + Math.cos(angle) * (radius - 8);
        const ty = centerY + Math.sin(angle) * (radius - 38);
        ctx.textAlign = 'center'; ctx.fillText(Math.round(textVal), tx, ty);
      }
    }
    const rawV = (fData[10 + (x > w / 2 ? 5 : 0)] / 255);
    const v = rawV * Math.PI;
    ctx.strokeStyle = '#CC0000'; ctx.lineWidth = 2.5; ctx.beginPath();
    ctx.moveTo(x, centerY); ctx.lineTo(x + Math.cos(Math.PI + v) * 105, centerY + Math.sin(Math.PI + v) * 105); ctx.stroke();
    ctx.fillStyle = textColor; ctx.beginPath(); ctx.arc(x, centerY, 6, 0, Math.PI * 2); ctx.fill();
  };
  drawMeter(w * 0.3);
  drawMeter(w * 0.7);
};;

VisRegistry['SINGULARITY'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.12);
  const bass = VisHelpers.bass(fData), mid = VisHelpers.mid(fData), tre = VisHelpers.treble(fData);
  const isBeat = VisHelpers.beat(fData, 0.7);
  const cx = w / 2, cy = h / 2;
  if (!Array.isArray(app.particles) || app.particles.length < 280) {
    app.particles = Array.from({ length: 320 }, () => ({
      x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0, z: Math.random(), life: Math.random()
    }));
  }
  const force = isBeat ? -(1.2 + bass * 2.2) : 0.55 + mid * 0.4;
  ctx.globalCompositeOperation = 'lighter';
  // multi-layer accretion rings
  for (let ring = 0; ring < 4; ring++) {
    const R = 30 + ring * 28 + bass * 20;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = VisHelpers.hue(260 + ring * 20, 70, 50, 0.08 + mid * 0.1);
    ctx.lineWidth = 2 + (3 - ring) * 0.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  app.particles.forEach(p => {
    const dx = cx - p.x, dy = cy - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
    p.vx += (dx / dist) * force * (0.6 + p.z);
    p.vy += (dy / dist) * force * (0.6 + p.z);
    // tangential swirl layers
    p.vx += -dy / dist * (0.15 + tre * 0.25);
    p.vy += dx / dist * (0.15 + tre * 0.25);
    if (isBeat) { p.vx += (Math.random() - 0.5) * 5; p.vy += (Math.random() - 0.5) * 5; }
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.88; p.vy *= 0.88;
    if (dist < 8 || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
      const ang = Math.random() * Math.PI * 2;
      const rr = Math.min(w, h) * (0.35 + Math.random() * 0.3);
      p.x = cx + Math.cos(ang) * rr; p.y = cy + Math.sin(ang) * rr;
      p.vx = p.vy = 0;
    }
    const sz = 1.2 + p.z * 2.5 + (isBeat ? 1.5 : 0);
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz * 2);
    g.addColorStop(0, isBeat ? 'rgba(255,255,255,0.95)' : accent);
    g.addColorStop(0.4, VisHelpers.hue(280, 80, 55, 0.35));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, sz * 2, 0, Math.PI * 2);
    ctx.fill();
  });
  // event horizon core — faceted
  const eg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28 + bass * 20);
  eg.addColorStop(0, 'rgba(255,255,255,0.5)');
  eg.addColorStop(0.3, accent);
  eg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = eg;
  ctx.beginPath();
  ctx.arc(cx, cy, 40 + bass * 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
};


VisRegistry['LED-BAR'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.2);
  const { s, pk, bins } = VisHelpers.smoothSpec(app, fData, 48, '_ledS');
  const bw = w / bins;
  const bass = VisHelpers.bass(fData);
  for (let i = 0; i < bins; i++) {
    const v = s[i], peak = pk[i];
    const maxH = h * 0.82;
    const segments = 16;
    const segH = maxH / segments;
    const lit = Math.floor(v * segments);
    for (let j = 0; j < lit; j++) {
      const y = h - (j + 1) * segH;
      const u = j / segments;
      // body
      ctx.fillStyle = VisHelpers.heatColor(u, 0.35 + v * 0.5);
      ctx.fillRect(i * bw + 2, y + 1, bw - 4, segH - 3);
      // facet top edge
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(i * bw + 2, y + 1, bw - 4, 1.5);
    }
    // peak hold facet
    const py = h - peak * maxH;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(i * bw + 2, py, bw - 4, 2);
    ctx.fillStyle = accent;
    ctx.fillRect(i * bw + 2, py + 2, bw - 4, 1);
  }
  // floor glow layer
  const g = ctx.createLinearGradient(0, h * 0.7, 0, h);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, VisHelpers.hue(40, 80, 40, 0.12 + bass * 0.15));
  ctx.fillStyle = g;
  ctx.fillRect(0, h * 0.7, w, h * 0.3);
};


VisRegistry['SPIRALS'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.14);
  const { s, bins } = VisHelpers.smoothSpec(app, fData, 120, '_spiralS');
  const bass = VisHelpers.bass(fData), tre = VisHelpers.treble(fData);
  const cx = w / 2, cy = h / 2, t = Date.now() * 0.001;
  const arms = 4;
  ctx.globalCompositeOperation = 'lighter';
  for (let arm = 0; arm < arms; arm++) {
    for (let layer = 0; layer < 3; layer++) {
      ctx.beginPath();
      for (let i = 0; i < bins; i++) {
        const u = i / bins;
        const a = u * Math.PI * 8 + t * (0.7 + arm * 0.15) + arm * (Math.PI * 2 / arms) + layer * 0.08;
        const v = s[i];
        const r = 12 + u * Math.min(w, h) * 0.42 * (0.75 + bass * 0.4) + v * 40 + layer * 6;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = VisHelpers.hue(200 + arm * 40 + layer * 15, 80, 55, 0.15 + layer * 0.1 + tre * 0.1);
      ctx.lineWidth = 2.5 - layer * 0.6 + bass;
      ctx.stroke();
      // facet highlight
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.05 + tre * 0.1) + ')';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
};


VisRegistry['PARTICLES'] = function(ctx, w, h, fData, app, accent) {
  // DIGITAL LOOM — original parameters preserved
  // keep stage --crt-bg

  const startAmount = 250;
  const maxAmount = 600;
  const propagateRate = 8;
  const baseSpeed = 0.1;
  const lifeGain = 0.35;
  const lifeDecay = 0.98;
  const sizeBase = 1.0;
  const sizeMax = 2.5;
  const lineDist = 65;

  // Prefer live skin accent, fall back to passed accent
  let currentAccent = accent || '#ffffff';
  try {
    const css = getComputedStyle(document.documentElement).getPropertyValue('--skin-accent').trim();
    if (css) currentAccent = css;
  } catch (e) {}

  const getRGBColor = (colorStr) => {
    let hex = colorStr || '#ffffff';
    if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
      const match = hex.match(/\d+/g);
      return match ? match[0] + ', ' + match[1] + ', ' + match[2] : '255, 255, 255';
    }
    if (hex.startsWith('#')) hex = hex.slice(1);
    if (hex.length === 3) hex = hex.split('').map(ch => ch + ch).join('');
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return r + ', ' + g + ', ' + b;
    }
    return '255, 255, 255';
  };
  const lineRGB = getRGBColor(currentAccent);

  const bass = (fData[2] || 0) / 255;
  const mid = (fData[50] || 0) / 255;
  const isBeat = bass > 0.65;

  if (!Array.isArray(app.particles)) app.particles = [];
  if (!Array.isArray(app.sparks)) app.sparks = [];

  if (app.particles.length < startAmount) {
    for (let i = 0; i < startAmount; i++) {
      app.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * baseSpeed * 2,
        vy: (Math.random() - 0.5) * baseSpeed * 2,
        life: Math.random() * 0.8 + 0.2,
        radius: sizeBase + Math.random() * 1.5
      });
    }
  }

  if (app.particles.length < maxAmount) {
    for (let i = 0; i < propagateRate; i++) {
      app.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * baseSpeed * (1 + bass * 3),
        vy: (Math.random() - 0.5) * baseSpeed * (1 + bass * 3),
        life: 1.0,
        radius: sizeBase + Math.random() * 1.5
      });
    }
  }

  app.particles.forEach((p, i) => {
    p.x += p.vx * (1 + mid * 3);
    p.y += p.vy * (1 + mid * 3);
    p.radius = sizeBase + (p.life * (sizeMax - sizeBase));

    if (p.x - p.radius < 0) { p.x = p.radius; p.vx *= -1; }
    if (p.x + p.radius > w) { p.x = w - p.radius; p.vx *= -1; }
    if (p.y - p.radius < 0) { p.y = p.radius; p.vy *= -1; }
    if (p.y + p.radius > h) { p.y = h - p.radius; p.vy *= -1; }

    if (isBeat) p.life = Math.min(p.life + lifeGain, 1.0);
    else p.life *= lifeDecay;

    if (p.life > 0.05) {
      for (let j = i + 1; j < app.particles.length; j++) {
        const p2 = app.particles[j];
        const dx = p2.x - p.x;
        const dy = p2.y - p.y;
        const distSq = dx * dx + dy * dy;
        const minDistance = p.radius + p2.radius;

        if (distSq < minDistance * minDistance && distSq > 0) {
          const distance = Math.sqrt(distSq);
          const angle = Math.atan2(dy, dx);
          const sin = Math.sin(angle);
          const cos = Math.cos(angle);
          const vx1 = p.vx * cos + p.vy * sin;
          const vy1 = p.vy * cos - p.vx * sin;
          const vx2 = p2.vx * cos + p2.vy * sin;
          const vy2 = p2.vy * cos - p2.vx * sin;
          p.vx = vx2 * cos - vy1 * sin;
          p.vy = vy1 * cos + vx2 * sin;
          p2.vx = vx1 * cos - vy2 * sin;
          p2.vy = vy2 * cos + vx1 * sin;
          const overlap = (minDistance - distance) / 2;
          p.x -= overlap * cos; p.y -= overlap * sin;
          p2.x += overlap * cos; p2.y += overlap * sin;
          for (let k = 0; k < 3; k++) {
            app.sparks.push({
              x: p.x + (dx / 2),
              y: p.y + (dy / 2),
              vx: (Math.random() - 0.5) * 6.5,
              vy: (Math.random() - 0.5) * 6.5,
              life: 1.0,
              color: Math.random() > 0.5 ? '#ffff00' : (accent || currentAccent)
            });
          }
        }

        if (distSq < lineDist * lineDist && (p.life > 0.1 || p2.life > 0.1)) {
          const alpha = (1 - Math.sqrt(distSq) / lineDist) * Math.max(p.life, p2.life) * 0.5;
          ctx.strokeStyle = 'rgba(' + lineRGB + ', ' + alpha + ')';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }

    if (p.life > 0.01) {
      ctx.fillStyle = 'rgba(255, 255, 255, ' + (p.life + 0.15) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  for (let s = app.sparks.length - 1; s >= 0; s--) {
    const spark = app.sparks[s];
    spark.x += spark.vx;
    spark.y += spark.vy;
    spark.life *= 0.92;
    if (spark.life < 0.01) {
      app.sparks.splice(s, 1);
    } else {
      ctx.globalAlpha = spark.life;
      ctx.fillStyle = spark.color;
      ctx.fillRect(spark.x, spark.y, 3.5, 3.5);
    }
  }

  ctx.globalAlpha = 1.0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '10px monospace';
  ctx.fillText('NODES: ' + app.particles.length + ' | SPARKS: ' + app.sparks.length, 20, 30);
};


VisRegistry['PARTICLES2'] = function(ctx, w, h, fData, app, accent) {
  // keep stage --crt-bg
  const bass = (fData[2] / 255) || 0;
  const mid = (fData[10] / 255) || 0;
  const isBeat = bass > 0.85;
  const centerX = w / 2, centerY = h / 2;
  const gridSize = 35;
  const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2);
  for (let x = gridSize; x < w; x += gridSize) {
    for (let y = gridSize; y < h; y += gridSize) {
      const dx = x - centerX, dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const distRatio = dist / maxDist;
      const wave = Math.sin(dist * 0.015 - Date.now() * 0.004) * (10 + bass * 50);
      const z = 120 + wave;
      const scale = 250 / (250 + z);
      const px = centerX + dx * scale, py = centerY + dy * scale;
      const size = gridSize * scale * (0.4 + mid * 0.5);
      ctx.beginPath();
      if (distRatio < 0.2 + (bass * 0.2)) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.globalAlpha = Math.max(0.2, 1 - z / 300);
      } else {
        ctx.strokeStyle = accent;
        ctx.globalAlpha = Math.max(0.1, 1 - z / 450);
      }
      ctx.lineWidth = isBeat ? 1.5 : 0.8;
      ctx.strokeRect(px - size / 2, py - size / 2, size, size);
    }
  }
  ctx.globalAlpha = 1.0;
};;

VisRegistry['UNKNOWN-PLEASURES'] = function(ctx, w, h, fData, app, accent, textColor, panelColor) {
  if (!app.upLineBuffers || app.upLineBuffers.length !== 100) {
    app.upLineBuffers = Array.from({ length: 100 }, () => Array(161).fill(0));
  }
  ctx.fillStyle = panelColor || VisHelpers.stageBg('#0a0a0a') || '#0a0a0a';
  ctx.fillRect(0, 0, w, h);
  const numLines = 100, spacing = h / (numLines + 1), points = 160;
  const sliceW = w / points, bass = (fData[2] || 0) / 255;
  for (let i = 0; i < numLines; i++) {
    ctx.beginPath();
    ctx.strokeStyle = accent;
    ctx.fillStyle = panelColor || '#000';
    const yBase = spacing * (i + 1);
    const distFromCenter = Math.abs(i - 50) / 50;
    const lerp = 0.8 - distFromCenter * 0.75;
    for (let j = 0; j <= points; j++) {
      const x = j * sliceW;
      const dataIndex = Math.floor((j / points) * fData.length);
      const value = (fData[dataIndex] || 0) / 255;
      const bell = Math.max(0, 1 - Math.pow(Math.abs(j - points / 2) / (points / 2), 2));
      const mult = (i > 20 && i < 80) ? 1 : 0.2;
      const target = value * bell * (45 + bass * 35) * mult * 3;
      app.upLineBuffers[i][j] += (target - app.upLineBuffers[i][j]) * Math.max(0.02, lerp);
      const y = yBase - app.upLineBuffers[i][j];
      if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
};


// ============================================================
// NEW HIGH-QUALITY EFFECTS
// ============================================================

// 1. NEON-TUNNEL;

VisRegistry['NEON-TUNNEL'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.14);
  const { s } = VisHelpers.smoothSpec(app, fData, 48, '_tunnelS');
  const bass = VisHelpers.bass(fData), mid = VisHelpers.mid(fData);
  const cx = w / 2, cy = h / 2, t = Date.now() * 0.0015;
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 32; i > 0; i--) {
    const p = i / 32;
    const v = s[i % s.length] || 0;
    const r = p * Math.min(w, h) * 0.55 * (0.55 + bass * 0.55) + v * 18;
    const twist = t * (1.1 + mid) + p * 10;
    ctx.beginPath();
    const segs = 28;
    for (let k = 0; k <= segs; k++) {
      const a = (k / segs) * Math.PI * 2 + twist;
      const wob = Math.sin(a * 4 + t * 2) * (5 + bass * 14 + v * 10);
      const x = cx + Math.cos(a) * (r + wob);
      const y = cy + Math.sin(a) * (r + wob) * 0.78;
      if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    // faceted triple stroke
    ctx.strokeStyle = VisHelpers.hue(180 + p * 100 + mid * 30, 90, 55, 0.08 + p * 0.45);
    ctx.lineWidth = 3 + bass;
    ctx.stroke();
    ctx.strokeStyle = VisHelpers.hue(200 + p * 80, 80, 65, 0.15 + p * 0.2);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.04 + p * 0.08) + ')';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
};


VisRegistry['PLASMA-STORM'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.1);
  const { s } = VisHelpers.smoothSpec(app, fData, 48, '_plasmaS');
  const bass = VisHelpers.bass(fData), tre = VisHelpers.treble(fData);
  const isBeat = VisHelpers.beat(fData, 0.68);
  const parts = VisHelpers.ensureParticles(app, 'plasmaParts', 200, () => ({
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
    z: Math.random(), hue: Math.random() * 60
  }));
  ctx.globalCompositeOperation = 'lighter';
  // field layers
  for (let i = 0; i < s.length; i++) {
    const x = (i / s.length) * w;
    const v = s[i];
    if (v < 0.15) continue;
    const g = ctx.createRadialGradient(x, h * 0.5, 0, x, h * 0.5, 30 + v * 80);
    g.addColorStop(0, VisHelpers.hue(180 + v * 80, 90, 55, 0.08 + v * 0.15));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 60, 0, 120, h);
  }
  parts.forEach(p => {
    p.vx += (Math.random() - 0.5) * (0.4 + bass);
    p.vy += (Math.random() - 0.5) * (0.4 + bass);
    if (isBeat) { p.vx *= 1.4; p.vy *= 1.4; }
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.96; p.vy *= 0.96;
    if (p.x < 0 || p.x > w) p.vx *= -1;
    if (p.y < 0 || p.y > h) p.vy *= -1;
    const sz = 2 + p.z * 4 + bass * 3;
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz * 2.5);
    g.addColorStop(0, 'rgba(255,255,255,0.7)');
    g.addColorStop(0.35, VisHelpers.hue(160 + p.hue + tre * 40, 90, 55, 0.5));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, sz * 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalCompositeOperation = 'source-over';
};


VisRegistry['KALEIDO-BLOOM'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.12);
  const { s, bins } = VisHelpers.smoothSpec(app, fData, 64, '_kalS');
  const bass = VisHelpers.bass(fData), mid = VisHelpers.mid(fData);
  const cx = w / 2, cy = h / 2, t = Date.now() * 0.001;
  const sectors = 8;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalCompositeOperation = 'lighter';
  for (let layer = 0; layer < 3; layer++) {
    for (let sec = 0; sec < sectors; sec++) {
      ctx.save();
      ctx.rotate((sec / sectors) * Math.PI * 2 + t * 0.15 * (layer + 1));
      ctx.beginPath();
      for (let i = 0; i < bins / 2; i++) {
        const u = i / (bins / 2);
        const a = u * (Math.PI / sectors);
        const v = s[i];
        const r = 20 + layer * 15 + v * Math.min(w, h) * 0.35 * (1 + bass * 0.3);
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      for (let i = (bins / 2) | 0; i >= 0; i--) {
        const u = i / (bins / 2);
        const a = -u * (Math.PI / sectors);
        const v = s[i];
        const r = 20 + layer * 15 + v * Math.min(w, h) * 0.35 * (1 + bass * 0.3);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fillStyle = VisHelpers.hue(280 + sec * 20 + layer * 25 + mid * 30, 80, 50, 0.06 + layer * 0.04);
      ctx.fill();
      ctx.strokeStyle = VisHelpers.hue(300 + sec * 15, 90, 65, 0.2 + bass * 0.2);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
};


VisRegistry['REACTION-DIFFUSION'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.06);
  if (!app.rdGrid || app.rdGrid.w !== Math.floor(w / 6)) {
    const gw = Math.floor(w / 6), gh = Math.floor(h / 6);
    app.rdGrid = { w: gw, h: gh, a: new Float32Array(gw * gh), b: new Float32Array(gw * gh) };
    for (let i = 0; i < gw * gh; i++) {
      app.rdGrid.a[i] = 1;
      app.rdGrid.b[i] = Math.random() > 0.98 ? 1 : 0;
    }
  }
  const { w: gw, h: gh, a, b } = app.rdGrid;
  const bass = VisHelpers.bass(fData);
  const feed = 0.035 + bass * 0.02;
  const kill = 0.06 + VisHelpers.mid(fData) * 0.02;
  // simplified update
  for (let y = 1; y < gh - 1; y++) {
    for (let x = 1; x < gw - 1; x++) {
      const i = y * gw + x;
      const la = a[i - 1] + a[i + 1] + a[i - gw] + a[i + gw] - 4 * a[i];
      const lb = b[i - 1] + b[i + 1] + b[i - gw] + b[i + gw] - 4 * b[i];
      const abb = a[i] * b[i] * b[i];
      a[i] = Math.max(0, Math.min(1, a[i] + (0.2 * la - abb + feed * (1 - a[i]))));
      b[i] = Math.max(0, Math.min(1, b[i] + (0.1 * lb + abb - (kill + feed) * b[i])));
    }
  }
  // inject on beat
  if (VisHelpers.beat(fData, 0.72)) {
    const cx = Math.floor(gw / 2 + (Math.random() - 0.5) * 10);
    const cy = Math.floor(gh / 2 + (Math.random() - 0.5) * 10);
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -3; dx <= 3; dx++) {
        const i = (cy + dy) * gw + (cx + dx);
        if (i >= 0 && i < a.length) b[i] = 1;
      }
  }
  // draw
  const cellW = w / gw, cellH = h / gh;
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const v = b[y * gw + x];
      if (v > 0.15) {
        ctx.fillStyle = accent;
        ctx.globalAlpha = Math.min(1, v * 1.4);
        ctx.fillRect(x * cellW, y * cellH, cellW + 1, cellH + 1);
      }
    }
  }
  ctx.globalAlpha = 1;
};

// 6. CRT-SCOPE;

VisRegistry['CRT-SCOPE'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.25);
  const bass = VisHelpers.bass(fData);
  const cx = w / 2, cy = h / 2;
  // phosphor glow background
  const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.min(w, h) * 0.55);
  g.addColorStop(0, accent + '33');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // lissajous-ish
  ctx.beginPath();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2 + bass * 3;
  ctx.shadowBlur = 18;
  ctx.shadowColor = accent;
  const points = 256;
  for (let i = 0; i < points; i++) {
    const t = i / points;
    const freqX = 2 + Math.floor(VisHelpers.mid(fData) * 4);
    const freqY = 3 + Math.floor(VisHelpers.treble(fData) * 5);
    const x = cx + Math.sin(t * Math.PI * 2 * freqX + Date.now() * 0.002) * (w * 0.35) * (0.6 + bass * 0.5);
    const y = cy + Math.sin(t * Math.PI * 2 * freqY + Date.now() * 0.0015) * (h * 0.32) * (0.6 + bass * 0.5);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // scanlines
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  for (let y = 0; y < h; y += 3) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
};

// 7. HYPERSPACE;

VisRegistry['HYPERSPACE'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.2);
  const stars = VisHelpers.ensureParticles(app, 'hyperStars', 250, () => ({
    x: (Math.random() - 0.5) * 2,
    y: (Math.random() - 0.5) * 2,
    z: Math.random()
  }));
  const bass = VisHelpers.bass(fData);
  const speed = 0.012 + bass * 0.06;
  const cx = w / 2, cy = h / 2;
  stars.forEach(s => {
    s.z -= speed;
    if (s.z <= 0) {
      s.x = (Math.random() - 0.5) * 2;
      s.y = (Math.random() - 0.5) * 2;
      s.z = 1;
    }
    const k = 280 / s.z;
    const px = cx + s.x * k;
    const py = cy + s.y * k;
    const size = (1 - s.z) * 4 + bass * 3;
    ctx.beginPath();
    ctx.fillStyle = accent;
    ctx.globalAlpha = 1 - s.z;
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
};

// 8. LIQUID-MIRROR;

VisRegistry['AURA-ORB'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.drawFacetPolar(ctx, w, h, fData, app, {
    accent, shells: 5, rays: 64, steps: 100, hue0: 310, trail: 0.12, baseR: 0.15, smoothKey: '_auraS', core: true
  });
};


VisRegistry['LAVA-LAMP'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.08);
  const blobs = VisHelpers.ensureParticles(app, 'lavaBlobs', 12, () => ({
    x: Math.random() * w, y: Math.random() * h,
    r: 30 + Math.random() * 50,
    vx: (Math.random() - 0.5) * 0.8,
    vy: (Math.random() - 0.5) * 0.8,
    phase: Math.random() * Math.PI * 2
  }));
  const bass = VisHelpers.bass(fData);
  blobs.forEach(b => {
    b.x += b.vx * (1 + bass);
    b.y += b.vy * (1 + bass);
    b.r = (30 + Math.sin(Date.now() * 0.001 + b.phase) * 15) * (1 + bass * 0.4);
    if (b.x < b.r || b.x > w - b.r) b.vx *= -1;
    if (b.y < b.r || b.y > h - b.r) b.vy *= -1;
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    g.addColorStop(0, '#fff');
    g.addColorStop(0.4, accent);
    g.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.55;
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
};

// 21. PULSE-RIPPLE;

VisRegistry['NEURAL-NET'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.15);
  const nodes = VisHelpers.ensureParticles(app, 'neuralNodes', 45, () => ({
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5
  }));
  const bass = VisHelpers.bass(fData);
  const mid = VisHelpers.mid(fData);
  nodes.forEach((n, i) => {
    n.x += n.vx * (1 + mid);
    n.y += n.vy * (1 + mid);
    if (n.x < 0 || n.x > w) n.vx *= -1;
    if (n.y < 0 || n.y > h) n.vy *= -1;
    for (let j = i + 1; j < nodes.length; j++) {
      const n2 = nodes[j];
      const dx = n2.x - n.x, dy = n2.y - n.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120 + bass * 80) {
        ctx.beginPath();
        ctx.strokeStyle = accent;
        ctx.globalAlpha = (1 - dist / 200) * 0.5;
        ctx.lineWidth = 1;
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.stroke();
      }
    }
    ctx.beginPath();
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.8;
    ctx.arc(n.x, n.y, 2.5 + bass * 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
};

// 23. SOLAR-FLARE;

VisRegistry['SOLAR-FLARE'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.12);
  const bass = VisHelpers.bass(fData);
  const cx = w / 2, cy = h / 2;
  // core
  const g = ctx.createRadialGradient(cx, cy, 5, cx, cy, 80 + bass * 100);
  g.addColorStop(0, '#fff');
  g.addColorStop(0.3, accent);
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(cx, cy, 80 + bass * 100, 0, Math.PI * 2);
  ctx.fill();
  // flares
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + Date.now() * 0.001;
    const len = 60 + (fData[i * 8] / 255) * 180 + bass * 80;
    ctx.beginPath();
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 3 + bass * 4;
    ctx.moveTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40);
    ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
};

// 24. RING-RUNNER;

VisRegistry['DARK-MATTER'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.2);
  const particles = VisHelpers.ensureParticles(app, 'darkParts', 100, () => ({
    x: Math.random() * w, y: Math.random() * h,
    mass: 0.5 + Math.random()
  }));
  const bass = VisHelpers.bass(fData);
  const cx = w / 2, cy = h / 2;
  particles.forEach(p => {
    const dx = cx - p.x, dy = cy - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    // gravity toward center, but also orbit
    const force = (bass * 2 + 0.3) / (dist * 0.01);
    p.x += (dx / dist) * force * 0.1 + Math.cos(dist * 0.01) * 1.5;
    p.y += (dy / dist) * force * 0.1 + Math.sin(dist * 0.01) * 1.5;
    if (dist < 20) {
      p.x = Math.random() * w; p.y = Math.random() * h;
    }
    ctx.beginPath();
    ctx.fillStyle = accent;
    ctx.globalAlpha = Math.min(1, 80 / dist);
    ctx.arc(p.x, p.y, p.mass * 2, 0, Math.PI * 2);
    ctx.fill();
  });
  // black hole
  ctx.beginPath();
  ctx.fillStyle = '#000';
  ctx.globalAlpha = 1;
  ctx.arc(cx, cy, 12 + bass * 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 1;
};

// 28. ELECTRIC-FIELD;

VisRegistry['MATRIX-RAIN'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.12);
  if (!app.matrixCols) {
    const cols = Math.floor(w / 14);
    app.matrixCols = Array.from({ length: cols }, () => ({
      y: Math.random() * h, speed: 1 + Math.random() * 4, chars: []
    }));
  }
  const bass = VisHelpers.bass(fData);
  const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789';
  app.matrixCols.forEach((c, i) => {
    c.y += c.speed * (1 + bass * 1.5);
    if (c.y > h + 100) {
      c.y = -20;
      c.speed = 1 + Math.random() * 4;
    }
    const x = i * 14;
    for (let j = 0; j < 12; j++) {
      const yy = c.y - j * 14;
      if (yy < 0 || yy > h) continue;
      ctx.fillStyle = j === 0 ? '#fff' : accent;
      ctx.globalAlpha = 1 - j / 14;
      ctx.font = '12px monospace';
      const ch = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(ch, x, yy);
    }
  });
  ctx.globalAlpha = 1;
};

// 39. GEOMETRIC-BLOOM;

VisRegistry['GEOMETRIC-BLOOM'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.14);
  const bass = VisHelpers.bass(fData);
  const mid = VisHelpers.mid(fData);
  const cx = w / 2, cy = h / 2;
  const shapes = 7;
  for (let s = 0; s < shapes; s++) {
    const sides = 3 + s;
    const r = 30 + s * 25 + bass * 50;
    const rot = Date.now() * 0.0005 * (s + 1) + mid;
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const a = (i / sides) * Math.PI * 2 + rot;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.35 + (s / shapes) * 0.4;
    ctx.lineWidth = 1.5 + bass * 2;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
};

// 40. AUDIO-RIBBONS;

VisRegistry['THOREAU-MESH'] = function(ctx, w, h, fData, app, accent, textColor, panelColor) {
  const bass = (fData[2] / 255) || 0;
              const tre  = (fData[90] / 255) || 0;
              const mid  = (fData[40] / 255) || 0;
  // keep stage --crt-bg

              const rows = 48;
              const cols = 96;
              const cx = w * 0.5;
              const cy = h * 0.58;
              const scaleX = w * 0.42;
              const scaleY = h * 0.28;
              const peakH  = h * (0.22 + bass * 0.02);

              const t = (app._thoreauT = (app._thoreauT || 0) + 0.008 + bass * 0.01);

              for (let r = 0; r < rows; r++) {
                  const v = r / (rows - 1);
                  const depthFade = 0.25 + v * 0.75;

                  ctx.beginPath();
                  let started = false;

                  for (let c = 0; c < cols; c++) {
                      const u = c / (cols - 1);
                      const nx = (u - 0.5) * 2;
                      const nz = (v - 0.5) * 2;
                      const dist = Math.sqrt(nx * nx + nz * nz);

                      const fi = Math.min(127, Math.floor(dist * 90 + (1 - dist) * 4));
                      const fv = (fData[fi] || 0) / 255;

                      // Bass → centre peak · Treble → outer rings
                      const centrePeak = Math.exp(-dist * dist * 2.8) * (0.55 + bass * 1.35);
                      const outerRipple =
                          Math.sin(dist * 7.5 - t * 3 + mid * 2) * 0.08 * (0.3 + tre) +
                          Math.sin(dist * 14 + t * 2) * 0.035 * tre;
                      const terrain =
                          Math.sin(nx * 2.2 + t) * Math.cos(nz * 1.8 - t * 0.7) * 0.06 * (0.4 + mid);

                      const height =
                          (centrePeak + outerRipple + terrain + fv * 0.22 * (0.4 + dist)) * peakH;

                      const persp = 1 - v * 0.12;
                      const px = cx + nx * scaleX * persp + nz * scaleX * 0.18;
                      const py = cy + nz * scaleY * 0.55 - height + v * h * 0.02;

                      if (!started) { ctx.moveTo(px, py); started = true; }
                      else ctx.lineTo(px, py);
                  }

                  if (bass > 0.55 && v > 0.35 && v < 0.65) ctx.strokeStyle = '#e8f080';
                  else ctx.strokeStyle = accent || '#b8e030';

                  ctx.globalAlpha = depthFade * (0.45 + tre * 0.25 + bass * 0.15);
                  ctx.lineWidth = (v < 0.15 || v > 0.9) ? 0.7 : 1.05;
                  ctx.stroke();
              }

              ctx.globalAlpha = 1;
};;

VisRegistry['RIDGE-RUN'] = function(ctx, w, h, fData, app, accent, textColor, panelColor) {
  const bass = (fData[2] / 255) || 0;
              const tre = (fData[90] / 255) || 0;
              const mid = (fData[40] / 255) || 0;
  // keep stage --crt-bg
              if (!app._ridgeHist) app._ridgeHist = [];
              const cols = 64;
              const slice = [];
              for (let i = 0; i < cols; i++) {
                  const v = (fData[Math.floor(i * fData.length / cols)] || 0) / 255;
                  slice.push(v);
              }
              app._ridgeHist.unshift(slice);
              if (app._ridgeHist.length > 36) app._ridgeHist.pop();
              const rows = app._ridgeHist.length;
              const cx = w * 0.5, cy = h * 0.62;
              for (let r = rows - 1; r >= 0; r--) {
                  const depth = r / Math.max(1, rows - 1);
                  const persp = 0.35 + depth * 0.65;
                  const yBase = cy - (1 - depth) * h * 0.42;
                  ctx.beginPath();
                  for (let c = 0; c < cols; c++) {
                      const nx = (c / (cols - 1) - 0.5) * 2;
                      const amp = app._ridgeHist[r][c];
                      const edge = Math.exp(-nx * nx * 1.2);
                      const hgt = amp * (28 + bass * 50) * edge + tre * Math.sin(c * 0.4 + r * 0.2) * 4;
                      const px = cx + nx * w * 0.48 * persp;
                      const py = yBase - hgt * persp;
                      if (c === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                  }
                  ctx.strokeStyle = accent || '#b8e030';
                  ctx.globalAlpha = 0.25 + depth * 0.7;
                  ctx.lineWidth = depth > 0.85 ? 1.4 : 0.9;
                  ctx.stroke();
              }
              ctx.globalAlpha = 1;
};;

VisRegistry['SPECTRAL-FALL'] = function(ctx, w, h, fData, app, accent, textColor, panelColor) {
  const bass = (fData[2] / 255) || 0;
  // keep stage --crt-bg
              if (!app._fallHist) app._fallHist = [];
              const bins = 96;
              const slice = [];
              for (let i = 0; i < bins; i++) {
                  slice.push((fData[Math.floor(i * fData.length / bins)] || 0) / 255);
              }
              app._fallHist.unshift(slice);
              if (app._fallHist.length > 48) app._fallHist.pop();
              const rowH = h / app._fallHist.length;
              for (let r = 0; r < app._fallHist.length; r++) {
                  ctx.beginPath();
                  const y0 = r * rowH + rowH * 0.5;
                  for (let i = 0; i < bins; i++) {
                      const x = (i / (bins - 1)) * w;
                      const v = app._fallHist[r][i];
                      const y = y0 - v * rowH * (1.8 + bass);
                      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                  }
                  const fade = 1 - r / app._fallHist.length;
                  ctx.strokeStyle = accent || '#b8e030';
                  ctx.globalAlpha = 0.15 + fade * 0.75;
                  ctx.lineWidth = r < 3 ? 1.5 : 0.85;
                  ctx.stroke();
              }
              ctx.globalAlpha = 1;
};;

VisRegistry['LISSAJOUS-SCOPE'] = function(ctx, w, h, fData, app, accent, textColor, panelColor) {
  const bass = (fData[2] / 255) || 0;
              const tre = (fData[90] / 255) || 0;
              const mid = (fData[40] / 255) || 0;
              // soft trail
              ctx.fillStyle = 'rgba(5,10,24,0.18)';
              ctx.fillRect(0, 0, w, h);
              if (!app._lisPts) app._lisPts = [];
              const t = (app._lisT = (app._lisT || 0) + 0.04 + bass * 0.05);
              // sample spectrum into phase offsets
              let sx = 0, sy = 0, n = 0;
              for (let i = 0; i < 32; i++) {
                  const v = (fData[i] || 0) / 255;
                  sx += v * Math.sin(i * 0.4);
                  sy += ((fData[i + 64] || 0) / 255) * Math.cos(i * 0.35);
                  n++;
              }
              sx = (sx / n) || 0; sy = (sy / n) || 0;
              const a = 2 + Math.floor(bass * 3);
              const b = 3 + Math.floor(tre * 4);
              const cx = w / 2, cy = h / 2;
              const rx = w * (0.22 + bass * 0.18);
              const ry = h * (0.22 + mid * 0.18);
              const pts = [];
              for (let i = 0; i <= 360; i += 2) {
                  const th = (i / 180) * Math.PI + t;
                  const x = cx + Math.sin(a * th + sx * 2) * rx * (1 + sx * 0.3);
                  const y = cy + Math.sin(b * th + sy * 2) * ry * (1 + sy * 0.3);
                  pts.push(x, y);
              }
              app._lisPts.push(pts);
              if (app._lisPts.length > 12) app._lisPts.shift();
              for (let p = 0; p < app._lisPts.length; p++) {
                  const arr = app._lisPts[p];
                  ctx.beginPath();
                  for (let i = 0; i < arr.length; i += 2) {
                      if (i === 0) ctx.moveTo(arr[i], arr[i + 1]);
                      else ctx.lineTo(arr[i], arr[i + 1]);
                  }
                  ctx.strokeStyle = accent || '#88ccff';
                  ctx.globalAlpha = 0.12 + (p / app._lisPts.length) * 0.75;
                  ctx.lineWidth = p === app._lisPts.length - 1 ? 2 : 1;
                  ctx.stroke();
              }
              ctx.globalAlpha = 1;
};;

VisRegistry['RADIAL-RIBS'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.15);
  const { s, bins } = VisHelpers.smoothSpec(app, fData, 80, '_ribsS');
  const bass = VisHelpers.bass(fData), tre = VisHelpers.treble(fData);
  const cx = w / 2, cy = h / 2, t = Date.now() * 0.001;
  ctx.globalCompositeOperation = 'lighter';
  for (let layer = 0; layer < 3; layer++) {
    for (let i = 0; i < bins; i++) {
      const a = (i / bins) * Math.PI * 2 + t * 0.08 * (layer + 1);
      const v = s[i];
      const r0 = 20 + layer * 12;
      const r1 = r0 + v * Math.min(w, h) * 0.4 * (1 + bass * 0.25);
      ctx.strokeStyle = VisHelpers.hue(160 + layer * 40 + (i / bins) * 50, 85, 50, 0.12 + v * 0.4);
      ctx.lineWidth = 2.2 - layer * 0.4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.stroke();
    }
    // facet white edge on strongest
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.04 + tre * 0.1) + ')';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < bins; i += 2) {
      const a = (i / bins) * Math.PI * 2 + t * 0.08 * (layer + 1);
      const v = s[i];
      const r0 = 20 + layer * 12;
      const r1 = r0 + v * Math.min(w, h) * 0.4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
};


VisRegistry['HELIX-LADDER'] = function(ctx, w, h, fData, app, accent, textColor, panelColor) {
  const bass = (fData[2] / 255) || 0;
              const mid = (fData[40] / 255) || 0;
              const tre = (fData[90] / 255) || 0;
  // keep stage --crt-bg
              const t = (app._helT = (app._helT || 0) + 0.03 + mid * 0.04);
              const steps = 80;
              const cx = w / 2;
              for (let strand = 0; strand < 2; strand++) {
                  ctx.beginPath();
                  for (let i = 0; i < steps; i++) {
                      const u = i / (steps - 1);
                      const y = u * h;
                      const fi = Math.min(fData.length - 1, Math.floor(u * fData.length));
                      const v = (fData[fi] || 0) / 255;
                      const phase = t + u * Math.PI * 6 + strand * Math.PI;
                      const rad = (40 + bass * 50 + v * 35) * (0.85 + tre * 0.2);
                      const x = cx + Math.cos(phase) * rad;
                      const z = Math.sin(phase);
                      const persp = 1 + z * 0.15;
                      const px = w / 2 + (x - w / 2) * persp;
                      if (i === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y);
                  }
                  ctx.strokeStyle = strand === 0 ? (accent || '#b8e030') : '#e8f080';
                  ctx.globalAlpha = 0.55 + bass * 0.35;
                  ctx.lineWidth = 1.4;
                  ctx.stroke();
              }
              // rungs
              for (let i = 0; i < steps; i += 4) {
                  const u = i / (steps - 1);
                  const y = u * h;
                  const fi = Math.min(fData.length - 1, Math.floor(u * fData.length));
                  const v = (fData[fi] || 0) / 255;
                  const phase = t + u * Math.PI * 6;
                  const rad = (40 + bass * 50 + v * 35);
                  const x1 = cx + Math.cos(phase) * rad;
                  const x2 = cx + Math.cos(phase + Math.PI) * rad;
                  ctx.beginPath();
                  ctx.moveTo(x1, y);
                  ctx.lineTo(x2, y);
                  ctx.strokeStyle = accent || '#b8e030';
                  ctx.globalAlpha = 0.15 + v * 0.5;
                  ctx.lineWidth = 0.8;
                  ctx.stroke();
              }
              ctx.globalAlpha = 1;
};;

VisRegistry['STRING-FIELD'] = function(ctx, w, h, fData, app, accent, textColor, panelColor) {
  const bass = (fData[2] / 255) || 0;
              const tre = (fData[90] / 255) || 0;
  // keep stage --crt-bg
              const strings = 28;
              const t = (app._strT = (app._strT || 0) + 0.05 + bass * 0.08);
              for (let s = 0; s < strings; s++) {
                  const yBase = ((s + 1) / (strings + 1)) * h;
                  const band = Math.floor((s / strings) * fData.length);
                  const v = (fData[band] || 0) / 255;
                  ctx.beginPath();
                  const pts = 80;
                  for (let i = 0; i <= pts; i++) {
                      const x = (i / pts) * w;
                      const wave = Math.sin(i * 0.35 + t + s * 0.4) * v * (18 + bass * 30);
                      const wave2 = Math.sin(i * 0.9 - t * 1.3 + s) * tre * 8;
                      const y = yBase + wave + wave2;
                      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                  }
                  ctx.strokeStyle = accent || '#b8e030';
                  ctx.globalAlpha = 0.3 + v * 0.65;
                  ctx.lineWidth = 0.8 + v * 1.2;
                  ctx.stroke();
              }
              ctx.globalAlpha = 1;
};;

VisRegistry['MOIRE-WAVE'] = function(ctx, w, h, fData, app, accent, textColor, panelColor) {
  const bass = (fData[2] / 255) || 0;
              const mid = (fData[40] / 255) || 0;
              const tre = (fData[90] / 255) || 0;
  // keep stage --crt-bg
              const t = (app._moiT = (app._moiT || 0) + 0.02 + bass * 0.04);
              const sets = [
                  { angle: t * 0.3, freq: 0.04 + mid * 0.02, phase: 0 },
                  { angle: -t * 0.22 + 1.0, freq: 0.05 + tre * 0.03, phase: 1.2 },
                  { angle: t * 0.15 + 2.0, freq: 0.035 + bass * 0.02, phase: 2.5 }
              ];
              for (let s = 0; s < sets.length; s++) {
                  const S = sets[s];
                  const ca = Math.cos(S.angle), sa = Math.sin(S.angle);
                  const lines = 22;
                  for (let i = 0; i < lines; i++) {
                      const u = (i / (lines - 1) - 0.5) * 2;
                      ctx.beginPath();
                      for (let x = 0; x <= w; x += 6) {
                          const nx = (x / w - 0.5) * 2;
                          const fi = Math.min(fData.length - 1, Math.floor((x / w) * fData.length));
                          const v = (fData[fi] || 0) / 255;
                          const local = u + Math.sin(nx * 8 + S.phase + t) * 0.05 * v;
                          const px = x;
                          const py = h / 2 + (local * ca + Math.sin(nx * S.freq * 60 + S.phase + t + v * 2) * sa) * h * 0.4
                                   + Math.sin(x * S.freq + t + s) * (12 + v * 25);
                          if (x === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                      }
                      ctx.strokeStyle = accent || '#b8e030';
                      ctx.globalAlpha = 0.2 + (s === 0 ? 0.35 : 0.15) + bass * 0.15;
                      ctx.lineWidth = 0.9;
                      ctx.stroke();
                  }
              }
              ctx.globalAlpha = 1;
};


// ============================================================
// ADDITIONAL HIGH-QUALITY PRESETS (completed catalog batch)
// ============================================================

// SPECTRUM-HEATMAP — animated frequency heatmap + line analyser overlay;


// 8BIT-SHOWDOWN — chunky pixel bars + scanline;

VisRegistry['THE-EYE'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.drawFacetPolar(ctx, w, h, fData, app, {
    accent, shells: 4, rays: 48, steps: 90, hue0: 0, trail: 0.15, baseR: 0.1, smoothKey: '_eyeS', core: false
  });
  const bass = VisHelpers.bass(fData), mid = VisHelpers.mid(fData);
  const cx = w / 2, cy = h / 2;
  const iris = Math.min(w, h) * (0.1 + bass * 0.04);
  // iris layers
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 4; i >= 0; i--) {
    const r = iris * (0.4 + i * 0.25);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, i === 0 ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.15)');
    g.addColorStop(0.5, accent);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // pupil
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(cx, cy, iris * 0.28 * (1 + mid * 0.2), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(cx - iris * 0.08, cy - iris * 0.1, iris * 0.06, 0, Math.PI * 2);
  ctx.fill();
};


VisRegistry['WINAMP-HYPERSPACE'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.22);
  const stars = VisHelpers.ensureParticles(app, 'winampStars', 280, () => ({
    x: (Math.random() - 0.5) * 2,
    y: (Math.random() - 0.5) * 2,
    z: Math.random(),
    trail: Math.random()
  }));
  const bass = VisHelpers.bass(fData);
  const speed = 0.014 + bass * 0.07;
  const cx = w / 2, cy = h / 2;
  stars.forEach(s => {
    s.z -= speed;
    if (s.z <= 0) {
      s.x = (Math.random() - 0.5) * 2;
      s.y = (Math.random() - 0.5) * 2;
      s.z = 1;
    }
    const k = 280 / s.z;
    const px = cx + s.x * k;
    const py = cy + s.y * k;
    const size = (1 - s.z) * 3.5 + 0.5;
    // trail
    const prevK = 280 / (s.z + speed * 3);
    ctx.beginPath();
    ctx.strokeStyle = accent;
    ctx.globalAlpha = (1 - s.z) * 0.6;
    ctx.lineWidth = size * 0.6;
    ctx.moveTo(cx + s.x * prevK, cy + s.y * prevK);
    ctx.lineTo(px, py);
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = s.z < 0.3 ? '#fff' : accent;
    ctx.globalAlpha = 1 - s.z;
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
};

// TRON — classic light-cycle grid + pulse;

VisRegistry['TRON'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.22);
  const bass = VisHelpers.bass(fData);
  const mid = VisHelpers.mid(fData);
  const horizon = h * 0.38;
  const vx = w / 2;
  // floor grid
  for (let i = 0; i < 18; i++) {
    const y = horizon + Math.pow(i / 18, 1.7) * (h - horizon);
    const wf = (y - horizon) / (h - horizon);
    ctx.beginPath();
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.15 + wf * 0.55;
    ctx.lineWidth = 1 + bass * 2;
    ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  for (let i = -18; i <= 18; i++) {
    ctx.beginPath();
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.25;
    ctx.moveTo(vx + i * 35 * 0.08, horizon);
    ctx.lineTo(vx + i * 55, h);
    ctx.stroke();
  }
  // racing pulse
  const pulseY = horizon + ((Date.now() * 0.06 * (1 + mid)) % (h - horizon));
  ctx.beginPath();
  ctx.strokeStyle = '#fff';
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 3 + bass * 2;
  ctx.shadowBlur = 15;
  ctx.shadowColor = accent;
  ctx.moveTo(0, pulseY); ctx.lineTo(w, pulseY); ctx.stroke();
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
};

// THE-INFINITE-GRID — perspective lattice;

VisRegistry['KOI-POND'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.06);
  const fish = VisHelpers.ensureParticles(app, 'koiFish', 8, () => ({
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * 1.2, vy: (Math.random() - 0.5) * 1.2,
    r: 18 + Math.random() * 25, phase: Math.random() * Math.PI * 2
  }));
  const bass = VisHelpers.bass(fData);
  // water tint
  ctx.fillStyle = accent + '11';
  ctx.fillRect(0, 0, w, h);
  fish.forEach(f => {
    f.x += f.vx * (1 + bass * 0.5);
    f.y += f.vy * (1 + bass * 0.5);
    f.r = (18 + Math.sin(Date.now() * 0.001 + f.phase) * 6) * (1 + bass * 0.2);
    if (f.x < 0 || f.x > w) f.vx *= -1;
    if (f.y < 0 || f.y > h) f.vy *= -1;
    const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
    g.addColorStop(0, '#fff');
    g.addColorStop(0.5, accent);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fill();
  });
  // ripples on beat
  if (!app.koiRipples) app.koiRipples = [];
  if (VisHelpers.beat(fData, 0.72) && Math.random() > 0.5) {
    app.koiRipples.push({ x: Math.random() * w, y: Math.random() * h, r: 5, life: 1 });
  }
  for (let i = app.koiRipples.length - 1; i >= 0; i--) {
    const rp = app.koiRipples[i];
    rp.r += 2.5; rp.life -= 0.015;
    if (rp.life <= 0) { app.koiRipples.splice(i, 1); continue; }
    ctx.beginPath();
    ctx.strokeStyle = accent;
    ctx.globalAlpha = rp.life * 0.6;
    ctx.lineWidth = 1.5;
    ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
};

// PSYCHADELIC-TRAIL — trailing psychedelic paths;

VisRegistry['VOLUMETRIC-LED-FIELD'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.2);
  const bass = VisHelpers.bass(fData);
  const cols = 18, rows = 12;
  const cw = w / cols, ch = h / rows;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = Math.floor(((x + y * cols) / (cols * rows)) * 128);
      const v = (fData[idx] || 0) / 255;
      const bright = v * (0.5 + bass * 0.5);
      if (bright < 0.08) continue;
      const size = Math.min(cw, ch) * 0.7;
      const px = x * cw + (cw - size) / 2;
      const py = y * ch + (ch - size) / 2;
      ctx.fillStyle = accent;
      ctx.globalAlpha = bright;
      ctx.shadowBlur = 10 * bright;
      ctx.shadowColor = accent;
      ctx.fillRect(px, py, size, size);
    }
  }
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
};

// WAVEFORM-ORBIT-TUNNEL — waveform bent into orbiting rings;

VisRegistry['UKG-SKYLINE-PULSE'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.18);
  const bass = VisHelpers.bass(fData);
  const isBeat = VisHelpers.beat(fData, 0.68);
  const buildings = 40;
  const bw = w / buildings;
  for (let i = 0; i < buildings; i++) {
    const v = (fData[Math.floor(i * 3) % fData.length] || 0) / 255;
    let bh = (0.15 + v * 0.75) * h;
    if (isBeat) bh *= 1.15;
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.5 + v * 0.5;
    ctx.fillRect(i * bw + 1, h - bh, bw - 2, bh);
  }
  // bass kick circle
  if (isBeat) {
    ctx.beginPath();
    ctx.strokeStyle = '#fff';
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 3;
    ctx.arc(w / 2, h * 0.7, 30 + bass * 50, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
};

// CHROMATIC-SHOCK-FRONTS — expanding chromatic shockwaves;

VisRegistry['POINT-CLOUD'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.15);
  if (!app.ptCloud) {
    app.ptCloud = Array.from({ length: 200 }, () => ({
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: (Math.random() - 0.5) * 2
    }));
  }
  const bass = VisHelpers.bass(fData);
  const t = Date.now() * 0.001;
  const cx = w / 2, cy = h / 2;
  app.ptCloud.forEach((p, i) => {
    // rotate around Y
    const cos = Math.cos(t * 0.5), sin = Math.sin(t * 0.5);
    let x = p.x * cos - p.z * sin;
    let z = p.x * sin + p.z * cos;
    const scale = 180 / (2.5 + z);
    const v = (fData[i % fData.length] || 0) / 255;
    const px = cx + x * scale;
    const py = cy + p.y * scale * (0.8 + bass * 0.3);
    ctx.beginPath();
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.3 + (1 - Math.abs(z) / 2) * 0.6;
    ctx.arc(px, py, 1.5 + v * 3 + bass * 2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
};

// FLOW — classic flow field lines;

VisRegistry['ENERGY-UNLOCKED'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.15);
  const bass = VisHelpers.bass(fData);
  const isBeat = VisHelpers.beat(fData, 0.7);
  const cx = w / 2, cy = h / 2;
  const rays = 64;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const v = (fData[Math.floor(i * fData.length / rays)] || 0) / 255;
    const len = 40 + v * 180 * (0.7 + bass * 0.6);
    ctx.beginPath();
    ctx.strokeStyle = isBeat && v > 0.5 ? '#fff' : accent;
    ctx.globalAlpha = 0.3 + v * 0.6;
    ctx.lineWidth = 1.5 + v * 2;
    ctx.moveTo(cx + Math.cos(a) * 15, cy + Math.sin(a) * 15);
    ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    ctx.stroke();
  }
  // core
  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 30 + bass * 40);
  g.addColorStop(0, '#fff');
  g.addColorStop(0.5, accent);
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(cx, cy, 30 + bass * 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
};

// A-SMOKE — rising smoke / fog particles;

VisRegistry['BITLESS'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.2);
  const bass = VisHelpers.bass(fData);
  ctx.beginPath();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.5 + bass * 3;
  ctx.shadowBlur = 12;
  ctx.shadowColor = accent;
  for (let i = 0; i < 128; i++) {
    const x = (i / 127) * w;
    const v = (fData[i] || 0) / 255;
    const y = h * 0.5 + (v - 0.5) * h * 0.7;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
};

// DEBUG-HUD — technical debug overlay style;


// UTILITIES — HTML layer handles UI; canvas stays quiet
VisRegistry['UTILITIES'] = function(ctx, w, h) {
  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(0, 0, w, h);
};

VisRegistry['DEBUG-HUD'] = function(ctx, w, h, fData, app, accent, textColor) {
  VisHelpers.clearSoft(ctx, w, h, 0.3);
  const bass = VisHelpers.bass(fData);
  const mid = VisHelpers.mid(fData);
  const tre = VisHelpers.treble(fData);
  // mini spectrum
  const bars = 64;
  const bw = (w * 0.6) / bars;
  for (let i = 0; i < bars; i++) {
    const v = (fData[i * 2] || 0) / 255;
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(w * 0.2 + i * bw, h * 0.7 - v * h * 0.4, bw - 1, v * h * 0.4);
  }
  // labels
  ctx.fillStyle = accent;
  ctx.font = '10px monospace';
  ctx.globalAlpha = 0.9;
  ctx.fillText(`BASS  ${(bass * 100).toFixed(0)}%`, 20, 30);
  ctx.fillText(`MID   ${(mid * 100).toFixed(0)}%`, 20, 45);
  ctx.fillText(`TREB  ${(tre * 100).toFixed(0)}%`, 20, 60);
  ctx.fillText(`TIME  ${new Date().toLocaleTimeString()}`, 20, 80);
  // corner brackets
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6;
  const m = 15;
  ctx.beginPath();
  ctx.moveTo(m, m + 20); ctx.lineTo(m, m); ctx.lineTo(m + 20, m);
  ctx.moveTo(w - m, m + 20); ctx.lineTo(w - m, m); ctx.lineTo(w - m - 20, m);
  ctx.moveTo(m, h - m - 20); ctx.lineTo(m, h - m); ctx.lineTo(m + 20, h - m);
  ctx.moveTo(w - m, h - m - 20); ctx.lineTo(w - m, h - m); ctx.lineTo(w - m - 20, h - m);
  ctx.stroke();
  ctx.globalAlpha = 1;
};;

// ============================================================
// COLOUR ANALYSIS
// ============================================================

// SPECTRUM-HEATMAP — true multi-colour thermal spectro + analyser
VisRegistry['SPECTRUM-HEATMAP'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.08);
  const { s, pk, bins } = VisHelpers.smoothSpec(app, fData, 64, '_heatMapS');
  const bass = VisHelpers.bass(fData);
  const cols = bins, rows = 24;
  const cw = w / cols, ch = h / rows;
  // scroll history buffer
  if (!app._heatHist || app._heatHist[0].length !== cols) {
    app._heatHist = Array.from({ length: rows }, () => new Float32Array(cols));
  }
  // shift up
  for (let y = rows - 1; y > 0; y--) app._heatHist[y] = app._heatHist[y - 1];
  app._heatHist[0] = Float32Array.from(s);
  ctx.globalCompositeOperation = 'lighter';
  for (let y = 0; y < rows; y++) {
    const row = app._heatHist[y];
    const fade = 1 - y / rows;
    for (let x = 0; x < cols; x++) {
      const v = row[x] || 0;
      if (v < 0.04) continue;
      const px = x * cw, py = y * ch;
      ctx.fillStyle = VisHelpers.heatColor(v * 0.85 + (x / cols) * 0.15, (0.25 + v * 0.7) * fade);
      ctx.fillRect(px, py, cw + 0.5, ch + 0.5);
    }
  }
  // faceted peak outline
  ctx.beginPath();
  for (let i = 0; i < cols; i++) {
    const v = Math.max(s[i], pk[i] * 0.85);
    const x = (i + 0.5) * cw;
    const y = (1 - v) * h * 0.35;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1.5 + bass;
  ctx.stroke();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 0.7;
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
};


VisRegistry['SPECTRO-WATERFALL'] = function(ctx, w, h, fData, app) {
  if (!app._wfCanvas) {
    app._wfCanvas = document.createElement('canvas');
    app._wfCanvas.width = 128;
    app._wfCanvas.height = 256;
    app._wfCtx = app._wfCanvas.getContext('2d');
  }
  const wc = app._wfCanvas, wx = app._wfCtx;
  // scroll up 1px
  wx.drawImage(wc, 0, 0, 128, 255, 0, 1, 128, 255);
  // new row at top from spectrum
  for (let i = 0; i < 128; i++) {
    const v = (fData[i] || 0) / 255;
    wx.fillStyle = VisHelpers.heatColor(Math.min(1, v * 1.1), 1);
    wx.fillRect(i, 0, 1, 1);
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(wc, 0, 0, 128, 256, 0, 0, w, h);
  // bright edge line
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 128; i++) {
    const x = (i / 127) * w;
    const v = (fData[i] || 0) / 255;
    const y = 4 + (1 - v) * 30;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
};

// HEAT-SPIRAL — polar heatmap spiral
VisRegistry['HEAT-SPIRAL'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.14);
  const { s, bins } = VisHelpers.smoothSpec(app, fData, 160, '_heatSpS');
  const bass = VisHelpers.bass(fData);
  const cx = w / 2, cy = h / 2, t = Date.now() * 0.0015;
  const arms = 4;
  ctx.globalCompositeOperation = 'lighter';
  for (let arm = 0; arm < arms; arm++) {
    for (let layer = 0; layer < 2; layer++) {
      for (let i = 0; i < bins; i++) {
        const u = i / bins;
        const a = u * Math.PI * 7 + t + arm * (Math.PI * 2 / arms) + layer * 0.05;
        const v = s[i];
        const r = 16 + u * Math.min(w, h) * 0.44 * (0.7 + bass * 0.5) + v * 28 + layer * 4;
        const sz = 1.2 + v * 4 + layer;
        const g = ctx.createRadialGradient(
          cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0,
          cx + Math.cos(a) * r, cy + Math.sin(a) * r, sz * 2
        );
        g.addColorStop(0, VisHelpers.heatColor(u * 0.45 + v * 0.55, 0.55 + v * 0.4));
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, sz * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.globalCompositeOperation = 'source-over';
};


VisRegistry['CIRCULAR-EQ'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.drawFacetPolar(ctx, w, h, fData, app, {
    accent, shells: 3, rays: 120, steps: 96, hue0: 180, trail: 0.18, baseR: 0.13, smoothKey: '_ceqS'
  });
  // extra facet bars for classic EQ read
  const { s, bins } = VisHelpers.smoothSpec(app, fData, 64, '_ceqBars');
  const cx = w / 2, cy = h / 2, inner = Math.min(w, h) * 0.12;
  const bass = VisHelpers.bass(fData);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < bins; i++) {
    const a = (i / bins) * Math.PI * 2 - Math.PI / 2;
    const v = s[i];
    const len = inner + v * Math.min(w, h) * 0.28 * (1 + bass * 0.2);
    const x0 = cx + Math.cos(a) * inner, y0 = cy + Math.sin(a) * inner;
    const x1 = cx + Math.cos(a) * len, y1 = cy + Math.sin(a) * len;
    ctx.strokeStyle = VisHelpers.heatColor(i / bins, 0.25 + v * 0.55);
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
};


VisRegistry['PEAK-HOLD-BARS'] = function(ctx, w, h, fData, app) {
  VisHelpers.clearSoft(ctx, w, h, 0.25);
  const bars = 48;
  if (!app._peaks || app._peaks.length !== bars) app._peaks = new Array(bars).fill(0);
  const bw = w / bars;
  for (let i = 0; i < bars; i++) {
    const v = (fData[Math.floor(i * fData.length / bars)] || 0) / 255;
    const barH = v * h * 0.85;
    if (barH > app._peaks[i]) app._peaks[i] = barH;
    else app._peaks[i] *= 0.96;
    const g = ctx.createLinearGradient(0, h - barH, 0, h);
    g.addColorStop(0, VisHelpers.heatColor(0.9));
    g.addColorStop(0.5, VisHelpers.heatColor(0.5));
    g.addColorStop(1, VisHelpers.heatColor(0.15));
    ctx.fillStyle = g;
    ctx.fillRect(i * bw + 1, h - barH, bw - 2, barH);
    // peak marker
    ctx.fillStyle = '#fff';
    ctx.fillRect(i * bw + 1, h - app._peaks[i] - 3, bw - 2, 3);
  }
};

// ============================================================
// GENRE-TUNED
// ============================================================

// VOCAL-AURORA — soft layered aurora for voice / R&B
VisRegistry['VOCAL-AURORA'] = function(ctx, w, h, fData, app) {
  VisHelpers.clearSoft(ctx, w, h, 0.08);
  const mid = VisHelpers.mid(fData), tre = VisHelpers.treble(fData);
  const t = Date.now() * 0.0004;
  for (let layer = 0; layer < 5; layer++) {
    ctx.beginPath();
    for (let x = 0; x <= w; x += 3) {
      const idx = Math.floor((x / w) * 80) + 20;
      const v = (fData[idx % fData.length] || 0) / 255;
      const y = h * 0.55 +
        Math.sin(x * 0.008 + t + layer * 1.1) * (40 + mid * 70) +
        Math.sin(x * 0.02 + t * 1.4 + layer) * (12 + v * 40) +
        (layer - 2) * 18;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = VisHelpers.hue(160 + layer * 25 + tre * 40, 70, 55, 0.25 + layer * 0.08);
    ctx.lineWidth = 4 + mid * 4;
    ctx.shadowBlur = 20;
    ctx.shadowColor = VisHelpers.hue(180 + layer * 20, 80, 50, 0.5);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
};

// PHONEME-RINGS — concentric formant-style rings for spoken word
VisRegistry['PHONEME-RINGS'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.14);
  const { s, bins } = VisHelpers.smoothSpec(app, fData, 32, '_phonS');
  const bass = VisHelpers.bass(fData), mid = VisHelpers.mid(fData), tre = VisHelpers.treble(fData);
  const cx = w / 2, cy = h / 2, t = Date.now() * 0.001;
  ctx.globalCompositeOperation = 'lighter';
  for (let ring = 0; ring < 8; ring++) {
    const base = 20 + ring * (Math.min(w, h) * 0.045);
    const v = s[Math.floor(ring * bins / 8)] || 0;
    const R = base * (1 + v * 0.45 + bass * 0.12);
    const segs = 24 + ring * 4;
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2 + t * (0.2 + ring * 0.05) * (ring % 2 ? 1 : -1);
      const a1 = a0 + (Math.PI * 2 / segs) * 0.7;
      const sv = s[(i + ring * 3) % bins] || 0;
      ctx.beginPath();
      ctx.arc(cx, cy, R + sv * 12, a0, a1);
      ctx.strokeStyle = VisHelpers.hue(200 + ring * 18 + mid * 40, 80, 55, 0.15 + sv * 0.45);
      ctx.lineWidth = 2.5 + sv * 2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.05 + tre * 0.08) + ')';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
};


VisRegistry['TECHNO-KICK-GRID'] = function(ctx, w, h, fData, app) {
  VisHelpers.clearSoft(ctx, w, h, 0.22);
  const bass = VisHelpers.bass(fData);
  const isBeat = VisHelpers.beat(fData, 0.7);
  const cols = 12, rows = 8;
  const cw = w / cols, ch = h / rows;
  if (isBeat) app._technoFlash = 1;
  if (app._technoFlash == null) app._technoFlash = 0;
  app._technoFlash *= 0.88;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = Math.floor(((x + y * cols) / (cols * rows)) * 128);
      const v = (fData[idx] || 0) / 255;
      const pulse = isBeat ? 1.25 : 1;
      const size = Math.min(cw, ch) * (0.25 + v * 0.65) * pulse;
      ctx.fillStyle = app._technoFlash > 0.3 && v > 0.4
        ? `rgba(255,255,255,${0.5 + app._technoFlash * 0.5})`
        : VisHelpers.hue(300 + v * 40, 90, 50, 0.3 + v * 0.7);
      ctx.fillRect(x * cw + (cw - size) / 2, y * ch + (ch - size) / 2, size, size);
    }
  }
  // hard horizontal kick line
  if (isBeat) {
    ctx.fillStyle = 'rgba(255,40,120,0.45)';
    ctx.fillRect(0, h * 0.5 - 4, w, 8);
  }
};

// TRANCE-TUNNEL — deep coloured perspective tunnel
VisRegistry['TRANCE-TUNNEL'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.13);
  const { s } = VisHelpers.smoothSpec(app, fData, 40, '_tranceS');
  const bass = VisHelpers.bass(fData), mid = VisHelpers.mid(fData), tre = VisHelpers.treble(fData);
  const cx = w / 2, cy = h / 2, t = Date.now() * 0.0014;
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 36; i > 0; i--) {
    const p = i / 36;
    const v = s[Math.floor(p * (s.length - 1))] || 0;
    const r = p * Math.min(w, h) * 0.58 * (0.5 + bass * 0.65) + v * 22;
    const twist = t * (1.3 + mid) + p * 9;
    ctx.beginPath();
    for (let k = 0; k <= 32; k++) {
      const a = (k / 32) * Math.PI * 2 + twist;
      const wob = Math.sin(a * 3 + t) * (6 + bass * 16);
      const x = cx + Math.cos(a) * (r + wob);
      const y = cy + Math.sin(a) * (r + wob) * 0.72;
      if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = VisHelpers.hue(260 + p * 90 + mid * 40, 85, 55, 0.1 + p * 0.5);
    ctx.lineWidth = 2.5 + bass * 1.5;
    ctx.stroke();
    ctx.strokeStyle = VisHelpers.hue(280 + p * 60, 70, 70, 0.12 + tre * 0.1);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
};


VisRegistry['POP-BOUNCE-BARS'] = function(ctx, w, h, fData, app) {
  VisHelpers.clearSoft(ctx, w, h, 0.2);
  const bars = 40, bw = w / bars;
  const midY = h * 0.5;
  const bass = VisHelpers.bass(fData);
  for (let i = 0; i < bars; i++) {
    const v = (fData[Math.floor(i * fData.length / bars)] || 0) / 255;
    const barH = v * h * 0.42 * (0.8 + bass * 0.4);
    const col = VisHelpers.hue(i * (360 / bars), 85, 55, 0.85);
    ctx.fillStyle = col;
    ctx.fillRect(i * bw + 1, midY - barH, bw - 2, barH);
    ctx.globalAlpha = 0.45;
    ctx.fillRect(i * bw + 1, midY, bw - 2, barH);
    ctx.globalAlpha = 1;
  }
  // centre line
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(w, midY); ctx.stroke();
};

// DNB-STREAKS — high-speed horizontal streaks
VisRegistry['DNB-STREAKS'] = function(ctx, w, h, fData, app) {
  VisHelpers.clearSoft(ctx, w, h, 0.18);
  if (!app._dnbStreaks) {
    app._dnbStreaks = Array.from({ length: 40 }, () => ({
      y: Math.random() * h, x: Math.random() * w,
      speed: 8 + Math.random() * 20, len: 40 + Math.random() * 120,
      hue: Math.random() * 360
    }));
  }
  const bass = VisHelpers.bass(fData), tre = VisHelpers.treble(fData);
  const isBeat = VisHelpers.beat(fData, 0.68);
  app._dnbStreaks.forEach(s => {
    s.x += s.speed * (1 + bass * 2 + (isBeat ? 1.5 : 0));
    if (s.x > w + s.len) {
      s.x = -s.len; s.y = Math.random() * h;
      s.speed = 8 + Math.random() * 20 + tre * 15;
      s.hue = Math.random() * 360;
    }
    const g = ctx.createLinearGradient(s.x - s.len, s.y, s.x, s.y);
    g.addColorStop(0, 'transparent');
    g.addColorStop(1, VisHelpers.hue(s.hue, 90, 60, 0.7));
    ctx.strokeStyle = g;
    ctx.lineWidth = 2 + bass * 3;
    ctx.beginPath();
    ctx.moveTo(s.x - s.len, s.y);
    ctx.lineTo(s.x, s.y);
    ctx.stroke();
  });
};

// LOFI-DUST — soft dust + gentle wave
VisRegistry['LOFI-DUST'] = function(ctx, w, h, fData, app) {
  VisHelpers.clearSoft(ctx, w, h, 0.06);
  const mid = VisHelpers.mid(fData), bass = VisHelpers.bass(fData);
  const dust = VisHelpers.ensureParticles(app, 'lofiDust', 80, () => ({
    x: Math.random() * w, y: Math.random() * h,
    r: 1 + Math.random() * 2.5, drift: (Math.random() - 0.5) * 0.3
  }));
  dust.forEach(d => {
    d.x += d.drift; d.y += Math.sin(Date.now() * 0.0005 + d.x) * 0.2;
    if (d.x < 0) d.x = w; if (d.x > w) d.x = 0;
    ctx.fillStyle = VisHelpers.hue(35, 40, 70, 0.25 + mid * 0.3);
    ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
  });
  // soft wave
  ctx.beginPath();
  ctx.strokeStyle = VisHelpers.hue(25, 50, 60, 0.5);
  ctx.lineWidth = 2;
  for (let x = 0; x <= w; x += 4) {
    const v = (fData[Math.floor((x / w) * 64)] || 0) / 255;
    const y = h * 0.65 + Math.sin(x * 0.01 + Date.now() * 0.0008) * (20 + bass * 30) + v * 25;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
};

// SYNTHWAVE-SUN — retrowave sun + grid
VisRegistry['SYNTHWAVE-SUN'] = function(ctx, w, h, fData, app) {
  VisHelpers.clearSoft(ctx, w, h, 0.2);
  const bass = VisHelpers.bass(fData), mid = VisHelpers.mid(fData);
  const cx = w / 2, horizon = h * 0.55;
  // sun
  const sunR = 70 + bass * 40;
  const sg = ctx.createRadialGradient(cx, horizon - sunR * 0.3, 5, cx, horizon - sunR * 0.3, sunR);
  sg.addColorStop(0, '#fff5a0');
  sg.addColorStop(0.4, '#ff6b35');
  sg.addColorStop(1, 'transparent');
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.arc(cx, horizon - sunR * 0.3, sunR, 0, Math.PI * 2);
  ctx.fill();
  // sun scanlines
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 8; i++) {
    const y = horizon - sunR * 0.9 + i * (sunR * 1.4 / 8);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(cx - sunR, y, sunR * 2, 3 + i * 0.5);
  }
  ctx.globalCompositeOperation = 'source-over';
  // perspective grid
  for (let i = 0; i < 16; i++) {
    const y = horizon + Math.pow(i / 16, 1.6) * (h - horizon);
    ctx.strokeStyle = VisHelpers.hue(300, 80, 55, 0.15 + (i / 16) * 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  for (let i = -12; i <= 12; i++) {
    ctx.beginPath();
    ctx.strokeStyle = VisHelpers.hue(280 + mid * 40, 75, 55, 0.3);
    ctx.moveTo(cx + i * 20 * 0.1, horizon);
    ctx.lineTo(cx + i * 70, h);
    ctx.stroke();
  }
};

// METAL-LIGHTNING — aggressive bolts on transients
VisRegistry['METAL-LIGHTNING'] = function(ctx, w, h, fData, app) {
  VisHelpers.clearSoft(ctx, w, h, 0.2);
  const bass = VisHelpers.bass(fData), tre = VisHelpers.treble(fData);
  const isBeat = VisHelpers.beat(fData, 0.72);
  // jagged spectrum floor
  ctx.beginPath();
  ctx.strokeStyle = VisHelpers.hue(0, 90, 50, 0.7);
  ctx.lineWidth = 2;
  for (let i = 0; i < 64; i++) {
    const x = (i / 63) * w;
    const v = (fData[i * 2] || 0) / 255;
    const y = h * 0.7 - v * h * 0.4;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  if (isBeat || tre > 0.75 || Math.random() < 0.04) {
    for (let b = 0; b < 2 + (isBeat ? 2 : 0); b++) {
      let x = Math.random() * w, y = 0;
      ctx.beginPath();
      ctx.strokeStyle = Math.random() > 0.5 ? '#fff' : VisHelpers.hue(50, 100, 60, 1);
      ctx.lineWidth = 1.5 + bass * 3;
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#ff0';
      ctx.moveTo(x, y);
      while (y < h) {
        x += (Math.random() - 0.5) * 70;
        y += 12 + Math.random() * 28;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  ctx.shadowBlur = 0;
};

// RAVE-STROBE — beat colour field + particles
VisRegistry['RAVE-STROBE'] = function(ctx, w, h, fData, app) {
  const bass = VisHelpers.bass(fData);
  const isBeat = VisHelpers.beat(fData, 0.68);
  if (isBeat) {
    app._raveHue = (app._raveHue || 0) + 40 + Math.random() * 80;
    ctx.fillStyle = VisHelpers.hue(app._raveHue, 90, 40, 0.35);
    ctx.fillRect(0, 0, w, h);
  } else {
    VisHelpers.clearSoft(ctx, w, h, 0.25);
  }
  const parts = VisHelpers.ensureParticles(app, 'raveParts', 100, () => ({
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4
  }));
  parts.forEach(p => {
    p.vx += (Math.random() - 0.5) * (0.5 + bass * 2);
    p.vy += (Math.random() - 0.5) * (0.5 + bass * 2);
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.94; p.vy *= 0.94;
    if (p.x < 0 || p.x > w) p.vx *= -1;
    if (p.y < 0 || p.y > h) p.vy *= -1;
    ctx.fillStyle = VisHelpers.hue((app._raveHue || 0) + p.x * 0.2, 90, 60, 0.7);
    ctx.fillRect(p.x, p.y, 3 + bass * 3, 3 + bass * 3);
  });
};

// JAZZ-SMOKE — soft rising curves
VisRegistry['JAZZ-SMOKE'] = function(ctx, w, h, fData, app) {
  VisHelpers.clearSoft(ctx, w, h, 0.07);
  const mid = VisHelpers.mid(fData), bass = VisHelpers.bass(fData);
  const t = Date.now() * 0.0005;
  for (let s = 0; s < 6; s++) {
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const u = i / 60;
      const x = w * 0.2 + s * w * 0.12 + Math.sin(u * 4 + t + s) * 30;
      const v = (fData[Math.floor(u * 40 + s * 10)] || 0) / 255;
      const y = h - u * h * 0.85 - v * 40 - bass * 20;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = VisHelpers.hue(20 + s * 15, 45, 55, 0.3 + mid * 0.3);
    ctx.lineWidth = 2 + mid * 2;
    ctx.stroke();
  }
};

// AMBIENT-CHLADNI — interference node patterns
VisRegistry['AMBIENT-CHLADNI'] = function(ctx, w, h, fData, app) {
  VisHelpers.clearSoft(ctx, w, h, 0.12);
  const bass = VisHelpers.bass(fData), mid = VisHelpers.mid(fData), tre = VisHelpers.treble(fData);
  const t = Date.now() * 0.0003;
  const n = 3 + Math.floor(mid * 4);
  const m = 2 + Math.floor(tre * 5);
  const step = 6;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const nx = x / w, ny = y / h;
      const v = Math.sin(n * Math.PI * nx + t) * Math.sin(m * Math.PI * ny + t * 0.7)
              + Math.sin(m * Math.PI * nx - t) * Math.sin(n * Math.PI * ny);
      const idx = Math.floor(((x + y) / (w + h)) * 128);
      const audio = (fData[idx] || 0) / 255;
      const amp = Math.abs(v) * (0.3 + audio * 0.7);
      if (amp < 0.15) continue;
      ctx.fillStyle = VisHelpers.hue(180 + amp * 80 + bass * 40, 60, 50, amp * 0.8);
      ctx.fillRect(x, y, step - 1, step - 1);
    }
  }
};

// FERROFLUID — metaball-ish bass blobs
VisRegistry['FERROFLUID'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.1);
  const bass = VisHelpers.bass(fData);
  const blobs = VisHelpers.ensureParticles(app, 'ferroBlobs', 10, () => ({
    x: Math.random() * w, y: Math.random() * h,
    r: 40 + Math.random() * 50,
    vx: (Math.random() - 0.5) * 1.2, vy: (Math.random() - 0.5) * 1.2,
    phase: Math.random() * Math.PI * 2
  }));
  blobs.forEach(b => {
    b.x += b.vx * (1 + bass);
    b.y += b.vy * (1 + bass);
    b.r = (40 + Math.sin(Date.now() * 0.001 + b.phase) * 15) * (1 + bass * 0.5);
    if (b.x < b.r || b.x > w - b.r) b.vx *= -1;
    if (b.y < b.r || b.y > h - b.r) b.vy *= -1;
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    g.addColorStop(0, '#fff');
    g.addColorStop(0.35, VisHelpers.hue(250 + bass * 40, 70, 45, 0.9));
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;
};

// OSCILLOSCOPE-XY — phosphor XY scope
VisRegistry['OSCILLOSCOPE-XY'] = function(ctx, w, h, fData, app, accent) {
  VisHelpers.clearSoft(ctx, w, h, 0.2);
  const bass = VisHelpers.bass(fData), mid = VisHelpers.mid(fData);
  const cx = w / 2, cy = h / 2;
  const t = Date.now() * 0.002;
  ctx.beginPath();
  ctx.strokeStyle = VisHelpers.hue(120, 90, 55, 0.9);
  ctx.lineWidth = 1.5;
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#0f0';
  for (let i = 0; i < 256; i++) {
    const u = i / 256;
    const fx = 2 + Math.floor(bass * 3);
    const fy = 3 + Math.floor(mid * 4);
    const x = cx + Math.sin(u * Math.PI * 2 * fx + t) * w * 0.3 * (0.6 + (fData[i % 128] || 0) / 255 * 0.5);
    const y = cy + Math.sin(u * Math.PI * 2 * fy + t * 1.1) * h * 0.28 * (0.6 + (fData[(i + 40) % 128] || 0) / 255 * 0.5);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  // phosphor grid
  ctx.strokeStyle = 'rgba(0,255,80,0.08)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(w * i / 4, 0); ctx.lineTo(w * i / 4, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, h * i / 4); ctx.lineTo(w, h * i / 4); ctx.stroke();
  }
};


// ================================================
// Main render entry
// ================================================


// ============================================================
// ============================================================
// AI-VIDEO — metamorphic spectrum fluid (browser-max canvas)
// Polar isosurfaces + radial rays + reactive core · track-seeded
// ============================================================
VisRegistry['AI-VIDEO'] = function(ctx, w, h, fData, app, accent) {
  const id = String(
    (app.curTrack && (app.curTrack.stationuuid || app.curTrack.name)) ||
    (app.lastPlayed && app.lastPlayed.name) ||
    'idle'
  );

  if (app._aiVidSeedKey !== id) {
    app._aiVidSeedKey = id;
    let hsh = 2166136261;
    for (let i = 0; i < id.length; i++) {
      hsh ^= id.charCodeAt(i);
      hsh = Math.imul(hsh, 16777619);
    }
    app._aiVidSeed = Math.abs(hsh) >>> 0;
    app._aiVidT0 = Date.now();
    app._aiFluid = null;
  }
  const seed = app._aiVidSeed || 1;
  const N = fData && fData.length ? fData.length : 128;

  // smoothed spectrum buffer (metamorphic, not jittery)
  if (!app._aiFluid || app._aiFluid.spec.length !== 128) {
    app._aiFluid = {
      spec: new Float32Array(128),
      peak: new Float32Array(128),
      stars: null
    };
  }
  const F = app._aiFluid;
  const bins = 128;
  for (let i = 0; i < bins; i++) {
    const src = fData[Math.floor(i * N / bins)] || 0;
    const v = src / 255;
    F.spec[i] += (v - F.spec[i]) * 0.28;
    F.peak[i] *= 0.965;
    if (F.spec[i] > F.peak[i]) F.peak[i] = F.spec[i];
  }

  let bass = 0, mid = 0, tre = 0, avg = 0;
  for (let i = 0; i < 12; i++) bass += F.spec[i];
  for (let i = 20; i < 56; i++) mid += F.spec[i];
  for (let i = 70; i < 110; i++) tre += F.spec[i];
  for (let i = 0; i < bins; i++) avg += F.spec[i];
  bass /= 12; mid /= 36; tre /= 40; avg /= bins;
  const beat = bass > 0.62;

  let t;
  try {
    const ct = app.player && app.player.currentTime ? app.player.currentTime() : 0;
    t = (Number.isFinite(ct) && ct > 0) ? ct : ((Date.now() - (app._aiVidT0 || Date.now())) / 1000);
  } catch (e) {
    t = (Date.now() - (app._aiVidT0 || Date.now())) / 1000;
  }

  const cx = w * 0.5;
  const cy = h * 0.5;
  const minDim = Math.min(w, h);
  const baseR = minDim * (0.16 + bass * 0.05);

  // accent + seed palette
  const acc = VisHelpers.hexToRgb(accent || '#ff44aa');
  const h0 = (seed % 360);
  const colCore = `rgb(${acc[0]},${acc[1]},${acc[2]})`;

  // === deep persistence (fluid memory) ===
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(0, 0, w, h);

  // star field (seeded)
  if (!F.stars) {
    F.stars = [];
    for (let i = 0; i < 90; i++) {
      let s = (seed ^ (i * 2654435761)) >>> 0;
      F.stars.push({
        x: (s % 1000) / 1000,
        y: ((s >> 10) % 1000) / 1000,
        z: 0.3 + ((s >> 20) % 70) / 100,
        tw: (s % 100) / 100
      });
    }
  }
  for (let i = 0; i < F.stars.length; i++) {
    const s = F.stars[i];
    const par = 1 + bass * 0.4 * s.z;
    const sx = ((s.x - 0.5) * par + 0.5) * w;
    const sy = ((s.y - 0.5) * par + 0.5) * h;
    const a = 0.15 + s.tw * 0.35 + tre * 0.25;
    ctx.fillStyle = `rgba(200,220,255,${a})`;
    ctx.fillRect(sx, sy, s.z > 0.7 ? 2 : 1, s.z > 0.7 ? 2 : 1);
  }

  // helper: sample smoothed polar radius from spectrum
  const sampleSpec = (angle) => {
    // angle 0..2PI → bin with interpolation
    let u = ((angle / (Math.PI * 2)) % 1 + 1) % 1;
    // mirror low-freq weight toward bottom of spectrum for organic lobes
    const idx = u * (bins - 1);
    const i0 = Math.floor(idx);
    const i1 = (i0 + 1) % bins;
    const f = idx - i0;
    // blend adjacent + harmonic for smoother metamorphosis
    const i2 = (i0 + 8) % bins;
    const s0 = F.spec[i0] * 0.7 + F.peak[i0] * 0.3;
    const s1 = F.spec[i1] * 0.7 + F.peak[i1] * 0.3;
    const s2 = F.spec[i2] * 0.35;
    let v = s0 * (1 - f) + s1 * f + s2 * 0.25;
    // low-order shape modulation (classic “blob” lobes)
    v += 0.12 * Math.sin(angle * 3 + t * 0.8 + seed * 0.01);
    v += 0.08 * Math.sin(angle * 5 - t * 1.1);
    v += 0.05 * Math.cos(angle * 2 + t * 0.4);
    return Math.max(0, Math.min(1.35, v));
  };

  const radiusAt = (angle, shell) => {
    const v = sampleSpec(angle + shell * 0.15);
    const pulse = 1 + bass * 0.55 + (beat ? 0.12 : 0) + Math.sin(t * 2.2 + shell) * 0.03;
    return baseR * (1.15 + shell * 0.55) + v * minDim * (0.22 + shell * 0.06) * pulse;
  };

  // === radial spectrum rays (behind fluid) ===
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalCompositeOperation = 'lighter';
  const rayCount = 96;
  for (let i = 0; i < rayCount; i++) {
    const ang = (i / rayCount) * Math.PI * 2 + t * 0.05;
    const v = sampleSpec(ang);
    if (v < 0.05) continue;
    const r0 = baseR * 0.85;
    const r1 = baseR + v * minDim * 0.48 * (1 + bass * 0.3);
    const hue = h0 + (i / rayCount) * 80 + v * 40;
    ctx.strokeStyle = VisHelpers.hue(hue, 90, 55, 0.08 + v * 0.35);
    ctx.lineWidth = 0.6 + v * 1.8;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0);
    ctx.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
    ctx.stroke();
  }
  ctx.restore();

  // === multi-shell metamorphic fluid (outer → inner) ===
  const shells = 5;
  const steps = 120; // high-res contour
  ctx.globalCompositeOperation = 'lighter';

  for (let shell = shells - 1; shell >= 0; shell--) {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const ang = (i / steps) * Math.PI * 2;
      const r = radiusAt(ang, shell * 0.55);
      pts.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]);
    }

    // fill glow volume
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();

    const hue = h0 + shell * 28 + bass * 20;
    const alpha = 0.04 + (shell / shells) * 0.06 + avg * 0.05;
    const grd = ctx.createRadialGradient(cx, cy, baseR * 0.2, cx, cy, minDim * 0.55);
    grd.addColorStop(0, VisHelpers.hue(hue + 40, 90, 60, alpha * 0.3));
    grd.addColorStop(0.45, VisHelpers.hue(hue, 95, 50, alpha));
    grd.addColorStop(0.75, VisHelpers.hue(hue - 20, 100, 45, alpha * 1.2));
    grd.addColorStop(1, VisHelpers.hue(hue - 40, 90, 30, 0));
    ctx.fillStyle = grd;
    ctx.fill();

    // sharp luminous rim (beaded edge like the reference)
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    const rimHue = h0 + 50 + shell * 15;
    ctx.strokeStyle = VisHelpers.hue(rimHue, 100, 60 + tre * 15, 0.35 + shell * 0.08);
    ctx.lineWidth = 1.2 + (shell === 0 ? 1.5 : 0) + bass * 1.5;
    ctx.stroke();

    // bead dots along outermost shell
    if (shell === 0) {
      const beads = 64;
      for (let i = 0; i < beads; i++) {
        const ang = (i / beads) * Math.PI * 2 + t * 0.15;
        const r = radiusAt(ang, 0);
        const bx = cx + Math.cos(ang) * r;
        const by = cy + Math.sin(ang) * r;
        const bv = sampleSpec(ang);
        ctx.fillStyle = VisHelpers.hue(rimHue + 20, 100, 65, 0.4 + bv * 0.5);
        ctx.beginPath();
        ctx.arc(bx, by, 1.2 + bv * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // secondary high-frequency ripple outline
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const ang = (i / steps) * Math.PI * 2;
    const r = radiusAt(ang, 0.15) * (1.02 + tre * 0.04);
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = VisHelpers.hue(h0 + 90, 80, 70, 0.2 + tre * 0.35);
  ctx.lineWidth = 1;
  ctx.stroke();

  // === filament web (sparse connections between opposite lobes) ===
  ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 12; k++) {
    const a0 = (k / 12) * Math.PI * 2 + t * 0.1;
    const a1 = a0 + Math.PI * (0.7 + (k % 3) * 0.1);
    const r0 = radiusAt(a0, 0.2);
    const r1 = radiusAt(a1, 0.2);
    ctx.strokeStyle = VisHelpers.hue(h0 + k * 12, 70, 55, 0.06 + mid * 0.12);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a0) * r0 * 0.3, cy + Math.sin(a0) * r0 * 0.3);
    ctx.quadraticCurveTo(
      cx + Math.cos((a0 + a1) / 2) * ((r0 + r1) * 0.35),
      cy + Math.sin((a0 + a1) / 2) * ((r0 + r1) * 0.35),
      cx + Math.cos(a1) * r1 * 0.3,
      cy + Math.sin(a1) * r1 * 0.3
    );
    ctx.stroke();
  }

  // === central core (reference-style segmented rings) ===
  ctx.globalCompositeOperation = 'lighter';
  const coreR = baseR * (0.55 + mid * 0.08);
  // dark void
  ctx.globalCompositeOperation = 'source-over';
  const voidG = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 1.15);
  voidG.addColorStop(0, 'rgba(0,0,0,0.92)');
  voidG.addColorStop(0.7, 'rgba(0,0,0,0.75)');
  voidG.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = voidG;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR * 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = 'lighter';
  // outer glow ring
  ctx.strokeStyle = VisHelpers.hue(h0 + 30, 100, 60, 0.4 + bass * 0.4);
  ctx.lineWidth = 3 + bass * 4;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR * 1.05, 0, Math.PI * 2);
  ctx.stroke();

  // segmented white arcs (logo language)
  const drawArc = (radius, start, span, width, alpha) => {
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, start, start + span);
    ctx.stroke();
  };
  const spin = t * (0.6 + mid * 0.8);
  const spin2 = -t * (0.4 + tre * 0.5);
  drawArc(coreR * 0.92, spin, Math.PI * 1.35, 5 + bass * 2, 0.95);
  drawArc(coreR * 0.92, spin + Math.PI * 1.55, Math.PI * 0.35, 5, 0.7);
  drawArc(coreR * 0.72, spin2, Math.PI * 1.1, 4, 0.9);
  drawArc(coreR * 0.72, spin2 + Math.PI * 1.35, Math.PI * 0.45, 4, 0.65);
  drawArc(coreR * 0.52, spin * 1.3, Math.PI * 0.9, 3, 0.85);
  drawArc(coreR * 0.52, spin * 1.3 + Math.PI, Math.PI * 0.5, 3, 0.55);

  // micro nodes inside core (constellation)
  for (let i = 0; i < 6; i++) {
    const ang = spin2 + i * (Math.PI * 2 / 6);
    const rr = coreR * 0.28;
    ctx.fillStyle = `rgba(255,200,220,${0.5 + tre * 0.4})`;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // centre crosshair dots
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // bloom flash on beat
  if (beat) {
    ctx.globalCompositeOperation = 'lighter';
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, minDim * 0.4);
    bg.addColorStop(0, VisHelpers.hue(h0 + 20, 100, 60, 0.2));
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.globalCompositeOperation = 'source-over';
  // subtle letterbox
  const bar = Math.max(6, h * 0.04);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, w, bar);
  ctx.fillRect(0, h - bar, w, bar);
  ctx.fillStyle = VisHelpers.hue(h0 + 40, 70, 60, 0.4);
  ctx.font = '9px "Share Tech Mono", monospace';
  ctx.fillText('AI-VIDEO · SPECTRAL FLUID · ' + (seed % 10000), 10, h - 5);
};

VisRegistry['GAMES'] = function(ctx, w, h, fData, app, accent) {
  // keep stage --crt-bg
  // soft spectrum under menu (when menu visible games layer covers this)
  const bars = 48, bw = w / bars;
  for (let i = 0; i < bars; i++) {
    const v = (fData[Math.floor(i * fData.length / bars)] || 0) / 255;
    ctx.fillStyle = VisHelpers.hue(200 + i * 3, 70, 40, 0.25);
    ctx.fillRect(i * bw, h - v * h * 0.3, bw - 1, v * h * 0.3);
  }
  ctx.fillStyle = accent || '#8af';
  ctx.font = '12px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ARCADE LAYER', w / 2, h / 2 - 8);
  ctx.globalAlpha = 0.5;
  ctx.font = '10px monospace';
  ctx.fillText('SELECT A GAME · GAMEPAD SUPPORTED', w / 2, h / 2 + 12);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
};


window.Visualizers = {
  render: function(ctx, w, h, mode, fData, app, accent, textColor, panelColor) {
    if (!ctx || !w || !h) return;
    if (!fData || !fData.length) {
      fData = new Uint8Array(128);
    }
    const fn = mode && VisRegistry[mode];
    if (fn) {
      try {
        fn(ctx, w, h, fData, app || {}, accent || '#bb8844', textColor || '#fff', panelColor || '#111');
      } catch (err) {
        console.warn('[viz]', mode, err);
        // visible error fallback so the stage is never blank
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, w, 28);
        ctx.fillStyle = '#f66';
        ctx.font = '11px monospace';
        ctx.fillText('VIZ ERR: ' + mode + ' — ' + (err && err.message ? err.message : err), 8, 18);
      }
    } else {
      VisHelpers.clearSoft(ctx, w, h, 0.15);
      const bars = 64, bw = w / bars;
      for (let i = 0; i < bars; i++) {
        const v = (fData[Math.floor(i * 2)] || 0) / 255;
        ctx.fillStyle = VisHelpers.heatColor(i / bars, 0.7);
        ctx.fillRect(i * bw, h - v * h * 0.8, bw - 1, v * h * 0.8);
      }
      if (mode) {
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = '10px monospace';
        ctx.fillText(String(mode), 8, 16);
      }
    }
  }
};
