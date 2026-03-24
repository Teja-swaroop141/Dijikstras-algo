/* ============================================================
   DIJKSTRA'S ALGORITHM VISUALIZER
   Full implementation: Graph, UI, Animation, Presets
   ============================================================ */

// ── STATE ────────────────────────────────────────────────────
const state = {
  nodes: [],          // { id, x, y, label }
  edges: [],          // { id, from, to, weight }
  mode: 'addNode',
  startNode: null,
  endNode: null,
  selectedNode: null, // for edge drawing
  animSpeed: 400,     // ms per step
  running: false,
  nodeCounter: 0,
  edgeCounter: 0,
};

// ── CANVAS SETUP ─────────────────────────────────────────────
const canvas = document.getElementById('graph-canvas');
const ctx    = canvas.getContext('2d');
const hint   = document.getElementById('canvas-hint');

function resizeCanvas() {
  const wrapper = canvas.parentElement;
  canvas.width  = wrapper.clientWidth;
  canvas.height = wrapper.clientHeight;
  render();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ── VISUALS ───────────────────────────────────────────────────
const colors = {
  nodeFill:    'rgba(26, 26, 37, 0.9)',
  nodeBorder:  'rgba(255, 255, 255, 0.15)',
  nodeText:    '#f4f4f5',
  edgeLine:    'rgba(255, 255, 255, 0.15)',
  edgeWeight:  '#a1a1aa',
  start:       '#10b981',
  end:         '#ef4444',
  visited:     '#3b82f6',
  frontier:    '#8b5cf6',
  path:        '#f59e0b',
  selected:    '#f59e0b',
  hover:       '#3b82f6',
};

const NODE_R = 22;

// Per-node visual state for animation
let visualState = {}; // nodeId -> 'default'|'visited'|'frontier'|'path'
let pathEdges   = new Set();
let visitedEdges = new Set();
let hoveredNode = null;

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw edges
  state.edges.forEach(e => drawEdge(e));

  // Draw nodes
  state.nodes.forEach(n => drawNode(n));

  // Hint visibility
  hint.style.opacity = state.nodes.length === 0 ? '1' : '0';
  hint.style.pointerEvents = 'none';
}

function drawEdge(edge) {
  const from = state.nodes.find(n => n.id === edge.from);
  const to   = state.nodes.find(n => n.id === edge.to);
  if (!from || !to) return;

  const isPath    = pathEdges.has(edge.id);
  const isVisited = visitedEdges.has(edge.id);

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);

  if (isPath) {
    ctx.strokeStyle = colors.path;
    ctx.lineWidth   = 4;
    ctx.shadowColor = colors.path;
    ctx.shadowBlur  = 12;
  } else if (isVisited) {
    ctx.strokeStyle = colors.visited + 'dd';
    ctx.lineWidth   = 2.5;
    ctx.shadowColor = colors.visited;
    ctx.shadowBlur  = 6;
  } else {
    ctx.strokeStyle = colors.edgeLine;
    ctx.lineWidth   = 2;
    ctx.shadowBlur  = 0;
  }

  ctx.stroke();
  ctx.shadowBlur = 0;

  // Arrow
  drawArrow(from, to, isPath ? colors.path : isVisited ? colors.visited : colors.edgeLine);

  // Weight label
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const offsetX = -(to.y - from.y) * .12;
  const offsetY =  (to.x - from.x) * .12;

  ctx.fillStyle = isPath ? colors.path : colors.edgeWeight;
  ctx.font = isPath ? 'bold 12px Space Mono, monospace' : '11px Space Mono, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Weight bg
  ctx.fillStyle = 'rgba(5, 5, 8, 0.85)';
  ctx.beginPath();
  ctx.roundRect(mx + offsetX - 14, my + offsetY - 10, 28, 20, 6);
  ctx.fill();
  if (isPath || isVisited) {
    ctx.strokeStyle = isPath ? colors.path : colors.visited;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  ctx.fillStyle = isPath ? colors.path : colors.edgeWeight;
  ctx.fillText(edge.weight, mx + offsetX, my + offsetY);
}

