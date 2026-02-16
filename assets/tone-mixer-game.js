/* ================================================
 * Tone Mixer — Catch the Perfect Formula
 * assets/tone-mixer-game.js
 * ================================================ */

class ToneMixerGame extends HTMLElement {
  connectedCallback() {
    this.GOOD = [
      { name: 'Turmeric',           emoji: '🌿', color: '#E8A830', points: 15, star: true },
      { name: 'Turmeric Extract',   emoji: '✨', color: '#D4960A', points: 20, star: true },
      { name: 'Chamomile',          emoji: '🌼', color: '#F0D060', points: 10 },
      { name: 'Vitamin C',          emoji: '🍊', color: '#F0882A', points: 12 },
      { name: 'Panthenol B5',       emoji: '💧', color: '#60B8E0', points: 10 },
      { name: 'Kojic Acid',         emoji: '⚗️',  color: '#D8A8D8', points: 12 },
      { name: 'Vegetable Glycerin', emoji: '💧', color: '#90D4A0', points: 8 },
      { name: 'Lemon Peel',         emoji: '🍋', color: '#E8D840', points: 10 },
      { name: 'Orange Peel',        emoji: '🍊', color: '#E8882A', points: 10 },
      { name: 'Grapefruit Extract', emoji: '🍇', color: '#E07080', points: 10 },
      { name: 'Aqua',               emoji: '💦', color: '#70B8E8', points: 5 },
      { name: 'Coco Glucoside',     emoji: '🥥', color: '#C8A878', points: 8 },
      { name: 'Lactobacillus',      emoji: '🧫', color: '#B8D8A0', points: 10 },
    ];

    this.BAD = [
      { name: 'Alcohol',     emoji: '🚫', color: '#D9534F' },
      { name: 'Parabens',    emoji: '☠️',  color: '#C04040' },
      { name: 'Fragrance',   emoji: '💨', color: '#B04848' },
      { name: 'Sulfates',    emoji: '⚠️',  color: '#D05050' },
      { name: 'Mineral Oil',  emoji: '🛢️',  color: '#A04040' },
    ];

    this.LEVELS = [
      { level: 1,  speed: 1.3, spawnInt: 82, badChance: 0.15, bowlW: 0.24, name: 'Apprentice',     emoji: '🌱', hint: 'Nice and easy — learn the ingredients!' },
      { level: 2,  speed: 1.6, spawnInt: 72, badChance: 0.18, bowlW: 0.23, name: 'Novice Mixer',    emoji: '🧴', hint: 'A little faster now. Watch for contaminants!' },
      { level: 3,  speed: 1.9, spawnInt: 64, badChance: 0.20, bowlW: 0.22, name: 'Herbalist',       emoji: '🌿', hint: 'More bad ingredients creeping in...' },
      { level: 4,  speed: 2.2, spawnInt: 56, badChance: 0.22, bowlW: 0.21, name: 'Spice Blender',   emoji: '✨', hint: 'Getting spicy! Bowl is shrinking.' },
      { level: 5,  speed: 2.5, spawnInt: 50, badChance: 0.25, bowlW: 0.20, name: 'Toner Artisan',   emoji: '⚗️',  hint: 'Ingredients fall faster now!' },
      { level: 6,  speed: 2.9, spawnInt: 44, badChance: 0.27, bowlW: 0.19, name: 'Ayurvedic Adept', emoji: '🔥', hint: 'Things are heating up!' },
      { level: 7,  speed: 3.3, spawnInt: 40, badChance: 0.30, bowlW: 0.18, name: 'Formula Sage',    emoji: '🧙', hint: 'Only the skilled survive here.' },
      { level: 8,  speed: 3.7, spawnInt: 36, badChance: 0.32, bowlW: 0.17, name: 'Glow Master',     emoji: '👑', hint: 'Near-impossible speed!' },
      { level: 9,  speed: 4.1, spawnInt: 32, badChance: 0.35, bowlW: 0.16, name: 'Turmeric Legend',  emoji: '🏆', hint: 'Legend status. Can you survive?' },
      { level: 10, speed: 4.6, spawnInt: 28, badChance: 0.38, bowlW: 0.15, name: 'Eternal Glow',    emoji: '💫', hint: 'Maximum overdrive. Good luck.' },
    ];

    this.state = {
      score: 0, lives: 3, maxLives: 3,
      combo: 0, maxCombo: 0,
      level: 1, batches: 0,
      formula: 0, formulaMax: 100,
      caught: 0,
      playing: false, paused: false,
      bowlX: 0.5, bowlW: 0.24,
      drops: [],
      spawnTimer: 0, spawnInterval: 82,
      frameCount: 0, speed: 1.3, badChance: 0.15,
      animId: null,
    };

    this.dpr = 1;
    this.cw = 0;
    this.ch = 0;
    this.keys = {};

    this.cacheElements();
    this.resize();
    this.bindEvents();
  }

