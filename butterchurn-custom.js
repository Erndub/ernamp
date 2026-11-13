/**
 * butterchurn-custom.js — original erndub MilkDrop-style presets for Butterchurn
 * Merged into the preset list when Butterchurn mode is active.
 *
 * Format: Butterchurn / MilkDrop v1–2 JSON (EEL eqs). No external deps.
 */
(function () {
  'use strict';

  function emptyShapes() {
    return [0, 1, 2, 3].map(() => ({ baseVals: { enabled: 0 }, init_eqs_eel: '', frame_eqs_eel: '' }));
  }
  function emptyWaves() {
    return [0, 1, 2, 3].map(() => ({
      baseVals: { enabled: 0 },
      init_eqs_eel: '',
      frame_eqs_eel: '',
      point_eqs_eel: ''
    }));
  }
  function preset(baseVals, frame, pixel, init) {
    return {
      version: 1,
      baseVals: Object.assign({
        rating: 5,
        decay: 0.98,
        wave_a: 0.8,
        wave_scale: 1.0,
        wave_smoothing: 0.75,
        wave_thick: 1,
        zoom: 1.0,
        rot: 0,
        warp: 0,
        sx: 1,
        sy: 1,
        dx: 0,
        dy: 0,
        cx: 0.5,
        cy: 0.5,
        mv_a: 0,
        wrap: 1
      }, baseVals || {}),
      shapes: emptyShapes(),
      waves: emptyWaves(),
      init_eqs_eel: init || '',
      frame_eqs_eel: frame || '',
      pixel_eqs_eel: pixel || '',
      warp: '',
      comp: ''
    };
  }

  const CUSTOM = {
    // ── erndub originals ───────────────────────────────────────
    'erndub · Amber Pulse': preset(
      { wave_mode: 0, wave_r: 1, wave_g: 0.55, wave_b: 0.15, decay: 0.96, zoom: 0.98, wave_scale: 1.4 },
      [
        'wave_r = 0.7 + 0.3*sin(time*1.1);',
        'wave_g = 0.35 + 0.25*sin(time*0.9);',
        'wave_b = 0.1 + 0.15*bass;',
        'zoom = 0.97 + 0.03*bass_att;',
        'rot = 0.02*sin(time*0.4);',
        'decay = 0.95 + 0.03*mid;'
      ].join('\n'),
      'zoom = zoom + rad*0.08*bass;'
    ),

    'erndub · CRT Storm': preset(
      { wave_mode: 7, wave_thick: 1, decay: 0.92, darken_center: 1, wave_a: 0.6, ob_a: 0.4, ob_size: 0.01 },
      [
        'wave_r = 0.2 + 0.6*treb_att;',
        'wave_g = 0.9;',
        'wave_b = 0.3 + 0.4*mid;',
        'ob_r = wave_r; ob_g = wave_g; ob_b = wave_b;',
        'zoom = 1.02 + 0.04*bass;',
        'cx = 0.5 + 0.05*sin(time);',
        'cy = 0.5 + 0.04*cos(time*1.3);'
      ].join('\n'),
      'zoom = zoom + 0.06*sin(ang*8 + time) * treb;'
    ),

    'erndub · Cassette Spin': preset(
      { wave_mode: 1, wave_scale: 0.8, decay: 0.98, rot: 0.1, warp: 0.2, wave_r: 0.9, wave_g: 0.4, wave_b: 0.8 },
      [
        'rot = 0.04 + 0.08*bass_att;',
        'warp = 0.15 + 0.25*mid;',
        'wave_r = 0.6 + 0.4*sin(time*0.7);',
        'wave_g = 0.3 + 0.3*sin(time*1.1);',
        'wave_b = 0.7 + 0.3*sin(time*0.5);',
        'zoom = 1.0 + 0.02*sin(time*2);'
      ].join('\n'),
      'rot = rot + 0.15/(rad+0.2);'
    ),

    'erndub · Braun Scope': preset(
      { wave_mode: 3, wave_thick: 1, decay: 0.99, wave_a: 0.9, wave_scale: 1.2, wave_r: 0.2, wave_g: 0.85, wave_b: 0.4, wrap: 0 },
      [
        'wave_g = 0.7 + 0.3*bass_att;',
        'wave_r = 0.15 + 0.1*treb;',
        'wave_b = 0.25;',
        'zoom = 1.0;',
        'decay = 0.98;'
      ].join('\n'),
      'sx = 1.0 + 0.05*sin(time + rad*6);'
    ),

    'erndub · Neon Tunnel': preset(
      { wave_mode: 0, decay: 0.94, zoom: 1.05, wave_scale: 0.3, darken_center: 1, wave_a: 0.5 },
      [
        'zoom = 1.03 + 0.05*bass;',
        'rot = 0.01*sin(time);',
        'wave_r = 0.1 + 0.9*treb_att;',
        'wave_g = 0.2 + 0.5*mid;',
        'wave_b = 0.9;',
        'cx = 0.5 + 0.08*sin(time*0.8);',
        'cy = 0.5 + 0.08*cos(time*0.7);'
      ].join('\n'),
      'zoom = zoom + (1-rad)*0.1*bass_att;'
    ),

    'erndub · Milk Foam': preset(
      { wave_mode: 5, decay: 0.97, warp: 0.4, warpscale: 1.5, wave_a: 0.4, wave_scale: 1.5 },
      [
        'warp = 0.3 + 0.4*bass_att;',
        'warpscale = 1.2 + mid;',
        'wave_r = 0.9;',
        'wave_g = 0.85 + 0.1*sin(time);',
        'wave_b = 0.75;',
        'zoom = 0.99 + 0.02*sin(time*0.5);'
      ].join('\n'),
      'warp = warp + sin(rad*10 - time)*0.05;'
    ),

    'erndub · Radar Sweep': preset(
      { wave_mode: 1, decay: 0.9, wave_scale: 2.5, wave_a: 0.7, mv_a: 0.3, mv_x: 12, mv_y: 9, mv_l: 1.5 },
      [
        'rot = 0.06 + 0.1*bass;',
        'wave_r = 0.2;',
        'wave_g = 1.0;',
        'wave_b = 0.3;',
        'mv_r = 0.2; mv_g = 1; mv_b = 0.2;',
        'mv_a = 0.2 + 0.3*treb_att;',
        'decay = 0.88 + 0.05*mid;'
      ].join('\n'),
      'rot = rot + 0.05;'
    ),

    'erndub · Deep Bass Well': preset(
      { wave_mode: 0, decay: 0.98, zoom: 0.96, wave_scale: 0.5, wave_a: 0.9, darken_center: 0 },
      [
        'zoom = 0.95 + 0.06*bass_att;',
        'wave_r = 0.4 + 0.5*bass;',
        'wave_g = 0.1;',
        'wave_b = 0.6 + 0.3*bass_att;',
        'dx = 0.01*sin(time*0.3);',
        'dy = 0.01*cos(time*0.4);'
      ].join('\n'),
      'zoom = zoom - rad*0.12*bass;'
    ),

    'erndub · Treble Spark': preset(
      { wave_mode: 2, decay: 0.85, wave_thick: 1, wave_a: 1, wave_scale: 0.6, mv_a: 0.5, mv_x: 64, mv_y: 48, mv_l: 0.5 },
      [
        'wave_r = 1;',
        'wave_g = 0.7 + 0.3*treb_att;',
        'wave_b = 0.2;',
        'mv_a = treb_att * 0.6;',
        'mv_r = 1; mv_g = 0.8; mv_b = 0.3;',
        'decay = 0.8 + 0.1*bass;',
        'zoom = 1.01;'
      ].join('\n'),
      'zoom = zoom + sin(ang*20)*0.02*treb;'
    ),

    'erndub · Slow Zoom Dream': preset(
      { wave_mode: 0, decay: 0.99, zoom: 1.01, wave_a: 0.35, wave_scale: 1.8, warp: 0.05 },
      [
        'zoom = 1.008 + 0.01*sin(time*0.2);',
        'rot = 0.005*sin(time*0.15);',
        'wave_r = 0.5 + 0.3*sin(time*0.3);',
        'wave_g = 0.4 + 0.3*sin(time*0.37);',
        'wave_b = 0.7 + 0.2*sin(time*0.29);',
        'warp = 0.04 + 0.06*mid;'
      ].join('\n'),
      'zoom = zoom + rad*0.02;'
    ),

    'erndub · Gridlock': preset(
      { wave_mode: 7, decay: 0.93, wave_scale: 0.2, wave_a: 0.5, sx: 1, sy: 1 },
      [
        'sx = 1.0 + 0.05*sin(time*2);',
        'sy = 1.0 + 0.05*cos(time*2);',
        'wave_r = 0.3 + 0.5*mid_att;',
        'wave_g = 0.9;',
        'wave_b = 0.5 + 0.4*treb;',
        'rot = 0.02*bass;',
        'zoom = 0.99;'
      ].join('\n'),
      'sx = sx + 0.03*sin(x*20); sy = sy + 0.03*cos(y*20);'
    ),

    'erndub · Plasma Bloom': preset(
      { wave_mode: 5, decay: 0.96, warp: 0.5, warpscale: 2.2, wave_a: 0.55, wave_scale: 1.1 },
      [
        'warp = 0.4 + 0.5*bass_att;',
        'warpscale = 1.5 + 1.5*mid;',
        'zoom = 0.98 + 0.04*treb_att;',
        'wave_r = 0.8 + 0.2*sin(time*1.3);',
        'wave_g = 0.2 + 0.3*sin(time*0.9);',
        'wave_b = 0.9;'
      ].join('\n'),
      'warp = warp + 0.1*sin(rad*12 - time*2);'
    ),

    'erndub · Horizon Line': preset(
      { wave_mode: 3, decay: 0.97, wave_y: 0.65, wave_scale: 1.5, wave_a: 0.85, wrap: 1 },
      [
        'wave_y = 0.55 + 0.12*sin(time*0.6) + 0.05*bass;',
        'wave_r = 1; wave_g = 0.5; wave_b = 0.1;',
        'zoom = 1.0 + 0.01*sin(time);',
        'dx = 0.005*sin(time*0.4);'
      ].join('\n'),
      'dy = dy + 0.01*sin(x*8 + time);'
    ),

    'erndub · Orbit Rings': preset(
      { wave_mode: 1, decay: 0.95, wave_scale: 1.6, rot: 0.05, wave_a: 0.7, mv_a: 0.25, mv_x: 8, mv_y: 6 },
      [
        'rot = 0.03 + 0.05*mid_att;',
        'zoom = 1.0 + 0.03*bass;',
        'wave_r = 0.4 + 0.4*sin(time);',
        'wave_g = 0.6 + 0.3*cos(time*1.1);',
        'wave_b = 1.0;',
        'mv_a = 0.15 + 0.25*bass_att;'
      ].join('\n'),
      'rot = rot + 0.08*sin(rad*4);'
    ),

    'erndub · Static Wash': preset(
      { wave_mode: 0, decay: 0.88, wave_a: 0.3, wave_scale: 3.0, zoom: 1.0 },
      [
        'decay = 0.85 + 0.1*bass;',
        'wave_r = 0.7 + 0.3*treb_att;',
        'wave_g = 0.7 + 0.3*mid_att;',
        'wave_b = 0.7 + 0.3*bass_att;',
        'zoom = 1.0 + 0.02*(treb-mid);',
        'dx = 0.01*(random_integer(3)-1)*treb;',
        'dy = 0.01*(random_integer(3)-1)*treb;'
      ].join('\n'),
      'zoom = zoom + 0.02*(random_integer(5)-2)*0.01;'
    ),

    'erndub · Warm Valve': preset(
      { wave_mode: 4, decay: 0.98, wave_scale: 1.0, wave_a: 0.75, wave_r: 1, wave_g: 0.45, wave_b: 0.15 },
      [
        'wave_r = 0.9 + 0.1*bass_att;',
        'wave_g = 0.4 + 0.2*mid;',
        'wave_b = 0.1 + 0.1*sin(time);',
        'zoom = 0.99 + 0.02*sin(time*0.5);',
        'rot = 0.01*sin(time*0.3);',
        'decay = 0.97;'
      ].join('\n'),
      'zoom = zoom + 0.04*sin(ang*3 + time)*mid;'
    ),

    'erndub · Ice Lattice': preset(
      { wave_mode: 7, decay: 0.96, wave_scale: 0.4, wave_a: 0.6, wave_r: 0.5, wave_g: 0.8, wave_b: 1 },
      [
        'wave_r = 0.4 + 0.2*sin(time);',
        'wave_g = 0.75;',
        'wave_b = 1.0;',
        'zoom = 1.01 + 0.02*treb_att;',
        'sx = 1.0 + 0.03*sin(time*1.5);',
        'sy = 1.0 + 0.03*cos(time*1.5);'
      ].join('\n'),
      'sx = sx + 0.04*sin(y*30); sy = sy + 0.04*cos(x*30);'
    ),

    'erndub · Kick Zoom': preset(
      { wave_mode: 0, decay: 0.94, wave_scale: 1.2, wave_a: 0.8 },
      [
        'zoom = 0.92 + 0.12*bass_att;',
        'wave_r = 1.0;',
        'wave_g = 0.2 + 0.3*bass;',
        'wave_b = 0.1;',
        'rot = 0.04*(bass_att-0.5);',
        'decay = 0.92 + 0.05*mid;'
      ].join('\n'),
      'zoom = zoom + (0.5-rad)*0.15*bass;'
    ),

    'erndub · Soft Parade': preset(
      { wave_mode: 1, decay: 0.99, wave_scale: 1.3, wave_a: 0.45, warp: 0.12, wave_smoothing: 0.9 },
      [
        'warp = 0.1 + 0.15*mid_att;',
        'zoom = 1.0 + 0.015*sin(time*0.4);',
        'rot = 0.008*sin(time*0.25);',
        'wave_r = 0.6 + 0.3*sin(time*0.5);',
        'wave_g = 0.5 + 0.3*sin(time*0.55+1);',
        'wave_b = 0.7 + 0.3*sin(time*0.45+2);'
      ].join('\n'),
      'warp = warp + 0.03*sin(rad*6 + time);'
    ),

    'erndub · Vector Field': preset(
      { wave_mode: 0, decay: 0.97, wave_scale: 0.9, wave_a: 0.65, dx: 0, dy: 0 },
      [
        'dx = 0.01*sin(time*0.8) * mid;',
        'dy = 0.01*cos(time*0.7) * mid;',
        'zoom = 1.0;',
        'wave_r = 0.3 + 0.5*treb_att;',
        'wave_g = 0.8;',
        'wave_b = 0.4 + 0.4*bass;',
        'rot = 0.02*sin(time);'
      ].join('\n'),
      'dx = dx + 0.02*sin(y*10 + time); dy = dy + 0.02*cos(x*10 - time);'
    )
  };

  window.ERNDUB_BUTTERCHURN_PRESETS = CUSTOM;

  // Optional helper: merge into an existing pack
  window.mergeErndubButterchurnPresets = function (pack) {
    const out = Object.assign({}, pack || {});
    Object.keys(CUSTOM).forEach((k) => { out[k] = CUSTOM[k]; });
    return out;
  };
})();
