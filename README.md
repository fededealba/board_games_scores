# Board Game Scores

Static, no-build score trackers for board games — hostable for free on GitHub Pages.

## Games

Open `index.html` and pick a game:

- **Flip 7** — first to **200** points wins.
- **Custom game** — name it, choose whether the winner has the **most** or
  **fewest** points, and set the point limit that ends the game.

Then add players and start. Each round, type how many points each player earned.
Running totals show at the bottom; the current leader is highlighted in gold.
Once any player reaches the point limit the game ends and the winner (most or
fewest points, per the rule) is crowned. Scores are saved in your browser
(`localStorage`), so a refresh won't lose the game.

- **Add round** — append a new scoring row.
- **New game** — clear scores but keep the same players.
- **‹** (top-left) — back to the game picker.

> For "fewest points" games, the limit is the score that *ends* the game: when
> any player hits it, whoever has the lowest total wins.

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
