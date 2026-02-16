/* ================================================
 * Glow Reveal — Turmeric Toner Scratch-Off Game
 * assets/glow-reveal-game.js
 * ================================================ */

class GlowRevealGame extends HTMLElement {
  connectedCallback() {
    // CONFIG — responsive grid
    const isMobile = window.innerWidth < 600;
    this.COLS = isMobile ? 4 : 6;
    this.ROWS = isMobile ? 5 : 6;
    this.BOMB_COUNT = isMobile ? 4 : 5;
    this.BONUS_COUNT = isMobile ? 3 : 4;
    this.BRUSH_RADIUS = isMobile ? 26 : 22;
    this.REVEAL_THRESHOLD = 0.45;
    this.SAMPLE_POINTS = 12;

    this.state = {
      tiles: [],
      lives: 3,
      maxLives: 3,
      score: 0,
      totalGlow: 0,
      revealedGlow: 0,
      bombsHit: 0,
      playing: false,
      paused: false,
      pressing: false,
      tileW: 0,
      tileH: 0,
      canvasW: 0,
      canvasH: 0,
      lastX: null,
      lastY: null,
    };

    this.dpr = 1;
    this.cacheElements();
    this.resize();
    this.bindEvents();
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('mouseup', this._onMouseUp);
    document.removeEventListener('keydown', this._onKeyDown);
  }

  cacheElements() {
    this.area = this.querySelector('#gr-scratchArea');
    this.skinC = this.querySelector('#gr-skinCanvas');
    this.coverC = this.querySelector('#gr-coverCanvas');
    this.skinCtx = this.skinC.getContext('2d');
    this.coverCtx = this.coverC.getContext('2d');
    this.cursor = this.querySelector('#gr-cursor');
    this.startScreen = this.querySelector('#gr-startScreen');
    this.endScreen = this.querySelector('#gr-endScreen');
    this.pauseScreen = this.querySelector('#gr-pauseScreen');
    this.livesVal = this.querySelector('#gr-livesVal');
    this.scoreVal = this.querySelector('#gr-scoreVal');
    this.glowVal = this.querySelector('#gr-glowVal');
    this.progressBar = this.querySelector('#gr-progressBar');
    this.heartsRow = this.querySelector('#gr-heartsRow');
    this.endTitle = this.querySelector('#gr-endTitle');
    this.endScore = this.querySelector('#gr-endScore');
    this.endGlow = this.querySelector('#gr-endGlow');
    this.endBombs = this.querySelector('#gr-endBombs');
    this.endMsg = this.querySelector('#gr-endMsg');
  }

  bindEvents() {
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);

    this._onMouseUp = () => {
      this.state.pressing = false;
      this.state.lastX = null;
      this.state.lastY = null;
      this.cursor.classList.remove('gr-pressing');
    };
    window.addEventListener('mouseup', this._onMouseUp);

    // Mouse
    this.area.addEventListener('mousedown', (e) => {
      this.state.pressing = true;
      this.state.lastX = null;
      this.state.lastY = null;
      this.cursor.classList.add('gr-pressing');
      const p = this.getPos(e);
      this.scratchAt(p.x, p.y);
    });

    this.area.addEventListener('mousemove', (e) => {
      this.cursor.style.left = e.clientX + 'px';
      this.cursor.style.top = e.clientY + 'px';
      if (this.state.pressing) {
        const p = this.getPos(e);
        this.scratchAt(p.x, p.y);
      }
    });

    this.area.addEventListener('mouseenter', () => this.cursor.style.display = 'block');
    this.area.addEventListener('mouseleave', () => {
      this.cursor.style.display = 'none';
      this.state.pressing = false;
      this.state.lastX = null;
      this.state.lastY = null;
      this.cursor.classList.remove('gr-pressing');
    });

