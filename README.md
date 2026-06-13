# Board Game Scores

Static, no-build score trackers for board games — hostable for free on GitHub Pages.

## Flip 7

Open `index.html`. Add players, set the target score (default **200**), and start.
Each round, type how many points each player earned. Running totals show at the
bottom; the first player to reach the target is crowned the winner. Scores are
saved in your browser (`localStorage`), so a refresh won't lose the game.

- **Add round** — append a new scoring row.
- **New game** — clear scores but keep the same players.

## Run locally

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server
```

then visit http://localhost:8000.

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Settings → Pages → Source: **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Your tracker will be live at `https://<username>.github.io/board_games_scores/`.
