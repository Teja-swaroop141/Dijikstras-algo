# Dijkstra's Algorithm Visualizer

An interactive shortest-path visualizer built with pure HTML, CSS, and JavaScript — no frameworks, no dependencies.

![Algorithm](https://img.shields.io/badge/Algorithm-Dijkstra's-f5a623?style=flat-square)
![Tech](https://img.shields.io/badge/Built%20With-Vanilla%20JS-f7df1e?style=flat-square&logo=javascript&logoColor=black)
![Dependencies](https://img.shields.io/badge/Dependencies-None-39d98a?style=flat-square)

## 🔗 [Live Demo →](https://your-username.github.io/dijkstra-visualizer)

> Replace the link above with your actual deployed URL.

---

## Features

- Place nodes and draw weighted directed edges on a canvas
- Animated step-by-step visualization with color-coded node states
- 3 preset graphs to demo instantly
- Live shortest distance and path trace after each run
- Speed control — Slow / Normal / Fast

---

## Usage

| Action | How |
|---|---|
| Add a node | Select **+ Node** → click anywhere on the canvas |
| Draw an edge | Select **⟶ Edge** → click source node → click destination node |
| Set edge weight | Adjust the weight slider before drawing the edge |
| Set start node | Select **◉ Start** → click a node |
| Set end node | Select **◎ End** → click a node |
| Run algorithm | Click **▶ Run Dijkstra** |
| Delete a node | Select **✕ Delete** → click a node, or just right-click it |
| Reset visualization | Click **↺ Reset Path** — keeps your graph intact |
| Clear everything | Click **✕ Clear All** |

---

## How to Run

**Option 1 — Open directly**
```bash
open index.html
```

**Option 2 — Live Server (VS Code)**
1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension
2. Right-click `index.html` → **Open with Live Server**

**Option 3 — Local server**
```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

---

## Tech

HTML5 · CSS3 · Vanilla JavaScript · Canvas API

---

## License

MIT