    // Touch
    this.area.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.state.pressing = true;
      this.state.lastX = null;
      this.state.lastY = null;
      this.cursor.classList.add('gr-pressing');
      const p = this.getPos(e);
      this.cursor.style.display = 'block';
      this.cursor.style.left = p.cx + 'px';
      this.cursor.style.top = p.cy + 'px';
      this.scratchAt(p.x, p.y);
    }, { passive: false });

    this.area.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const p = this.getPos(e);
      this.cursor.style.left = p.cx + 'px';
      this.cursor.style.top = p.cy + 'px';
      this.scratchAt(p.x, p.y);
    }, { passive: false });

    this.area.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.state.pressing = false;
      this.state.lastX = null;
      this.state.lastY = null;
      this.cursor.classList.remove('gr-pressing');
      this.cursor.style.display = 'none';
    });

    // Keyboard
    this._onKeyDown = (e) => {
      if (e.code === 'Escape' && this.state.playing) {
        e.preventDefault();
        this.togglePause();
      }
    };
    document.addEventListener('keydown', this._onKeyDown);

    // Buttons
    this.querySelector('#gr-startBtn').addEventListener('click', () => this.startGame());
    this.querySelector('#gr-restartBtn').addEventListener('click', () => this.startGame());
    this.querySelector('#gr-pauseBtn').addEventListener('click', () => this.togglePause());
    this.querySelector('#gr-resumeBtn').addEventListener('click', () => this.togglePause());
    this.querySelector('#gr-quitBtn').addEventListener('click', () => this.quitGame());
  }

  /* ==================== CANVAS ==================== */

  getPos(e) {
    const rect = this.area.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top, cx: t.clientX, cy: t.clientY };
  }

  resize() {
    const rect = this.area.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.state.canvasW = rect.width;
    this.state.canvasH = rect.height;
    this.skinC.width = this.coverC.width = Math.round(rect.width * this.dpr);
    this.skinC.height = this.coverC.height = Math.round(rect.height * this.dpr);
    this.skinCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.coverCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.state.tileW = this.state.canvasW / this.COLS;
    this.state.tileH = this.state.canvasH / this.ROWS;
    if (this.state.playing) {
      this.drawSkin();
      this.drawCoverFull();
    }
  }

  /* ==================== TILES ==================== */

  generateTiles() {
    this.state.tiles = [];
    const total = this.COLS * this.ROWS;
    const types = [];

    for (let i = 0; i < this.BOMB_COUNT; i++) types.push('bomb');
    const bonusTypes = ['bonus-score', 'bonus-glow'];
    for (let i = 0; i < this.BONUS_COUNT; i++) types.push(bonusTypes[i % bonusTypes.length]);
    while (types.length < total) types.push('glow');

    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }

    this.state.totalGlow = types.filter(t => t === 'glow').length;

    for (let i = 0; i < total; i++) {
      this.state.tiles.push({
        type: types[i],
        row: Math.floor(i / this.COLS),
        col: i % this.COLS,
        revealed: false,
      });
    }
  }

  /* ==================== DRAW SKIN ==================== */

  drawSkin() {
    const w = this.state.canvasW, h = this.state.canvasH;
    const ctx = this.skinCtx;
    ctx.clearRect(0, 0, w, h);

    const grad = ctx.createRadialGradient(w * 0.35, h * 0.3, 20, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
    grad.addColorStop(0, '#F5E0C8');
    grad.addColorStop(0.4, '#E8CCA8');
    grad.addColorStop(1, '#D4B090');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 2000; i++) {
      ctx.fillStyle = `rgba(${170 + Math.random() * 40},${130 + Math.random() * 40},${90 + Math.random() * 30},${Math.random() * 0.05})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
    }

    const S = this.state;
    S.tiles.forEach(tile => {
      const cx = (tile.col + 0.5) * S.tileW;
      const cy = (tile.row + 0.5) * S.tileH;
      const minDim = Math.min(S.tileW, S.tileH);

      if (tile.type === 'glow') {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, minDim * 0.38);
        g.addColorStop(0, 'rgba(255,240,210,0.5)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, minDim * 0.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = `${minDim * 0.32}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\u2728', cx, cy);
      } else if (tile.type === 'bomb') {
        // Draw bomb as canvas shapes (Safari mobile doesn't render bomb emoji on canvas)
        const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, minDim * 0.42);
        bg.addColorStop(0, 'rgba(220,60,60,0.12)');
        bg.addColorStop(1, 'transparent');
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.arc(cx, cy, minDim * 0.42, 0, Math.PI * 2);
        ctx.fill();
        // Bomb body
        const r = minDim * 0.17;
        ctx.fillStyle = '#3A3A3A';
        ctx.beginPath();
        ctx.arc(cx, cy + r * 0.15, r, 0, Math.PI * 2);
        ctx.fill();
        // Fuse stem
        ctx.strokeStyle = '#5A5A5A';
        ctx.lineWidth = Math.max(1.5, r * 0.15);
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.5, cy - r * 0.65);
        ctx.quadraticCurveTo(cx + r * 1.1, cy - r * 1.5, cx + r * 0.3, cy - r * 1.4);
        ctx.stroke();
        // Spark glow
        ctx.fillStyle = '#FF6B35';
        ctx.beginPath();
        ctx.arc(cx + r * 0.3, cy - r * 1.4, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(cx + r * 0.3, cy - r * 1.4, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.arc(cx - r * 0.3, cy - r * 0.1, r * 0.28, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Bonus tiles
        const colorMap = {
          'bonus-score': 'rgba(240,176,48,0.12)',
          'bonus-glow': 'rgba(93,173,226,0.12)',
        };
        const emojiMap = { 'bonus-score': '\uD83D\uDC8E', 'bonus-glow': '\uD83C\uDF1F' };
        const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, minDim * 0.42);
        bg.addColorStop(0, colorMap[tile.type]);
        bg.addColorStop(1, 'transparent');
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.arc(cx, cy, minDim * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = `${minDim * 0.38}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emojiMap[tile.type], cx, cy);
      }
    });

    ctx.strokeStyle = 'rgba(180,140,100,0.06)';
    ctx.lineWidth = 1;
    for (let i = 1; i < this.COLS; i++) {
      ctx.beginPath(); ctx.moveTo(i * S.tileW, 0); ctx.lineTo(i * S.tileW, h); ctx.stroke();
    }
    for (let i = 1; i < this.ROWS; i++) {
      ctx.beginPath(); ctx.moveTo(0, i * S.tileH); ctx.lineTo(w, i * S.tileH); ctx.stroke();
    }
  }

  /* ==================== DRAW COVER ==================== */

  drawBlob(ctx, cx, cy, avgR, points, wobble) {
    const angleStep = (Math.PI * 2) / points;
    const pts = [];
    for (let i = 0; i < points; i++) {
      const angle = angleStep * i - Math.PI / 2;
      const r = avgR * (0.7 + Math.random() * wobble);
      pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
    }
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length; i++) {
      const curr = pts[i];
      const next = pts[(i + 1) % pts.length];
      const cpx = (curr.x + next.x) / 2 + (Math.random() - 0.5) * avgR * 0.3;
      const cpy = (curr.y + next.y) / 2 + (Math.random() - 0.5) * avgR * 0.3;
      ctx.quadraticCurveTo(curr.x, curr.y, cpx, cpy);
    }
    ctx.closePath();
  }

  drawCoverFull() {
    const S = this.state;
    const w = S.canvasW, h = S.canvasH;
    const ctx = this.coverCtx;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';

    const tileSeeds = S.tiles.map(() => ({
      hue: 18 + Math.random() * 14,
      sat: 30 + Math.random() * 20,
      light: 30 + Math.random() * 10,
      offX: (Math.random() - 0.5) * 6,
      offY: (Math.random() - 0.5) * 6,
      blobPoints: 6 + Math.floor(Math.random() * 5),
      wobble: 0.5 + Math.random() * 0.3,
    }));

    S.tiles.forEach((tile, idx) => {
      if (tile.revealed) return;
      const x = tile.col * S.tileW;
      const y = tile.row * S.tileH;
      const cx = x + S.tileW / 2;
      const cy = y + S.tileH / 2;
      const seed = tileSeeds[idx];

      const baseGrad = ctx.createLinearGradient(x, y, x + S.tileW, y + S.tileH);
      baseGrad.addColorStop(0, `hsl(${seed.hue + 3}, ${seed.sat - 12}%, ${seed.light + 14}%)`);
      baseGrad.addColorStop(0.5, `hsl(${seed.hue + 1}, ${seed.sat - 8}%, ${seed.light + 10}%)`);
      baseGrad.addColorStop(1, `hsl(${seed.hue}, ${seed.sat - 6}%, ${seed.light + 12}%)`);
      ctx.fillStyle = baseGrad;
      ctx.fillRect(x, y, S.tileW, S.tileH);

      const splotchCx = cx + seed.offX;
      const splotchCy = cy + seed.offY;
      const splotchR = S.tileW * (0.28 + Math.random() * 0.1);

      ctx.save();
      ctx.globalAlpha = 0.35;
      this.drawBlob(ctx, splotchCx, splotchCy, splotchR * 1.3, seed.blobPoints + 2, seed.wobble + 0.15);
      ctx.fillStyle = `hsl(${seed.hue}, ${seed.sat}%, ${seed.light + 2}%)`;
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.55;
      this.drawBlob(ctx, splotchCx + seed.offX * 0.3, splotchCy + seed.offY * 0.3, splotchR * 0.85, seed.blobPoints, seed.wobble);
      ctx.fillStyle = `hsl(${seed.hue - 2}, ${seed.sat + 8}%, ${seed.light - 4}%)`;
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.3;
      this.drawBlob(ctx, splotchCx + seed.offX, splotchCy + seed.offY * 0.5, splotchR * 0.45, 5 + Math.floor(Math.random() * 3), seed.wobble + 0.2);
      ctx.fillStyle = `hsl(${seed.hue - 3}, ${seed.sat + 12}%, ${seed.light - 8}%)`;
      ctx.fill();
      ctx.restore();

      if (Math.random() > 0.4) {
        const sx2 = cx + (Math.random() - 0.5) * S.tileW * 0.55;
        const sy2 = cy + (Math.random() - 0.5) * S.tileH * 0.55;
        ctx.save();
        ctx.globalAlpha = 0.25;
        this.drawBlob(ctx, sx2, sy2, splotchR * 0.35, 5 + Math.floor(Math.random() * 3), 0.6);
        ctx.fillStyle = `hsl(${seed.hue + 1}, ${seed.sat + 3}%, ${seed.light - 2}%)`;
        ctx.fill();
        ctx.restore();
      }

      for (let i = 0; i < 15; i++) {
        const px = x + Math.random() * S.tileW;
        const py = y + Math.random() * S.tileH;
        ctx.fillStyle = `hsla(${seed.hue}, ${seed.sat - 10}%, ${seed.light - 5}%, ${0.03 + Math.random() * 0.06})`;
        ctx.beginPath();
        ctx.arc(px, py, 0.4 + Math.random() * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      ctx.globalAlpha = 0.035;
      ctx.strokeStyle = `hsl(${seed.hue}, ${seed.sat - 15}%, ${seed.light - 8}%)`;
      ctx.lineWidth = 0.4;
      for (let i = 0; i < 2; i++) {
        const sx = x + Math.random() * S.tileW;
        const sy = y + Math.random() * S.tileH;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(
          sx + (Math.random() - 0.5) * S.tileW * 0.7,
          sy + (Math.random() - 0.5) * S.tileH * 0.5,
          sx + (Math.random() - 0.5) * S.tileW * 0.6,
          sy + (Math.random() - 0.5) * S.tileH * 0.5,
          sx + (Math.random() - 0.5) * S.tileW * 0.9,
          sy + (Math.random() - 0.5) * S.tileH * 0.6
        );
        ctx.stroke();
      }
      ctx.restore();

      ctx.strokeStyle = `hsla(${seed.hue}, ${seed.sat - 15}%, ${seed.light + 18}%, 0.08)`;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x + 0.5, y + 0.5, S.tileW - 1, S.tileH - 1);
    });
  }

  /* ==================== SCRATCH ==================== */

  scratchLine(x1, y1, x2, y2) {
    const ctx = this.coverCtx;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';

    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(1, Math.ceil(dist / 3));

    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t;

      const grad = ctx.createRadialGradient(px, py, 0, px, py, this.BRUSH_RADIUS);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(0.6, 'rgba(0,0,0,0.8)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, this.BRUSH_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  scratchAt(px, py) {
    if (!this.state.playing || this.state.paused) return;

    if (this.state.lastX !== null && this.state.lastY !== null) {
      this.scratchLine(this.state.lastX, this.state.lastY, px, py);
    } else {
      this.scratchLine(px, py, px, py);
    }
    this.state.lastX = px;
    this.state.lastY = py;

    this.checkTileReveals();
  }

  checkTileReveals() {
    const imageData = this.coverCtx.getImageData(0, 0, this.coverC.width, this.coverC.height);
    const data = imageData.data;
    const S = this.state;

    S.tiles.forEach((tile) => {
      if (tile.revealed) return;

      const tx = tile.col * S.tileW;
      const ty = tile.row * S.tileH;
      let transparent = 0;
      let total = 0;

      const sampleStep = Math.max(3, Math.floor(Math.min(S.tileW, S.tileH) * this.dpr / this.SAMPLE_POINTS));
      const startPx = Math.floor(tx * this.dpr) + sampleStep;
      const endPx = Math.floor((tx + S.tileW) * this.dpr) - sampleStep;
      const startPy = Math.floor(ty * this.dpr) + sampleStep;
      const endPy = Math.floor((ty + S.tileH) * this.dpr) - sampleStep;

      for (let sy = startPy; sy < endPy; sy += sampleStep) {
        for (let sx = startPx; sx < endPx; sx += sampleStep) {
          const i = (sy * this.coverC.width + sx) * 4;
          total++;
          if (data[i + 3] < 80) transparent++;
        }
      }

      if (total > 0 && (transparent / total) >= this.REVEAL_THRESHOLD) {
        this.revealTile(tile);
      }
    });
  }

  revealTile(tile) {
    tile.revealed = true;

    const ctx = this.coverCtx;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fillRect(tile.col * this.state.tileW - 1, tile.row * this.state.tileH - 1, this.state.tileW + 2, this.state.tileH + 2);
    ctx.restore();

    const cx = (tile.col + 0.5) * this.state.tileW;
    const cy = (tile.row + 0.5) * this.state.tileH;
    const rect = this.area.getBoundingClientRect();
    const screenX = rect.left + cx;
    const screenY = rect.top + cy;

    switch (tile.type) {
      case 'glow':
        this.state.score += 10;
        this.state.revealedGlow++;
        this.spawnFloat(screenX, screenY, '+10', '#72BF72');
        break;
      case 'bomb':
        this.state.lives--;
        this.state.bombsHit++;
        this.spawnFloat(screenX, screenY, '\u22121 \u2764\uFE0F', '#D95050');
        this.area.classList.add('gr-shake');
        setTimeout(() => this.area.classList.remove('gr-shake'), 400);
        break;
      case 'bonus-score':
        this.state.score += 50;
        this.spawnFloat(screenX, screenY, '+50 \uD83D\uDC8E', '#D4A843');
        this.spawnSparks(screenX, screenY);
        break;
      case 'bonus-glow':
        this.state.score += 15;
        this.spawnFloat(screenX, screenY, 'GLOW BURST!', '#5DADE2');
        this.spawnSparks(screenX, screenY);
        setTimeout(() => {
          this.revealAdjacentGlow(tile);
          this.updateUI();
          this.checkEnd();
        }, 250);
        break;
    }

    this.updateUI();
    this.checkEnd();
  }

  revealAdjacentGlow(tile) {
    const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
    const ctx = this.coverCtx;
    dirs.forEach(([dr, dc]) => {
      const nr = tile.row + dr, nc = tile.col + dc;
      if (nr < 0 || nr >= this.ROWS || nc < 0 || nc >= this.COLS) return;
      const ni = nr * this.COLS + nc;
      const neighbor = this.state.tiles[ni];
      if (!neighbor.revealed && neighbor.type === 'glow') {
        neighbor.revealed = true;
        this.state.revealedGlow++;
        this.state.score += 5;
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.fillRect(neighbor.col * this.state.tileW - 1, neighbor.row * this.state.tileH - 1, this.state.tileW + 2, this.state.tileH + 2);
        ctx.restore();
      }
    });
  }

  /* ==================== GAME FLOW ==================== */

  startGame() {
    this.state.lives = 3;
    this.state.maxLives = 3;
    this.state.score = 0;
    this.state.revealedGlow = 0;
    this.state.bombsHit = 0;
    this.state.playing = true;
    this.state.paused = false;
    this.state.lastX = null;
    this.state.lastY = null;

    this.startScreen.classList.add('gr-hidden');
    this.endScreen.classList.add('gr-hidden');
    this.pauseScreen.classList.add('gr-hidden');

    this.generateTiles();
    this.resize();
    this.updateUI();
  }

  checkEnd() {
    if (this.state.lives <= 0) {
      this.state.playing = false;
      setTimeout(() => this.showEnd(false), 500);
      return;
    }
    if (this.state.revealedGlow >= this.state.totalGlow) {
      this.state.playing = false;
      this.state.score += this.state.lives * 25;
      setTimeout(() => this.showEnd(true), 300);
    }
  }

  showEnd(won) {
    this.endTitle.textContent = won ? 'Full Glow! \u2728' : 'Game Over';
    this.endScore.textContent = this.state.score;
    const pct = this.state.totalGlow > 0 ? Math.round((this.state.revealedGlow / this.state.totalGlow) * 100) : 0;
    this.endGlow.textContent = pct + '%';
    this.endBombs.textContent = this.state.bombsHit;
    let msg;
    if (won) {
      msg = this.state.bombsHit === 0 ? "Flawless glow-up! Not a single breakout! \uD83C\uDFC6" : "Beautiful radiance achieved! Your skin is glowing.";
    } else {
      msg = pct > 50 ? "So close! Over halfway to full glow \u2014 try again!" : "Those breakouts got you. Try again!";
    }
    this.endMsg.textContent = msg;
    this.endScreen.classList.remove('gr-hidden');
  }

  togglePause() {
    if (!this.state.playing) return;
    this.state.paused = !this.state.paused;
    this.pauseScreen.classList.toggle('gr-hidden', !this.state.paused);
  }

  quitGame() {
    this.state.paused = false;
    this.pauseScreen.classList.add('gr-hidden');
    this.state.playing = false;
    this.showEnd(false);
  }

  /* ==================== UI ==================== */

  updateUI() {
    this.livesVal.textContent = this.state.lives;
    this.scoreVal.textContent = this.state.score;
    const pct = this.state.totalGlow > 0 ? Math.round((this.state.revealedGlow / this.state.totalGlow) * 100) : 0;
    this.glowVal.textContent = pct + '%';
    this.progressBar.style.width = pct + '%';
    this.heartsRow.innerHTML = '';
    for (let i = 0; i < this.state.maxLives; i++) {
      const h = document.createElement('span');
      h.className = 'gr-heart' + (i >= this.state.lives ? ' gr-lost' : '');
      h.textContent = '\u2764\uFE0F';
      this.heartsRow.appendChild(h);
    }
  }

  /* ==================== EFFECTS ==================== */

  spawnFloat(x, y, text, color) {
    const el = document.createElement('div');
    el.className = 'gr-float-text';
    el.textContent = text;
    el.style.cssText = `left:${x - 35}px;top:${y - 10}px;color:${color};`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  spawnSparks(x, y) {
    const emojis = ['\u2728', '\uD83D\uDC9C', '\u2B50'];
    for (let i = 0; i < 5; i++) {
      const el = document.createElement('div');
      el.className = 'gr-spark';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      const dx = (Math.random() - 0.5) * 70, dy = -15 - Math.random() * 45;
      el.style.cssText = `left:${x}px;top:${y}px;--dx:${dx}px;--dy:${dy}px;`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 700);
    }
  }
}

customElements.define('glow-reveal-game-component', GlowRevealGame);
