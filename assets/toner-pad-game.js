/* ================================================
 * Turmeric Glow — Scratch & Tone Game
 * assets/toner-pad-game.js
 * ================================================ */

class TonerPadGame extends HTMLElement {
  connectedCallback() {
    this.state = {
      score: 0,
      pads: 5,
      maxPads: 5,
      timer: 60,
      wasted: 0,
      isPlaying: false,
      isPaused: false,
      isMouseDown: false,
      spots: [],
      clearedSpots: 0,
      timerInterval: null,
    };
    this.lastScrubTime = 0;
    this.cacheElements();
    this.resizeCanvas();
    this.bindEvents();
  }

  disconnectedCallback() {
    if (this.state.timerInterval) clearInterval(this.state.timerInterval);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('mouseup', this._onMouseUp);
    document.removeEventListener('keydown', this._onKeyDown);
  }

  cacheElements() {
    this.canvas = this.querySelector('#tp-gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.wrapper = this.querySelector('#tp-canvasWrapper');
    this.cursor = this.querySelector('#tp-cursor');
    this.startScreen = this.querySelector('#tp-startScreen');
    this.endScreen = this.querySelector('#tp-endScreen');
    this.pauseScreen = this.querySelector('#tp-pauseScreen');
    this.timerDisplay = this.querySelector('#tp-timerDisplay');
    this.padsDisplay = this.querySelector('#tp-padsDisplay');
    this.scoreDisplay = this.querySelector('#tp-scoreDisplay');
    this.wastedDisplay = this.querySelector('#tp-wastedDisplay');
    this.padStack = this.querySelector('#tp-padStack');
    this.finalScoreEl = this.querySelector('#tp-finalScore');
    this.endMessageEl = this.querySelector('#tp-endMessage');
  }

  bindEvents() {
    this._onResize = () => this.resizeCanvas();
    window.addEventListener('resize', this._onResize);

    this._onMouseUp = () => {
      this.state.isMouseDown = false;
      this.cursor.classList.remove('tp-pressing');
    };
    window.addEventListener('mouseup', this._onMouseUp);

    // Canvas wrapper — mouse
    this.wrapper.addEventListener('mousedown', (e) => {
      this.state.isMouseDown = true;
      this.cursor.classList.add('tp-pressing');
      this.handleScrub(e.clientX, e.clientY);
    });

    this.wrapper.addEventListener('mousemove', (e) => {
      this.cursor.style.left = e.clientX + 'px';
      this.cursor.style.top = e.clientY + 'px';
      if (this.state.isMouseDown) this.handleScrub(e.clientX, e.clientY);
    });

    this.wrapper.addEventListener('mouseenter', () => {
      this.cursor.style.display = 'block';
    });

    this.wrapper.addEventListener('mouseleave', () => {
      this.cursor.style.display = 'none';
      this.state.isMouseDown = false;
      this.cursor.classList.remove('tp-pressing');
    });

    // Canvas wrapper — touch
    this.wrapper.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.state.isMouseDown = true;
      this.cursor.classList.add('tp-pressing');
      const t = e.touches[0];
      this.cursor.style.display = 'block';
      this.cursor.style.left = t.clientX + 'px';
      this.cursor.style.top = t.clientY + 'px';
      this.handleScrub(t.clientX, t.clientY);
    }, { passive: false });

