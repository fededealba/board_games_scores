"use strict";

const STORAGE_KEY = "flip7-state";

const defaultState = () => ({
  players: [],     // [{ id, name }]
  rounds: [],      // [{ [playerId]: number }]
  target: 200,
  started: false,
});

let state = load() || defaultState();

/* ---------- persistence ---------- */
function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
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

function totalFor(playerId) {
  return state.rounds.reduce((sum, r) => sum + (Number(r[playerId]) || 0), 0);
}

// Returns the winning player id, or null if no one has reached the target.
function winnerId() {
  let best = null;
  let bestTotal = -Infinity;
  for (const p of state.players) {
    const t = totalFor(p.id);
    if (t >= state.target && t > bestTotal) {
      bestTotal = t;
      best = p.id;
    }
  }
  return best;
}

// Player id with the highest total (regardless of target).
function leaderId() {
  let best = null;
  let bestTotal = -Infinity;
  for (const p of state.players) {
    const t = totalFor(p.id);
    if (t > bestTotal) {
      bestTotal = t;
      best = p.id;
    }
  }
  return best;
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
  // header
  const head = $("score-head");
  head.innerHTML = "<th>Round</th>";
  state.players.forEach((p) => {
    const th = document.createElement("th");
    th.textContent = p.name;
    head.appendChild(th);
  });

  // body — one row per round
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
// fixed) even after someone crosses the target.
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
  $("target-input").value = state.target;
  if (state.started) {
    $("setup").classList.add("hidden");
    $("game").classList.remove("hidden");
    renderGame();
  } else {
    $("setup").classList.remove("hidden");
    $("game").classList.add("hidden");
    renderSetup();
  }
}

/* ---------- events ---------- */
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

$("target-input").addEventListener("input", (e) => {
  const v = Number(e.target.value);
  state.target = v > 0 ? v : 200;
  save();
  if (state.started) renderGame();
});

$("start-btn").addEventListener("click", () => {
  state.started = true;
  if (state.rounds.length === 0) state.rounds.push({});
  save();
  render();
});

$("add-round-btn").addEventListener("click", () => {
  state.rounds.push({});
  save();
  renderGame();
});

$("new-game-btn").addEventListener("click", () => {
  if (!confirm("Start a new game? Current scores will be cleared.")) return;
  const players = state.players; // keep the same roster
  state = defaultState();
  state.players = players;
  state.target = Number($("target-input").value) || 200;
  save();
  render();
});

render();