  disconnectedCallback() {
    if (this.state.animId) cancelAnimationFrame(this.state.animId);
    window.removeEventListener('resize', this._onResize);
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
  }

  getLevelConfig(lvl) {
    if (lvl <= this.LEVELS.length) return this.LEVELS[lvl - 1];
    const base = this.LEVELS[this.LEVELS.length - 1];
    const extra = lvl - this.LEVELS.length;
    return {
      ...base, level: lvl,
      speed: base.speed + extra * 0.3,
      spawnInt: Math.max(18, base.spawnInt - extra * 2),
      badChance: Math.min(0.45, base.badChance + extra * 0.02),
      bowlW: Math.max(0.12, base.bowlW - extra * 0.005),
      name: `Eternal Glow +${extra}`, emoji: '💫', hint: 'Beyond the limit...',
    };
  }

  cacheElements() {
    this.areaEl = this.querySelector('#tm-gameArea');
    this.canvas = this.querySelector('#tm-gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.startScreen = this.querySelector('#tm-startScreen');
    this.endScreen = this.querySelector('#tm-endScreen');
    this.pauseScreen = this.querySelector('#tm-pauseScreen');
    this.scoreVal = this.querySelector('#tm-scoreVal');
    this.livesVal = this.querySelector('#tm-livesVal');
    this.comboVal = this.querySelector('#tm-comboVal');
    this.levelVal = this.querySelector('#tm-levelVal');
    this.formulaPct = this.querySelector('#tm-formulaPct');
    this.formulaBar = this.querySelector('#tm-formulaBar');
    this.heartsRow = this.querySelector('#tm-heartsRow');
    this.endTitle = this.querySelector('#tm-endTitle');
    this.endScore = this.querySelector('#tm-endScore');
    this.endCaught = this.querySelector('#tm-endCaught');
    this.endBatches = this.querySelector('#tm-endBatches');
    this.endCombo = this.querySelector('#tm-endCombo');
    this.endMsg = this.querySelector('#tm-endMsg');
  }

  bindEvents() {
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);

    this._onKeyDown = (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Escape' && this.state.playing) { e.preventDefault(); this.togglePause(); }
    };
    this._onKeyUp = (e) => { this.keys[e.code] = false; };
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);

    this.areaEl.addEventListener('mousemove', (e) => {
      if (!this.state.playing || this.state.paused) return;
      const rect = this.areaEl.getBoundingClientRect();
      this.state.bowlX = Math.max(this.state.bowlW / 2, Math.min(1 - this.state.bowlW / 2, (e.clientX - rect.left) / rect.width));
    });

