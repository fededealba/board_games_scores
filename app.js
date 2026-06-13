"use strict";

const STORAGE_KEY = "bgs-state";

const defaultState = () => ({
  screen: "home",   // "home" | "setup" | "game"
  game: null,       // { name, mode: "most" | "least", target }
  players: [],      // [{ id, name }]
  rounds: [],       // [{ [playerId]: number }]
});

let state = load() || defaultState();

/* ---------- persistence ---------- */
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
    // basic shape check so an old/garbage payload can't break the app
    if (!s || typeof s !== "object" || !Array.isArray(s.players)) return null;
    return s;
  } catch {
    return null;
  }
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ---------- helpers ---------- */
const uid = () => Math.random().toString(36).slice(2, 9);
const $ = (id) => document.getElementById(id);
const show = (id, on) => $(id).classList.toggle("hidden", !on);

function totalFor(playerId) {
  return state.rounds.reduce((sum, r) => sum + (Number(r[playerId]) || 0), 0);
}

// True once any player has reached the point limit — this ends the game.
function limitReached() {
  return state.players.some((p) => totalFor(p.id) >= state.game.target);
}

// Best player for the current win condition: highest total ("most") or
// lowest total ("least"). Used both for the live leader and the final winner.
function bestId() {
  const least = state.game.mode === "least";
  let best = null;
  let bestTotal = least ? Infinity : -Infinity;
  for (const p of state.players) {
    const t = totalFor(p.id);
    if (least ? t < bestTotal : t > bestTotal) {
      bestTotal = t;
      best = p.id;
    }
  }
  return best;
}

// Winner only exists once the limit has been reached.
const winnerId = () => (limitReached() ? bestId() : null);
const leaderId = () => bestId();

function ruleText() {
  const g = state.game;
  return g.mode === "least"
    ? `Fewest points — ends at ${g.target}`
    : `Most points — first to ${g.target}`;
}

/* ---------- navigation ---------- */
function goHome() {
  state.screen = "home";
  save();
  render();
}

function startGame(config) {
  state.game = config;
  state.rounds = [];
  state.screen = "setup";
  save();
  render();
}

/* ---------- setup phase ---------- */
function renderSetup() {
  const list = $("player-list");
  list.innerHTML = "";
  state.players.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = p.name;
    const btn = document.createElement("button");
    btn.className = "remove";
    btn.type = "button";
    btn.textContent = "×";
    btn.title = `Remove ${p.name}`;
    btn.addEventListener("click", () => {
      state.players = state.players.filter((x) => x.id !== p.id);
      save();
      renderSetup();
    });
    li.appendChild(btn);
    list.appendChild(li);
  });
  $("start-btn").disabled = state.players.length < 1;
}

/* ---------- game phase ---------- */
function renderGame() {
  // header row
  const head = $("score-head");
  head.innerHTML = "<th>Round</th>";
  state.players.forEach((p) => {
    const th = document.createElement("th");
    th.textContent = p.name;
    head.appendChild(th);
  });

  // one row per round
  const body = $("score-body");
  body.innerHTML = "";
  state.rounds.forEach((round, ri) => {
    const tr = document.createElement("tr");
    const label = document.createElement("td");
    label.textContent = ri + 1;
    tr.appendChild(label);
    state.players.forEach((p) => {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.type = "number";
      input.inputMode = "numeric";
      input.step = "1";
      input.value = round[p.id] ?? "";
      input.placeholder = "0";
      input.addEventListener("input", () => {
        const v = input.value.trim();
        round[p.id] = v === "" ? "" : Number(v);
        save();
        updateTotals();
      });
      td.appendChild(input);
      tr.appendChild(td);
    });
    body.appendChild(tr);
  });

  updateTotals();
}

// Recompute footer totals + winner banner. Cheap; called on every keystroke.
// Inputs stay editable throughout so the whole round can be entered (and typos
// fixed) even after someone crosses the limit.
function updateTotals() {
  const win = winnerId();
  const lead = leaderId();

  const foot = $("score-total");
  foot.innerHTML = "<td>Total</td>";
  state.players.forEach((p) => {
    const td = document.createElement("td");
    td.textContent = totalFor(p.id);
    if (p.id === win) td.classList.add("winner");
    else if (p.id === lead) td.classList.add("leader");
    foot.appendChild(td);
  });

  // highlight the winning column header without rebuilding the table
  state.players.forEach((p, i) => {
    const th = $("score-head").children[i + 1];
    if (th) th.classList.toggle("col-winner", p.id === win);
  });

  const banner = $("banner");
  if (win !== null) {
    const p = state.players.find((x) => x.id === win);
    banner.textContent = `🏆 ${p.name} wins with ${totalFor(win)} points!`;
    banner.classList.remove("hidden");
  } else {
    banner.classList.add("hidden");
  }
}

/* ---------- view switching ---------- */
function render() {
  const onHome = state.screen === "home";
  show("home", onHome);
  show("setup", state.screen === "setup");
  show("game", state.screen === "game");

  $("home-btn").classList.toggle("hidden", onHome);
  $("title").textContent = onHome ? "Board Games" : state.game.name;
  $("rule").textContent = onHome ? "" : ruleText();
  $("rule").classList.toggle("hidden", onHome);

  if (state.screen === "setup") renderSetup();
  if (state.screen === "game") renderGame();
}

/* ---------- events: home ---------- */
$("pick-flip7").addEventListener("click", () => {
  startGame({ name: "Flip 7", mode: "most", target: 200 });
});

$("custom-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("custom-name").value.trim() || "Custom game";
  const mode = $("custom-mode").value === "least" ? "least" : "most";
  const target = Math.max(1, Math.floor(Number($("custom-target").value)) || 100);
  startGame({ name, mode, target });
});

$("home-btn").addEventListener("click", goHome);

/* ---------- events: setup ---------- */
$("add-player-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("player-name");
  const name = input.value.trim();
  if (!name) return;
  state.players.push({ id: uid(), name });
  input.value = "";
  input.focus();
  save();
  renderSetup();
});

$("start-btn").addEventListener("click", () => {
  if (state.rounds.length === 0) state.rounds.push({});
  state.screen = "game";
  save();
  render();
});

/* ---------- events: game ---------- */
$("add-round-btn").addEventListener("click", () => {
  state.rounds.push({});
  save();
  renderGame();
});

$("new-game-btn").addEventListener("click", () => {
  if (!confirm("Start a new game? Current scores will be cleared.")) return;
  state.rounds = [{}];
  save();
  renderGame();
});

render();