    this.wrapper.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      this.cursor.style.left = t.clientX + 'px';
      this.cursor.style.top = t.clientY + 'px';
      this.handleScrub(t.clientX, t.clientY);
    }, { passive: false });

    this.wrapper.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.state.isMouseDown = false;
      this.cursor.classList.remove('tp-pressing');
      this.cursor.style.display = 'none';
    });

    // Keyboard shortcuts
    this._onKeyDown = (e) => {
      if (e.code === 'Space' && this.state.isPlaying && !this.state.isPaused) {
        e.preventDefault();
        this.restockPads();
      }
      if (e.code === 'Escape' && this.state.isPlaying) {
        e.preventDefault();
        this.togglePause();
      }
    };
    document.addEventListener('keydown', this._onKeyDown);

    // Buttons
    this.querySelector('#tp-startBtn').addEventListener('click', () => this.startGame());
    this.querySelector('#tp-restartBtn').addEventListener('click', () => this.startGame());
    this.querySelector('#tp-restockBtn').addEventListener('click', () => this.restockPads());
    this.querySelector('#tp-pauseBtn').addEventListener('click', () => this.togglePause());
    this.querySelector('#tp-resumeBtn').addEventListener('click', () => this.togglePause());
    this.querySelector('#tp-quitBtn').addEventListener('click', () => this.quitGame());
  }

  /* ==================== CANVAS ==================== */

  resizeCanvas() {
    const rect = this.wrapper.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    if (this.state.isPlaying) this.drawScene();
  }

  /* ==================== SKIN RENDERING ==================== */

  drawSkin() {
    const w = this.canvas.width / window.devicePixelRatio;
    const h = this.canvas.height / window.devicePixelRatio;

    const grad = this.ctx.createRadialGradient(w * 0.4, h * 0.35, 30, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
    grad.addColorStop(0, '#E8C4A0');
    grad.addColorStop(0.3, '#D4A574');
    grad.addColorStop(0.7, '#C49060');
    grad.addColorStop(1, '#B07848');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, w, h);

    // Skin texture noise
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      this.ctx.fillStyle = `rgba(${180 + Math.random() * 40}, ${140 + Math.random() * 40}, ${100 + Math.random() * 30}, ${Math.random() * 0.08})`;
      this.ctx.fillRect(x, y, 1, 1);
    }

    // Subtle creases
    this.ctx.strokeStyle = 'rgba(160,120,80,0.06)';
    this.ctx.lineWidth = 0.5;
    for (let i = 0; i < 20; i++) {
      this.ctx.beginPath();
      const sx = Math.random() * w;
      const sy = Math.random() * h;
      this.ctx.moveTo(sx, sy);
      this.ctx.bezierCurveTo(
        sx + (Math.random() - 0.5) * 100, sy + (Math.random() - 0.5) * 60,
        sx + (Math.random() - 0.5) * 100, sy + (Math.random() - 0.5) * 60,
        sx + (Math.random() - 0.5) * 120, sy + (Math.random() - 0.5) * 80
      );
      this.ctx.stroke();
    }

    // Pore dots
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      this.ctx.fillStyle = `rgba(140,100,70,${0.03 + Math.random() * 0.05})`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 0.5 + Math.random(), 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  /* ==================== DARK SPOTS ==================== */

  generateSpots() {
    this.state.spots = [];
    const numSpots = 8;
    for (let i = 0; i < numSpots; i++) {
      this.spawnSpot();
    }
  }

  spawnSpot() {
    const w = this.canvas.width / window.devicePixelRatio;
    const h = this.canvas.height / window.devicePixelRatio;
    const padding = 40;
    const activeSpots = this.state.spots.filter(s => !s.cleared);

    let spot, attempts = 0;
    do {
      spot = {
        x: padding + Math.random() * (w - padding * 2),
        y: padding + Math.random() * (h - padding * 2),
        radius: 14 + Math.random() * 22,
        opacity: 0.5 + Math.random() * 0.4,
        scrubbed: 0,
        cleared: false,
        hue: Math.random() > 0.5 ? 25 : 15,
      };
      attempts++;
    } while (attempts < 50 && activeSpots.some(s => {
      const dist = Math.hypot(s.x - spot.x, s.y - spot.y);
      return dist < s.radius + spot.radius + 10;
    }));
    this.state.spots.push(spot);
  }

  drawSpots() {
    this.state.spots.forEach(spot => {
      if (spot.cleared) return;
      const remaining = 1 - spot.scrubbed;
      if (remaining <= 0) return;

      this.ctx.save();
      this.ctx.globalAlpha = spot.opacity * remaining;

      // Outer glow
      const glow = this.ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, spot.radius * 1.3);
      glow.addColorStop(0, `hsla(${spot.hue}, 40%, 28%, 0.8)`);
      glow.addColorStop(0.5, `hsla(${spot.hue}, 35%, 32%, 0.5)`);
      glow.addColorStop(1, 'transparent');
      this.ctx.fillStyle = glow;
      this.ctx.beginPath();
      this.ctx.arc(spot.x, spot.y, spot.radius * 1.3, 0, Math.PI * 2);
      this.ctx.fill();

      // Core
      const core = this.ctx.createRadialGradient(
        spot.x - spot.radius * 0.2, spot.y - spot.radius * 0.2, 0,
        spot.x, spot.y, spot.radius
      );
      core.addColorStop(0, `hsla(${spot.hue}, 45%, 22%, 0.9)`);
      core.addColorStop(0.6, `hsla(${spot.hue}, 40%, 30%, 0.7)`);
      core.addColorStop(1, `hsla(${spot.hue}, 35%, 35%, 0.2)`);
      this.ctx.fillStyle = core;
      this.ctx.beginPath();
      this.ctx.arc(spot.x, spot.y, spot.radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    });
  }

  drawClearedGlow() {
    // Only show glow for recently cleared spots (keep last 10)
    const cleared = this.state.spots.filter(s => s.cleared);
    const recent = cleared.slice(-10);
    recent.forEach(spot => {
      this.ctx.save();
      this.ctx.globalAlpha = 0.15;
      const glow = this.ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, spot.radius * 1.2);
      glow.addColorStop(0, 'rgba(196, 160, 201, 0.5)');
      glow.addColorStop(1, 'transparent');
      this.ctx.fillStyle = glow;
      this.ctx.beginPath();
      this.ctx.arc(spot.x, spot.y, spot.radius * 1.2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }

  drawScene() {
    const w = this.canvas.width / window.devicePixelRatio;
    const h = this.canvas.height / window.devicePixelRatio;
    this.ctx.clearRect(0, 0, w, h);
    this.drawSkin();
    this.drawClearedGlow();
    this.drawSpots();
  }

  /* ==================== SCRUBBING ==================== */

  getCanvasCoords(clientX, clientY) {
    const rect = this.wrapper.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  scrubAt(cx, cy) {
    if (!this.state.isPlaying || this.state.pads <= 0 || this.state.isPaused) return;

    const scrubRadius = 25;
    let hitSpot = false;

    this.state.spots.forEach(spot => {
      if (spot.cleared) return;
      const dist = Math.hypot(cx - spot.x, cy - spot.y);
      if (dist < spot.radius + scrubRadius * 0.5) {
        hitSpot = true;
        const scrubAmount = 0.08 * (1 - dist / (spot.radius + scrubRadius));
        spot.scrubbed = Math.min(1, spot.scrubbed + scrubAmount);

        if (spot.scrubbed >= 1 && !spot.cleared) {
          spot.cleared = true;
          this.state.score += 10;
          this.state.clearedSpots++;
          this.updateUI();
          this.spawnSparkles(cx, cy);
          this.spawnScorePop(cx, cy, '+10');

          // Spawn a replacement spot
          this.spawnSpot();
        }
      }
    });

    if (!hitSpot) {
      this.state.pads--;
      this.state.wasted++;
      this.updateUI();
      this.spawnPenalty(cx, cy);
      if (this.state.pads <= 0) this.updateCursor();
    }

    this.drawScene();
  }

  handleScrub(clientX, clientY) {
    const now = Date.now();
    if (now - this.lastScrubTime < 50) return;
    this.lastScrubTime = now;
    const coords = this.getCanvasCoords(clientX, clientY);
    this.scrubAt(coords.x, coords.y);
  }

  /* ==================== EFFECTS ==================== */

  spawnSparkles(x, y) {
    const rect = this.wrapper.getBoundingClientRect();
    const emojis = ['\u2728', '\u2B50', '\uD83D\uDC9C', '\uD83C\uDF1F'];
    for (let i = 0; i < 6; i++) {
      const el = document.createElement('div');
      el.className = 'tp-sparkle';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      const dx = (Math.random() - 0.5) * 80;
      const dy = -20 - Math.random() * 60;
      el.style.cssText = `left:${rect.left + x}px; top:${rect.top + y}px; --dx:${dx}px; --dy:${dy}px;`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 800);
    }
  }

  spawnPenalty(x, y) {
    const rect = this.wrapper.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'tp-penalty-flash';
    el.textContent = '\u22121 PAD \uD83D\uDCB8';
    el.style.cssText = `left:${rect.left + x - 30}px; top:${rect.top + y - 10}px;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);
  }

  spawnScorePop(x, y, text) {
    const rect = this.wrapper.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'tp-score-pop';
    el.textContent = text;
    el.style.cssText = `left:${rect.left + x - 15}px; top:${rect.top + y - 10}px;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  /* ==================== RESTOCK ==================== */

  restockPads() {
    if (!this.state.isPlaying || this.state.isPaused) return;
    if (this.state.timer <= 2) return;

    this.state.pads = this.state.maxPads;
    this.state.timer = Math.max(1, this.state.timer - 2);
    this.updateUI();
    this.updateCursor();

    const flash = document.createElement('div');
    flash.className = 'tp-restock-flash';
    this.wrapper.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
  }

  /* ==================== UI ==================== */

  updateUI() {
    this.timerDisplay.textContent = this.state.timer;
    this.padsDisplay.textContent = this.state.pads;
    this.scoreDisplay.textContent = this.state.score;
    this.wastedDisplay.textContent = this.state.wasted;

    this.timerDisplay.classList.toggle('tp-warning', this.state.timer <= 5);

    this.padStack.innerHTML = '';
    for (let i = 0; i < this.state.maxPads; i++) {
      const dot = document.createElement('div');
      dot.className = 'tp-pad-dot' + (i >= this.state.pads ? ' tp-empty' : '');
      this.padStack.appendChild(dot);
    }
  }

  updateCursor() {
    this.cursor.classList.toggle('tp-cursor-empty', this.state.pads <= 0);
  }

  /* ==================== GAME LOOP ==================== */

  startGame() {
    this.state.score = 0;
    this.state.pads = 5;
    this.state.timer = 60;
    this.state.wasted = 0;
    this.state.isPlaying = true;
    this.state.isPaused = false;
    this.state.clearedSpots = 0;

    this.startScreen.classList.add('tp-hidden');
    this.endScreen.classList.add('tp-hidden');
    this.pauseScreen.classList.add('tp-hidden');

    this.resizeCanvas();
    this.generateSpots();
    this.drawScene();
    this.updateUI();
    this.updateCursor();

    if (this.state.timerInterval) clearInterval(this.state.timerInterval);
    this.state.timerInterval = setInterval(() => {
      this.state.timer--;
      this.updateUI();
      if (this.state.timer <= 0) this.endGame();
    }, 1000);
  }

  endGame() {
    this.state.isPlaying = false;
    clearInterval(this.state.timerInterval);

    this.finalScoreEl.textContent = this.state.score;

    let msg = '';
    if (this.state.score === 0) msg = "No worries \u2014 grab some pads and try again!";
    else if (this.state.score < 100) msg = "Good start! Keep scrubbing for a higher score.";
    else if (this.state.score < 200) msg = "Impressive glow-up! Can you beat that next round?";
    else if (this.state.score < 400) msg = "Skincare pro! That's some serious turmeric power! \uD83C\uDFC6";
    else msg = "Legendary glow! You're a turmeric master! \uD83C\uDFC6\u2728";
    this.endMessageEl.textContent = msg;

    this.endScreen.classList.remove('tp-hidden');
  }

  togglePause() {
    if (!this.state.isPlaying) return;

    this.state.isPaused = !this.state.isPaused;
    this.pauseScreen.classList.toggle('tp-hidden', !this.state.isPaused);

    if (this.state.isPaused) {
      clearInterval(this.state.timerInterval);
    } else {
      this.state.timerInterval = setInterval(() => {
        this.state.timer--;
        this.updateUI();
        if (this.state.timer <= 0) this.endGame();
      }, 1000);
    }
  }

  quitGame() {
    this.state.isPaused = false;
    this.pauseScreen.classList.add('tp-hidden');
    this.endGame();
  }
}

customElements.define('toner-pad-game-component', TonerPadGame);