function drawArrow(from, to, color) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const dist  = Math.hypot(to.x - from.x, to.y - from.y);
  const tipX  = from.x + Math.cos(angle) * (dist - NODE_R);
  const tipY  = from.y + Math.sin(angle) * (dist - NODE_R);
  const size  = 10;

  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - size * Math.cos(angle - .4), tipY - size * Math.sin(angle - .4));
  ctx.lineTo(tipX - size * Math.cos(angle + .4), tipY - size * Math.sin(angle + .4));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawNode(node) {
  const vs      = visualState[node.id] || 'default';
  const isStart = node.id === state.startNode;
  const isEnd   = node.id === state.endNode;
  const isSel   = node.id === state.selectedNode;
  const isHov   = node.id === hoveredNode;

  let fill   = colors.nodeFill;
  let border = colors.nodeBorder;
  let glow   = null;
  let textC  = colors.nodeText;

  if (isStart)          { border = colors.start;   glow = colors.start; }
  if (isEnd)            { border = colors.end;     glow = colors.end; }
  if (vs === 'visited') { border = colors.visited; fill = 'rgba(59, 130, 246, 0.15)'; glow = colors.visited; }
  if (vs === 'frontier'){ border = colors.frontier; fill = 'rgba(139, 92, 246, 0.15)'; glow = colors.frontier; }
  if (vs === 'path')    { border = colors.path;    fill = 'rgba(245, 158, 11, 0.2)';    glow = colors.path; }
  if (isSel)            { border = colors.selected; glow = colors.selected; }
  if (isHov && !isSel)  { border = colors.hover; glow = colors.hover; }

  // Background blur effect for nodes could also be mimicked but we'll stick to clear fill
  
  // Glow
  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur  = isSel || isHov ? 25 : 18;
  } else {
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
  }

  // Circle
  ctx.beginPath();
  ctx.arc(node.x, node.y, NODE_R, 0, Math.PI * 2);
  ctx.fillStyle   = fill;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth   = isSel || isHov ? 3 : 2;
  ctx.stroke();
  ctx.shadowBlur  = 0; // Reset

  // Distance label (shown during/after algorithm)
  if (node._dist !== undefined && node._dist !== Infinity) {
    ctx.font      = 'bold 9px Space Mono, monospace';
    ctx.fillStyle = vs === 'path' ? colors.path : colors.edgeWeight;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add subtle bg to dist
    ctx.fillStyle = 'rgba(5,5,8,0.8)';
    ctx.beginPath();
    ctx.roundRect(node.x - 12, node.y - NODE_R - 16, 24, 14, 4);
    ctx.fill();
    ctx.fillStyle = vs === 'path' ? colors.path : colors.text;
    ctx.fillText(node._dist, node.x, node.y - NODE_R - 9);
  }

  // Node label
  ctx.font        = 'bold 14px Syne, sans-serif';
  ctx.fillStyle   = textC;
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(node.label, node.x, node.y);

  // Start/End badge
  if (isStart || isEnd) {
    const badge = isStart ? 'S' : 'E';
    const bColor = isStart ? colors.start : colors.end;
    ctx.beginPath();
    ctx.arc(node.x + NODE_R * .7, node.y - NODE_R * .7, 8, 0, Math.PI * 2);
    ctx.fillStyle = bColor;
    ctx.shadowColor = bColor;
    ctx.shadowBlur = 5;
    ctx.fill();
    ctx.shadowBlur = 0;
    
    ctx.font = 'bold 8px Space Mono, monospace';
    ctx.fillStyle = '#111';
    ctx.fillText(badge, node.x + NODE_R * .7, node.y - NODE_R * .7);
  }
}

// ── INTERACTION ───────────────────────────────────────────────
canvas.addEventListener('click', handleCanvasClick);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('contextmenu', e => { e.preventDefault(); handleRightClick(e); });

