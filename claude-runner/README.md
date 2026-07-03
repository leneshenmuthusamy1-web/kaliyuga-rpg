# Claude Runner

A tiny endless-runner arcade game starring a hand-drawn Claude Code mascot. Vanilla HTML/CSS/JS,
Canvas 2D rendering, zero dependencies and no build step.

## Playing

Open `index.html` directly in a browser, or serve the folder statically:

```bash
cd claude-runner
python3 -m http.server 8080
# visit http://localhost:8080
```

**Controls:** Space / Up arrow / click / tap to jump — hold for a higher jump. Dodge the bugs,
collect the sparkle tokens for bonus score. Best score is saved to `localStorage`.

## Files

- `index.html` — page shell, HUD, start/game-over overlay
- `style.css` — dark terminal-inspired theme
- `game.js` — game loop, physics, mascot/obstacle/token drawing, collisions, persistence
