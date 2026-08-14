// ================================================
// visualizers.js – Full original v0.9 effects + VIDEO_MODE
// ================================================

window.MODES = ['INFO-HUD', 'PIC', 'VIDEO_MODE', 'GLISTEN', 'RUMPLE', 'POLAR', 'VU-METER', 'SINGULARITY', 'LED-BAR', 'SPIRALS', 'PARTICLES', 'PARTICLES2', 'UNKNOWN-PLEASURES', 'VIS_OFF'];
window.Visualizers = {
    render: function(ctx, w, h, mode, fData, app, accent, textColor, panelColor) {

        // PIC
        if (mode === 'PIC') {
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
        }

        // VIDEO_MODE
        else if (mode === 'VIDEO_MODE') {
            ctx.clearRect(0, 0, w, h);
            const videoEl = document.querySelector('#audio-engine_html5_api');
            if (videoEl && app.isPlaying) {
                ctx.drawImage(videoEl, 0, 0, w, h);
            }
            return;
        }

        // VIS_OFF
        else if (mode === 'VIS_OFF') {
            ctx.clearRect(0, 0, w, h);
            return;
        }

        // INFO-HUD
        else if (mode === 'INFO-HUD') {
            ctx.fillStyle = accent; 
            ctx.font = '900 16px "JetBrains Mono"';
            ctx.fillText(app.curTrack?.name?.toUpperCase() || 'NO SIGNAL', 80, 60);
            
            ctx.font = '900 11px "JetBrains Mono"'; 
            ctx.globalAlpha = 0.5;
            ctx.fillText(app.curTrack?.tags?.toUpperCase() || 'IDLE', 80, 82);

            ctx.globalAlpha = 1.0;
            ctx.fillStyle = textColor; 
            ctx.font = '900 10px "JetBrains Mono"';
            const currentSkinName = Object.keys(window.SKINS)[app.sIdx] || 'UNKNOWN';
            ctx.fillText(`SKIN: ${currentSkinName.toUpperCase()}`, 5, h - 10);

            ctx.fillStyle = accent;
            ctx.font = '900 9px "JetBrains Mono"';
            const bitrate = app.curTrack?.bitrate ? `${app.curTrack.bitrate} KBPS` : '--- KBPS';
            ctx.fillText(`ENCODING: ${bitrate}`, 40, 105);

            ctx.fillText('SIGNAL:', 40, 125);
            for(let i = 0; i < 10; i++) {
                const level = (fData[i*2] / 255);
                ctx.globalAlpha = level > 0.2 ? 1 : 0.2;
                ctx.fillRect(95 + (i * 7), 118, 4, 8);
            }
            ctx.globalAlpha = 1.0;
            return;
        }
        
        // GLISTEN
        else if (mode === 'GLISTEN') {
            const bass = fData[2] / 255;
            const treble = fData[100] / 255;
            app.rumpleOrbs.forEach(orb => {
                orb.y += orb.speed;
                if (orb.y > h) orb.y = 0;
                ctx.fillStyle = `rgba(255, 255, 255, ${orb.opacity})`;
                ctx.beginPath();
                ctx.arc(orb.x, orb.y, orb.r * (1 + bass * 0.5), 0, Math.PI * 2);
                ctx.fill();
            });
            const centerX = w / 2, centerY = h / 2;
            const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, 150 + (bass * 200));
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.2, accent);
            gradient.addColorStop(1, 'transparent');
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 200 + (bass * 50), 0, Math.PI * 2);
            ctx.fill();
            if (treble > 0.6 && Math.random() < 0.3) {
                app.rumpleParticles.push({
                    x: Math.random() * w, y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
                    life: 1.0, size: Math.random() * 4 + 2
                });
            }
            app.rumpleParticles.forEach((p, i) => {
                ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
                ctx.shadowBlur = 15; ctx.shadowColor = "#FFF";
                ctx.fillRect(p.x, p.y, p.size, p.size);
                p.x += p.vx; p.y += p.vy; p.life -= 0.02;
                if (p.life <= 0) app.rumpleParticles.splice(i, 1);
            });
            ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over';
        }

        // RUMPLE
        else if (mode === 'RUMPLE') {
            const centerY = h * 0.5;
            const WIND = 1.2; 
            app.rumpleOrbs.forEach(orb => {
                orb.y -= orb.speed * 0.5;
                if (orb.y < 0) orb.y = h;
                ctx.fillStyle = `rgba(255, 255, 255, ${orb.opacity * 0.3})`;
                ctx.fillRect(orb.x, orb.y, 1, 1);
            });
            ctx.beginPath();
            ctx.lineWidth = 2; ctx.strokeStyle = accent; ctx.shadowBlur = 10; ctx.shadowColor = accent;
            for (let i = 0; i < 128; i++) {
                let barHeight = (fData[i] / 255) * 220 * app.vol;
                let x = (i / 128) * w;
                let y = centerY + Math.sin(i * 0.15 + Date.now() * 0.003) * (barHeight * 0.4);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                if (fData[i] > 140 && Math.random() > 0.85) { 
                    app.rumpleParticles.push({
                        x: x, y: y,
                        vx: ((Math.random() - 0.5) * 2) + WIND,
                        vy: (Math.random() - 1) * 5 * app.vol,
                        life: 1.0, startSize: Math.random() * 5 + 3
                    });
                }
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
            if (app.rumpleParticles.length > 2500) app.rumpleParticles.splice(0, 500);
            for (let i = app.rumpleParticles.length - 1; i >= 0; i--) {
                let p = app.rumpleParticles[i];
                p.x += p.vx; p.y += p.vy; p.life -= 0.01; 
                let size = Math.max(0.1, p.startSize * p.life);
                let pCol = p.life > 0.7 ? "#FFF" : (p.life > 0.3 ? accent : "#FF4500");
                ctx.fillStyle = pCol; ctx.globalAlpha = p.life;
                ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, Math.PI * 2); ctx.fill();
                if (p.life <= 0 || p.x > w) app.rumpleParticles.splice(i, 1);
            }
            ctx.globalAlpha = 1.0;
        }

        // POLAR
        else if (mode === 'POLAR') {
            ctx.save();
            ctx.translate(w / 2, h / 2);
            const bass = fData[2] / 255;
            const nodes = 180;
            const moonRadius = 65 + (bass * 15);
            const moonGrad = ctx.createRadialGradient(-moonRadius/3, -moonRadius/3, moonRadius/4, 0, 0, moonRadius);
            moonGrad.addColorStop(0, '#FFFFFF');
            moonGrad.addColorStop(0.5, accent);
            moonGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
            ctx.beginPath();
            ctx.fillStyle = moonGrad;
            ctx.arc(0, 0, moonRadius, 0, Math.PI * 2);
            ctx.fill();
            if (bass > 0.7) {
                ctx.shadowBlur = 30 * bass;
                ctx.shadowColor = accent;
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2;
                ctx.stroke(); 
                ctx.shadowBlur = 0;
            }
            for (let i = 0; i < nodes; i++) {
                let a = (i * 360 / nodes) * Math.PI / 180;
                let amp = (fData[Math.floor(i * 128 / nodes)] / 255) * 200; 
                ctx.strokeStyle = accent;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * moonRadius, Math.sin(a) * moonRadius);
                ctx.lineTo(Math.cos(a) * (moonRadius + amp), Math.sin(a) * (moonRadius + amp));
                ctx.stroke();
            }
            ctx.restore();
        }

        // VU-METER
        else if (mode === 'VU-METER') {
            const drawMeter = (x) => {
                const centerY = h * 0.85; const radius = 110;
                const grad = ctx.createRadialGradient(x, centerY-30, 10, x, centerY-30, radius+20);
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
                const rawV = (fData[10 + (x > w/2 ? 5 : 0)] / 255);
                const v = rawV * Math.PI;
                ctx.strokeStyle = '#CC0000'; ctx.lineWidth = 2.5; ctx.beginPath();
                ctx.moveTo(x, centerY); ctx.lineTo(x + Math.cos(Math.PI + v) * 105, centerY + Math.sin(Math.PI + v) * 105); ctx.stroke();
                ctx.fillStyle = textColor; ctx.beginPath(); ctx.arc(x, centerY, 6, 0, Math.PI * 2); ctx.fill();
            };
            drawMeter(w * 0.3);
            drawMeter(w * 0.7);
        } 

        // SINGULARITY
        else if (mode === 'SINGULARITY') {
    if (!Array.isArray(app.particles) || app.particles.length === 0) {
        app.particles = Array.from({ length: 300 }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: 0,
            vy: 0,
            life: Math.random()
        }));
    }

    const bass = fData[2] / 255;
    const avg = Array.from(fData).reduce((a, b) => a + b, 0) / fData.length;
    const pull = avg / 255;
    const isBeat = bass > 0.75; 
    const targetForce = isBeat ? -(bass * 2.0) : 0.7;

    app.particles.forEach(p => {
        if (p.life === undefined) p.life = 1.0;
        const dx = w / 2 - p.x;
        const dy = h / 2 - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
            p.vx += (dx / dist) * targetForce;
            p.vy += (dy / dist) * targetForce;
            if (isBeat) {
                p.vx += (Math.random() - 0.5) * 4;
                p.vy += (Math.random() - 0.5) * 4;
            }
        }
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.10; p.vy *= 0.10;
        if (dist < 10 || p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
            p.x = Math.random() * w; p.y = Math.random() * h;
            p.vx = 0; p.vy = 0;
            p.life = Math.random();
        }
        ctx.beginPath();
        ctx.globalAlpha = isBeat ? 1.0 : Math.max(0.1, p.life * (0.05 + pull));
        ctx.fillStyle = isBeat ? "#FFFFFF" : accent;
        if (isBeat) { ctx.shadowBlur = 20 * bass; ctx.shadowColor = accent; }
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
    });
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
}

        // LED-BAR
        else if (mode === 'LED-BAR') {
            const bars = 64, bw = w / bars;
            for(let i = 0; i < bars; i++) { 
                let hg = (fData[i*10]/255) * h * 0.8; 
                ctx.fillStyle = accent; 
                for(let j = 0; j < hg; j += 10) { 
                    ctx.globalAlpha = 1 - (j / h); 
                    ctx.fillRect(i * bw + 2, h - j - 10, bw - 4, 6); 
                } 
            } 
            ctx.globalAlpha = 1;
        } 

        // SPIRALS
        else if (mode === 'SPIRALS') {
            const centerX = w / 2, centerY = h / 2, bass = fData[2] / 255;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fillRect(0, 0, w, h);
            for (let i = 0; i < 360; i += 5) {
                const magnitude = fData[i % 128] / 255;
                const radius = magnitude * (h * 0.4) + (bass * 20);
                const angle = (i * Math.PI / 180) + Date.now() * 0.001;
                const x = centerX + radius * Math.cos(angle), y = centerY + radius * Math.sin(angle);
                ctx.beginPath();
                if (magnitude > 0.8) { ctx.fillStyle = '#FFFFFF'; ctx.shadowBlur = 15; ctx.shadowColor = accent; }
                else { ctx.fillStyle = accent; ctx.shadowBlur = 0; }
                ctx.arc(x, y, 2 + (magnitude * 6), 0, Math.PI * 2); ctx.fill();
            }
        }

