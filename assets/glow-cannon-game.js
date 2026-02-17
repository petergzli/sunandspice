/* ================================================
 * Glow Cannon — Turmeric Pad Shooter
 * assets/glow-cannon-game.js
 * ================================================ */

class GlowCannonGame extends HTMLElement {
  connectedCallback() {
    this.SPOT_TYPES = [
      { name: 'Dark Spot',      hp: 1, radius: 0.035, color: [45, 32, 22],  points: 10, desc: 'Hyperpigmentation' },
      { name: 'Acne',           hp: 2, radius: 0.028, color: [160, 60, 60], points: 20, desc: 'Inflammatory acne' },
      { name: 'Stubborn Patch', hp: 3, radius: 0.045, color: [55, 38, 25],  points: 35, desc: 'Deep discoloration' },
      { name: 'Redness',        hp: 1, radius: 0.032, color: [170, 80, 70], points: 15, desc: 'Inflammation' },
      { name: 'Dull Zone',      hp: 2, radius: 0.05,  color: [80, 65, 55],  points: 25, desc: 'Loss of radiance' },
    ];

    this.WAVE_CONFIGS = [
      { spots: 5,  types: [0, 0, 0, 3, 3] },
      { spots: 6,  types: [0, 0, 1, 3, 3, 0] },
      { spots: 7,  types: [0, 1, 1, 3, 4, 0, 0] },
      { spots: 8,  types: [0, 1, 2, 3, 4, 1, 0, 0] },
      { spots: 9,  types: [1, 1, 2, 2, 4, 4, 0, 0, 3] },
      { spots: 10, types: [1, 2, 2, 4, 4, 1, 2, 0, 3, 3] },
      { spots: 11, types: [2, 2, 1, 1, 4, 4, 2, 0, 3, 1, 3] },
      { spots: 12, types: [2, 2, 2, 1, 4, 4, 2, 1, 3, 1, 3, 0] },
    ];

    this.POUCH_SIZE = 60;
    this.POUCH_COST = 32;

    this.state = {
      score: 0, wave: 1, pads: 60, totalShots: 0, totalHits: 0,
      totalCleared: 0, playing: false, paused: false, animId: null,
      spots: [], projectiles: [], particles: [],
      aimX: 0, aimY: 0, cannonAngle: -Math.PI / 2,
      endReason: '', pouchesUsed: 1,
    };

    this.dpr = 1;
    this.cw = 0;
    this.ch = 0;

    this.cacheElements();
    this.resize();
    this.bindEvents();
  }

  disconnectedCallback() {
    if (this.state.animId) cancelAnimationFrame(this.state.animId);
    window.removeEventListener('resize', this._onResize);
    document.removeEventListener('keydown', this._onKeyDown);
  }

  getWaveConfig(w) {
    if (w <= this.WAVE_CONFIGS.length) return this.WAVE_CONFIGS[w - 1];
    const extra = w - this.WAVE_CONFIGS.length;
    return {
      spots: 12 + extra,
      types: Array.from({ length: 12 + extra }, () => Math.floor(Math.random() * 5)),
    };
  }