    this.areaEl.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (!this.state.playing || this.state.paused) return;
      const rect = this.areaEl.getBoundingClientRect();
      const t = e.touches[0];
      this.state.bowlX = Math.max(this.state.bowlW / 2, Math.min(1 - this.state.bowlW / 2, (t.clientX - rect.left) / rect.width));
    }, { passive: false });

    this.areaEl.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.state.playing || this.state.paused) return;
      const rect = this.areaEl.getBoundingClientRect();
      const t = e.touches[0];
      this.state.bowlX = Math.max(this.state.bowlW / 2, Math.min(1 - this.state.bowlW / 2, (t.clientX - rect.left) / rect.width));
    }, { passive: false });

    this.querySelector('#tm-startBtn').addEventListener('click', () => this.startGame());
    this.querySelector('#tm-restartBtn').addEventListener('click', () => this.startGame());
    this.querySelector('#tm-pauseBtn').addEventListener('click', () => this.togglePause());
    this.querySelector('#tm-resumeBtn').addEventListener('click', () => this.togglePause());
    this.querySelector('#tm-quitBtn').addEventListener('click', () => this.quitGame());
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

  /* ==================== SPAWN ==================== */

  spawnDrop() {
    const S = this.state;
    const isBad = Math.random() < S.badChance;
    let item;
    if (isBad) {
      item = this.BAD[Math.floor(Math.random() * this.BAD.length)];
    } else {
      const weighted = [];
      this.GOOD.forEach(g => { weighted.push(g); if (g.star) weighted.push(g); });
      item = weighted[Math.floor(Math.random() * weighted.length)];
    }
    const size = 36 + Math.random() * 8;
    S.drops.push({
      x: 20 + Math.random() * (this.cw - 40),
      y: -size, size,
      speed: S.speed + Math.random() * 0.4,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.02,
      rotation: Math.random() * 0.3 - 0.15,
      item, isBad, caught: false, missed: false,
    });
  }

  /* ==================== GAME LOOP ==================== */

  loop() {
    const S = this.state;
    if (!S.playing) return;
    if (S.paused) { S.animId = requestAnimationFrame(() => this.loop()); return; }

    // Keyboard
    const moveSpeed = 0.025;
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) S.bowlX = Math.max(S.bowlW / 2, S.bowlX - moveSpeed);
    if (this.keys['ArrowRight'] || this.keys['KeyD']) S.bowlX = Math.min(1 - S.bowlW / 2, S.bowlX + moveSpeed);

    S.frameCount++;
    S.spawnTimer++;
    if (S.spawnTimer >= S.spawnInterval) {
      S.spawnTimer = 0;
      this.spawnDrop();
      if (S.level >= 4 && Math.random() < (S.level - 3) * 0.08) this.spawnDrop();
    }

    const bowlLeft = S.bowlX * this.cw - (S.bowlW * this.cw) / 2;
    const bowlRight = bowlLeft + S.bowlW * this.cw;
    const bowlTop = this.ch - 68;

    S.drops.forEach(d => {
      if (d.caught || d.missed) return;
      d.y += d.speed;
      d.wobble += d.wobbleSpeed;
      d.x += Math.sin(d.wobble) * 0.5;
      if (d.y + d.size / 2 > bowlTop && d.y < bowlTop + 50) {
        if (d.x > bowlLeft - 5 && d.x < bowlRight + 5) { d.caught = true; this.catchIngredient(d); return; }
      }
      if (d.y > this.ch + 20) {
        d.missed = true;
        if (!d.isBad) { S.combo = 0; this.updateUI(); }
      }
    });

    S.drops = S.drops.filter(d => !d.caught && !d.missed);
    this.draw();
    S.animId = requestAnimationFrame(() => this.loop());
  }

  /* ==================== CATCH ==================== */

  catchIngredient(drop) {
    const S = this.state;
    const rect = this.areaEl.getBoundingClientRect();
    const screenX = rect.left + drop.x;
    const screenY = rect.top + drop.y;

    if (drop.isBad) {
      S.lives--;
      S.combo = 0;
      this.spawnFlash(screenX, screenY, `\u2620\uFE0F ${drop.item.name}!`, drop.item.color);
      this.flashScreen('rgba(217,83,79,0.15)');
      if (S.lives <= 0) { S.playing = false; setTimeout(() => this.showEnd(), 400); }
    } else {
      const comboMult = 1 + Math.floor(S.combo / 5) * 0.5;
      const pts = Math.round(drop.item.points * comboMult);
      S.score += pts;
      S.combo++;
      S.caught++;
      if (S.combo > S.maxCombo) S.maxCombo = S.combo;
      const fill = drop.item.star ? 12 : 7;
      S.formula = Math.min(S.formulaMax, S.formula + fill);
      const comboText = S.combo >= 5 ? ` x${comboMult.toFixed(1)}` : '';
      this.spawnFlash(screenX, screenY, `+${pts} ${drop.item.emoji}${comboText}`, drop.item.color);
      if (S.combo >= 5 && S.combo % 5 === 0) this.spawnSparks(screenX, screenY);
      if (S.formula >= S.formulaMax) {
        S.batches++;
        S.formula = 0;
        S.score += 50 + S.level * 25;
        S.level++;
        if (S.level >= 4 && (S.level - 1) % 3 === 0 && S.lives < 5) {
          S.lives++; S.maxLives = Math.max(S.maxLives, S.lives);
        }
        this.applyLevelConfig();
        this.flashScreen('rgba(232,168,48,0.15)');
      }
    }
    this.updateUI();
  }

  /* ==================== DRAW ==================== */

  draw() {
    const S = this.state;
    const ctx = this.ctx;
    const cw = this.cw, ch = this.ch;
    ctx.clearRect(0, 0, cw, ch);

    const bg = ctx.createLinearGradient(0, 0, 0, ch);
    const warmth = Math.min(S.level * 3, 30);
    bg.addColorStop(0, '#FFFCF8');
    bg.addColorStop(1, `rgb(${255}, ${245 - warmth * 0.3}, ${232 - warmth})`);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cw, ch);

    // Level watermark
    const cfg = this.getLevelConfig(S.level);
    ctx.save();
    ctx.globalAlpha = 0.045;
    ctx.font = `800 ${cw * 0.13}px 'Playfair Display', serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#C4A0C9';
    ctx.fillText(`LVL ${S.level}`, cw / 2, ch * 0.35);
    ctx.font = `600 ${cw * 0.05}px 'DM Sans', sans-serif`;
    ctx.fillText(cfg.name, cw / 2, ch * 0.35 + cw * 0.09);
    ctx.restore();

    // Drops
    S.drops.forEach(d => {
      if (d.caught || d.missed) return;
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(Math.sin(d.wobble * 2) * d.rotation);

      const bubbleR = d.size / 2 + 4;
      ctx.beginPath(); ctx.arc(0, 0, bubbleR, 0, Math.PI * 2);
      ctx.fillStyle = d.isBad ? 'rgba(217,83,79,0.12)' : d.item.star ? 'rgba(232,168,48,0.15)' : 'rgba(92,184,92,0.1)';
      ctx.fill();

      ctx.beginPath(); ctx.arc(0, 0, bubbleR, 0, Math.PI * 2);
      ctx.strokeStyle = d.isBad ? 'rgba(217,83,79,0.4)' : d.item.star ? 'rgba(232,168,48,0.5)' : 'rgba(92,184,92,0.3)';
      ctx.lineWidth = 2; ctx.stroke();

      ctx.font = `${d.size * 0.65}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(d.item.emoji, 0, 1);

      ctx.font = `700 ${Math.max(9, d.size * 0.24)}px DM Sans, sans-serif`;
      ctx.fillStyle = d.isBad ? d.item.color : '#4A3A2A';
      ctx.globalAlpha = 0.85;
      ctx.fillText(d.item.name, 0, bubbleR + 11);
      ctx.restore();
    });

    this.drawBowl();
  }

  drawBowl() {
    const S = this.state;
    const ctx = this.ctx;
    const cw = this.cw, ch = this.ch;
    const bw = S.bowlW * cw;
    const bx = S.bowlX * cw - bw / 2;
    const by = ch - 68;
    const bh = 52;

    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(80,50,20,0.08)';
    ctx.beginPath(); ctx.ellipse(bx + bw / 2, by + bh + 3, bw / 2 + 6, 7, 0, 0, Math.PI * 2); ctx.fill();

    // Basket shape
    ctx.beginPath();
    ctx.moveTo(bx + 4, by);
    ctx.lineTo(bx + bw - 4, by);
    ctx.quadraticCurveTo(bx + bw + 6, by + bh * 0.15, bx + bw - 6, by + bh * 0.75);
    ctx.quadraticCurveTo(bx + bw / 2, by + bh + 10, bx + 6, by + bh * 0.75);
    ctx.quadraticCurveTo(bx - 6, by + bh * 0.15, bx + 4, by);
    ctx.closePath();

    const wickerGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
    wickerGrad.addColorStop(0, '#D4A860');
    wickerGrad.addColorStop(0.3, '#C89848');
    wickerGrad.addColorStop(0.7, '#B08038');
    wickerGrad.addColorStop(1, '#987030');
    ctx.fillStyle = wickerGrad;
    ctx.fill();

    // Clip for weave
    ctx.save(); ctx.clip();
    const bandH = bh / 7;
    for (let i = 0; i < 8; i++) {
      const bandY = by + i * bandH;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(160,110,50,0.25)' : 'rgba(200,160,80,0.2)';
      ctx.fillRect(bx - 5, bandY, bw + 10, bandH);
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(120,80,30,0.2)' : 'rgba(180,140,70,0.15)';
      ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(bx - 5, bandY + bandH); ctx.lineTo(bx + bw + 5, bandY + bandH); ctx.stroke();
    }

    const strandCount = Math.floor(bw / 8);
    for (let i = 0; i < strandCount; i++) {
      const sx = bx + 4 + (i / strandCount) * (bw - 8);
      for (let r = 0; r < 8; r++) {
        const ry = by + r * bandH;
        if ((i + r) % 2 === 0) {
          ctx.fillStyle = 'rgba(180,130,60,0.3)';
          ctx.fillRect(sx - 2.5, ry + 1, 5, bandH - 2);
          ctx.fillStyle = 'rgba(220,180,100,0.15)';
          ctx.fillRect(sx - 2, ry + 1, 2, bandH - 2);
        }
      }
      ctx.strokeStyle = 'rgba(120,80,30,0.1)'; ctx.lineWidth = 0.4;
      ctx.beginPath(); ctx.moveTo(sx, by); ctx.lineTo(sx, by + bh); ctx.stroke();
    }

    // Decorative band
    const bandY1 = by + bandH * 1.5;
    const patternH = bandH * 0.8;
    ctx.fillStyle = 'rgba(180,60,40,0.35)';
    ctx.fillRect(bx - 5, bandY1, bw + 10, patternH);
    ctx.strokeStyle = 'rgba(240,200,80,0.5)'; ctx.lineWidth = 1;
    const zigW = 10;
    ctx.beginPath();
    for (let zx = bx; zx < bx + bw; zx += zigW) {
      const zy = bandY1 + patternH / 2;
      ctx.lineTo(zx, zy - patternH * 0.3);
      ctx.lineTo(zx + zigW / 2, zy + patternH * 0.3);
    }
    ctx.stroke();

    const bandY2 = by + bandH * 4.5;
    ctx.fillStyle = 'rgba(40,90,120,0.25)';
    ctx.fillRect(bx - 5, bandY2, bw + 10, patternH * 0.6);
    ctx.fillStyle = 'rgba(240,200,80,0.4)';
    for (let dx = bx + 6; dx < bx + bw - 4; dx += 9) {
      ctx.beginPath(); ctx.arc(dx, bandY2 + patternH * 0.3, 1.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore(); // un-clip

    // Outline
    ctx.beginPath();
    ctx.moveTo(bx + 4, by); ctx.lineTo(bx + bw - 4, by);
    ctx.quadraticCurveTo(bx + bw + 6, by + bh * 0.15, bx + bw - 6, by + bh * 0.75);
    ctx.quadraticCurveTo(bx + bw / 2, by + bh + 10, bx + 6, by + bh * 0.75);
    ctx.quadraticCurveTo(bx - 6, by + bh * 0.15, bx + 4, by);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(100,65,25,0.4)'; ctx.lineWidth = 1.8; ctx.stroke();

    // Rim
    ctx.beginPath(); ctx.moveTo(bx + 2, by); ctx.lineTo(bx + bw - 2, by);
    ctx.strokeStyle = '#A07838'; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + 6, by - 0.5); ctx.lineTo(bx + bw - 6, by - 0.5);
    ctx.strokeStyle = 'rgba(240,210,150,0.4)'; ctx.lineWidth = 1.2; ctx.stroke();

    // Turmeric liquid
    if (S.formula > 0) {
      const fillPct = S.formula / S.formulaMax;
      const fillH = fillPct * bh * 0.45;
      const fillY = by + bh * 0.65 - fillH;
      const fillW = bw * (0.3 + fillPct * 0.15);
      ctx.beginPath(); ctx.ellipse(bx + bw / 2, fillY + fillH, fillW, fillH * 0.7 + 5, 0, 0, Math.PI * 2);
      const liqGrad = ctx.createRadialGradient(bx + bw / 2, fillY + fillH, 0, bx + bw / 2, fillY + fillH, fillW);
      liqGrad.addColorStop(0, 'rgba(232,168,48,0.65)');
      liqGrad.addColorStop(0.7, 'rgba(210,145,30,0.4)');
      liqGrad.addColorStop(1, 'rgba(180,120,20,0.15)');
      ctx.fillStyle = liqGrad; ctx.fill();
      ctx.beginPath(); ctx.ellipse(bx + bw / 2 - 4, fillY + fillH - 2, fillW * 0.5, 3, -0.15, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,230,150,0.2)'; ctx.fill();
    }

    ctx.restore();
  }

  /* ==================== EFFECTS ==================== */

  spawnFlash(x, y, text, color) {
    const el = document.createElement('div');
    el.className = 'tm-catch-flash';
    el.textContent = text;
    el.style.cssText = `left:${x - 50}px;top:${y - 15}px;color:${color};`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  spawnSparks(x, y) {
    const emojis = ['\u2728', '\u2B50', '\uD83D\uDC9B'];
    for (let i = 0; i < 4; i++) {
      const el = document.createElement('div');
      el.className = 'tm-spark';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      const dx = (Math.random() - 0.5) * 60, dy = -15 - Math.random() * 40;
      el.style.cssText = `left:${x}px;top:${y}px;font-size:1rem;--dx:${dx}px;--dy:${dy}px;`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 600);
    }
  }

  flashScreen(color) {
    const el = document.createElement('div');
    el.className = 'tm-screen-flash';
    el.style.background = color;
    this.areaEl.appendChild(el);
    setTimeout(() => el.remove(), 300);
  }

  /* ==================== GAME FLOW ==================== */

  applyLevelConfig() {
    const cfg = this.getLevelConfig(this.state.level);
    this.state.speed = cfg.speed;
    this.state.spawnInterval = cfg.spawnInt;
    this.state.badChance = cfg.badChance;
    this.state.bowlW = cfg.bowlW;
  }

  startGame() {
    const S = this.state;
    S.score = 0; S.lives = 3; S.maxLives = 3;
    S.combo = 0; S.maxCombo = 0;
    S.level = 1; S.batches = 0;
    S.formula = 0; S.caught = 0;
    S.playing = true; S.paused = false;
    S.drops = []; S.spawnTimer = 0; S.frameCount = 0;
    S.bowlX = 0.5;
    this.applyLevelConfig();

    this.startScreen.classList.add('tm-hidden');
    this.endScreen.classList.add('tm-hidden');
    this.pauseScreen.classList.add('tm-hidden');

    this.resize();
    this.updateUI();
    if (S.animId) cancelAnimationFrame(S.animId);
    S.animId = requestAnimationFrame(() => this.loop());
  }

  showEnd() {
    const S = this.state;
    const won = S.batches > 0;
    this.endTitle.textContent = won ? '\uD83E\uDDF4 Great Run!' : 'Game Over';
    this.endScore.textContent = S.score;
    this.endCaught.textContent = S.caught;
    this.endBatches.textContent = S.level;
    this.endCombo.textContent = 'x' + S.maxCombo;

    let msg;
    if (S.level >= 8) msg = "Legendary formulator! You've mastered the mix! \uD83C\uDFC6";
    else if (S.level >= 5) msg = 'Impressive! You made it to ' + this.getLevelConfig(S.level).name + '!';
    else if (S.batches >= 1) msg = 'Nice batch! Keep practicing to reach higher levels.';
    else if (S.caught > 10) msg = 'Good catching! Almost had a full formula.';
    else msg = 'Those contaminants got you \u2014 try again!';
    this.endMsg.textContent = msg;
    this.endScreen.classList.remove('tm-hidden');
  }

  togglePause() {
    if (!this.state.playing) return;
    this.state.paused = !this.state.paused;
    this.pauseScreen.classList.toggle('tm-hidden', !this.state.paused);
  }

  quitGame() {
    this.state.paused = false;
    this.pauseScreen.classList.add('tm-hidden');
    this.state.playing = false;
    this.showEnd();
  }

  /* ==================== UI ==================== */

  updateUI() {
    const S = this.state;
    this.scoreVal.textContent = S.score;
    this.livesVal.textContent = S.lives;
    const mult = 1 + Math.floor(S.combo / 5) * 0.5;
    this.comboVal.textContent = S.combo >= 5 ? `x${mult.toFixed(1)}` : 'x1';
    this.levelVal.textContent = S.level;
    const pct = Math.round((S.formula / S.formulaMax) * 100);
    this.formulaPct.textContent = pct + '%';
    this.formulaBar.style.width = pct + '%';
    this.heartsRow.innerHTML = '';
    for (let i = 0; i < S.maxLives; i++) {
      const h = document.createElement('span');
      h.className = 'tm-heart' + (i >= S.lives ? ' tm-lost' : '');
      h.textContent = '\u2764\uFE0F';
      this.heartsRow.appendChild(h);
    }
  }
}

customElements.define('tone-mixer-game-component', ToneMixerGame);