function getMousePos(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function getNodeAtPos(x, y) {
  for (let i = state.nodes.length - 1; i >= 0; i--) {
    const n = state.nodes[i];
    if (Math.hypot(n.x - x, n.y - y) <= NODE_R + 4) return n;
  }
  return null;
}

function handleMouseMove(e) {
  if (state.running) return;
  const { x, y } = getMousePos(e);
  const node = getNodeAtPos(x, y);
  const prev = hoveredNode;
  hoveredNode = node ? node.id : null;
  if (hoveredNode !== prev) render();
  canvas.style.cursor = node ? 'pointer' : 'crosshair';
}

function handleCanvasClick(e) {
  if (state.running) return;
  const { x, y } = getMousePos(e);
  const node = getNodeAtPos(x, y);

  switch (state.mode) {
    case 'addNode':
      if (node) return;
      addNode(x, y);
      break;
    case 'addEdge':
      if (!node) { state.selectedNode = null; render(); return; }
      if (!state.selectedNode) {
        state.selectedNode = node.id;
        render();
        toast(`Selected "${node.label}" as edge source`, 'info');
      } else {
        if (state.selectedNode === node.id) { state.selectedNode = null; render(); return; }
        addEdge(state.selectedNode, node.id);
        state.selectedNode = null;
        render();
      }
      break;
    case 'setStart':
      if (!node) return;
      if (node.id === state.endNode) { toast('Cannot set start = end', 'error'); return; }
      state.startNode = node.id;
      resetVisual();
      toast(`"${node.label}" set as Start`, 'success');
      break;
    case 'setEnd':
      if (!node) return;
      if (node.id === state.startNode) { toast('Cannot set end = start', 'error'); return; }
      state.endNode = node.id;
      resetVisual();
      toast(`"${node.label}" set as End`, 'success');
      break;
    case 'delete':
      if (!node) return;
      deleteNode(node.id);
      break;
  }
}

function handleRightClick(e) {
  if (state.running) return;
  const { x, y } = getMousePos(e);
  const node = getNodeAtPos(x, y);
  if (node) deleteNode(node.id);
}

// ── GRAPH OPERATIONS ──────────────────────────────────────────
function addNode(x, y) {
  const label = String.fromCharCode(65 + state.nodeCounter % 26) +
                (state.nodeCounter >= 26 ? Math.floor(state.nodeCounter / 26) : '');
  const node = { id: ++state.nodeCounter, x, y, label };
  state.nodes.push(node);
  updateStats();
  render();
  toast(`Added node "${label}"`, 'info');
}

function addEdge(fromId, toId) {
  // Check duplicate
  if (state.edges.find(e => e.from === fromId && e.to === toId)) {
    toast('Edge already exists!', 'error'); return;
  }
  const weight = parseInt(document.getElementById('weight-slider').value);
  state.edges.push({ id: ++state.edgeCounter, from: fromId, to: toId, weight });
  updateStats();
  render();
  const f = state.nodes.find(n => n.id === fromId);
  const t = state.nodes.find(n => n.id === toId);
  toast(`Edge ${f.label} → ${t.label} (w=${weight}) added`, 'info');
}

function deleteNode(id) {
  state.nodes = state.nodes.filter(n => n.id !== id);
  state.edges = state.edges.filter(e => e.from !== id && e.to !== id);
  if (state.startNode === id) state.startNode = null;
  if (state.endNode   === id) state.endNode   = null;
  if (state.selectedNode === id) state.selectedNode = null;
  resetVisual();
}

// ── DIJKSTRA ──────────────────────────────────────────────────
async function runDijkstra() {
  if (state.running) return;
  if (!state.startNode || !state.endNode) { toast('Please set Start and End nodes first!', 'error'); return; }
  if (state.nodes.length < 2) { toast('Add at least 2 nodes', 'error'); return; }

  resetVisual(false); // keep nodes/edges, clear visual state
  state.running = true;
  setStatus('running', 'RUNNING');

  // Build adjacency
  const dist   = {};
  const prev   = {};
  const visited = new Set();
  state.nodes.forEach(n => { dist[n.id] = Infinity; prev[n.id] = null; n._dist = Infinity; });
  dist[state.startNode] = 0;
  state.nodes.find(n => n.id === state.startNode)._dist = 0;

  const unvisited = new Set(state.nodes.map(n => n.id));

  while (unvisited.size > 0) {
    // Pick min-dist unvisited
    let u = null;
    for (const id of unvisited) {
      if (u === null || dist[id] < dist[u]) u = id;
    }
    if (dist[u] === Infinity) break;
    if (u === state.endNode) break;

    unvisited.delete(u);
    visited.add(u);
    visualState[u] = 'visited';

    // Mark visited edges
    state.edges.filter(e => e.from === u && visited.has(e.to) || e.to === u && visited.has(e.from))
               .forEach(e => visitedEdges.add(e.id));

    render();
    await sleep(state.animSpeed);

    // Neighbors (directed edges from u)
    const neighbors = state.edges.filter(e => e.from === u);
    for (const edge of neighbors) {
      const v = edge.to;
      if (!unvisited.has(v)) continue;

      visualState[v] = 'frontier';
      render();
      await sleep(state.animSpeed * .5);

      const alt = dist[u] + edge.weight;
      if (alt < dist[v]) {
        dist[v] = alt;
        prev[v] = u;
        state.nodes.find(n => n.id === v)._dist = alt;
      }
    }
    render();
    await sleep(state.animSpeed * .3);
  }

  // Reconstruct path
  const path = [];
  let cur = state.endNode;
  while (cur !== null) {
    path.unshift(cur);
    cur = prev[cur];
  }

  state.running = false;

  if (path[0] !== state.startNode) {
    setStatus('no-path', 'NO PATH');
    toast('No path found between start and end!', 'error');
    document.getElementById('stat-dist').textContent = '∞';
    return;
  }

  // Animate path
  for (let i = 0; i < path.length; i++) {
    visualState[path[i]] = 'path';
    if (i > 0) {
      const edge = state.edges.find(e => e.from === path[i-1] && e.to === path[i]);
      if (edge) pathEdges.add(edge.id);
    }
    render();
    await sleep(state.animSpeed * .8);
  }

  setStatus('done', 'DONE');
  document.getElementById('stat-visited').textContent = visited.size;
  document.getElementById('stat-dist').textContent    = dist[state.endNode];
  toast(`Shortest path found! Distance: ${dist[state.endNode]}`, 'success');
  renderPathTrace(path, dist);
}

function renderPathTrace(path, dist) {
  const container = document.getElementById('path-trace');
  container.innerHTML = '';

  path.forEach((id, i) => {
    const node = state.nodes.find(n => n.id === id);
    const span = document.createElement('span');
    span.className = 'trace-node' + (i === 0 ? ' start' : i === path.length-1 ? ' end' : '');
    span.innerHTML = `${node.label} <span class="trace-dist">(${dist[id]})</span>`;
    container.appendChild(span);
    if (i < path.length - 1) {
      const arrow = document.createElement('span');
      arrow.className = 'trace-arrow';
      arrow.textContent = ' → ';
      container.appendChild(arrow);
    }
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── CONTROLS ──────────────────────────────────────────────────
function setMode(mode) {
  if (state.running) return;
  state.mode = mode;
  state.selectedNode = null;

  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  const map = { addNode: 'btn-add-node', addEdge: 'btn-add-edge', setStart: 'btn-set-start', setEnd: 'btn-set-end', delete: 'btn-delete' };
  document.getElementById(map[mode])?.classList.add('active');

  const labels = {
    addNode:  'Mode: Add Node — Click canvas to place nodes',
    addEdge:  'Mode: Add Edge — Click source node, then destination',
    setStart: 'Mode: Set Start — Click a node to mark as Start',
    setEnd:   'Mode: Set End — Click a node to mark as End',
    delete:   'Mode: Delete — Click a node to remove it',
  };
  document.getElementById('mode-label').textContent = labels[mode];
  document.getElementById('weight-group').style.display = mode === 'addEdge' ? 'block' : 'none';
  render();
}

function updateSpeed(v) {
  const speeds = { '1': 800, '2': 400, '3': 150 };
  const labels = { '1': 'Slow', '2': 'Normal', '3': 'Fast' };
  state.animSpeed = speeds[v];
  document.getElementById('speed-display').textContent = labels[v];
}

function resetVisual(doRender = true) {
  visualState  = {};
  pathEdges    = new Set();
  visitedEdges = new Set();
  state.nodes.forEach(n => delete n._dist);
  setStatus('idle', 'IDLE');
  document.getElementById('stat-visited').textContent = '0';
  document.getElementById('stat-dist').textContent    = '—';
  document.getElementById('path-trace').innerHTML = '<div class="trace-empty">Run the algorithm to see the shortest path trace here.</div>';
  if (doRender) render();
}

function clearAll() {
  if (state.running) return;
  state.nodes       = [];
  state.edges       = [];
  state.startNode   = null;
  state.endNode     = null;
  state.selectedNode= null;
  resetVisual();
  updateStats();
  toast('Canvas cleared', 'info');
}

function setStatus(cls, text) {
  const el = document.getElementById('status-badge');
  el.className  = `status-badge ${cls}`;
  el.textContent = text;
}

function updateStats() {
  document.getElementById('stat-nodes').textContent = state.nodes.length;
  document.getElementById('stat-edges').textContent = state.edges.length;
}

// ── PRESETS ───────────────────────────────────────────────────
function loadPreset(name) {
  if (state.running) return;
  clearAll();

  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;

  if (name === 'simple') {
    // 5-node linear-ish graph
    const positions = [
      [cx - 200, cy],
      [cx - 70,  cy - 80],
      [cx + 70,  cy + 80],
      [cx + 200, cy],
      [cx,       cy - 100],
    ];
    positions.forEach(([x, y]) => { state.nodes.push({ id: ++state.nodeCounter, x, y, label: String.fromCharCode(64 + state.nodeCounter) }); });
    const edges = [[1,2,4],[1,5,2],[2,3,5],[2,5,1],[3,4,3],[5,3,8],[5,4,10]];
    edges.forEach(([f,t,w]) => state.edges.push({ id: ++state.edgeCounter, from: f, to: t, weight: w }));
    state.startNode = 1; state.endNode = 4;

  } else if (name === 'medium') {
    const positions = [
      [cx-220, cy-80],[cx-100, cy-140],[cx+40, cy-80],
      [cx+180, cy-80],[cx-220, cy+80],[cx-100, cy+40],
      [cx+40,  cy+100],[cx+180, cy+80],
    ];
    positions.forEach(([x, y]) => { state.nodes.push({ id: ++state.nodeCounter, x, y, label: String.fromCharCode(64 + state.nodeCounter) }); });
    const edges = [[1,2,2],[1,5,6],[2,3,3],[2,6,8],[3,4,5],[3,7,7],[4,8,4],[5,6,1],[6,3,3],[6,7,5],[7,8,2]];
    edges.forEach(([f,t,w]) => state.edges.push({ id: ++state.edgeCounter, from: f, to: t, weight: w }));
    state.startNode = 1; state.endNode = 8;

  } else if (name === 'complex') {
    const r = Math.min(W, H) * .32;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
      state.nodes.push({ id: ++state.nodeCounter, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), label: String.fromCharCode(64 + state.nodeCounter) });
    }
    // Center nodes
    state.nodes.push({ id: ++state.nodeCounter, x: cx - 60, y: cy, label: 'I' });
    state.nodes.push({ id: ++state.nodeCounter, x: cx + 60, y: cy, label: 'J' });

    const edges = [
      [1,2,3],[2,3,4],[3,4,2],[4,5,6],[5,6,3],[6,7,5],[7,8,4],[8,1,2],
      [1,9,5],[2,9,3],[3,10,4],[4,10,2],[5,10,6],[6,10,3],[7,9,4],[8,9,2],
      [9,10,1],[1,3,8],[2,4,7],[5,7,9],[6,8,6],
    ];
    edges.forEach(([f,t,w]) => state.edges.push({ id: ++state.edgeCounter, from: f, to: t, weight: w }));
    state.startNode = 1; state.endNode = 5;
  }

  updateStats(); render();
  toast(`Preset "${name}" loaded! Press ▶ Run Dijkstra`, 'success');
}

// ── TOAST ─────────────────────────────────────────────────────
let toastTimer;
function toast(msg, type = 'info') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 2800);
}

// ── INIT ──────────────────────────────────────────────────────
setMode('addNode');
loadPreset('medium');
