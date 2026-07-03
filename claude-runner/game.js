(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlaySub = document.getElementById("overlay-sub");
  const startBtn = document.getElementById("startBtn");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const tokensEl = document.getElementById("tokens");

  const LOGICAL_W = 800;
  const LOGICAL_H = 360;
  const GROUND_Y = 288;
  const BEST_KEY = "claude-runner-best";

  // Crisp rendering on high-DPI screens while keeping a fixed logical coordinate space.
  function fitCanvas() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = LOGICAL_W * ratio;
    canvas.height = LOGICAL_H * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  fitCanvas();
  window.addEventListener("resize", fitCanvas);

  const STATE = { IDLE: "idle", RUNNING: "running", OVER: "over" };
  let state = STATE.IDLE;

  const player = {
    x: 110,
    y: GROUND_Y,
    w: 46,
    h: 46,
    vy: 0,
    onGround: true,
    legPhase: 0,
    squash: 1,
  };

  const GRAVITY = 0.62;
  const JUMP_VELOCITY = -12.6;
  const HOLD_GRAVITY_SCALE = 0.55; // lighter gravity while ascending + holding jump
  const MAX_FALL = 16;

  let holdingJump = false;
  let speed = 6.2;
  const SPEED_CAP = 13;
  const SPEED_GROWTH = 0.0012;

  let obstacles = [];
  let tokens = [];
  let spawnTimer = 0;
  let nextSpawnAt = 0;
  let tokenTimer = 0;
  let nextTokenAt = 0;

  let distance = 0;
  let score = 0;
  let tokenCount = 0;
  let best = Number(localStorage.getItem(BEST_KEY) || 0);
  bestEl.textContent = best;

  let groundScroll = 0;
  let bgScroll = 0;
  let particles = [];
  let shakeT = 0;

  function resetRun() {
    player.y = GROUND_Y;
    player.vy = 0;
    player.onGround = true;
    player.legPhase = 0;
    player.squash = 1;
    speed = 6.2;
    obstacles = [];
    tokens = [];
    particles = [];
    spawnTimer = 0;
    nextSpawnAt = 46;
    tokenTimer = 0;
    nextTokenAt = 70;
    distance = 0;
    score = 0;
    tokenCount = 0;
    shakeT = 0;
    scoreEl.textContent = "0";
    tokensEl.textContent = "0";
  }

  function startRun() {
    resetRun();
    state = STATE.RUNNING;
    overlay.classList.remove("visible");
  }

  function endRun() {
    state = STATE.OVER;
    const finalScore = Math.floor(score);
    if (finalScore > best) {
      best = finalScore;
      localStorage.setItem(BEST_KEY, String(best));
    }
    bestEl.textContent = best;
    overlayTitle.textContent = "Run Ended";
    overlaySub.textContent = `Score ${finalScore} · ${tokenCount} tokens collected. Press Space, tap, or click Restart to go again.`;
    startBtn.textContent = "Restart";
    overlay.classList.add("visible");
    shakeT = 14;
  }

  function jump() {
    if (state !== STATE.RUNNING) return;
    if (player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      player.squash = 1.25;
      spawnDust();
    }
  }

  function spawnDust() {
    for (let i = 0; i < 6; i++) {
      particles.push({
        x: player.x + player.w * 0.3,
        y: GROUND_Y + player.h,
        vx: -1.5 - Math.random() * 1.5,
        vy: -1 - Math.random() * 1.5,
        life: 20 + Math.random() * 10,
        r: 2 + Math.random() * 2,
      });
    }
  }

  // ---- Input ----
  function handlePressStart() {
    if (state === STATE.RUNNING) {
      holdingJump = true;
      jump();
    } else {
      startRun();
    }
  }
  function handlePressEnd() {
    holdingJump = false;
  }

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      if (!e.repeat) handlePressStart();
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") handlePressEnd();
  });

  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    handlePressStart();
  });
  canvas.addEventListener("pointerup", handlePressEnd);
  canvas.addEventListener("pointerleave", handlePressEnd);

  startBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    startRun();
  });

  // ---- Obstacles & tokens ----
  function spawnObstacle() {
    const variants = [
      { w: 26, h: 26, color: "#d1524a" },
      { w: 34, h: 22, color: "#c9433c" },
      { w: 22, h: 34, color: "#e0685f" },
    ];
    const v = variants[Math.floor(Math.random() * variants.length)];
    obstacles.push({
      x: LOGICAL_W + 20,
      y: GROUND_Y + (46 - v.h),
      w: v.w,
      h: v.h,
      color: v.color,
      legPhase: Math.random() * Math.PI * 2,
      passed: false,
    });
  }

  function spawnToken() {
    const hoverHeights = [40, 78, 112];
    const h = hoverHeights[Math.floor(Math.random() * hoverHeights.length)];
    tokens.push({
      x: LOGICAL_W + 20,
      y: GROUND_Y + player.h - h,
      r: 10,
      bob: Math.random() * Math.PI * 2,
      collected: false,
    });
  }

  function aabbHit(a, b) {
    const pad = 6;
    return (
      a.x + pad < b.x + b.w &&
      a.x + a.w - pad > b.x &&
      a.y + pad < b.y + b.h &&
      a.y + a.h - pad > b.y
    );
  }

  // ---- Update ----
  function update(dt) {
    if (state !== STATE.RUNNING) return;

    speed = Math.min(SPEED_CAP, speed + SPEED_GROWTH * dt);
    distance += speed * (dt / 16.67);
    score = distance * 0.1;
    scoreEl.textContent = Math.floor(score);

    // player physics
    const gravity = !player.onGround && holdingJump && player.vy < 0
      ? GRAVITY * HOLD_GRAVITY_SCALE
      : GRAVITY;
    player.vy = Math.min(MAX_FALL, player.vy + gravity * (dt / 16.67));
    player.y += player.vy * (dt / 16.67);

    if (player.y >= GROUND_Y) {
      if (!player.onGround) {
        player.squash = 0.8;
        spawnDust();
      }
      player.y = GROUND_Y;
      player.vy = 0;
      player.onGround = true;
    }

    player.squash += (1 - player.squash) * 0.2;
    if (player.onGround) {
      player.legPhase += 0.28 * (speed / 6.2) * (dt / 16.67);
    }

    // spawn obstacles
    spawnTimer += dt / 16.67;
    if (spawnTimer >= nextSpawnAt) {
      spawnTimer = 0;
      nextSpawnAt = 42 - Math.min(18, speed * 1.6) + Math.random() * 26;
      spawnObstacle();
    }

    // spawn tokens
    tokenTimer += dt / 16.67;
    if (tokenTimer >= nextTokenAt) {
      tokenTimer = 0;
      nextTokenAt = 90 + Math.random() * 70;
      spawnToken();
    }

    // move + collide obstacles
    const playerBox = { x: player.x, y: player.y, w: player.w, h: player.h };
    for (const o of obstacles) {
      o.x -= speed * (dt / 16.67);
      o.legPhase += 0.4 * (dt / 16.67);
      if (aabbHit(playerBox, o)) {
        endRun();
        return;
      }
    }
    obstacles = obstacles.filter((o) => o.x + o.w > -20);

    // move + collect tokens
    for (const t of tokens) {
      t.x -= speed * (dt / 16.67);
      t.bob += 0.12 * (dt / 16.67);
      if (!t.collected) {
        const tokBox = { x: t.x - t.r, y: t.y - t.r, w: t.r * 2, h: t.r * 2 };
        if (aabbHit(playerBox, tokBox)) {
          t.collected = true;
          tokenCount += 1;
          tokensEl.textContent = tokenCount;
          score += 5;
          for (let i = 0; i < 8; i++) {
            particles.push({
              x: t.x,
              y: t.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              life: 22,
              r: 2 + Math.random() * 2,
              spark: true,
            });
          }
        }
      }
    }
    tokens = tokens.filter((t) => t.x > -20 && !t.collected);

    // particles
    for (const p of particles) {
      p.x += p.vx * (dt / 16.67);
      p.y += p.vy * (dt / 16.67);
      p.vy += 0.15 * (dt / 16.67);
      p.life -= dt / 16.67;
    }
    particles = particles.filter((p) => p.life > 0);

    groundScroll = (groundScroll - speed * (dt / 16.67)) % 40;
    bgScroll = (bgScroll - speed * 0.35 * (dt / 16.67)) % 80;

    if (shakeT > 0) shakeT -= dt / 16.67;
  }

  // ---- Drawing ----
  function drawBackground() {
    ctx.fillStyle = "#1f1d19";
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // faint receding grid, terminal vibe
    ctx.strokeStyle = "rgba(218,119,86,0.07)";
    ctx.lineWidth = 1;
    for (let x = bgScroll - 80; x < LOGICAL_W; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GROUND_Y + 46);
      ctx.stroke();
    }

    // horizon glow
    const grad = ctx.createLinearGradient(0, GROUND_Y - 80, 0, GROUND_Y + 46);
    grad.addColorStop(0, "rgba(218,119,86,0)");
    grad.addColorStop(1, "rgba(218,119,86,0.10)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, GROUND_Y - 80, LOGICAL_W, 126);

    // ground line
    ctx.fillStyle = "#3a372f";
    ctx.fillRect(0, GROUND_Y + 46, LOGICAL_W, 2);

    // scrolling ground ticks
    ctx.fillStyle = "#4a4638";
    for (let x = groundScroll; x < LOGICAL_W; x += 40) {
      ctx.fillRect(x, GROUND_Y + 50, 18, 3);
    }
  }

  function drawMascot() {
    const cx = player.x + player.w / 2;
    const groundBase = GROUND_Y + player.h;
    const bodyH = player.h * player.squash;
    const bodyTop = groundBase - bodyH;
    const bob = player.onGround ? Math.sin(player.legPhase) * 2 : 0;

    ctx.save();
    ctx.translate(0, bob);

    // soft shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(cx, groundBase + 6, player.w * 0.42, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // legs (two little stubs alternating while grounded)
    const legSwing = player.onGround ? Math.sin(player.legPhase) : 0;
    ctx.fillStyle = "#a85b40";
    ctx.fillRect(cx - 14, groundBase - 10 + legSwing * 4, 8, 10);
    ctx.fillRect(cx + 6, groundBase - 10 - legSwing * 4, 8, 10);

    // body
    const bodyW = player.w;
    ctx.fillStyle = "#da7756";
    roundRect(cx - bodyW / 2, bodyTop, bodyW, bodyH, 16);
    ctx.fill();

    // belly highlight
    ctx.fillStyle = "#f0a884";
    roundRect(cx - bodyW / 2 + 8, bodyTop + bodyH * 0.42, bodyW - 16, bodyH * 0.46, 10);
    ctx.fill();

    // little arm
    ctx.fillStyle = "#c9633f";
    ctx.beginPath();
    ctx.ellipse(cx - bodyW / 2 + 2, bodyTop + bodyH * 0.55, 6, 9, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // eyes
    ctx.fillStyle = "#241b14";
    ctx.beginPath();
    ctx.ellipse(cx - 7, bodyTop + bodyH * 0.36, 4, 5.5, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 9, bodyTop + bodyH * 0.36, 4, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(cx - 8, bodyTop + bodyH * 0.33, 1.4, 1.8, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 8, bodyTop + bodyH * 0.33, 1.4, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // smile
    ctx.strokeStyle = "#241b14";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx + 1, bodyTop + bodyH * 0.5, 6, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    // sparkle antenna (nod to the CLI spinner)
    const sparkleY = bodyTop - 10 + Math.sin(player.legPhase * 0.6 + performance.now() * 0.004) * 2;
    drawSparkle(cx, sparkleY, 6, "#e8c468");

    ctx.restore();
  }

  function drawSparkle(x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
      ctx.lineTo(Math.cos(angle + Math.PI / 4) * size * 0.35, Math.sin(angle + Math.PI / 4) * size * 0.35);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawBug(o) {
    const cx = o.x + o.w / 2;
    const cy = o.y + o.h / 2;
    ctx.save();
    ctx.translate(cx, cy);

    // legs
    ctx.strokeStyle = "#241b14";
    ctx.lineWidth = 1.6;
    const swing = Math.sin(o.legPhase) * 3;
    for (const side of [-1, 1]) {
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(side * o.w * 0.3, i * (o.h * 0.22));
        ctx.lineTo(side * (o.w * 0.55) + swing * side, i * (o.h * 0.22) + swing);
        ctx.stroke();
      }
    }

    // body
    ctx.fillStyle = o.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, o.w * 0.42, o.h * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    // segment line
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -o.h * 0.4);
    ctx.lineTo(0, o.h * 0.4);
    ctx.stroke();

    // eyes
    ctx.fillStyle = "#241b14";
    ctx.beginPath();
    ctx.arc(-o.w * 0.14, -o.h * 0.1, 2.4, 0, Math.PI * 2);
    ctx.arc(o.w * 0.14, -o.h * 0.1, 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawToken(t) {
    const y = t.y + Math.sin(t.bob) * 4;
    drawSparkle(t.x, y, t.r, "#e8c468");
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(t.x, y, t.r * 1.6, 0, Math.PI * 2);
    ctx.fillStyle = "#e8c468";
    ctx.fill();
    ctx.restore();
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / 24);
      ctx.fillStyle = p.spark ? "#e8c468" : "#6b6355";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function render() {
    ctx.save();
    if (shakeT > 0) {
      ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
    }
    drawBackground();
    for (const o of obstacles) drawBug(o);
    for (const t of tokens) drawToken(t);
    drawParticles();
    drawMascot();
    ctx.restore();
  }

  // ---- Main loop ----
  let lastTime = performance.now();
  function loop(now) {
    const dt = Math.min(48, now - lastTime);
    lastTime = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  resetRun();
  render();
  requestAnimationFrame(loop);
})();
