/**
 * Turmeric Harvest Game — Custom Element
 *
 * A mini farming game where players plant, water, and harvest turmeric
 * within a 90-second timer. Wrapped as a Web Component so it initializes
 * cleanly inside a Shopify section and cleans up on disconnect.
 */

const GRID_SIZE = 20;
const GAME_TIME = 90;
const WATER_NEEDED = 3;
const MAX_WATER_BEFORE_RUIN = 4;
const MAX_WATER = 30;
const WATER_REGEN_MS = 3000;
const WELL_PER_TAP = 1;

class TurmericGameComponent extends HTMLElement {
  connectedCallback() {
    this.plots = [];
    this.currentTool = 'plant';
    this.score = 0;
    this.ruined = 0;
    this.water = 20;
    this.timeLeft = GAME_TIME;
    this.timerInterval = null;
    this.waterInterval = null;
    this.gameActive = false;

    this.gridEl = this.querySelector('#tg-grid');
    this.scoreEl = this.querySelector('#tg-score');
    this.waterEl = this.querySelector('#tg-water');
    this.timerEl = this.querySelector('#tg-timer');
    this.paused = false;
    this.startOverlay = this.querySelector('#tg-startOverlay');
    this.endOverlay = this.querySelector('#tg-endOverlay');
    this.pauseOverlay = this.querySelector('#tg-pauseOverlay');
    this.pauseBtn = this.querySelector('#tg-pauseBtn');
    this.endBtn = this.querySelector('#tg-endBtn');
    this.wellBtn = this.querySelector('#tg-wellBtn');

    this.spawnPetals();
    this.buildGrid();
    this.bindTools();
    this.bindOverlayButtons();
    this.bindWell();
    this.bindShare();
  }

  disconnectedCallback() {
    clearInterval(this.timerInterval);
    clearInterval(this.waterInterval);
  }

  // --- Floating petals ---
  spawnPetals() {
    const scene = this.querySelector('.tg-scene');
    const petals = ['🌼', '🪷', '🌺'];
    for (let i = 0; i < 6; i++) {
      const p = document.createElement('div');
      p.className = 'tg-petal';
      p.textContent = petals[Math.floor(Math.random() * petals.length)];
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = (8 + Math.random() * 10) + 's';
      p.style.animationDelay = (Math.random() * 12) + 's';
      p.style.fontSize = (0.7 + Math.random() * 0.6) + 'rem';
      scene.appendChild(p);
    }
  }

