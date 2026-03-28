# Cursor demo — Tetris

A small browser Tetris-style game with a landing page: stack tetrominoes, clear lines, and keep the stack from reaching the top.

## Run locally

Open **`index.html`** in your browser for the home page, then click **Play** to open the game.

Optional: serve the folder so URLs behave like a real site:

```bash
cd /path/to/Cursor_demo
python3 -m http.server 8080
```

Then visit `http://localhost:8080/`.

## Controls

| Key | Action |
|-----|--------|
| ← / → | Move |
| ↓ | Soft drop |
| ↑ | Rotate |

After game over, refresh **`play.html`** to play again.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Landing / docs page |
| `landing.css` | Styles for the landing page |
| `play.html` | Game screen |
| `style.css` | Game UI styles |
| `tetris.js` | Game logic |
