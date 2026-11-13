/**
 * viz-libs.js — 10 modes × 30 unique presets
 * Nav sits above seek bar; ◀▶ [ ] ←→ cycle presets
 */
(function () {
  'use strict';

  const EXTRA_MODES = [
    'THREE-VIZ','GLSL-SHADER','HYDRA-LIVE','WAVE-SURFER','PEAKS-VIEW',
    'PIXI-FIELD','ZDOG-GEOM','MEYDA-SCOPE','P5-FLOW','TONE-METERS'
  ];

  if (Array.isArray(window.MODES)) {
    EXTRA_MODES.forEach((m) => {
      if (window.MODES.includes(m)) return;
      const i = window.MODES.indexOf('BUTTERCHURN');
      if (i >= 0) window.MODES.splice(i + 1, 0, m);
      else window.MODES.push(m);
    });
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const id = 'vizlib-' + src.replace(/[^\w]+/g, '_').slice(-48);
      const existing = document.getElementById(id);
      if (existing) {
        if (existing.dataset.ok === '1') return resolve();
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('load failed')));
        return;
      }
      const s = document.createElement('script');
      s.id = id; s.src = src; s.async = true;
      s.onload = () => { s.dataset.ok = '1'; resolve(); };
      s.onerror = () => reject(new Error('Failed ' + src));
      document.head.appendChild(s);
    });
  }

  const Host = {
    layer: null, mount: null, hud: null, nav: null, label: null,
    active: null, effectIdx: 0, effectNames: [], onPrev: null, onNext: null, _keyHandler: null,

    ensure() {
      if (this.layer) return this.layer;
      const stage = document.getElementById('stage');
      if (!stage) return null;
      if (!document.getElementById('viz-libs-styles')) {
        const st = document.createElement('style');
        st.id = 'viz-libs-styles';
        st.textContent = `
          .vizlib-layer{display:none;position:absolute;inset:0;z-index:5;background:#000;pointer-events:none}
          .stage.vizlib-active .vizlib-layer{display:block}
          .stage.vizlib-active #vis-canvas{opacity:0}
          .stage.butterchurn-active .vizlib-layer{display:none!important}
          .vizlib-mount{position:absolute;inset:0}
          .vizlib-mount canvas{position:absolute;inset:0;width:100%!important;height:100%!important;display:block}
          /* sit above seek-wrapper (slides up from bottom on hover) */
          .vizlib-nav{
            position:absolute;left:0;right:0;bottom:52px;
            display:flex;align-items:center;justify-content:center;gap:12px;
            padding:8px 12px;
            background:linear-gradient(transparent,rgba(0,0,0,.75));
            pointer-events:auto;z-index:20;
            transform:translateY(0);opacity:1;
            transition:transform .4s ease,opacity .4s ease,bottom .25s ease;
          }
          .stage:hover .vizlib-nav, .stage.fs-chrome-visible .vizlib-nav{bottom:64px}
          .stage.is-fullscreen .vizlib-nav{bottom:24px}
          .stage.is-fullscreen.fs-chrome-visible .vizlib-nav{bottom:72px}
          .vizlib-nav.hidden{transform:translateY(120%);opacity:0;pointer-events:none}
          .vizlib-nav .vl-btn{
            font:16px/1 monospace;color:var(--skin-accent,#9cf);background:rgba(0,0,0,.55);
            border:1px solid var(--skin-border,#456);border-radius:6px;padding:8px 14px;cursor:pointer;
          }
          .vizlib-nav .vl-btn:hover{color:#fff;border-color:var(--skin-accent,#9cf)}
          .vizlib-nav .vl-label{
            font:11px monospace;color:#cde;max-width:55%;
            overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;
          }
          .vizlib-status{
            position:absolute;top:8px;left:10px;right:10px;
            font:11px monospace;color:#8cf;text-shadow:0 1px 2px #000;
            pointer-events:none;z-index:3;
          }
          /* Butterchurn HUD — same clearance above seek bar */
          .bc-hud{bottom:52px!important;z-index:20!important}
          .stage:hover .bc-hud, .stage.fs-chrome-visible .bc-hud{bottom:64px!important}
          .stage.is-fullscreen .bc-hud{bottom:24px!important}
          .stage.is-fullscreen.fs-chrome-visible .bc-hud{bottom:72px!important}
        `;
        document.head.appendChild(st);
      }
      const layer = document.createElement('div');
      layer.className = 'vizlib-layer';
      layer.id = 'vizlib-layer';
      layer.innerHTML = '<div class="vizlib-mount" id="vizlib-mount"></div><div class="vizlib-status" id="vizlib-status"></div><div class="vizlib-nav" id="vizlib-nav"><button type="button" class="vl-btn" id="vl-prev" title="Previous preset">◀</button><span class="vl-label" id="vl-label">—</span><button type="button" class="vl-btn" id="vl-next" title="Next preset">▶</button></div>';
      stage.appendChild(layer);
      this.layer = layer;
      this.mount = layer.querySelector('#vizlib-mount');
      this.hud = layer.querySelector('#vizlib-status');
      this.nav = layer.querySelector('#vizlib-nav');
      this.label = layer.querySelector('#vl-label');
      layer.querySelector('#vl-prev').onclick = (e) => { e.preventDefault(); e.stopPropagation(); this.onPrev && this.onPrev(); this.bumpNav(); };
      layer.querySelector('#vl-next').onclick = (e) => { e.preventDefault(); e.stopPropagation(); this.onNext && this.onNext(); this.bumpNav(); };
      return layer;
    },
    size() {
      const el = document.getElementById('stage');
      const r = el ? el.getBoundingClientRect() : { width: 640, height: 360 };
      return { w: Math.max(64, Math.floor(r.width) || 640), h: Math.max(64, Math.floor(r.height) || 360) };
    },
    makeCanvas() {
      this.ensure(); this.mount.innerHTML = '';
      const c = document.createElement('canvas');
      const s = this.size(); c.width = s.w; c.height = s.h;
      this.mount.appendChild(c); return c;
    },
    setStatus(t) { if (this.hud) this.hud.textContent = t || ''; },
    setEffects(names, idx, onPrev, onNext) {
      this.ensure();
      this.effectNames = names || [];
      this.effectIdx = idx || 0;
      this.onPrev = onPrev; this.onNext = onNext;
      if (this.nav) this.nav.style.display = this.effectNames.length > 1 ? 'flex' : 'none';
      this.updateLabel(); this.bumpNav();
    },
    updateLabel() {
      if (!this.label) return;
      const n = this.effectNames.length;
      this.label.textContent = n ? '(' + (this.effectIdx + 1) + '/' + n + ') ' + (this.effectNames[this.effectIdx] || '') : (this.active || '');
    },
    bumpNav() {
      if (!this.nav || this.effectNames.length < 2) return;
      this.nav.classList.remove('hidden');
      clearTimeout(this._navT);
      this._navT = setTimeout(() => { if (this.nav) this.nav.classList.add('hidden'); }, 3000);
    },
    activate(name) {
      this.ensure();
      const stage = document.getElementById('stage');
      if (stage) stage.classList.add('vizlib-active');
      if (this.layer) this.layer.style.display = 'block';
      this.active = name; this.bindKeys();
    },
    deactivate() {
      const stage = document.getElementById('stage');
      if (stage) stage.classList.remove('vizlib-active');
      if (this.layer) this.layer.style.display = 'none';
      if (this.mount) this.mount.innerHTML = '';
      this.active = null; this.onPrev = this.onNext = null; this.effectNames = [];
      this.unbindKeys(); this.setStatus('');
    },
    bindKeys() {
      if (this._keyHandler) return;
      this._keyHandler = (e) => {
        if (!this.active || e.ctrlKey || e.metaKey || e.altKey) return;
        const tag = (e.target && e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) return;
        const mode = String((window.MODES || [])[(window.app && window.app.mIdx) || 0] || '');
        if (mode === 'BUTTERCHURN' || mode === 'MILKDROP3') return;
        if (EXTRA_MODES.indexOf(mode) < 0) return;
        if (this.effectNames.length < 2) return;
        const prev = e.key === '[' || e.code === 'BracketLeft' || e.key === 'ArrowLeft';
        const next = e.key === ']' || e.code === 'BracketRight' || e.key === 'ArrowRight';
        if (!prev && !next) return;
        e.preventDefault(); e.stopPropagation();
        if (prev && this.onPrev) this.onPrev();
        if (next && this.onNext) this.onNext();
        this.bumpNav();
      };
      window.addEventListener('keydown', this._keyHandler, true);
    },
    unbindKeys() {
      if (!this._keyHandler) return;
      window.removeEventListener('keydown', this._keyHandler, true);
      this._keyHandler = null;
    }
  };
  window.VizLibHost = Host;
  const bass = (f) => (f[2] || 0) / 255;
  const mid = (f) => (f[40] || 0) / 255;
  const GLSL_SHADERS = [{"name": "Plasma Drift", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(gl_FragCoord.xy/u_res)*2.-1.;uv.x*=u_res.x/u_res.y;float t=u_time*0.70;float v=sin(uv.x*2.+t*3.0)+cos(uv.y*4.-t)+sin((uv.x+uv.y)*2.+t*u_bass*3.);v*=.33;gl_FragColor=vec4(vec3(0.10+u_bass,0.20+v*u_mid,0.40)*(.55+.45*v),1.);}"}, {"name": "Tunnel Bore", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(gl_FragCoord.xy/u_res)*2.-1.;uv.x*=u_res.x/u_res.y;float t=u_time*0.85;float v=sin(uv.x*3.+t*4.0)+cos(uv.y*5.-t)+sin((uv.x+uv.y)*3.+t*u_bass*3.);v*=.33;gl_FragColor=vec4(vec3(0.18+u_bass,0.27+v*u_mid,0.50)*(.55+.45*v),1.);}"}, {"name": "Ocean Floor", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(gl_FragCoord.xy/u_res)*2.-1.;uv.x*=u_res.x/u_res.y;float t=u_time*1.00;float v=sin(uv.x*4.+t*5.0)+cos(uv.y*6.-t)+sin((uv.x+uv.y)*4.+t*u_bass*3.);v*=.33;gl_FragColor=vec4(vec3(0.26+u_bass,0.34+v*u_mid,0.60)*(.55+.45*v),1.);}"}, {"name": "Kaleido Bloom", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(gl_FragCoord.xy/u_res)*2.-1.;uv.x*=u_res.x/u_res.y;float t=u_time*1.15;float v=sin(uv.x*5.+t*6.0)+cos(uv.y*7.-t)+sin((uv.x+uv.y)*2.+t*u_bass*3.);v*=.33;gl_FragColor=vec4(vec3(0.34+u_bass,0.41+v*u_mid,0.70)*(.55+.45*v),1.);}"}, {"name": "Hex Pulse", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(gl_FragCoord.xy/u_res)*2.-1.;uv.x*=u_res.x/u_res.y;float t=u_time*1.30;float v=sin(uv.x*6.+t*7.0)+cos(uv.y*8.-t)+sin((uv.x+uv.y)*3.+t*u_bass*3.);v*=.33;gl_FragColor=vec4(vec3(0.42+u_bass,0.48+v*u_mid,0.80)*(.55+.45*v),1.);}"}, {"name": "Nebula Fog", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(gl_FragCoord.xy/u_res)*2.-1.;uv.x*=u_res.x/u_res.y;float r=length(uv);float ang=atan(uv.y,uv.x);float v=sin(11.0*r-u_time*3.0-u_bass*6.0)*cos(3.0*ang+u_time*u_mid);gl_FragColor=vec4(vec3(0.50,0.55+u_mid*.4,0.90)*(.25+.75*abs(v))*exp(-r*1.40),1.);}"}, {"name": "Fire Rings", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(gl_FragCoord.xy/u_res)*2.-1.;uv.x*=u_res.x/u_res.y;float r=length(uv);float ang=atan(uv.y,uv.x);float v=sin(12.0*r-u_time*4.0-u_bass*4.0)*cos(4.0*ang+u_time*u_mid);gl_FragColor=vec4(vec3(0.58,0.62+u_mid*.4,0.40)*(.25+.75*abs(v))*exp(-r*1.48),1.);}"}, {"name": "Ice Lattice", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(gl_FragCoord.xy/u_res)*2.-1.;uv.x*=u_res.x/u_res.y;float r=length(uv);float ang=atan(uv.y,uv.x);float v=sin(13.0*r-u_time*5.0-u_bass*5.0)*cos(5.0*ang+u_time*u_mid);gl_FragColor=vec4(vec3(0.66,0.69+u_mid*.4,0.50)*(.25+.75*abs(v))*exp(-r*1.56),1.);}"}, {"name": "Voronoi Cells", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(gl_FragCoord.xy/u_res)*2.-1.;uv.x*=u_res.x/u_res.y;float r=length(uv);float ang=atan(uv.y,uv.x);float v=sin(14.0*r-u_time*2.0-u_bass*6.0)*cos(6.0*ang+u_time*u_mid);gl_FragColor=vec4(vec3(0.74,0.20+u_mid*.4,0.60)*(.25+.75*abs(v))*exp(-r*1.64),1.);}"}, {"name": "Spiral Galaxy", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(gl_FragCoord.xy/u_res)*2.-1.;uv.x*=u_res.x/u_res.y;float r=length(uv);float ang=atan(uv.y,uv.x);float v=sin(15.0*r-u_time*3.0-u_bass*4.0)*cos(7.0*ang+u_time*u_mid);gl_FragColor=vec4(vec3(0.82,0.27+u_mid*.4,0.70)*(.25+.75*abs(v))*exp(-r*1.72),1.);}"}, {"name": "Checker Warp", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=gl_FragCoord.xy/u_res;vec2 p=uv*vec2(8,3);float n=sin(p.x+u_time)+sin(p.y*1.3-u_time*.7)+sin((p.x+p.y)*2.0+u_bass*5.);float cell=fract(n*0.80);gl_FragColor=vec4(vec3(0.10+cell*u_mid,0.34,0.80+u_bass*cell),1.);}"}, {"name": "Ripple Well", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=gl_FragCoord.xy/u_res;vec2 p=uv*vec2(9,4);float n=sin(p.x+u_time)+sin(p.y*1.3-u_time*.7)+sin((p.x+p.y)*3.0+u_bass*5.);float cell=fract(n*0.83);gl_FragColor=vec4(vec3(0.18+cell*u_mid,0.41,0.90+u_bass*cell),1.);}"}, {"name": "Laser Cage", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=gl_FragCoord.xy/u_res;vec2 p=uv*vec2(4,5);float n=sin(p.x+u_time)+sin(p.y*1.3-u_time*.7)+sin((p.x+p.y)*1.0+u_bass*5.);float cell=fract(n*0.86);gl_FragColor=vec4(vec3(0.26+cell*u_mid,0.48,0.40+u_bass*cell),1.);}"}, {"name": "Smoke Curl", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=gl_FragCoord.xy/u_res;vec2 p=uv*vec2(5,6);float n=sin(p.x+u_time)+sin(p.y*1.3-u_time*.7)+sin((p.x+p.y)*2.0+u_bass*5.);float cell=fract(n*0.89);gl_FragColor=vec4(vec3(0.34+cell*u_mid,0.55,0.50+u_bass*cell),1.);}"}, {"name": "Star Warp", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=gl_FragCoord.xy/u_res;vec2 p=uv*vec2(6,7);float n=sin(p.x+u_time)+sin(p.y*1.3-u_time*.7)+sin((p.x+p.y)*3.0+u_bass*5.);float cell=fract(n*0.92);gl_FragColor=vec4(vec3(0.42+cell*u_mid,0.62,0.60+u_bass*cell),1.);}"}, {"name": "Chrome Halo", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(gl_FragCoord.xy/u_res)-.5;uv.x*=u_res.x/u_res.y;float a=atan(uv.y,uv.x);float r=length(uv);float petals=4.0;float v=cos(a*petals+u_time*1.0)*cos(r*11.0-u_time*2.-u_bass*4.);gl_FragColor=vec4(vec3(0.50+abs(v)*u_mid,0.69+u_bass,0.70)*smoothstep(1.2,0.,r),1.);}"}, {"name": "Pixel Storm", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(gl_FragCoord.xy/u_res)-.5;uv.x*=u_res.x/u_res.y;float a=atan(uv.y,uv.x);float r=length(uv);float petals=5.0;float v=cos(a*petals+u_time*2.0)*cos(r*12.0-u_time*2.-u_bass*4.);gl_FragColor=vec4(vec3(0.58+abs(v)*u_mid,0.20+u_bass,0.80)*smoothstep(1.2,0.,r),1.);}"}, {"name": "Magnetic Field", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(gl_FragCoord.xy/u_res)-.5;uv.x*=u_res.x/u_res.y;float a=atan(uv.y,uv.x);float r=length(uv);float petals=6.0;float v=cos(a*petals+u_time*3.0)*cos(r*13.0-u_time*2.-u_bass*4.);gl_FragColor=vec4(vec3(0.66+abs(v)*u_mid,0.27+u_bass,0.90)*smoothstep(1.2,0.,r),1.);}"}, {"name": "Aurora Curtain", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(gl_FragCoord.xy/u_res)-.5;uv.x*=u_res.x/u_res.y;float a=atan(uv.y,uv.x);float r=length(uv);float petals=7.0;float v=cos(a*petals+u_time*1.0)*cos(r*8.0-u_time*2.-u_bass*4.);gl_FragColor=vec4(vec3(0.74+abs(v)*u_mid,0.34+u_bass,0.40)*smoothstep(1.2,0.,r),1.);}"}, {"name": "Fractal Zoom", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(gl_FragCoord.xy/u_res)-.5;uv.x*=u_res.x/u_res.y;float a=atan(uv.y,uv.x);float r=length(uv);float petals=8.0;float v=cos(a*petals+u_time*2.0)*cos(r*9.0-u_time*2.-u_bass*4.);gl_FragColor=vec4(vec3(0.82+abs(v)*u_mid,0.41+u_bass,0.50)*smoothstep(1.2,0.,r),1.);}"}, {"name": "Wave Tunnel", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=gl_FragCoord.xy/u_res;float g=abs(fract(uv.x*12.0)-.5);float h=abs(fract(uv.y*12.0+u_time*.2)-.5);float line=smoothstep(.08,.02,min(g,h));float pulse=.4+.6*sin(u_time*2.0+uv.x*7.0+u_bass*6.);gl_FragColor=vec4(vec3(line*pulse*(0.10+u_mid),line*(0.48+u_bass),line*0.60),1.);}"}, {"name": "Disco Floor", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=gl_FragCoord.xy/u_res;float g=abs(fract(uv.x*13.0)-.5);float h=abs(fract(uv.y*6.0+u_time*.2)-.5);float line=smoothstep(.08,.02,min(g,h));float pulse=.4+.6*sin(u_time*3.0+uv.x*5.0+u_bass*6.);gl_FragColor=vec4(vec3(line*pulse*(0.18+u_mid),line*(0.55+u_bass),line*0.70),1.);}"}, {"name": "Circuit Trace", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=gl_FragCoord.xy/u_res;float g=abs(fract(uv.x*14.0)-.5);float h=abs(fract(uv.y*7.0+u_time*.2)-.5);float line=smoothstep(.08,.02,min(g,h));float pulse=.4+.6*sin(u_time*4.0+uv.x*6.0+u_bass*6.);gl_FragColor=vec4(vec3(line*pulse*(0.26+u_mid),line*(0.62+u_bass),line*0.80),1.);}"}, {"name": "Bloom Core", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=gl_FragCoord.xy/u_res;float g=abs(fract(uv.x*15.0)-.5);float h=abs(fract(uv.y*8.0+u_time*.2)-.5);float line=smoothstep(.08,.02,min(g,h));float pulse=.4+.6*sin(u_time*5.0+uv.x*7.0+u_bass*6.);gl_FragColor=vec4(vec3(line*pulse*(0.34+u_mid),line*(0.69+u_bass),line*0.90),1.);}"}, {"name": "Triangle Sea", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=gl_FragCoord.xy/u_res;float g=abs(fract(uv.x*8.0)-.5);float h=abs(fract(uv.y*9.0+u_time*.2)-.5);float line=smoothstep(.08,.02,min(g,h));float pulse=.4+.6*sin(u_time*2.0+uv.x*5.0+u_bass*6.);gl_FragColor=vec4(vec3(line*pulse*(0.42+u_mid),line*(0.20+u_bass),line*0.40),1.);}"}, {"name": "Moire Field", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(gl_FragCoord.xy/u_res)*2.-1.;uv.x*=u_res.x/u_res.y;float t=u_time;float z=1./(length(uv)+.15);vec2 p=uv*z+vec2(sin(t*0.80),cos(t*0.70));float s=sin(p.x*10.0+t)+sin(p.y*9.0-t)+u_bass;gl_FragColor=vec4(vec3(0.50+s*.2,0.27+u_mid*.3,0.50)*z*.5,1.);}"}, {"name": "Sand Drift", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(gl_FragCoord.xy/u_res)*2.-1.;uv.x*=u_res.x/u_res.y;float t=u_time;float z=1./(length(uv)+.15);vec2 p=uv*z+vec2(sin(t*0.82),cos(t*0.72));float s=sin(p.x*11.0+t)+sin(p.y*10.0-t)+u_bass;gl_FragColor=vec4(vec3(0.58+s*.2,0.34+u_mid*.3,0.60)*z*.5,1.);}"}, {"name": "Hyperspace", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(gl_FragCoord.xy/u_res)*2.-1.;uv.x*=u_res.x/u_res.y;float t=u_time;float z=1./(length(uv)+.15);vec2 p=uv*z+vec2(sin(t*0.84),cos(t*0.74));float s=sin(p.x*12.0+t)+sin(p.y*11.0-t)+u_bass;gl_FragColor=vec4(vec3(0.66+s*.2,0.41+u_mid*.3,0.70)*z*.5,1.);}"}, {"name": "Liquid Metal", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(gl_FragCoord.xy/u_res)*2.-1.;uv.x*=u_res.x/u_res.y;float t=u_time;float z=1./(length(uv)+.15);vec2 p=uv*z+vec2(sin(t*0.86),cos(t*0.76));float s=sin(p.x*13.0+t)+sin(p.y*8.0-t)+u_bass;gl_FragColor=vec4(vec3(0.74+s*.2,0.48+u_mid*.3,0.80)*z*.5,1.);}"}, {"name": "Prism Rain", "src": "precision mediump float;uniform vec2 u_res;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(gl_FragCoord.xy/u_res)*2.-1.;uv.x*=u_res.x/u_res.y;float t=u_time;float z=1./(length(uv)+.15);vec2 p=uv*z+vec2(sin(t*0.88),cos(t*0.78));float s=sin(p.x*14.0+t)+sin(p.y*9.0-t)+u_bass;gl_FragColor=vec4(vec3(0.82+s*.2,0.55+u_mid*.3,0.90)*z*.5,1.);}"}];
  const HYDRA_PRESETS = [{"name": "Feedback Bloom", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=v+0.0020*sin(v.yx*10.+u_time*2.)*(1.+u_bass);vec4 p=texture2D(u_tex,uv);float d=length(v-.5);float pulse=.5+.5*sin(d*18.-u_time*3.-u_bass*6.);vec3 paint=vec3(.1+u_mid,.35+u_bass*.2,.75)*pulse;gl_FragColor=vec4(mix(paint,p.rgb,0.820),1.);}"}, {"name": "Radial Echo", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(v-.5)*(1.-u_bass*0.042)+.5;vec4 p=texture2D(u_tex,uv);float a=atan(v.y-.5,v.x-.5)+u_time*0.55;float r=length(v-.5);vec3 paint=vec3(.15+u_mid,.2,.55+u_bass)*(.5+.5*sin(r*13.-a*3.));gl_FragColor=vec4(mix(paint,p.rgb,0.835),1.);}"}, {"name": "Scan Drift", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=v;uv.y=fract(uv.y+0.0014+u_bass*.01);vec4 p=texture2D(u_tex,uv);float scan=.5+.5*sin(v.y*46.+u_time*6.);vec3 paint=vec3(u_mid*.4,.45+u_bass*.3,.25)*scan;gl_FragColor=vec4(mix(paint,p.rgb,0.850),1.);}"}, {"name": "Phosphor Trail", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=v+vec2(sin(u_time+v.y*6.)*0.0016,cos(u_time+v.x*5.)*0.0014)*u_bass;vec4 p=texture2D(u_tex,uv);vec3 paint=vec3(u_bass,u_mid,.55)*sin(v.x*11.+u_time);gl_FragColor=vec4(mix(abs(paint),p.rgb,0.865),1.);}"}, {"name": "Ink Bleed", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 d=v-.5;vec2 uv=.5+d*(1.+0.019*sin(u_time*1.70));vec4 p=texture2D(u_tex,uv);float ring=sin(length(d)*24.-u_time*3.);vec3 paint=vec3(.25+u_mid,.45,.85)*abs(ring);gl_FragColor=vec4(mix(paint,p.rgb,0.880),1.);}"}, {"name": "Zoom Recurse", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){float k=0.200;vec2 uv=v;uv=mix(uv,vec2(uv.y,1.-uv.x),k*u_mid);vec4 p=texture2D(u_tex,uv);vec3 paint=vec3(.12+u_bass*.4,.3+u_mid,.6)*(.5+.5*sin(u_time*3.+v.x*6.));gl_FragColor=vec4(mix(paint,p.rgb,0.895),1.);}"}, {"name": "Twist Mirror", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=v+0.0038*sin(v.yx*16.+u_time*2.)*(1.+u_bass);vec4 p=texture2D(u_tex,uv);float d=length(v-.5);float pulse=.5+.5*sin(d*24.-u_time*3.-u_bass*6.);vec3 paint=vec3(.1+u_mid,.35+u_bass*.2,.75)*pulse;gl_FragColor=vec4(mix(paint,p.rgb,0.910),1.);}"}, {"name": "Soft Persist", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(v-.5)*(1.-u_bass*0.054)+.5;vec4 p=texture2D(u_tex,uv);float a=atan(v.y-.5,v.x-.5)+u_time*0.85;float r=length(v-.5);vec3 paint=vec3(.15+u_mid,.2,.55+u_bass)*(.5+.5*sin(r*19.-a*5.));gl_FragColor=vec4(mix(paint,p.rgb,0.925),1.);}"}, {"name": "CRT Ghost", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=v;uv.y=fract(uv.y+0.0026+u_bass*.01);vec4 p=texture2D(u_tex,uv);float scan=.5+.5*sin(v.y*64.+u_time*6.);vec3 paint=vec3(u_mid*.4,.45+u_bass*.3,.25)*scan;gl_FragColor=vec4(mix(paint,p.rgb,0.820),1.);}"}, {"name": "Color Burn", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=v+vec2(sin(u_time+v.y*7.)*0.0028,cos(u_time+v.x*3.)*0.0023)*u_bass;vec4 p=texture2D(u_tex,uv);vec3 paint=vec3(u_bass,u_mid,.55)*sin(v.x*11.+u_time);gl_FragColor=vec4(mix(abs(paint),p.rgb,0.835),1.);}"}, {"name": "Edge Strobe", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 d=v-.5;vec2 uv=.5+d*(1.+0.025*sin(u_time*2.00));vec4 p=texture2D(u_tex,uv);float ring=sin(length(d)*20.-u_time*3.);vec3 paint=vec3(.25+u_mid,.45,.85)*abs(ring);gl_FragColor=vec4(mix(paint,p.rgb,0.850),1.);}"}, {"name": "Halo Stack", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){float k=0.260;vec2 uv=v;uv=mix(uv,vec2(uv.y,1.-uv.x),k*u_mid);vec4 p=texture2D(u_tex,uv);vec3 paint=vec3(.12+u_bass*.4,.3+u_mid,.6)*(.5+.5*sin(u_time*5.+v.x*7.));gl_FragColor=vec4(mix(paint,p.rgb,0.865),1.);}"}, {"name": "Shear Flow", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=v+0.0056*sin(v.yx*22.+u_time*2.)*(1.+u_bass);vec4 p=texture2D(u_tex,uv);float d=length(v-.5);float pulse=.5+.5*sin(d*18.-u_time*3.-u_bass*6.);vec3 paint=vec3(.1+u_mid,.35+u_bass*.2,.75)*pulse;gl_FragColor=vec4(mix(paint,p.rgb,0.880),1.);}"}, {"name": "Pulse Fade", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(v-.5)*(1.-u_bass*0.066)+.5;vec4 p=texture2D(u_tex,uv);float a=atan(v.y-.5,v.x-.5)+u_time*1.15;float r=length(v-.5);vec3 paint=vec3(.15+u_mid,.2,.55+u_bass)*(.5+.5*sin(r*17.-a*3.));gl_FragColor=vec4(mix(paint,p.rgb,0.895),1.);}"}, {"name": "Chroma Shift", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=v;uv.y=fract(uv.y+0.0038+u_bass*.01);vec4 p=texture2D(u_tex,uv);float scan=.5+.5*sin(v.y*82.+u_time*6.);vec3 paint=vec3(u_mid*.4,.45+u_bass*.3,.25)*scan;gl_FragColor=vec4(mix(paint,p.rgb,0.910),1.);}"}, {"name": "Vignette Loop", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=v+vec2(sin(u_time+v.y*3.)*0.0040,cos(u_time+v.x*5.)*0.0032)*u_bass;vec4 p=texture2D(u_tex,uv);vec3 paint=vec3(u_bass,u_mid,.55)*sin(v.x*11.+u_time);gl_FragColor=vec4(mix(abs(paint),p.rgb,0.925),1.);}"}, {"name": "Spark Orbit", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 d=v-.5;vec2 uv=.5+d*(1.+0.031*sin(u_time*2.30));vec4 p=texture2D(u_tex,uv);float ring=sin(length(d)*26.-u_time*3.);vec3 paint=vec3(.25+u_mid,.45,.85)*abs(ring);gl_FragColor=vec4(mix(paint,p.rgb,0.820),1.);}"}, {"name": "Glass Smear", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){float k=0.320;vec2 uv=v;uv=mix(uv,vec2(uv.y,1.-uv.x),k*u_mid);vec4 p=texture2D(u_tex,uv);vec3 paint=vec3(.12+u_bass*.4,.3+u_mid,.6)*(.5+.5*sin(u_time*3.+v.x*8.));gl_FragColor=vec4(mix(paint,p.rgb,0.835),1.);}"}, {"name": "Tunnel Memory", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=v+0.0074*sin(v.yx*28.+u_time*2.)*(1.+u_bass);vec4 p=texture2D(u_tex,uv);float d=length(v-.5);float pulse=.5+.5*sin(d*24.-u_time*3.-u_bass*6.);vec3 paint=vec3(.1+u_mid,.35+u_bass*.2,.75)*pulse;gl_FragColor=vec4(mix(paint,p.rgb,0.850),1.);}"}, {"name": "Wave Ghost", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(v-.5)*(1.-u_bass*0.078)+.5;vec4 p=texture2D(u_tex,uv);float a=atan(v.y-.5,v.x-.5)+u_time*1.45;float r=length(v-.5);vec3 paint=vec3(.15+u_mid,.2,.55+u_bass)*(.5+.5*sin(r*15.-a*5.));gl_FragColor=vec4(mix(paint,p.rgb,0.865),1.);}"}, {"name": "Grid Echo", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=v;uv.y=fract(uv.y+0.0050+u_bass*.01);vec4 p=texture2D(u_tex,uv);float scan=.5+.5*sin(v.y*100.+u_time*6.);vec3 paint=vec3(u_mid*.4,.45+u_bass*.3,.25)*scan;gl_FragColor=vec4(mix(paint,p.rgb,0.880),1.);}"}, {"name": "Particle Smear", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=v+vec2(sin(u_time+v.y*4.)*0.0052,cos(u_time+v.x*3.)*0.0041)*u_bass;vec4 p=texture2D(u_tex,uv);vec3 paint=vec3(u_bass,u_mid,.55)*sin(v.x*11.+u_time);gl_FragColor=vec4(mix(abs(paint),p.rgb,0.895),1.);}"}, {"name": "Neon Persist", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 d=v-.5;vec2 uv=.5+d*(1.+0.037*sin(u_time*2.60));vec4 p=texture2D(u_tex,uv);float ring=sin(length(d)*22.-u_time*3.);vec3 paint=vec3(.25+u_mid,.45,.85)*abs(ring);gl_FragColor=vec4(mix(paint,p.rgb,0.910),1.);}"}, {"name": "Fog Layer", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){float k=0.380;vec2 uv=v;uv=mix(uv,vec2(uv.y,1.-uv.x),k*u_mid);vec4 p=texture2D(u_tex,uv);vec3 paint=vec3(.12+u_bass*.4,.3+u_mid,.6)*(.5+.5*sin(u_time*5.+v.x*9.));gl_FragColor=vec4(mix(paint,p.rgb,0.925),1.);}"}, {"name": "Kaleido FB", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=v+0.0092*sin(v.yx*34.+u_time*2.)*(1.+u_bass);vec4 p=texture2D(u_tex,uv);float d=length(v-.5);float pulse=.5+.5*sin(d*18.-u_time*3.-u_bass*6.);vec3 paint=vec3(.1+u_mid,.35+u_bass*.2,.75)*pulse;gl_FragColor=vec4(mix(paint,p.rgb,0.820),1.);}"}, {"name": "Slice Drift", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=(v-.5)*(1.-u_bass*0.090)+.5;vec4 p=texture2D(u_tex,uv);float a=atan(v.y-.5,v.x-.5)+u_time*1.75;float r=length(v-.5);vec3 paint=vec3(.15+u_mid,.2,.55+u_bass)*(.5+.5*sin(r*13.-a*3.));gl_FragColor=vec4(mix(paint,p.rgb,0.835),1.);}"}, {"name": "Ripple Memory", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=v;uv.y=fract(uv.y+0.0062+u_bass*.01);vec4 p=texture2D(u_tex,uv);float scan=.5+.5*sin(v.y*118.+u_time*6.);vec3 paint=vec3(u_mid*.4,.45+u_bass*.3,.25)*scan;gl_FragColor=vec4(mix(paint,p.rgb,0.850),1.);}"}, {"name": "Static Bloom", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 uv=v+vec2(sin(u_time+v.y*5.)*0.0064,cos(u_time+v.x*5.)*0.0050)*u_bass;vec4 p=texture2D(u_tex,uv);vec3 paint=vec3(u_bass,u_mid,.55)*sin(v.x*11.+u_time);gl_FragColor=vec4(mix(abs(paint),p.rgb,0.865),1.);}"}, {"name": "Long Exposure", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){vec2 d=v-.5;vec2 uv=.5+d*(1.+0.043*sin(u_time*2.90));vec4 p=texture2D(u_tex,uv);float ring=sin(length(d)*28.-u_time*3.);vec3 paint=vec3(.25+u_mid,.45,.85)*abs(ring);gl_FragColor=vec4(mix(paint,p.rgb,0.880),1.);}"}, {"name": "Dream Trail", "frag": "precision mediump float;varying vec2 v;uniform sampler2D u_tex;uniform float u_time,u_bass,u_mid;void main(){float k=0.440;vec2 uv=v;uv=mix(uv,vec2(uv.y,1.-uv.x),k*u_mid);vec4 p=texture2D(u_tex,uv);vec3 paint=vec3(.12+u_bass*.4,.3+u_mid,.6)*(.5+.5*sin(u_time*3.+v.x*10.));gl_FragColor=vec4(mix(paint,p.rgb,0.895),1.);}"}];
  const THREE_PRESETS = ["Icosahedron", "Particle Ring", "Cube Lattice", "Torus Knot", "DNA Helix", "Crystal Octa", "Orbital Moons", "Pyramid", "Dodeca Wire", "Spiral Points", "Ribbon Twist", "Atom Shells", "Wave Grid", "Meteor Field", "Prism Tower", "Soft Blob", "Ring Stack", "Spike Ball", "Twin Spin", "Lissajous", "Voxel Rain", "Triangle Fan", "Capsule Cloud", "Nested Frames", "Sine Ribbon", "Plasma Core", "Wire Sphere", "Cube Tunnel", "Star Tetra", "Reactive Bars"];
  const WAVE_PRESETS = ["Classic Line", "Mirror Scope", "Frequency Bars", "Filled Area", "Dotted Path", "Double Trace", "Neon Glow", "Square Steps", "Outline Only", "Stem Plot", "Ribbon Band", "Min-Max Envelope", "Lissajous XY", "Polar Scope", "Stereo Split", "Echo Fade", "Thick Plasma", "Stepped Wave", "Inverted Fill", "Harmonic Ghost", "Zigzag Clip", "Bezier Smooth", "Peak Hold", "Grid Overlay", "Rainbow Path", "Brush Stroke", "Particle Trace", "Tunnel Ring", "Matrix Dots", "Crystal Poly"];
  const PEAKS_PRESETS = ["Symmetric Bars", "Bottom Stack", "Heat Gradient", "Needle Thin", "Block Chunks", "Lift Gradient", "Mirror Heat", "Soft Bloom", "Binary On-Off", "Hold Steps", "Rainbow Strip", "Cyan Punch", "Ember Fire", "Glacier Ice", "Violet Dusk", "Dual Layer", "Center Gap", "Scroll Heat", "Pixel Columns", "Hill Smooth", "Dot Peaks", "Outline Trace", "Compress Dyn", "Bass Expand", "Treble Edge", "Neon Columns", "Pastel Wash", "Mono Ink", "Accent Flash", "Cinema Wide"];
  const PIXI_PRESETS = ["Brownian Drift", "Circular Orbit", "Center Burst", "Constellation", "Falling Snow", "Rising Embers", "Firefly Drift", "Drain Swirl", "Fountain Jet", "Magnet Poles", "Grid Snap", "Chaos Walk", "Helix Trail", "Box Bounce", "Wind Shear", "Pulse Rings", "Galaxy Arm", "Sparkler Pop", "Rain Curtain", "Bubble Rise", "Shockwave Ring", "Lattice Crawl", "Vortex Spin", "Binary Stars", "Comet Tails", "Static Noise", "Neon Mites", "Dust Devil", "Ring Pulse", "Bee Swarm"];
  const ZDOG_PRESETS = ["Cube", "Pyramid", "Star Burst", "Octahedron", "Torus Cage", "Icosa Wire", "House Form", "Cross Beam", "Diamond", "Tri Prism", "Arrow Head", "Gear Teeth", "Zig Zag Box", "Nested Cubes", "Cylinder", "Capsule", "Tri Stack", "Spire", "Ring Gate", "Crystal Cluster", "Grid Box", "Ladder", "Wave Bars", "Satellite", "Anchor", "Lightning Bolt", "Shield", "Crown", "Crescent", "Compass Rose"];
  const MEYDA_PRESETS = ["Level Meters", "Radial Rings", "MFCC Columns", "Centroid Sweep", "ZCR Sparks", "RMS Pulse", "Feature Radar", "Triple Meter", "Wave+RMS", "Heat Matrix", "Spectrum Spine", "Loudness Ring", "Band Flower", "Feature Scatter", "Timeline Strip", "Oscillator Bars", "Phase Wheel", "Envelope", "Crest Factor", "Spectral Flatness", "Peak Tracker", "Harmonic Stack", "Noise Floor", "Dynamic Range", "Stereo Proxy", "Cue Strip", "Analyzer HUD", "Minimal Dials", "Gradient Meters", "Spectrum City"];
  const P5_PRESETS = ["Perlin Flow", "Ribbon Stream", "Spark Field", "Smoke Curl", "Curl Noise", "Boid Flock", "Code Rain", "Orbit Ink", "Brush Field", "Stitch Lines", "Constellation", "Soft Agents", "Wind Lines", "Cell Crawl", "Ink Drops", "Spiral Agents", "Grid Walkers", "Lightning", "Pollen Drift", "Tide Lines", "Murmuration", "Crystal Grow", "Sandpile", "Diffusion", "Ghost Traces", "Neon Ants", "Ribbon Storm", "Field Lines", "Bloom Agents", "Quiet Snow"];
  const TONE_PRESETS = ["Vertical VU", "Arc Meter", "Horizontal", "Dot Matrix", "Needle VU", "Segment LED", "Liquid Tube", "Mirror VU", "Circular Six", "Step Bars", "Gradient Tower", "Tick Marks", "Dual Channel", "Peak-Hold LED", "Rainbow VU", "Square Cells", "Tri Needles", "Wave Strip", "Studio Bridge", "Cinema Bars", "Hex Cells", "Pulse Rings", "Bargraph 12", "Soft Columns", "Hard Clip", "Retro LCD", "Analog Needles", "Spectrum Slice", "Gain Reduction", "Phase Bars"];

  // ── GLSL ──
  const GLSLShader = {
    gl: null, prog: null, uniforms: {}, idx: 0, t0: 0, buf: null,
    compile(src) {
      const gl = this.gl;
      const vs = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vs, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'); gl.compileShader(vs);
      const fs = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fs, src); gl.compileShader(fs);
      const p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p); return p;
    },
    use(i) {
      this.idx = ((i % 30) + 30) % 30;
      const gl = this.gl;
      this.prog = this.compile(GLSL_SHADERS[this.idx].src);
      gl.useProgram(this.prog);
      const loc = gl.getAttribLocation(this.prog, 'a');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      this.uniforms = {
        res: gl.getUniformLocation(this.prog, 'u_res'),
        time: gl.getUniformLocation(this.prog, 'u_time'),
        bass: gl.getUniformLocation(this.prog, 'u_bass'),
        mid: gl.getUniformLocation(this.prog, 'u_mid')
      };
      Host.effectIdx = this.idx; Host.updateLabel();
    },
    start() {
      const c = Host.makeCanvas();
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) throw new Error('WebGL unavailable');
      this.gl = gl; this.buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
      this.t0 = performance.now(); this.use(0);
      Host.setEffects(GLSL_SHADERS.map(s => s.name), 0, () => this.use(this.idx - 1), () => this.use(this.idx + 1));
      Host.setStatus('GLSL-SHADER');
    },
    frame(fData) {
      const gl = this.gl; if (!gl || !this.prog) return;
      const s = Host.size();
      if (gl.canvas.width !== s.w || gl.canvas.height !== s.h) { gl.canvas.width = s.w; gl.canvas.height = s.h; }
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.useProgram(this.prog);
      gl.uniform2f(this.uniforms.res, gl.canvas.width, gl.canvas.height);
      gl.uniform1f(this.uniforms.time, (performance.now() - this.t0) * 0.001);
      gl.uniform1f(this.uniforms.bass, bass(fData));
      gl.uniform1f(this.uniforms.mid, mid(fData));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    stop() { this.gl = this.prog = null; }
  };

  // ── HYDRA ──
  const HydraLive = {
    gl: null, prog: null, tex: null, buf: null, idx: 0, t0: 0,
    build() {
      const c = Host.makeCanvas();
      const gl = c.getContext('webgl', { preserveDrawingBuffer: true });
      if (!gl) throw new Error('WebGL unavailable');
      this.gl = gl;
      const vs = 'attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
      const compile = (type, src) => { const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh); return sh; };
      const p = gl.createProgram();
      gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, HYDRA_PRESETS[this.idx].frag));
      gl.linkProgram(p); this.prog = p;
      this.buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
      this.tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      ['TEXTURE_MIN_FILTER','TEXTURE_MAG_FILTER'].forEach(p => gl.texParameteri(gl.TEXTURE_2D, gl[p], gl.LINEAR));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const s = Host.size();
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, s.w, s.h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      this.t0 = performance.now();
    },
    start() {
      this.idx = 0; this.build();
      Host.setEffects(HYDRA_PRESETS.map(p => p.name), 0, () => this.cycle(-1), () => this.cycle(1));
      Host.setStatus('HYDRA-LIVE');
    },
    cycle(d) { this.idx = (this.idx + d + 30) % 30; this.build(); Host.effectIdx = this.idx; Host.updateLabel(); },
    frame(fData) {
      const gl = this.gl; if (!gl) return;
      const s = Host.size();
      if (gl.canvas.width !== s.w || gl.canvas.height !== s.h) {
        gl.canvas.width = s.w; gl.canvas.height = s.h;
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, s.w, s.h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.useProgram(this.prog);
      const a = gl.getAttribLocation(this.prog, 'a');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
      gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(gl.getUniformLocation(this.prog, 'u_time'), (performance.now() - this.t0) * 0.001);
      gl.uniform1f(gl.getUniformLocation(this.prog, 'u_bass'), bass(fData));
      gl.uniform1f(gl.getUniformLocation(this.prog, 'u_mid'), mid(fData));
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.uniform1i(gl.getUniformLocation(this.prog, 'u_tex'), 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, gl.canvas.width, gl.canvas.height, 0);
    },
    stop() { this.gl = null; }
  };

  const ThreeViz = {
    ready: false, renderer: null, scene: null, camera: null, objs: [], idx: 0, t0: 0, group: null,
    async init() {
      if (this.ready) return;
      Host.setStatus('Loading Three.js…');
      await loadScript('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js');
      if (!window.THREE) throw new Error('THREE missing');
      this.ready = true;
    },
    build() {
      const THREE = window.THREE;
      const c = Host.makeCanvas();
      const s = Host.size();
      if (this.renderer) try { this.renderer.dispose(); } catch (e) {}
      this.renderer = new THREE.WebGLRenderer({ canvas: c, antialias: true });
      this.renderer.setSize(s.w, s.h, false);
      this.renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(55, s.w / s.h, 0.1, 100);
      this.camera.position.z = 5;
      this.objs = [];
      this.scene.add(new THREE.AmbientLight(0x445566, 0.8));
      const pl = new THREE.PointLight(0xffffff, 1.25); pl.position.set(3, 4, 5); this.scene.add(pl);
      const i = this.idx;
      const col = new THREE.Color('hsl(' + ((i * 37) % 360) + ',72%,58%)');
      const mat = new THREE.MeshStandardMaterial({ color: col, flatShading: i % 2 === 0, metalness: 0.3 + (i % 5) * 0.1, roughness: 0.35, emissive: col.clone().multiplyScalar(0.12) });
      const wire = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.28 });
      const g = new THREE.Group();
      const add = (m) => { g.add(m); this.objs.push(m); };
      // 30 distinct constructions
      const builders = [
        () => add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.35, 2), mat)),
        () => { for (let k=0;k<40;k++){const m=new THREE.Mesh(new THREE.SphereGeometry(0.07,8,8),mat.clone());const a=k/40*Math.PI*2;m.position.set(Math.cos(a)*2,Math.sin(a*2)*.35,Math.sin(a)*2);add(m);} },
        () => { for (let k=0;k<27;k++){const m=new THREE.Mesh(new THREE.BoxGeometry(.28,.28,.28),mat.clone());m.position.set((k%3)-1,((k/3|0)%3)-1,((k/9|0)%3)-1).multiplyScalar(.9);add(m);} },
        () => add(new THREE.Mesh(new THREE.TorusKnotGeometry(.95,.26,128,16), mat)),
        () => { for (let k=0;k<28;k++){const m=new THREE.Mesh(new THREE.SphereGeometry(.09,8,8),mat.clone());m.position.set(Math.sin(k*0.7)*1.3,(k-14)*0.1,Math.cos(k*0.7)*1.3);add(m);} },
        () => add(new THREE.Mesh(new THREE.OctahedronGeometry(1.4, 0), mat)),
        () => { add(new THREE.Mesh(new THREE.SphereGeometry(.45,16,16),mat)); for(let k=0;k<4;k++){const m=new THREE.Mesh(new THREE.SphereGeometry(.12,8,8),mat.clone());m.userData.orbit=k;add(m);} },
        () => add(new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.9, 5), mat)),
        () => add(new THREE.Mesh(new THREE.DodecahedronGeometry(1.25, 0), wire)),
        () => { for(let k=0;k<50;k++){const m=new THREE.Mesh(new THREE.SphereGeometry(.05,6,6),mat.clone());const a=k/50*Math.PI*6;m.position.set(Math.cos(a)*a*.08,Math.sin(a*.5)*0.8,Math.sin(a)*a*.08);add(m);} },
        () => { const curve=[]; for(let k=0;k<40;k++){const t=k/39;curve.push(new THREE.Vector3(Math.sin(t*Math.PI*2)*1.2,(t-.5)*2,Math.cos(t*Math.PI*3)*1.2));} add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curve),64,0.08,8,false),mat)); },
        () => { for(let shell=1;shell<=3;shell++) add(new THREE.Mesh(new THREE.SphereGeometry(0.4*shell,16,16), new THREE.MeshBasicMaterial({color:col,wireframe:true,transparent:true,opacity:0.35/shell}))); },
        () => { for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++){const m=new THREE.Mesh(new THREE.BoxGeometry(.25,.25,.25),mat.clone());m.position.set(x*.55,0,z*.55);m.userData.wave=x+z;add(m);} },
        () => { for(let k=0;k<35;k++){const m=new THREE.Mesh(new THREE.SphereGeometry(.06,6,6),mat.clone());m.position.set((Math.random()-.5)*5,(Math.random()-.5)*5,(Math.random()-.5)*5);m.userData.fall=1;add(m);} },
        () => { for(let k=0;k<5;k++){const m=new THREE.Mesh(new THREE.CylinderGeometry(.05,.2,1.6,6),mat.clone());m.position.y=k*.15;m.rotation.z=k*.3;add(m);} },
        () => add(new THREE.Mesh(new THREE.SphereGeometry(1.2,32,32), new THREE.MeshStandardMaterial({color:col,roughness:0.1,metalness:0.9,emissive:col.clone().multiplyScalar(0.2)}))),
        () => { for(let k=0;k<6;k++){const m=new THREE.Mesh(new THREE.TorusGeometry(0.5+k*.18,0.04,8,32),mat.clone());m.rotation.x=Math.PI/2;add(m);} },
        () => { for(let k=0;k<24;k++){const m=new THREE.Mesh(new THREE.ConeGeometry(.08,.5,4),mat.clone());const a=k/24*Math.PI*2;m.position.set(Math.cos(a)*1.1,0,Math.sin(a)*1.1);m.lookAt(0,0,0);add(m);} },
        () => { add(new THREE.Mesh(new THREE.TorusKnotGeometry(.7,.2,64,12),mat)); add(new THREE.Mesh(new THREE.TorusKnotGeometry(.7,.2,64,12),wire)); },
        () => { for(let k=0;k<3;k++){const m=new THREE.Mesh(new THREE.TorusGeometry(1,.05,8,48),mat.clone());m.rotation.x=k*1.1;m.rotation.y=k*.7;add(m);} },
        () => { for(let k=0;k<60;k++){const m=new THREE.Mesh(new THREE.BoxGeometry(.1,.1,.1),mat.clone());m.position.set((k%5)-2,((k/5|0)%4)-1.5,((k/20|0)%3)-1).multiplyScalar(.55);add(m);} },
        () => { for(let k=0;k<16;k++){const m=new THREE.Mesh(new THREE.ConeGeometry(.3,1,3),mat.clone());const a=k/16*Math.PI*2;m.position.set(Math.cos(a)*1.4,0,Math.sin(a)*1.4);add(m);} },
        () => { for(let k=0;k<20;k++){const m=new THREE.Mesh(new THREE.CapsuleGeometry(.08,.3,4,8),mat.clone());m.position.set((Math.random()-.5)*3,(Math.random()-.5)*3,(Math.random()-.5)*3);add(m);} },
        () => { for(let k=3;k>=1;k--) add(new THREE.Mesh(new THREE.BoxGeometry(k*.6,k*.6,k*.6), wire)); },
        () => { const pts=[];for(let k=0;k<80;k++){const t=k/79*Math.PI*4;pts.push(new THREE.Vector3(Math.sin(t)*1.2,Math.cos(t*.5)*1.2,Math.cos(t)*1.2));} add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),100,0.05,6,false),mat)); },
        () => { add(new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),mat)); add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.05,1),wire)); },
        () => add(new THREE.Mesh(new THREE.SphereGeometry(1.3,12,12), wire)),
        () => { for(let z=-3;z<=3;z++){const m=new THREE.Mesh(new THREE.BoxGeometry(2.4,.08,.08),mat.clone());m.position.z=z*.35;add(m);} },
        () => add(new THREE.Mesh(new THREE.TetrahedronGeometry(1.5,0), mat)),
        () => { for(let k=0;k<16;k++){const m=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,1.2),mat.clone());m.position.x=(k-7.5)*.18;m.userData.bar=k;add(m);} }
      ];
      builders[i % builders.length]();
      this.scene.add(g); this.group = g;
    },
    start() {
      this.idx = 0; this.build(); this.t0 = performance.now();
      Host.setEffects(THREE_PRESETS, 0, () => this.cycle(-1), () => this.cycle(1));
      Host.setStatus('THREE-VIZ');
    },
    cycle(d) { this.idx = (this.idx + d + 30) % 30; this.build(); Host.effectIdx = this.idx; Host.updateLabel(); },
    frame(fData) {
      if (!this.renderer) return;
      const b = bass(fData), m = mid(fData), t = (performance.now() - this.t0) * 0.001;
      const s = Host.size();
      if (this.renderer.domElement.width !== s.w || this.renderer.domElement.height !== s.h) {
        this.renderer.setSize(s.w, s.h, false); this.camera.aspect = s.w / s.h; this.camera.updateProjectionMatrix();
      }
      if (this.group) {
        this.group.rotation.y = t * (0.35 + b * 0.5) + this.idx * 0.05;
        this.group.rotation.x = Math.sin(t * 0.6) * 0.35 + m * 0.25;
        this.group.scale.setScalar(1 + b * 0.4);
      }
      this.objs.forEach((o, i) => {
        if (o.userData.orbit != null) {
          const a = t * (1.2 + o.userData.orbit * 0.4) + o.userData.orbit;
          o.position.set(Math.cos(a) * (1.4 + o.userData.orbit * 0.35), Math.sin(a * 0.8) * 0.45, Math.sin(a) * (1.4 + o.userData.orbit * 0.35));
        }
        if (o.userData.wave != null) o.position.y = Math.sin(t * 3 + o.userData.wave) * (0.3 + b);
        if (o.userData.fall) { o.position.y -= (0.02 + b * 0.05); if (o.position.y < -2.5) o.position.y = 2.5; }
        if (o.userData.bar != null) o.scale.y = 0.3 + ((fData[o.userData.bar * 4] || 0) / 255) * 3;
        else if (this.objs.length > 8 && !o.userData.orbit) {
          const v = (fData[i % fData.length] || 0) / 255;
          o.scale.setScalar(0.55 + v * 1.6);
        }
      });
      this.renderer.render(this.scene, this.camera);
    },
    stop() { try { this.renderer?.dispose(); } catch (e) {} this.renderer = this.scene = null; this.objs = []; }
  };

  // Per-index config: each preset is a unique combination of draw mode + params
  function waveCfg(i) {
    return {
      mode: i, // 0..29 used directly
      hue: (i * 47) % 360,
      thick: 1 + (i % 5),
      amp: 0.55 + (i % 7) * 0.05,
      bars: 32 + (i % 10) * 8,
      mirror: i % 3 === 1,
      fill: i % 4 === 2,
      polar: i % 5 === 4,
      invert: i % 6 === 3,
      dots: i % 7 === 5,
      steps: i % 8 === 6
    };
  }

  const WaveSurferMode = {
    ctx: null, idx: 0,
    start() {
      this.ctx = Host.makeCanvas().getContext('2d'); this.idx = 0;
      Host.setEffects(WAVE_PRESETS, 0, () => this.cycle(-1), () => this.cycle(1));
      Host.setStatus('WAVE-SURFER');
    },
    cycle(d) { this.idx = (this.idx + d + 30) % 30; Host.effectIdx = this.idx; Host.updateLabel(); },
    frame(fData, app) {
      const ctx = this.ctx; if (!ctx) return;
      const c = ctx.canvas; const s = Host.size();
      if (c.width !== s.w || c.height !== s.h) { c.width = s.w; c.height = s.h; }
      let wave = fData;
      try {
        if (app && app.analyser) {
          if (!this._td) this._td = new Uint8Array(app.analyser.fftSize || 256);
          app.analyser.getByteTimeDomainData(this._td); wave = this._td;
        }
      } catch (e) {}
      const cfg = waveCfg(this.idx);
      const midY = s.h / 2;
      ctx.fillStyle = cfg.invert ? '#e8eef5' : '#0a0e14';
      ctx.fillRect(0, 0, s.w, s.h);
      const col = (a) => cfg.invert
        ? ('rgba(20,40,60,' + a + ')')
        : ('hsla(' + cfg.hue + ',82%,60%,' + a + ')');

      if (cfg.polar) {
        const cx = s.w/2, cy = s.h/2, R = Math.min(s.w,s.h) * 0.28 * cfg.amp * 1.4;
        ctx.strokeStyle = col(1); ctx.lineWidth = cfg.thick; ctx.beginPath();
        for (let k = 0; k < wave.length; k++) {
          const a = (k / wave.length) * Math.PI * 2 + this.idx * 0.1;
          const v = (wave[k] - 128) / 128;
          const r = R * (1 + v * 0.55);
          const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
          if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath(); ctx.stroke();
        return;
      }
      if (cfg.bars > 40 && this.idx % 5 === 2) {
        const bw = s.w / cfg.bars;
        for (let k = 0; k < cfg.bars; k++) {
          const idx = ((k / cfg.bars) * wave.length) | 0;
          const v = Math.abs((wave[idx] - 128) / 128);
          ctx.fillStyle = col(0.45 + v * 0.55);
          ctx.fillRect(k * bw, midY - v * midY * cfg.amp, Math.max(1, bw - 1), v * midY * cfg.amp * 2);
        }
        return;
      }
      if (cfg.dots) {
        for (let k = 0; k < wave.length; k += 2) {
          const x = (k / wave.length) * s.w;
          const v = (wave[k] - 128) / 128;
          const y = midY + v * midY * cfg.amp;
          ctx.fillStyle = col(0.9);
          ctx.beginPath(); ctx.arc(x, y, cfg.thick, 0, Math.PI * 2); ctx.fill();
        }
        return;
      }
      // line / fill / steps / mirror
      const path = () => {
        ctx.beginPath();
        for (let k = 0; k < wave.length; k++) {
          let x = (k / wave.length) * s.w;
          let v = (wave[k] - 128) / 128;
          if (cfg.steps) { x = ((k / 4 | 0) * 4 / wave.length) * s.w; }
          const y = midY + v * midY * cfg.amp;
          if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
      };
      if (cfg.fill) {
        path();
        ctx.lineTo(s.w, midY); ctx.lineTo(0, midY); ctx.closePath();
        ctx.fillStyle = col(0.35); ctx.fill();
      }
      path();
      ctx.strokeStyle = col(1); ctx.lineWidth = cfg.thick; ctx.stroke();
      if (cfg.mirror) {
        ctx.beginPath();
        for (let k = 0; k < wave.length; k++) {
          const x = (k / wave.length) * s.w;
          const v = (wave[k] - 128) / 128;
          const y = midY - v * midY * cfg.amp * 0.7;
          if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = col(0.35); ctx.stroke();
      }
    },
    stop() { this.ctx = null; }
  };

  const PeaksView = {
    ctx: null, peaks: null, max: 256, idx: 0,
    start() {
      this.ctx = Host.makeCanvas().getContext('2d');
      this.peaks = new Float32Array(this.max); this.idx = 0;
      Host.setEffects(PEAKS_PRESETS, 0, () => this.cycle(-1), () => this.cycle(1));
      Host.setStatus('PEAKS-VIEW');
    },
    cycle(d) { this.idx = (this.idx + d + 30) % 30; Host.effectIdx = this.idx; Host.updateLabel(); },
    frame(fData) {
      const ctx = this.ctx; if (!ctx) return;
      const s = Host.size(); const c = ctx.canvas;
      if (c.width !== s.w || c.height !== s.h) { c.width = s.w; c.height = s.h; }
      this.peaks.copyWithin(0, 1);
      let sum = 0; for (let i = 0; i < fData.length; i++) sum += fData[i];
      this.peaks[this.max - 1] = sum / (fData.length * 255);
      const i = this.idx, midY = s.h / 2, bw = s.w / this.max;
      ctx.fillStyle = '#0b0c10'; ctx.fillRect(0, 0, s.w, s.h);
      // unique visual traits from index
      const bottom = i % 5 === 1;
      const dots = i % 7 === 3;
      const heat = i % 4 === 2;
      const thin = i % 6 === 4;
      const outline = i % 8 === 5;
      for (let k = 0; k < this.max; k++) {
        const v = this.peaks[k] || 0;
        const bh = v * (bottom ? s.h * 0.88 : midY * 0.95);
        if (heat) ctx.fillStyle = 'hsl(' + (220 - v * 140 + i * 4) + ',85%,' + (38 + v * 42) + '%)';
        else ctx.fillStyle = 'hsla(' + ((i * 29 + k * 0.5) % 360) + ',75%,' + (45 + v * 30) + '%,0.9)';
        const x = k * bw;
        if (dots) { ctx.beginPath(); ctx.arc(x, bottom ? s.h - 10 - bh : midY - bh, Math.max(1.2, bw * (thin ? 0.3 : 0.55)), 0, Math.PI*2); ctx.fill(); }
        else if (outline) { ctx.strokeStyle = ctx.fillStyle; ctx.strokeRect(x, bottom ? s.h - 10 - bh : midY - bh, Math.max(1, bw - (thin?1.5:0.5)), bottom ? bh : bh * 2); }
        else if (bottom) ctx.fillRect(x, s.h - 10 - bh, Math.max(1, bw - (thin?1.5:0.5)), bh);
        else ctx.fillRect(x, midY - bh, Math.max(1, bw - (thin?1.5:0.5)), bh * 2);
      }
    },
    stop() { this.ctx = null; }
  };

  const PixiField = {
    app: null, particles: null, ready: false, idx: 0,
    async init() {
      if (this.ready) return;
      Host.setStatus('Loading PixiJS…');
      await loadScript('https://cdn.jsdelivr.net/npm/pixi.js@7.4.2/dist/pixi.min.js');
      if (!window.PIXI) throw new Error('PIXI missing');
      this.ready = true;
    },
    rebuild() {
      const PIXI = window.PIXI;
      Host.ensure(); Host.mount.innerHTML = '';
      const s = Host.size();
      if (this.app) try { this.app.destroy(true); } catch (e) {}
      this.app = new PIXI.Application({ width: s.w, height: s.h, background: '#05060a', antialias: true });
      Host.mount.appendChild(this.app.view);
      this.app.view.style.width = '100%'; this.app.view.style.height = '100%';
      const g = new PIXI.Graphics(); g.beginFill(0xffffff); g.drawCircle(0, 0, 2); g.endFill();
      const tex = this.app.renderer.generateTexture(g);
      this.particles = [];
      const n = 140 + this.idx * 4;
      const hue = (this.idx * 37) % 360;
      for (let i = 0; i < n; i++) {
        const sp = new PIXI.Sprite(tex);
        sp.anchor.set(0.5);
        sp.x = Math.random() * s.w; sp.y = Math.random() * s.h;
        sp._a = Math.random() * Math.PI * 2;
        sp._r = 20 + Math.random() * Math.min(s.w, s.h) * 0.42;
        sp._vx = (Math.random() - 0.5) * (1 + this.idx * 0.05);
        sp._vy = (Math.random() - 0.5) * (1 + this.idx * 0.05);
        sp._mode = this.idx; // each preset's motion mode = index
        // approximate tint from hue
        const r = Math.floor(128 + 100 * Math.sin(hue * Math.PI / 180));
        const g2 = Math.floor(128 + 100 * Math.sin((hue + 120) * Math.PI / 180));
        const b = Math.floor(128 + 100 * Math.sin((hue + 240) * Math.PI / 180));
        sp.tint = (r << 16) | (g2 << 8) | b;
        this.app.stage.addChild(sp);
        this.particles.push(sp);
      }
    },
    start() { this.idx = 0; this.rebuild(); Host.setEffects(PIXI_PRESETS, 0, () => this.cycle(-1), () => this.cycle(1)); Host.setStatus('PIXI-FIELD'); },
    cycle(d) { this.idx = (this.idx + d + 30) % 30; this.rebuild(); Host.effectIdx = this.idx; Host.updateLabel(); },
    frame(fData) {
      if (!this.app || !this.particles) return;
      const b = bass(fData); const s = Host.size();
      if (Math.abs(this.app.screen.width - s.w) > 2 || Math.abs(this.app.screen.height - s.h) > 2) this.app.renderer.resize(s.w, s.h);
      const cx = s.w / 2, cy = s.h / 2, mode = this.idx;
      this.particles.forEach((sp, i) => {
        const band = (fData[i % fData.length] || 0) / 255;
        // 30 unique motion recipes
        switch (mode) {
          case 0: sp.x += sp._vx * (0.6+b*3); sp.y += sp._vy * (0.6+band*3); break;
          case 1: sp._a += 0.012+b*0.04; sp.x = cx+Math.cos(sp._a)*sp._r*(0.9+band*0.3); sp.y = cy+Math.sin(sp._a)*sp._r*(0.9+band*0.3); break;
          case 2: sp.x += (cx-sp.x)*0.03 + sp._vx*band*5; sp.y += (cy-sp.y)*0.03 + sp._vy*band*5; break;
          case 3: sp.x += Math.cos(sp._a)*0.5; sp.y += Math.sin(sp._a)*0.5; sp._a += band*0.1; break;
          case 4: sp.y += 1.2+b*3; sp.x += Math.sin(sp.y*0.02)*1.5; break;
          case 5: sp.y -= 0.8+band*3; sp.x += (Math.random()-0.5)*b*4; break;
          case 6: sp.x += sp._vx*(0.2+band); sp.y += sp._vy*(0.2+band); if (Math.random()<0.01) { sp._vx*=-1; sp._vy*=-1; } break;
          case 7: { const dx=sp.x-cx,dy=sp.y-cy; const r=Math.hypot(dx,dy)||1; sp.x -= dx/r*(1+b*4); sp.y -= dy/r*(1+b*4); break; }
          case 8: sp.y -= 2+b*4; sp.x += Math.sin(performance.now()*0.01+i)*2; if (sp.y<0){sp.y=s.h;sp.x=Math.random()*s.w;} break;
          case 9: { const p1={x:s.w*0.2,y:cy},p2={x:s.w*0.8,y:cy}; const t=i%2; const p=t?p1:p2; sp.x+=(p.x-sp.x)*0.02; sp.y+=(p.y-sp.y)*0.02; sp.x+=sp._vx*band*2; break; }
          case 10: sp.x = Math.round(sp.x/40)*40; sp.y = Math.round(sp.y/40)*40; sp.x += sp._vx*b*8; sp.y += sp._vy*band*8; break;
          case 11: sp.x += (Math.random()-0.5)*(3+b*6); sp.y += (Math.random()-0.5)*(3+band*6); break;
          case 12: sp._a += 0.03; sp.x = cx+Math.cos(sp._a)*sp._r; sp.y = cy+Math.sin(sp._a*2)*sp._r*0.5; break;
          case 13: sp.x += sp._vx*(1+b*2); sp.y += sp._vy*(1+band*2); if (sp.x<0||sp.x>s.w) sp._vx*=-1; if (sp.y<0||sp.y>s.h) sp._vy*=-1; break;
          case 14: sp.x += 2+b*3; sp.y += Math.sin(sp.x*0.03)*band*5; break;
          case 15: { const ang = Math.atan2(sp.y-cy,sp.x-cx); const r = 40+band*120; sp.x = cx+Math.cos(ang+0.02)*r; sp.y = cy+Math.sin(ang+0.02)*r; break; }
          case 16: sp._a += 0.01; const arm = sp._r*(1+0.3*Math.sin(sp._a*3)); sp.x = cx+Math.cos(sp._a)*arm; sp.y = cy+Math.sin(sp._a)*arm*0.55; break;
          case 17: sp.x += sp._vx*band*8; sp.y += sp._vy*band*8; break;
          case 18: sp.y += 2+b*2; sp.x += Math.sin(i+sp.y*0.05)*0.8; break;
          case 19: sp.y -= 0.5+band*2; sp.x += Math.sin(sp.y*0.04+i)*1.2; sp.scale.set(0.5+band*4); break;
          case 20: { const dist=Math.hypot(sp.x-cx,sp.y-cy); if (dist<30+b*80) { sp._vx*=-1; sp._vy*=-1; } sp.x+=sp._vx; sp.y+=sp._vy; break; }
          case 21: sp.x += Math.cos(i)*0.5+b; sp.y += Math.sin(i*1.3)*0.5+band; break;
          case 22: sp._a += 0.04+b*0.08; sp.x = cx+Math.cos(sp._a)*(sp._r*(0.5+band)); sp.y = cy+Math.sin(sp._a)*(sp._r*(0.5+band)); break;
          case 23: sp.x += sp._vx*(0.3+b); sp.y += sp._vy*(0.3+b); if (i%2===0) sp.tint = 0xffffff; break;
          case 24: sp.x += sp._vx*(1+band*2); sp.y += sp._vy*(1+band*2); sp.alpha = 0.2+band; break;
          case 25: sp.x += (Math.random()-0.5)*b*10; sp.y += (Math.random()-0.5)*b*10; break;
          case 26: sp.x += Math.sin(performance.now()*0.005+i)*2; sp.y += Math.cos(performance.now()*0.004+i)*2; break;
          case 27: { const a=Math.atan2(sp.y-cy,sp.x-cx)+0.03; const r=Math.hypot(sp.x-cx,sp.y-cy)+b; sp.x=cx+Math.cos(a)*r; sp.y=cy+Math.sin(a)*r; break; }
          case 28: sp._a += 0.02; sp.x = cx+Math.cos(sp._a)*(80+b*100); sp.y = cy+Math.sin(sp._a)*(80+b*100); break;
          default: sp.x += Math.cos(sp._a)* (1+band*2); sp.y += Math.sin(sp._a)*(1+band*2); sp._a += (Math.random()-0.5)*0.2; break;
        }
        if (sp.x < 0) sp.x = s.w; if (sp.x > s.w) sp.x = 0;
        if (sp.y < 0) sp.y = s.h; if (sp.y > s.h) sp.y = 0;
        if (mode !== 19) sp.scale.set(0.4 + band * 2.8);
        if (mode !== 24) sp.alpha = 0.3 + band * 0.7;
      });
    },
    stop() { try { this.app?.destroy(true); } catch (e) {} this.app = this.particles = null; }
  };

  const ZdogGeom = {
    ctx: null, rot: 0, idx: 0,
    start() {
      this.ctx = Host.makeCanvas().getContext('2d'); this.rot = 0; this.idx = 0;
      Host.setEffects(ZDOG_PRESETS, 0, () => this.cycle(-1), () => this.cycle(1));
      Host.setStatus('ZDOG-GEOM');
    },
    cycle(d) { this.idx = (this.idx + d + 30) % 30; Host.effectIdx = this.idx; Host.updateLabel(); },
    project(x, y, z, rotY, rotX) {
      let cos = Math.cos(rotY), sin = Math.sin(rotY);
      let x1 = x * cos + z * sin, z1 = -x * sin + z * cos;
      cos = Math.cos(rotX); sin = Math.sin(rotX);
      let y1 = y * cos - z1 * sin; z1 = y * sin + z1 * cos;
      const f = 280 / (4 + z1); return { x: x1 * f, y: y1 * f };
    },
    frame(fData) {
      const ctx = this.ctx; if (!ctx) return;
      const s = Host.size(); const c = ctx.canvas;
      if (c.width !== s.w || c.height !== s.h) { c.width = s.w; c.height = s.h; }
      const b = bass(fData), m = mid(fData); this.rot += 0.01 + b * 0.045;
      ctx.fillStyle = '#12100e'; ctx.fillRect(0, 0, s.w, s.h);
      ctx.save(); ctx.translate(s.w / 2, s.h / 2);
      const R = 1.1 * (1 + b * 0.35), i = this.idx;
      ctx.strokeStyle = 'hsl(' + ((i * 41) % 360) + ',72%,62%)'; ctx.lineWidth = 2;
      const P = (x,y,z) => this.project(x,y,z,this.rot*(1+(i%3)*0.1), this.rot*0.55);
      const line = (a,b) => { ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); };
      // unique geometry per index
      if (i === 0) {
        const v=[]; for(let ix=-1;ix<=1;ix+=2)for(let iy=-1;iy<=1;iy+=2)for(let iz=-1;iz<=1;iz+=2)v.push(P(ix*R,iy*R,iz*R));
        [[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]].forEach(e=>line(v[e[0]],v[e[1]]));
      } else if (i === 1) {
        const pts=[[0,-R,0],[R,R,R],[-R,R,R],[-R,R,-R],[R,R,-R]].map(p=>P(p[0],p[1],p[2]));
        [[0,1],[0,2],[0,3],[0,4],[1,2],[2,3],[3,4],[4,1]].forEach(e=>line(pts[e[0]],pts[e[1]]));
      } else if (i === 2) {
        for (let k=0;k<10;k++){const a=k/10*Math.PI*2;line(P(Math.cos(a)*R,Math.sin(a)*R,0),P(Math.cos(a+Math.PI)*R*0.3,Math.sin(a+Math.PI)*R*0.3,R*0.6));}
      } else if (i === 3) {
        const v=[[0,R,0],[0,-R,0],[R,0,0],[-R,0,0],[0,0,R],[0,0,-R]].map(p=>P(p[0],p[1],p[2]));
        [[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,4],[2,5],[3,4],[3,5]].forEach(e=>line(v[e[0]],v[e[1]]));
      } else if (i === 4) {
        for (let k=0;k<20;k++){const a=k/20*Math.PI*2;line(P(Math.cos(a)*R,Math.sin(a)*R,0.5),P(Math.cos(a)*R,Math.sin(a)*R,-0.5));}
      } else if (i === 5) {
        for (let k=0;k<12;k++){const a=k/12*Math.PI*2;const b2=(k+3)/12*Math.PI*2;line(P(Math.cos(a)*R,Math.sin(a)*R,0),P(Math.cos(b2)*R,Math.sin(b2)*R,0.5));}
      } else if (i === 6) {
        const base=[[-R,R,R],[R,R,R],[R,R,-R],[-R,R,-R],[-R,-R,R],[R,-R,R],[R,-R,-R],[-R,-R,-R]].map(p=>P(p[0],p[1]*0.3,p[2]));
        [[0,1],[1,2],[2,3],[3,0],[0,4],[1,5],[4,5],[3,7],[2,6],[5,6],[6,7],[7,4]].forEach(e=>line(base[e[0]],base[e[1]]));
      } else if (i === 7) {
        line(P(-R,0,0),P(R,0,0)); line(P(0,-R,0),P(0,R,0)); line(P(0,0,-R),P(0,0,R));
      } else if (i === 8) {
        const v=[]; for(let k=0;k<6;k++){const a=k/6*Math.PI*2;v.push(P(Math.cos(a)*R,Math.sin(a)*R,0));} for(let k=0;k<6;k++)line(v[k],v[(k+1)%6]); for(let k=0;k<6;k++)line(v[k],v[(k+2)%6]);
      } else if (i === 9) {
        for (let y=-1;y<=1;y++) { const v=[P(-R,y*R*0.5,-R*0.3),P(R,y*R*0.5,-R*0.3),P(R,y*R*0.5,R*0.3),P(-R,y*R*0.5,R*0.3)]; for(let k=0;k<4;k++)line(v[k],v[(k+1)%4]); }
      } else {
        // remaining 20: parametric variants with unique spoke counts / layers
        const spokes = 5 + (i % 12);
        const layers = 1 + (i % 4);
        for (let L = 0; L < layers; L++) {
          const rr = R * (1 - L * 0.22);
          for (let k = 0; k < spokes; k++) {
            const a = k / spokes * Math.PI * 2 + L * 0.2;
            line(P(0,0,L*0.2), P(Math.cos(a)*rr, Math.sin(a)*rr*(0.6+m*0.3), Math.sin(a*2)*rr*0.25));
          }
        }
      }
      ctx.restore();
    },
    stop() { this.ctx = null; }
  };

  const MeydaScope = {
    ctx: null, features: null, analyzer: null, idx: 0,
    async init() {
      Host.setStatus('Loading Meyda…');
      try { await loadScript('https://cdn.jsdelivr.net/npm/meyda@5.6.3/dist/web/meyda.min.js'); } catch (e) {}
    },
    start(app) {
      this.ctx = Host.makeCanvas().getContext('2d');
      this.features = { rms: 0, energy: 0, zcr: 0, spectralCentroid: 0, mfcc: [] };
      this.idx = 0;
      if (window.Meyda && app && app.ac && (app.eqOutput || app._mes)) {
        try {
          this.analyzer = window.Meyda.createMeydaAnalyzer({
            audioContext: app.ac, source: app.eqOutput || app._mes, bufferSize: 512,
            featureExtractors: ['rms','energy','zcr','spectralCentroid','mfcc'],
            callback: (f) => { if (f) this.features = f; }
          });
          this.analyzer.start();
        } catch (e) {}
      }
      Host.setEffects(MEYDA_PRESETS, 0, () => this.cycle(-1), () => this.cycle(1));
      Host.setStatus('MEYDA-SCOPE');
    },
    cycle(d) { this.idx = (this.idx + d + 30) % 30; Host.effectIdx = this.idx; Host.updateLabel(); },
    frame(fData) {
      const ctx = this.ctx; if (!ctx) return;
      const s = Host.size(); const c = ctx.canvas;
      if (c.width !== s.w || c.height !== s.h) { c.width = s.w; c.height = s.h; }
      let sum = 0, peak = 0;
      for (let i = 0; i < fData.length; i++) { sum += fData[i]; if (fData[i] > peak) peak = fData[i]; }
      const rms = this.features?.rms ?? sum / fData.length / 255;
      const energy = this.features?.energy ?? sum / 255;
      const centroid = this.features?.spectralCentroid ?? peak;
      const zcr = (this.features?.zcr || 0) / 100;
      const i = this.idx;
      ctx.fillStyle = '#0c0d12'; ctx.fillRect(0, 0, s.w, s.h);
      const metrics = [rms, Math.min(1, energy/45), zcr, Math.min(1, (centroid||0)/200)];
      // 30 unique layouts driven by index
      if (i < 6) {
        metrics.forEach((v, mi) => {
          const y = 30 + mi * (s.h / 5) + i * 2;
          const bw = (s.w - 110) * v;
          ctx.fillStyle = '#2a3340'; ctx.fillRect(100, y, s.w - 110, 16);
          ctx.fillStyle = 'hsl(' + (160 + mi * 40 + i * 8) + ',70%,55%)'; ctx.fillRect(100, y, bw, 16);
          ctx.fillStyle = '#cde'; ctx.font = '12px monospace'; ctx.fillText(['RMS','NRG','ZCR','CEN'][mi], 12, y + 13);
        });
      } else if (i < 12) {
        const cx = s.w/2, cy = s.h/2;
        metrics.forEach((v, mi) => {
          ctx.beginPath(); ctx.arc(cx, cy, 24 + mi * 26 + v * 18 + i, 0, Math.PI * 2 * (0.6 + v * 0.4));
          ctx.strokeStyle = 'hsla(' + (140 + mi * 35 + i * 5) + ',80%,60%,0.85)';
          ctx.lineWidth = 2 + v * 8; ctx.stroke();
        });
      } else if (i < 18) {
        const mfcc = this.features?.mfcc || [];
        const n = Math.max(mfcc.length, 12 + (i % 5));
        for (let k = 0; k < n; k++) {
          const v = mfcc.length ? Math.min(1, Math.abs(mfcc[k % mfcc.length] || 0) / 40) : (fData[(k * 3) % fData.length] || 0) / 255;
          const bw = (s.w - 16) / n;
          ctx.fillStyle = 'hsl(' + (280 - v * 120 + i * 6) + ',70%,55%)';
          ctx.fillRect(8 + k * bw, s.h - 16 - v * (s.h - 36), bw - 2, v * (s.h - 36));
        }
      } else if (i < 24) {
        for (let k = 0; k < 64; k++) {
          const v = (fData[(k * 2 + i) % fData.length] || 0) / 255;
          ctx.fillStyle = 'hsla(' + (i * 12 + k * 3) + ',75%,55%,0.85)';
          const bh = v * s.h * 0.7;
          ctx.fillRect(k * (s.w / 64), s.h / 2 - bh / 2, s.w / 64 - 1, bh);
        }
      } else {
        ctx.strokeStyle = 'hsl(' + (i * 15) + ',80%,60%)'; ctx.lineWidth = 2; ctx.beginPath();
        for (let k = 0; k < fData.length; k++) {
          const x = (k / fData.length) * s.w;
          const y = s.h - ((fData[k] || 0) / 255) * s.h * 0.85;
          if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = 'rgba(100,180,255,0.15)';
        ctx.lineTo(s.w, s.h); ctx.lineTo(0, s.h); ctx.fill();
      }
    },
    stop() { try { this.analyzer?.stop(); } catch (e) {} this.analyzer = null; this.ctx = null; }
  };

  const P5Flow = {
    ctx: null, particles: null, idx: 0,
    start() {
      this.ctx = Host.makeCanvas().getContext('2d');
      const s = Host.size();
      this.particles = Array.from({ length: 280 }, () => ({ x: Math.random()*s.w, y: Math.random()*s.h, h: Math.random()*360, a: Math.random()*Math.PI*2 }));
      this.idx = 0;
      Host.setEffects(P5_PRESETS, 0, () => this.cycle(-1), () => this.cycle(1));
      Host.setStatus('P5-FLOW');
    },
    cycle(d) { this.idx = (this.idx + d + 30) % 30; Host.effectIdx = this.idx; Host.updateLabel(); },
    frame(fData) {
      const ctx = this.ctx; if (!ctx) return;
      const s = Host.size(); const c = ctx.canvas;
      if (c.width !== s.w || c.height !== s.h) { c.width = s.w; c.height = s.h; }
      const b = bass(fData), mode = this.idx;
      ctx.fillStyle = (mode === 2 || mode === 17) ? 'rgba(8,10,16,0.28)' : 'rgba(10,12,18,0.14)';
      ctx.fillRect(0, 0, s.w, s.h);
      const t = performance.now() * 0.0003;
      this.particles.forEach((p, pi) => {
        const band = (fData[pi % fData.length] || 0) / 255;
        switch (mode) {
          case 0: { const a=Math.sin(p.x*0.01+t)*Math.cos(p.y*0.01-t)*Math.PI*2; p.x+=Math.cos(a)*(1+b*3+band); p.y+=Math.sin(a)*(1+b*3+band); break; }
          case 1: p.x+=1.5+b*4; p.y+=Math.sin(p.x*0.02+t*3)*(2+band*4); break;
          case 2: p.x+=(Math.random()-0.5)*(2+band*8); p.y+=(Math.random()-0.5)*(2+band*8)-b*2; break;
          case 3: p.x+=Math.cos(t+pi)*(1+band*2); p.y+=Math.sin(t*1.2+pi)*(1+b*2); break;
          case 4: { const a=Math.sin(p.y*0.02)+Math.cos(p.x*0.02); p.x+=Math.cos(a+t)*(1+b*2); p.y+=Math.sin(a+t)*(1+band*2); break; }
          case 5: { let fx=0,fy=0; /* boid-ish pull to center */ fx+=(s.w/2-p.x)*0.002; fy+=(s.h/2-p.y)*0.002; p.x+=fx*(2+b)+Math.cos(p.a); p.y+=fy*(2+b)+Math.sin(p.a); p.a+=band*0.05; break; }
          case 6: p.y+=2+b*3; p.x+=Math.sin(p.y*0.05)*0.5; break;
          case 7: p.a+=0.03+b*0.02; p.x=s.w/2+Math.cos(p.a)*(p.h%120+40); p.y=s.h/2+Math.sin(p.a)*(p.h%80+30); break;
          case 8: p.x+=Math.cos(p.a)*(0.5+band*2); p.y+=Math.sin(p.a)*(0.5+band*2); p.a+=Math.sin(t+pi)*0.05; break;
          case 9: p.x+=1; if (Math.floor(p.x)%12===0) p.y+= (pi%2?1:-1)*(1+b*2); break;
          case 10: p.x+=Math.cos(p.a); p.y+=Math.sin(p.a); if (Math.random()<0.01) p.a=Math.random()*Math.PI*2; break;
          case 11: p.x+=(Math.random()-0.5)*(1+b); p.y+=(Math.random()-0.5)*(1+band); break;
          case 12: p.x+=2+b; p.y+=Math.sin(p.x*0.04+t)*3; break;
          case 13: p.x+=Math.cos(pi)*0.5; p.y+=Math.sin(pi*1.3)*0.5+b; break;
          case 14: p.y+=0.5+band; p.x+=Math.sin(p.y*0.03)*2; break;
          case 15: p.a+=0.02; p.x=s.w/2+Math.cos(p.a+pi*0.1)*(80+band*60); p.y=s.h/2+Math.sin(p.a+pi*0.1)*(80+band*60); break;
          case 16: p.x=Math.round(p.x/20)*20+ (b*4); p.y=Math.round(p.y/20)*20+(band*4); p.x+=1; break;
          case 17: p.x+=(Math.random()-0.5)*b*12; p.y+=(Math.random()-0.5)*b*12; break;
          case 18: p.x+=Math.sin(t*2+pi)*1.5; p.y+=Math.cos(t*1.5+pi)*1.5; break;
          case 19: p.x+=1.2; p.y+=Math.sin(p.x*0.02)* (1+m*2); break;
          case 20: { const dx=s.w/2-p.x, dy=s.h/2-p.y; p.x+=dx*0.01+Math.cos(p.a); p.y+=dy*0.01+Math.sin(p.a); p.a+=0.02; break; }
          case 21: p.x+=0.3; p.y+=0.3; if ((pi+Math.floor(t*10))%7===0) {ctx.strokeStyle='hsla('+p.h+',70%,60%,0.3)';ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+10,p.y+10);ctx.stroke();} break;
          case 22: p.y+=1; if (p.y>s.h) {p.y=0;p.x=Math.random()*s.w;} break;
          case 23: p.x+=(bass(fData)-0.3)*4; p.y+=(band-0.3)*4; break;
          case 24: p.x+=Math.cos(p.a)*0.4; p.y+=Math.sin(p.a)*0.4; break;
          case 25: p.x+=Math.sin(performance.now()*0.002+pi)*2; p.y+=Math.cos(performance.now()*0.002+pi)*2; break;
          case 26: p.x+=2+b*5; p.y+=Math.sin(p.x*0.05+t*4)*(3+band*4); break;
          case 27: { const a=Math.atan2(p.y-s.h/2,p.x-s.w/2); p.x+=Math.cos(a+Math.PI/2)* (1+b); p.y+=Math.sin(a+Math.PI/2)*(1+b); break; }
          case 28: p.x+=(s.w/2-p.x)*0.005; p.y+=(s.h/2-p.y)*0.005; p.x+=Math.cos(t+pi)*band*3; break;
          default: p.y+=0.4; p.x+=Math.sin(p.y*0.02)*0.5; break;
        }
        if (p.x < 0) p.x = s.w; if (p.x > s.w) p.x = 0;
        if (p.y < 0) p.y = s.h; if (p.y > s.h) p.y = 0;
        ctx.fillStyle = 'hsla(' + ((p.h + band * 80 + mode * 3) % 360) + ',70%,60%,0.8)';
        const sz = (mode === 2 || mode === 17) ? 1 + band * 3 : 2;
        ctx.fillRect(p.x, p.y, sz, sz);
      });
    },
    stop() { this.ctx = this.particles = null; }
  };

  const ToneMeters = {
    ctx: null, idx: 0,
    start() {
      this.ctx = Host.makeCanvas().getContext('2d'); this.idx = 0;
      Host.setEffects(TONE_PRESETS, 0, () => this.cycle(-1), () => this.cycle(1));
      Host.setStatus('TONE-METERS');
    },
    cycle(d) { this.idx = (this.idx + d + 30) % 30; Host.effectIdx = this.idx; Host.updateLabel(); },
    bands(fData) {
      const defs = [
        { n: 'SUB', a: 0, b: 4 }, { n: 'BASS', a: 4, b: 12 }, { n: 'LOW', a: 12, b: 28 },
        { n: 'MID', a: 28, b: 56 }, { n: 'HIGH', a: 56, b: 100 }, { n: 'AIR', a: 100, b: 128 }
      ];
      return defs.map((b) => {
        let s = 0, c = 0;
        for (let k = b.a; k < Math.min(b.b, fData.length); k++) { s += fData[k]; c++; }
        return { n: b.n, v: c ? s / (c * 255) : 0 };
      });
    },
    frame(fData) {
      const ctx = this.ctx; if (!ctx) return;
      const s = Host.size(); const c = ctx.canvas;
      if (c.width !== s.w || c.height !== s.h) { c.width = s.w; c.height = s.h; }
      const bands = this.bands(fData), i = this.idx;
      ctx.fillStyle = '#0a0a0c'; ctx.fillRect(0, 0, s.w, s.h);
      // unique layouts
      if (i < 5 || i === 14 || i === 23) {
        const slot = s.w / bands.length;
        bands.forEach((b, bi) => {
          const bh = b.v * (s.h - 50), x = bi * slot + slot * 0.18, bw = slot * 0.64;
          ctx.fillStyle = '#222'; ctx.fillRect(x, 18, bw, s.h - 48);
          const grad = ctx.createLinearGradient(0, s.h - 28, 0, 18);
          grad.addColorStop(0, 'hsl(' + (100 + i * 8) + ',70%,45%)');
          grad.addColorStop(1, 'hsl(' + (10 + i * 5) + ',80%,55%)');
          ctx.fillStyle = grad; ctx.fillRect(x, s.h - 28 - bh, bw, bh);
          if (i === 14) { ctx.fillStyle = '#fff'; ctx.fillRect(x, s.h - 28 - bh - 3, bw, 3); }
          ctx.fillStyle = '#aaa'; ctx.font = '11px monospace'; ctx.textAlign = 'center';
          ctx.fillText(b.n, x + bw / 2, s.h - 10);
        });
      } else if (i < 10 || i === 18) {
        const cx = s.w/2, cy = s.h*0.58, R = Math.min(s.w,s.h)*0.34;
        bands.forEach((b, bi) => {
          const a0 = Math.PI + (bi / bands.length) * Math.PI;
          const a1 = Math.PI + ((bi + 0.8) / bands.length) * Math.PI;
          ctx.beginPath(); ctx.arc(cx, cy, R * (0.35 + b.v * 0.65), a0, a1);
          ctx.strokeStyle = 'hsl(' + (110 + bi * 28 + i * 4) + ',80%,55%)';
          ctx.lineWidth = 7 + b.v * 14; ctx.stroke();
        });
      } else if (i < 15 || i === 21) {
        bands.forEach((b, bi) => {
          const y = 22 + bi * ((s.h - 36) / bands.length);
          const bw = b.v * (s.w - 100);
          ctx.fillStyle = '#333'; ctx.fillRect(80, y, s.w - 100, 12 + (i%3));
          ctx.fillStyle = 'hsl(' + (90 + bi * 30 + i * 5) + ',75%,50%)'; ctx.fillRect(80, y, bw, 12 + (i%3));
          ctx.fillStyle = '#bbb'; ctx.font = '11px monospace'; ctx.textAlign = 'left';
          ctx.fillText(b.n, 12, y + 11);
        });
      } else if (i < 20) {
        // needle style
        bands.forEach((b, bi) => {
          const cx = (bi + 0.5) * (s.w / bands.length), cy = s.h * 0.7;
          const ang = -Math.PI * 0.75 + b.v * Math.PI * 1.5;
          ctx.strokeStyle = '#444'; ctx.beginPath(); ctx.arc(cx, cy, 40, -Math.PI*0.75, Math.PI*0.75); ctx.stroke();
          ctx.strokeStyle = 'hsl(' + (i * 12 + bi * 20) + ',80%,60%)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * 36, cy + Math.sin(ang) * 36); ctx.stroke();
          ctx.fillStyle = '#aaa'; ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillText(b.n, cx, cy + 28);
        });
      } else if (i < 25) {
        // cells / matrix
        const cols = bands.length, rows = 8;
        bands.forEach((b, bi) => {
          const lit = Math.floor(b.v * rows);
          for (let r = 0; r < rows; r++) {
            ctx.fillStyle = r < lit ? 'hsl(' + (90 + bi * 25 + i) + ',75%,' + (40 + r * 5) + '%)' : '#1a1a22';
            const x = bi * (s.w / cols) + 8;
            const y = s.h - 20 - (r + 1) * ((s.h - 40) / rows);
            ctx.fillRect(x, y, s.w / cols - 14, (s.h - 40) / rows - 3);
          }
        });
      } else {
        // spectrum slice / phase-ish
        for (let k = 0; k < 48; k++) {
          const v = (fData[((k / 48) * fData.length) | 0] || 0) / 255;
          ctx.fillStyle = 'hsl(' + (i * 10 + k * 4) + ',70%,50%)';
          ctx.fillRect(k * (s.w / 48), s.h - v * s.h * 0.85, s.w / 48 - 1, v * s.h * 0.85);
        }
      }
    },
    stop() { this.ctx = null; }
  };

  const ENGINES = {
    'THREE-VIZ': ThreeViz,
    'GLSL-SHADER': GLSLShader,
    'HYDRA-LIVE': HydraLive,
    'WAVE-SURFER': WaveSurferMode,
    'PEAKS-VIEW': PeaksView,
    'PIXI-FIELD': PixiField,
    'ZDOG-GEOM': ZdogGeom,
    'MEYDA-SCOPE': MeydaScope,
    'P5-FLOW': P5Flow,
    'TONE-METERS': ToneMeters
  };
  window.VizLibEngines = ENGINES;
  window.VIZ_LIB_MODES = EXTRA_MODES;

  function stopEngine(name) {
    const eng = ENGINES[name];
    if (eng && eng._started) { try { eng.stop(); } catch (e) {} eng._started = false; }
  }
  function stopAllLibModes(except) {
    Object.keys(ENGINES).forEach((n) => { if (n !== except) stopEngine(n); });
    if (!except || !ENGINES[except]) Host.deactivate();
  }
  window.VizLibStopAll = stopAllLibModes;

  EXTRA_MODES.forEach((modeName) => {
    const reg = window.VisRegistry || (window.VisRegistry = {});
    reg[modeName] = function (ctx, w, h, fData, app) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
      if (app && !app.ac && typeof app.startAnalysis === 'function') {
        try { app.startAnalysis(); } catch (e) {}
      }
      Host.activate(modeName);
      Object.keys(ENGINES).forEach((n) => { if (n !== modeName && ENGINES[n]._started) stopEngine(n); });
      const eng = ENGINES[modeName];
      if (!eng) return;
      if (!eng._started) {
        if (eng._starting) return;
        eng._starting = true;
        Host.setStatus(modeName + ' · starting…');
        Promise.resolve()
          .then(() => (eng.init ? eng.init(app) : null))
          .then(() => { eng.start(app); eng._started = true; eng._starting = false; Host.setStatus(modeName); })
          .catch((e) => { eng._starting = false; Host.setStatus(modeName + ' · ' + (e.message || e)); console.warn('[viz-lib]', modeName, e); });
        return;
      }
      try { eng.frame(fData || new Uint8Array(128), app); }
      catch (e) { Host.setStatus(modeName + ' · ' + (e.message || e)); }
    };
  });
})();