  // --- Grid setup ---
  buildGrid() {
    this.gridEl.innerHTML = '';
    this.plots = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      const plot = { state: 'empty', waters: 0, el: null };
      const div = document.createElement('div');
      div.className = 'tg-plot';
      div.innerHTML = '<div class="tg-plot-content"></div>';
      div.addEventListener('click', () => this.handleClick(i));
      this.gridEl.appendChild(div);
      plot.el = div;
      this.plots.push(plot);
    }
  }

  // --- Tool buttons ---
  bindTools() {
    this.querySelectorAll('.tg-tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.querySelectorAll('.tg-tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTool = btn.dataset.tool;
      });
    });
  }

  // --- Overlay buttons ---
  bindOverlayButtons() {
    this.querySelector('#tg-startBtn').addEventListener('click', () => this.startGame());
    this.querySelector('#tg-restartBtn').addEventListener('click', () => this.startGame());
    this.querySelector('#tg-resumeBtn').addEventListener('click', () => this.resumeGame());
    this.pauseBtn.addEventListener('click', () => this.pauseGame());
    this.endBtn.addEventListener('click', () => this.endGame());
  }

  // --- Click handler ---
  handleClick(i) {
    if (!this.gameActive || this.paused) return;
    const plot = this.plots[i];

    if (this.currentTool === 'plant' && plot.state === 'empty') {
      plot.state = 'planted';
      plot.waters = 0;
      this.updatePlot(i);
      this.playBounce(plot.el);
    }
    else if (this.currentTool === 'water') {
      if (plot.state === 'empty' || plot.state === 'ruined') return;
      if (this.water <= 0) return;
      this.water--;
      this.updateWater();
      plot.waters++;
      this.showWaterDrop(plot.el);
      plot.el.classList.add('wet');

      if (plot.waters >= MAX_WATER_BEFORE_RUIN) {
        plot.state = 'ruined';
        plot.el.classList.remove('harvestable', 'wet');
        plot.el.classList.add('ruined');
        this.ruined++;
        this.showFloatText(plot.el, '💀 Flooded!', 'bad');
      } else if (plot.waters >= WATER_NEEDED) {
        plot.state = 'harvestable';
        plot.el.classList.add('harvestable');
      } else if (plot.waters >= 2) {
        plot.state = 'growing2';
      } else {
        plot.state = 'growing1';
      }
      this.updatePlot(i);
    }
    else if (this.currentTool === 'harvest') {
      if (plot.state === 'empty' || plot.state === 'ruined') return;

      if (plot.state === 'harvestable') {
        this.score++;
        this.scoreEl.textContent = this.score;
        this.showSparkle(plot.el);
        this.showFloatText(plot.el, '+1 🫚', 'good');
        plot.state = 'empty';
        plot.waters = 0;
        plot.el.classList.remove('harvestable', 'wet');
        this.updatePlot(i);
        this.playBounce(plot.el);
      } else {
        plot.state = 'ruined';
        plot.el.classList.remove('wet', 'harvestable');
        plot.el.classList.add('ruined');
        this.ruined++;
        this.showFloatText(plot.el, '💀 Too early!', 'bad');
        this.updatePlot(i);
      }
    }
    else if (this.currentTool === 'remove') {
      if (plot.state === 'ruined') {
        plot.state = 'empty';
        plot.waters = 0;
        plot.el.classList.remove('ruined', 'wet', 'harvestable');
        this.updatePlot(i);
        this.playBounce(plot.el);
        this.showFloatText(plot.el, '🧹 Cleared', 'bad');
      }
    }
  }

  // --- SVG states ---
  getTurmericSVG(state) {
    if (state === 'empty') return '';
    if (state === 'ruined') return `
      <svg viewBox="0 0 60 60" width="44" height="44">
        <line x1="30" y1="42" x2="28" y2="22" stroke="#5D4037" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
        <ellipse cx="22" cy="24" rx="8" ry="3.5" fill="#795548" transform="rotate(-35 22 24)" opacity="0.5"/>
        <ellipse cx="36" cy="22" rx="7" ry="3" fill="#6D4C41" transform="rotate(30 36 22)" opacity="0.5"/>
        <ellipse cx="30" cy="46" rx="8" ry="4" fill="#5D4037" opacity="0.4"/>
        <text x="30" y="38" text-anchor="middle" font-size="18" fill="#D32F2F" opacity="0.9">✕</text>
      </svg>`;
    if (state === 'planted') return `
      <svg viewBox="0 0 60 60" width="48" height="48">
        <line x1="30" y1="44" x2="30" y2="30" stroke="#6B8E23" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="26" cy="28" rx="6" ry="4" fill="#7CB342" transform="rotate(-30 26 28)"/>
        <ellipse cx="34" cy="30" rx="5" ry="3.5" fill="#8BC34A" transform="rotate(25 34 30)"/>
        <ellipse cx="30" cy="46" rx="12" ry="3" fill="rgba(0,0,0,0.15)"/>
      </svg>`;
    if (state === 'growing1') return `
      <svg viewBox="0 0 60 60" width="48" height="48">
        <line x1="30" y1="46" x2="30" y2="18" stroke="#558B2F" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="22" cy="22" rx="10" ry="4" fill="#7CB342" transform="rotate(-40 22 22)"/>
        <ellipse cx="38" cy="20" rx="10" ry="4" fill="#8BC34A" transform="rotate(35 38 20)"/>
        <ellipse cx="24" cy="32" rx="8" ry="3.5" fill="#689F38" transform="rotate(-25 24 32)"/>
        <ellipse cx="30" cy="48" rx="6" ry="4" fill="#D4A017" opacity="0.5"/>
        <ellipse cx="30" cy="46" rx="12" ry="3" fill="rgba(0,0,0,0.12)"/>
      </svg>`;
    if (state === 'growing2') return `
      <svg viewBox="0 0 60 60" width="48" height="48">
        <line x1="30" y1="48" x2="30" y2="10" stroke="#33691E" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="26" y1="46" x2="22" y2="16" stroke="#558B2F" stroke-width="2.5" stroke-linecap="round"/>
        <ellipse cx="16" cy="16" rx="13" ry="5" fill="#7CB342" transform="rotate(-45 16 16)"/>
        <ellipse cx="42" cy="14" rx="12" ry="4.5" fill="#8BC34A" transform="rotate(40 42 14)"/>
        <ellipse cx="18" cy="28" rx="10" ry="4" fill="#689F38" transform="rotate(-30 18 28)"/>
        <ellipse cx="40" cy="26" rx="10" ry="4" fill="#7CB342" transform="rotate(30 40 26)"/>
        <ellipse cx="30" cy="50" rx="9" ry="5" fill="#D4A017"/>
        <ellipse cx="24" cy="50" rx="4" ry="3" fill="#C49000" transform="rotate(-15 24 50)"/>
        <ellipse cx="36" cy="50" rx="4" ry="3" fill="#C49000" transform="rotate(15 36 50)"/>
        <ellipse cx="30" cy="47" rx="13" ry="3" fill="rgba(0,0,0,0.1)"/>
      </svg>`;
    if (state === 'harvestable') return `
      <svg viewBox="0 0 60 60" width="52" height="52">
        <line x1="30" y1="42" x2="30" y2="6" stroke="#33691E" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="26" y1="40" x2="20" y2="10" stroke="#558B2F" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="34" y1="40" x2="38" y2="12" stroke="#558B2F" stroke-width="2.5" stroke-linecap="round"/>
        <ellipse cx="14" cy="12" rx="12" ry="5" fill="#7CB342" transform="rotate(-50 14 12)"/>
        <ellipse cx="46" cy="10" rx="12" ry="5" fill="#8BC34A" transform="rotate(45 46 10)"/>
        <ellipse cx="12" cy="24" rx="10" ry="4" fill="#689F38" transform="rotate(-35 12 24)"/>
        <ellipse cx="48" cy="22" rx="10" ry="4" fill="#7CB342" transform="rotate(35 48 22)"/>
        <ellipse cx="20" cy="34" rx="8" ry="3.5" fill="#558B2F" transform="rotate(-20 20 34)"/>
        <ellipse cx="42" cy="32" rx="8" ry="3.5" fill="#689F38" transform="rotate(20 42 32)"/>
        <ellipse cx="30" cy="48" rx="12" ry="7" fill="#E8A317"/>
        <ellipse cx="30" cy="46" rx="8" ry="5" fill="#F5CE62"/>
        <ellipse cx="20" cy="50" rx="6" ry="4" fill="#D4A017" transform="rotate(-20 20 50)"/>
        <ellipse cx="40" cy="50" rx="6" ry="4" fill="#D4A017" transform="rotate(20 40 50)"/>
        <ellipse cx="30" cy="52" rx="5" ry="3" fill="#C49000"/>
        <circle cx="25" cy="47" r="1.5" fill="#C49000"/>
        <circle cx="35" cy="47" r="1.5" fill="#C49000"/>
        <circle cx="30" cy="50" r="1.5" fill="#B8860B"/>
        <ellipse cx="30" cy="48" rx="16" ry="9" fill="#FFD54F" opacity="0.2"/>
      </svg>`;
    return '';
  }

  updatePlot(i) {
    const plot = this.plots[i];
    const content = plot.el.querySelector('.tg-plot-content');
    content.innerHTML = this.getTurmericSVG(plot.state);

    const oldBar = plot.el.querySelector('.tg-progress-bar');
    if (oldBar) oldBar.remove();
    const oldCount = plot.el.querySelector('.tg-water-count');
    if (oldCount) oldCount.remove();

    if (plot.state !== 'empty' && plot.state !== 'harvestable' && plot.state !== 'ruined') {
      const pct = Math.min((plot.waters / WATER_NEEDED) * 100, 100);
      const bar = document.createElement('div');
      bar.className = 'tg-progress-bar';
      bar.innerHTML = '<div class="tg-progress-fill" style="width:' + pct + '%"></div>';
      plot.el.appendChild(bar);

      const wc = document.createElement('div');
      wc.className = 'tg-water-count';
      wc.textContent = '💧' + plot.waters + '/' + WATER_NEEDED;
      plot.el.appendChild(wc);
    }
  }

  // --- Visual effects ---
  playBounce(el) {
    el.style.transform = 'scale(0.88)';
    setTimeout(() => { el.style.transform = ''; }, 120);
  }

  showWaterDrop(el) {
    for (let j = 0; j < 3; j++) {
      const drop = document.createElement('div');
      drop.className = 'tg-water-drop';
      drop.textContent = '💧';
      drop.style.left = (20 + Math.random() * 60) + '%';
      drop.style.top = (10 + Math.random() * 30) + '%';
      drop.style.animationDelay = (j * 0.1) + 's';
      el.appendChild(drop);
      setTimeout(() => drop.remove(), 600);
    }
  }

  showSparkle(el) {
    const container = document.createElement('div');
    container.className = 'tg-sparkle';
    for (let j = 0; j < 8; j++) {
      const p = document.createElement('div');
      p.className = 'tg-sparkle-particle';
      const angle = (j / 8) * Math.PI * 2;
      const dist = 25 + Math.random() * 20;
      p.style.left = '50%';
      p.style.top = '50%';
      p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
      container.appendChild(p);
    }
    el.appendChild(container);
    setTimeout(() => container.remove(), 700);
  }

  showFloatText(el, text, type) {
    const rect = el.getBoundingClientRect();
    const div = document.createElement('div');
    div.className = 'tg-float-text ' + type;
    div.textContent = text;
    div.style.left = rect.left + rect.width / 2 - 30 + 'px';
    div.style.top = rect.top + 'px';
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 1000);
  }

  // --- HUD updates ---
  updateWater() {
    this.waterEl.textContent = this.water;
  }

  updateTimer() {
    this.timeLeft--;
    const m = Math.floor(this.timeLeft / 60);
    const s = String(this.timeLeft % 60).padStart(2, '0');
    this.timerEl.textContent = m + ':' + s;
    if (this.timeLeft <= 15) this.timerEl.classList.add('danger');
    if (this.timeLeft <= 0) this.endGame();
  }

  // --- Well (tap-to-fill) ---
  bindWell() {
    this.wellBtn.addEventListener('click', () => this.useWell());
  }

  useWell() {
    if (!this.gameActive || this.paused) return;
    if (this.water >= MAX_WATER) return;
    this.water = Math.min(this.water + WELL_PER_TAP, MAX_WATER);
    this.updateWater();
    this.playBounce(this.wellBtn);
  }

  // --- Share ---
  bindShare() {
    this.querySelector('#tg-shareHudBtn').addEventListener('click', () => this.shareGame());
    this.querySelector('#tg-shareX').addEventListener('click', () => this.shareToX());
    this.querySelector('#tg-shareFb').addEventListener('click', () => this.shareToFb());
    this.querySelector('#tg-shareCopy').addEventListener('click', () => this.copyLink());
  }

  getShareUrl() {
    return window.location.href.split('?')[0];
  }

  getShareText(withScore) {
    const base = 'Play the Turmeric Harvest game on Sun & Spice!';
    if (withScore && this.score > 0) return 'I harvested ' + this.score + ' turmeric on Sun & Spice! Can you beat my score?';
    return base;
  }

  shareGame() {
    const url = this.getShareUrl();
    const text = this.getShareText(false);
    if (navigator.share) {
      navigator.share({ title: 'Turmeric Harvest', text: text, url: url }).catch(() => {});
    } else {
      this.copyToClipboard(url);
    }
  }

  shareToX() {
    const url = this.getShareUrl();
    const text = this.getShareText(true);
    window.open('https://x.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url), '_blank');
  }

  shareToFb() {
    const url = this.getShareUrl();
    window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), '_blank');
  }

  copyLink() {
    const url = this.getShareUrl();
    const text = this.getShareText(true) + ' ' + url;
    this.copyToClipboard(text);
    const btn = this.querySelector('#tg-shareCopy');
    btn.classList.add('copied');
    btn.textContent = '✓';
    setTimeout(() => { btn.classList.remove('copied'); btn.textContent = '🔗'; }, 1500);
  }

  copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }

  // --- Game lifecycle ---
  startGame() {
    this.startOverlay.style.display = 'none';
    this.endOverlay.style.display = 'none';
    this.pauseOverlay.style.display = 'none';
    this.paused = false;
    this.score = 0;
    this.ruined = 0;
    this.water = 20;
    this.timeLeft = GAME_TIME;
    this.scoreEl.textContent = 0;
    this.updateWater();
    this.timerEl.classList.remove('danger');
    this.gameActive = true;
    this.buildGrid();
    this.bindTools();

    this.pauseBtn.style.display = '';
    this.endBtn.style.display = '';

    clearInterval(this.timerInterval);
    clearInterval(this.waterInterval);

    this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    this.waterInterval = setInterval(() => {
      if (this.water < MAX_WATER) { this.water++; this.updateWater(); }
    }, WATER_REGEN_MS);

    this.updateTimer();
    this.timeLeft++;
  }

  pauseGame() {
    if (!this.gameActive || this.paused) return;
    this.paused = true;
    clearInterval(this.timerInterval);
    clearInterval(this.waterInterval);
    this.pauseOverlay.style.display = 'flex';
  }

  resumeGame() {
    if (!this.paused) return;
    this.paused = false;
    this.pauseOverlay.style.display = 'none';
    this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    this.waterInterval = setInterval(() => {
      if (this.water < MAX_WATER) { this.water++; this.updateWater(); }
    }, WATER_REGEN_MS);
  }

  endGame() {
    this.gameActive = false;
    this.paused = false;
    clearInterval(this.timerInterval);
    clearInterval(this.waterInterval);
    this.pauseOverlay.style.display = 'none';
    this.pauseBtn.style.display = 'none';
    this.endBtn.style.display = 'none';
    this.querySelector('#tg-finalScore').textContent = this.score;

    let msg = '';
    if (this.score >= 20) msg = '🏆 Master Farmer! Golden harvest!';
    else if (this.score >= 12) msg = '🌟 Excellent, seasoned grower!';
    else if (this.score >= 6) msg = '👍 Good work, keep growing!';
    else msg = '🌱 Just getting started, try again!';
    this.querySelector('#tg-endMsg').textContent = msg;
    this.querySelector('#tg-endStats').textContent = 'Harvested: ' + this.score + ' | Ruined: ' + this.ruined;

    this.endOverlay.style.display = 'flex';
  }
}

if (!customElements.get('turmeric-game-component')) {
  customElements.define('turmeric-game-component', TurmericGameComponent);
}