  cacheElements() {
    this.areaEl = this.querySelector('#gc-gameArea');
    this.canvas = this.querySelector('#gc-gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.startScreen = this.querySelector('#gc-startScreen');
    this.endScreen = this.querySelector('#gc-endScreen');
    this.pauseScreen = this.querySelector('#gc-pauseScreen');
    this.scoreVal = this.querySelector('#gc-scoreVal');
    this.waveVal = this.querySelector('#gc-waveVal');
    this.padsVal = this.querySelector('#gc-padsVal');
    this.spotsVal = this.querySelector('#gc-spotsVal');
    this.pouchInfo = this.querySelector('#gc-pouchInfo');
    this.restockBtn = this.querySelector('#gc-restockBtn');
    this.endTitle = this.querySelector('#gc-endTitle');
    this.endScore = this.querySelector('#gc-endScore');
    this.endWave = this.querySelector('#gc-endWave');
    this.endCleared = this.querySelector('#gc-endCleared');
    this.endAccuracy = this.querySelector('#gc-endAccuracy');
    this.endPouches = this.querySelector('#gc-endPouches');
    this.endMsg = this.querySelector('#gc-endMsg');
  }

  bindEvents() {
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);

    this._onKeyDown = (e) => {
      if (e.code === 'Escape' && this.state.playing) { e.preventDefault(); this.togglePause(); }
    };
    document.addEventListener('keydown', this._onKeyDown);

    this.areaEl.addEventListener('mousemove', (e) => {
      const p = this.getPos(e);
      this.state.aimX = p.x; this.state.aimY = p.y;
    });

    this.areaEl.addEventListener('click', (e) => {
      const p = this.getPos(e);
      this.shoot(p.x, p.y);
    });

    this.areaEl.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const p = this.getPos(e);
      this.state.aimX = p.x; this.state.aimY = p.y;
    }, { passive: false });

    this.areaEl.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.shoot(this.state.aimX, this.state.aimY);
    }, { passive: false });

    this.areaEl.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const p = this.getPos(e);
      this.state.aimX = p.x; this.state.aimY = p.y;
    }, { passive: false });

    this.querySelector('#gc-startBtn').addEventListener('click', () => this.startGame());
    this.querySelector('#gc-restartBtn').addEventListener('click', () => this.startGame());
    this.querySelector('#gc-pauseBtn').addEventListener('click', () => this.togglePause());
    this.querySelector('#gc-resumeBtn').addEventListener('click', () => this.togglePause());
    this.querySelector('#gc-quitBtn').addEventListener('click', () => this.quitGame());
    this.restockBtn.addEventListener('click', () => this.restockPouch());
  }

  getPos(e) {
    const rect = this.areaEl.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }

  /* ==================== CANVAS ==================== */

  resize() {
    const rect = this.areaEl.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.cw = rect.width;
    this.ch = rect.height;
    this.canvas.width = Math.round(this.cw * this.dpr);
    this.canvas.height = Math.round(this.ch * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /* ==================== SPOTS ==================== */

  generateSpots() {
    const cfg = this.getWaveConfig(this.state.wave);
    this.state.spots = [];
    const margin = 30;
    const maxY = this.ch * 0.7;

    for (let i = 0; i < cfg.spots; i++) {
      const typeIdx = cfg.types[i] !== undefined ? cfg.types[i] : Math.floor(Math.random() * 5);
      const type = this.SPOT_TYPES[typeIdx];
      const r = type.radius * this.cw;

      let x, y, tries = 0, valid = false;
      while (!valid && tries < 100) {
        x = margin + r + Math.random() * (this.cw - 2 * margin - 2 * r);
        y = margin + r + Math.random() * (maxY - 2 * margin - 2 * r);
        valid = this.state.spots.every(s => Math.hypot(s.x - x, s.y - y) > s.r + r + 12);
        tries++;
      }

      const points = 7 + Math.floor(Math.random() * 5);
      const shape = [];
      for (let p = 0; p < points; p++) {
        const angle = (p / points) * Math.PI * 2;
        const wobble = r * (0.7 + Math.random() * 0.5);
        shape.push({ angle, dist: wobble });
      }

      this.state.spots.push({
        x, y, r, shape, type, typeIdx,
        hp: type.hp, maxHp: type.hp,
        hitFlash: 0, cleared: false,
        growthScale: 0.3,
        growthRate: 0.0008 + Math.random() * 0.0004 + this.state.wave * 0.0001,
        maxScale: 2.5,
      });
    }
  }

  /* ==================== SHOOT ==================== */

  shoot(targetX, targetY) {
    const S = this.state;
    if (!S.playing || S.paused || S.pads <= 0) return;

    const cx = this.cw / 2, cy = this.ch - 10;
    const dx = targetX - cx, dy = targetY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist < 30 || targetY > this.ch - 40) return;

    const speed = 7;
    const nx = dx / dist, ny = dy / dist;

    S.projectiles.push({
      x: cx, y: cy - 40,
      vx: nx * speed, vy: ny * speed,
      active: true,
    });

    S.pads--;
    S.totalShots++;
    this.updateUI();
  }

  /* ==================== GAME LOOP ==================== */

  loop() {
    const S = this.state;
    if (!S.playing) return;
    if (S.paused) { S.animId = requestAnimationFrame(() => this.loop()); return; }

    // Cannon angle
    const cx = this.cw / 2, cy = this.ch - 10;
    const targetAngle = Math.atan2(S.aimY - cy, S.aimX - cx);
    const clamped = Math.max(-Math.PI + 0.2, Math.min(-0.2, targetAngle));
    S.cannonAngle += (clamped - S.cannonAngle) * 0.15;

    // Update projectiles
    S.projectiles.forEach(p => {
      if (!p.active) return;
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -20 || p.x > this.cw + 20 || p.y < -20 || p.y > this.ch + 20) {
        p.active = false;
        return;
      }

      S.spots.forEach(spot => {
        if (spot.cleared) return;
        const d = Math.hypot(p.x - spot.x, p.y - spot.y);
        if (d < spot.r * spot.growthScale + 12) {
          p.active = false;
          this.hitSpot(spot, p);
        }
      });
    });

    S.projectiles = S.projectiles.filter(p => p.active);

    // Grow spots
    let anyOvergrown = false;
    S.spots.forEach(spot => {
      if (spot.cleared) return;
      spot.growthScale += spot.growthRate;
      if (spot.growthScale >= spot.maxScale) anyOvergrown = true;
    });

    // Particles
    S.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life -= p.decay;
    });
    S.particles = S.particles.filter(p => p.life > 0);

    // Check conditions
    const remaining = S.spots.filter(s => !s.cleared).length;
    if (remaining === 0) {
      this.advanceWave();
    } else if (anyOvergrown) {
      S.playing = false;
      S.endReason = 'spread';
      setTimeout(() => this.showEnd(), 300);
    } else if (S.pads <= 0 && S.projectiles.length === 0) {
      S.playing = false;
      S.endReason = 'pads';
      setTimeout(() => this.showEnd(), 400);
    }

    this.draw();
    S.animId = requestAnimationFrame(() => this.loop());
  }

  /* ==================== HIT ==================== */

  hitSpot(spot, proj) {
    const S = this.state;
    spot.hp--;
    spot.hitFlash = 1;
    S.totalHits++;

    spot.growthScale = Math.max(0.2, spot.growthScale * 0.65);

    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      S.particles.push({
        x: proj.x, y: proj.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
        color: spot.hp > 0 ? '#FFD76A' : '#5CB85C',
      });
    }

    const rect = this.areaEl.getBoundingClientRect();
    const sx = rect.left + spot.x, sy = rect.top + spot.y;

    if (spot.hp <= 0) {
      spot.cleared = true;
      S.totalCleared++;
      S.score += spot.type.points * S.wave;
      this.spawnFloat(sx, sy, `+${spot.type.points * S.wave} \u2728`, '#5CB85C');
      this.spawnSparks(sx, sy);
    } else {
      this.spawnFloat(sx, sy, `${spot.hp} left`, '#E8A830');
    }

    this.updateUI();
  }

  /* ==================== DRAW ==================== */

  draw() {
    const S = this.state;
    const ctx = this.ctx;
    const cw = this.cw, ch = this.ch;
    ctx.clearRect(0, 0, cw, ch);

    this.drawSkinBg();

    S.spots.forEach(spot => { if (!spot.cleared) this.drawSpot(spot); });
    S.spots.forEach(spot => { if (spot.cleared) this.drawClearedSpot(spot); });

    // Projectiles
    S.projectiles.forEach(p => {
      if (!p.active) return;

      ctx.save();
      ctx.globalAlpha = 0.25;
      const tGrad = ctx.createRadialGradient(p.x - p.vx * 2, p.y - p.vy * 2, 0, p.x - p.vx * 2, p.y - p.vy * 2, 22);
      tGrad.addColorStop(0, '#FFE060');
      tGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = tGrad;
      ctx.beginPath();
      ctx.arc(p.x - p.vx * 2, p.y - p.vy * 2, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(p.x, p.y);

      const glowR = 18;
      const outerGlow = ctx.createRadialGradient(0, 0, 8, 0, 0, glowR);
      outerGlow.addColorStop(0, 'rgba(255,224,80,0.3)');
      outerGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(0, 0, glowR, 0, Math.PI * 2);
      ctx.fill();

      const padR = 13;
      const padGrad = ctx.createRadialGradient(-2, -2, 0, 0, 0, padR);
      padGrad.addColorStop(0, '#FFF0A0');
      padGrad.addColorStop(0.35, '#FFD840');
      padGrad.addColorStop(0.75, '#F0B820');
      padGrad.addColorStop(1, '#D89818');
      ctx.fillStyle = padGrad;
      ctx.beginPath();
      ctx.arc(0, 0, padR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#C08010';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(-2, -3, padR * 0.6, -0.8, 1.2);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    });

    // Particles
    S.particles.forEach(p => {
      if (p.life <= 0) return;
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    this.drawCannon();

    if (S.playing && !S.paused && S.pads > 0) this.drawAimLine();

    // Red vignette warning
    const worstScale = Math.max(...S.spots.filter(s => !s.cleared).map(s => s.growthScale / s.maxScale), 0);
    if (worstScale > 0.7) {
      const intensity = (worstScale - 0.7) / 0.3;
      const pulse = 0.5 + Math.sin(Date.now() * 0.012) * 0.3;
      ctx.save();
      ctx.globalAlpha = intensity * 0.35 * pulse;
      const vg = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.3, cw / 2, ch / 2, Math.max(cw, ch) * 0.7);
      vg.addColorStop(0, 'transparent');
      vg.addColorStop(1, 'rgba(200,40,40,0.7)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, cw, ch);
      ctx.restore();
    }
  }

  drawSkinBg() {
    const ctx = this.ctx;
    const cw = this.cw, ch = this.ch;
    const S = this.state;

    const grad = ctx.createRadialGradient(cw * 0.4, ch * 0.3, 20, cw * 0.5, ch * 0.5, Math.max(cw, ch) * 0.7);
    grad.addColorStop(0, '#F5E0C8');
    grad.addColorStop(0.4, '#EACCA8');
    grad.addColorStop(1, '#D8B898');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);

    for (let i = 0; i < 800; i++) {
      ctx.fillStyle = `rgba(${170 + Math.random() * 40},${130 + Math.random() * 40},${90 + Math.random() * 30},${Math.random() * 0.04})`;
      ctx.fillRect(Math.random() * cw, Math.random() * ch, 1, 1);
    }

    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.font = `800 ${cw * 0.15}px 'Playfair Display', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#C4A0C9';
    ctx.fillText(`WAVE ${S.wave}`, cw / 2, ch * 0.3);
    ctx.restore();
  }

  drawSpot(spot) {
    const ctx = this.ctx;
    ctx.save();
    const hpRatio = spot.hp / spot.maxHp;
    const scale = spot.growthScale;

    if (spot.hitFlash > 0) spot.hitFlash -= 0.05;

    const [cr, cg, cb] = spot.type.color;

    // Outer feathered edge
    ctx.globalAlpha = 0.35 * hpRatio * Math.min(1, scale);
    if (spot.hitFlash > 0) ctx.globalAlpha *= (0.5 + spot.hitFlash * 0.5);
    ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
    ctx.beginPath();
    spot.shape.forEach((pt, i) => {
      const x = spot.x + Math.cos(pt.angle) * pt.dist * 1.3 * scale;
      const y = spot.y + Math.sin(pt.angle) * pt.dist * 1.3 * scale;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();

    // Core
    ctx.globalAlpha = (0.45 + 0.45 * hpRatio) * Math.min(1, scale * 0.8 + 0.2);
    if (spot.hitFlash > 0) ctx.globalAlpha = Math.min(1, ctx.globalAlpha + spot.hitFlash * 0.5);
    const coreGrad = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, spot.r * scale);
    coreGrad.addColorStop(0, `rgba(${Math.max(0,cr-15)},${Math.max(0,cg-10)},${Math.max(0,cb-8)}, 0.9)`);
    coreGrad.addColorStop(0.7, `rgba(${cr},${cg},${cb}, 0.6)`);
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    spot.shape.forEach((pt, i) => {
      const x = spot.x + Math.cos(pt.angle) * pt.dist * scale;
      const y = spot.y + Math.sin(pt.angle) * pt.dist * scale;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();

    // HP indicator
    if (spot.maxHp > 1 && scale > 0.5) {
      ctx.globalAlpha = 0.75;
      ctx.font = `700 ${Math.max(8, 10 * scale)}px 'DM Sans', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.8)`;
      ctx.lineWidth = 2.5;
      ctx.strokeText(spot.hp, spot.x, spot.y);
      ctx.fillText(spot.hp, spot.x, spot.y);
    }

    // Warning stages
    if (scale > 1.2 && scale <= 1.7) {
      const warningAlpha = (scale - 1.2) * 0.5;
      ctx.globalAlpha = warningAlpha;
      ctx.strokeStyle = '#E8A830';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, spot.r * scale * 1.15, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (scale > 1.7 && scale <= 2.1) {
      const urgency = (scale - 1.7) / 0.4;
      const pulseFlicker = 0.5 + Math.sin(Date.now() * 0.008) * 0.3;

      ctx.globalAlpha = urgency * 0.4 * pulseFlicker;
      const dangerGlow = ctx.createRadialGradient(spot.x, spot.y, spot.r * scale * 0.5, spot.x, spot.y, spot.r * scale * 1.6);
      dangerGlow.addColorStop(0, 'rgba(217,83,79,0.4)');
      dangerGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = dangerGlow;
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, spot.r * scale * 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = urgency * 0.7;
      ctx.strokeStyle = '#D9534F';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, spot.r * scale * 1.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.globalAlpha = urgency * 0.85;
      ctx.font = `700 ${Math.max(9, 11 * scale)}px 'DM Sans', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#D9534F';
      ctx.fillText('\u26A0', spot.x, spot.y - spot.r * scale * 1.0);
    }

    if (scale > 2.1) {
      const critPulse = 0.6 + Math.sin(Date.now() * 0.015) * 0.4;

      ctx.globalAlpha = 0.5 * critPulse;
      const critGlow = ctx.createRadialGradient(spot.x, spot.y, spot.r * scale * 0.3, spot.x, spot.y, spot.r * scale * 2.0);
      critGlow.addColorStop(0, 'rgba(200,40,40,0.5)');
      critGlow.addColorStop(0.6, 'rgba(217,83,79,0.25)');
      critGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = critGlow;
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, spot.r * scale * 2.0, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.8 * critPulse;
      ctx.strokeStyle = '#C0302C';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, spot.r * scale * 1.2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = 0.9 * critPulse;
      ctx.font = `800 ${Math.max(8, 8 * scale)}px 'DM Sans', sans-serif`;
      ctx.fillStyle = '#C0302C';
      ctx.textAlign = 'center';
      ctx.fillText('SPREADING!', spot.x, spot.y - spot.r * scale * 1.15);
    }

    ctx.restore();
  }

  drawClearedSpot(spot) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.5;
    const glow = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, spot.r * 1.2);
    glow.addColorStop(0, 'rgba(255,240,210,0.6)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, spot.r * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `${spot.r * 0.9}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.7;
    ctx.fillText('\u2728', spot.x, spot.y);
    ctx.restore();
  }

  drawCannon() {
    const ctx = this.ctx;
    const S = this.state;
    const cx = this.cw / 2, cy = this.ch - 10;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#9B7AA0';
    ctx.beginPath();
    ctx.ellipse(0, 5, 35, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(S.cannonAngle + Math.PI / 2);
    const barrelGrad = ctx.createLinearGradient(0, 0, 0, -45);
    barrelGrad.addColorStop(0, '#B088B8');
    barrelGrad.addColorStop(0.5, '#C4A0C9');
    barrelGrad.addColorStop(1, '#D4B0D8');
    ctx.fillStyle = barrelGrad;
    ctx.beginPath();
    ctx.roundRect(-8, -45, 16, 45, [4, 4, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,80,130,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#E8A830';
    ctx.beginPath();
    ctx.roundRect(-10, -50, 20, 8, 3);
    ctx.fill();

    ctx.globalAlpha = 0.2;
    ctx.fillStyle = 'white';
    ctx.fillRect(-5, -40, 3, 30);
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  drawAimLine() {
    const ctx = this.ctx;
    const S = this.state;
    const cx = this.cw / 2, cy = this.ch - 10;
    const dx = S.aimX - cx, dy = S.aimY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist < 20) return;

    const nx = dx / dist, ny = dy / dist;

    ctx.save();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = 'rgba(196,160,201,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + nx * 50, cy + ny * 50);
    ctx.lineTo(cx + nx * 120, cy + ny * 120);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = 'rgba(232,168,48,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(S.aimX, S.aimY, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(S.aimX - 12, S.aimY);
    ctx.lineTo(S.aimX + 12, S.aimY);
    ctx.moveTo(S.aimX, S.aimY - 12);
    ctx.lineTo(S.aimX, S.aimY + 12);
    ctx.stroke();
    ctx.restore();
  }

  /* ==================== EFFECTS ==================== */

  spawnFloat(x, y, text, color) {
    const el = document.createElement('div');
    el.className = 'gc-float-text';
    el.textContent = text;
    el.style.cssText = `left:${x - 30}px;top:${y - 10}px;color:${color};`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  spawnSparks(x, y) {
    const emojis = ['\u2728', '\uD83D\uDC9B', '\u2B50'];
    for (let i = 0; i < 4; i++) {
      const el = document.createElement('div');
      el.className = 'gc-spark';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      const dx = (Math.random() - 0.5) * 50, dy = -10 - Math.random() * 35;
      el.style.cssText = `left:${x}px;top:${y}px;font-size:0.9rem;--dx:${dx}px;--dy:${dy}px;`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 600);
    }
  }

  /* ==================== GAME FLOW ==================== */

  startGame() {
    const S = this.state;
    S.score = 0; S.wave = 1;
    S.totalShots = 0; S.totalHits = 0; S.totalCleared = 0;
    S.playing = true; S.paused = false;
    S.projectiles = []; S.particles = [];
    S.aimX = this.cw / 2; S.aimY = this.ch * 0.3;
    S.cannonAngle = -Math.PI / 2;
    S.pads = this.POUCH_SIZE;
    S.pouchesUsed = 1;
    S.endReason = '';

    this.startScreen.classList.add('gc-hidden');
    this.endScreen.classList.add('gc-hidden');
    this.pauseScreen.classList.add('gc-hidden');

    this.resize();
    this.generateSpots();
    this.updateUI();

    if (S.animId) cancelAnimationFrame(S.animId);
    S.animId = requestAnimationFrame(() => this.loop());
  }

  restockPouch() {
    const S = this.state;
    if (!S.playing || S.paused) return;
    if (S.pads > 10) return;
    S.pads += this.POUCH_SIZE;
    S.pouchesUsed++;
    this.updateUI();

    const rect = this.areaEl.getBoundingClientRect();
    this.spawnFloat(rect.left + this.cw / 2, rect.top + this.ch - 50, `\uD83E\uDDF4 +${this.POUCH_SIZE} pads!`, '#E8A830');
  }

  advanceWave() {
    const S = this.state;
    S.wave++;

    const count = Math.min(5 + S.wave, 15);
    const margin = 30;
    const maxY = this.ch * 0.7;

    for (let i = 0; i < count; i++) {
      const typeIdx = Math.floor(Math.random() * Math.min(S.wave + 1, 5));
      const type = this.SPOT_TYPES[typeIdx];
      const r = type.radius * this.cw;

      let x, y, tries = 0, valid = false;
      while (!valid && tries < 80) {
        x = margin + r + Math.random() * (this.cw - 2 * margin - 2 * r);
        y = margin + r + Math.random() * (maxY - 2 * margin - 2 * r);
        valid = S.spots.filter(s => !s.cleared).every(s =>
          Math.hypot(s.x - x, s.y - y) > s.r * s.growthScale + r + 15
        );
        tries++;
      }
      if (!valid) continue;

      const points = 7 + Math.floor(Math.random() * 5);
      const shape = [];
      for (let p = 0; p < points; p++) {
        const angle = (p / points) * Math.PI * 2;
        const wobble = r * (0.7 + Math.random() * 0.5);
        shape.push({ angle, dist: wobble });
      }

      S.spots.push({
        x, y, r, shape, type, typeIdx,
        hp: type.hp, maxHp: type.hp,
        hitFlash: 0, cleared: false,
        growthScale: 0.15,
        growthRate: 0.0008 + Math.random() * 0.0005 + S.wave * 0.00015,
        maxScale: 2.5,
      });
    }

    const rect = this.areaEl.getBoundingClientRect();
    this.spawnFloat(rect.left + this.cw / 2, rect.top + 60, `\u26A1 Wave ${S.wave}`, '#C4A0C9');
    this.updateUI();
  }

  showEnd() {
    const S = this.state;
    const accuracy = S.totalShots > 0 ? Math.round((S.totalHits / S.totalShots) * 100) : 0;

    const productImg = this.dataset.productImage;
    if (S.wave >= 8 && productImg) {
      this.endTitle.innerHTML = `<img src="${productImg}" alt="" class="gc-end-product-img"> Amazing Treatment!`;
    } else {
      this.endTitle.textContent = S.wave >= 8 ? 'Amazing Treatment!' : 'Game Over';
    }

    this.endScore.textContent = S.score;
    this.endWave.textContent = S.wave;
    this.endCleared.textContent = S.totalCleared;
    this.endAccuracy.textContent = accuracy + '%';
    this.endPouches.textContent = S.pouchesUsed;

    let msg;
    if (S.endReason === 'spread') msg = 'A spot spread too far! Target the ones with red warnings first.';
    else if (S.endReason === 'pads') msg = 'Ran out of pads! Hit restock or aim more carefully.';
    else if (S.wave >= 10) msg = "Master dermatologist! That skin is absolutely glowing! \uD83C\uDFC6";
    else if (S.wave >= 5) msg = 'Great treatment session! The glow is real.';
    else msg = 'Keep practicing \u2014 prioritize the growing spots!';
    this.endMsg.textContent = msg;
    this.endScreen.classList.remove('gc-hidden');
  }

  togglePause() {
    if (!this.state.playing) return;
    this.state.paused = !this.state.paused;
    this.pauseScreen.classList.toggle('gc-hidden', !this.state.paused);
  }

  quitGame() {
    this.state.paused = false;
    this.pauseScreen.classList.add('gc-hidden');
    this.state.playing = false;
    this.showEnd();
  }

  /* ==================== UI ==================== */

  updateUI() {
    const S = this.state;
    this.scoreVal.textContent = S.score;
    this.waveVal.textContent = S.wave;
    this.padsVal.textContent = S.pads;
    const remaining = S.spots.filter(s => !s.cleared).length;
    this.spotsVal.textContent = remaining;
    this.pouchInfo.textContent = `POUCH ${S.pouchesUsed} \u2022 $${S.pouchesUsed * this.POUCH_COST} spent`;

    if (S.pads <= 10 && S.playing) {
      this.restockBtn.style.display = 'block';
    } else {
      this.restockBtn.style.display = 'none';
    }
  }
}

customElements.define('glow-cannon-game-component', GlowCannonGame);