// PARTICLES (DIGITAL LOOM)
        else if (mode === 'PARTICLES') {
            ctx.clearRect(0, 0, w, h);
            
            const startAmount = 250;     
            const maxAmount = 600;      
            const propagateRate = 8;     
            const baseSpeed = 0.1;       
            const lifeGain = 0.35;       
            const lifeDecay = 0.98;      
            const sizeBase = 1.0;        
            const sizeMax = 2.5;         
            const lineDist = 65;         

            const currentAccent = getComputedStyle(document.documentElement).getPropertyValue('--skin-accent').trim();
            
            const getRGBColor = (colorStr) => {
                let hex = colorStr;
                if (colorStr.startsWith('rgba') || colorStr.startsWith('rgb')) {
                    const match = colorStr.match(/\d+/g);
                    return match ? `${match[0]}, ${match[1]}, ${match[2]}` : '255, 255, 255';
                }
                if (hex.startsWith('#')) hex = hex.slice(1);
                if (hex.length === 3) {
                    hex = hex.split('').map(char => char + char).join('');
                }
                if (hex.length === 6) {
                    const r = parseInt(hex.slice(0, 2), 16);
                    const g = parseInt(hex.slice(2, 4), 16);
                    const b = parseInt(hex.slice(4, 6), 16);
                    return `${r}, ${g}, ${b}`;
                }
                return '255, 255, 255';
            };

            const lineRGB = getRGBColor(currentAccent);

            const bass = fData[2] / 255;
            const mid = fData[50] / 255;
            const isBeat = bass > 0.65;

            if (!Array.isArray(app.particles)) app.particles = []; 
            if (!Array.isArray(app.sparks)) app.sparks = [];

            if (app.particles.length < startAmount) {
                for (let i = 0; i < startAmount; i++) {
                    app.particles.push({
                        x: Math.random() * w, y: Math.random() * h,
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
                        x: Math.random() * w, y: Math.random() * h,
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

                if (p.life > .05) {
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
                                    x: p.x + (dx / 2), y: p.y + (dy / 2),
                                    vx: (Math.random() - 0.5) * 6.5,
                                    vy: (Math.random() - 0.5) * 6.5,
                                    life: 1.0, color: Math.random() > 0.5 ? '#ffff00' : accent
                                });
                            }
                        }

                        if (distSq < lineDist * lineDist && (p.life > 0.1 || p2.life > 0.1)) {
                            const alpha = (1 - Math.sqrt(distSq) / lineDist) * Math.max(p.life, p2.life) * 0.5;
                            ctx.strokeStyle = `rgba(${lineRGB}, ${alpha})`;
                            ctx.lineWidth = 1.2;
                            ctx.beginPath();
                            ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y);
                            ctx.stroke();
                        }
                    }
                }

                if (p.life > 0.01) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${p.life + 0.15})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            for (let s = app.sparks.length - 1; s >= 0; s--) {
                let spark = app.sparks[s];
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
            ctx.fillText(`NODES: ${app.particles.length} | SPARKS: ${app.sparks.length}`, 20, 30);
        }

        // PARTICLES2
        else if (mode === 'PARTICLES2') {
            ctx.clearRect(0, 0, w, h);
            const bass = (fData[2] / 255) || 0;
            const mid = (fData[10] / 255) || 0;
            const isBeat = bass > 0.85;
            const centerX = w / 2, centerY = h / 2;
            const gridSize = 35; 
            const maxDist = Math.sqrt(centerX**2 + centerY**2);
            let lastDistRatio = 0;
            for (let x = gridSize; x < w; x += gridSize) {
                for (let y = gridSize; y < h; y += gridSize) {
                    const dx = x - centerX, dy = y - centerY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const distRatio = dist / maxDist;
                    lastDistRatio = distRatio;
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
                    ctx.strokeRect(px - size/2, py - size/2, size, size);
                }
            }
            ctx.globalAlpha = 1.0;
        }

        // UNKNOWN-PLEASURES
        else if (mode === 'UNKNOWN-PLEASURES') {
            if (!app.upLineBuffers || app.upLineBuffers.length !== 100) {
                app.upLineBuffers = Array(100).fill().map(() => Array(161).fill(0));
            }
            if (!app.upRotationInitialized) {
                app.upRotation = 0;
                app.upTilt = 1.0;
                window.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowLeft') app.upRotation -= 0.05;
                    if (e.key === 'ArrowRight') app.upRotation += 0.05;
                    if (e.key === 'ArrowUp') app.upTilt = Math.max(0.1, app.upTilt - 0.05);
                    if (e.key === 'ArrowDown') app.upTilt = Math.min(2.5, app.upTilt + 0.05);
                });
                app.upRotationInitialized = true;
            }

            ctx.save();
            ctx.translate(w / 2, h / 2);
            ctx.rotate(app.upRotation);
            ctx.scale(1, app.upTilt);
            ctx.translate(-w / 2, -h / 2);

            ctx.fillStyle = panelColor || '#000000';
            ctx.fillRect(0, 0, w, h);

            const numLines = 100;
            const spacing = h / (numLines + 1);
            const points = 160;
            const sliceWidth = w / points;
            const bass = (fData[2] / 255) || 0;

            for (let i = 0; i < numLines; i++) {
                ctx.beginPath();
                ctx.strokeStyle = accent;
                ctx.fillStyle = panelColor || '#000000';

                const yBase = spacing * (i + 1);
                ctx.moveTo(0, yBase);

                const distFromCenter = Math.abs(i - 50) / 50;
                const lerpSpeed = 0.8 - (distFromCenter * 0.75);

                for (let j = 0; j <= points; j++) {
                    const x = j * sliceWidth;
                    const dataIndex = Math.floor((j / points) * fData.length);
                    const value = (fData[dataIndex] / 255) || 0;

                    const distanceFromCenterNode = Math.abs(j - points / 2) / (points / 2);
                    const bellCurve = Math.max(0, 1 - Math.pow(distanceFromCenterNode, 2));

                    const lineMultiplier = (i > 20 && i < 80) ? 1.0 : 0.2;
                    const targetHeight = value * bellCurve * (45 + bass * 35) * lineMultiplier * 3.0;

                    app.upLineBuffers[i][j] += (targetHeight - app.upLineBuffers[i][j]) * Math.max(0.02, lerpSpeed);
                    const y = yBase - app.upLineBuffers[i][j];

                    if (j === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }

                ctx.lineTo(w, h);
                ctx.lineTo(0, h);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
            ctx.restore();
        }
    }
};