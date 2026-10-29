/**
 * birdPathfinder — grid A* navigation for the hero flock.
 *
 * Pure functions, no DOM, no React. The hero is rasterised into a square
 * occupancy grid built from the unified obstacle pads (logo, buttons,
 * headline glyphs, hero edges). Cells are blocked when their centre falls
 * inside a pad inflated by the sprite half-extent plus a turn margin, so a
 * path that follows free cells has room to bank without clipping the art.
 *
 * Cost model (per cell entered):
 *
 *   step      1 (orthogonal) | sqrt(2) (diagonal)
 *   clearance +2.0 * (1 - min(distToPad, 120) / 120)
 *
 * That is the non-negative form of "add up to +2.0 when clear": open cells
 * cost their step only, pad-adjacent cells pay the full 2.0, so the planner
 * strongly prefers open-space corridors over technically-valid edge skims.
 * The heuristic is octile distance in cell units (admissible: step >= 1 and
 * the clearance term is non-negative).
 *
 * The raw grid path is string-pulled against the same padded cells (every
 * sample must keep a cell of clearance) and then resampled every
 * GRID_STEP_PX, which is what the follower consumes as lookahead points.
 */

export const GRID_CELL = 8
export const GRID_MARGIN = 14 // px past the sprite half-extent (desktop)
export const GRID_MARGIN_MOBILE = 10 // smaller heroes need tighter corridors
export const GRID_MAX_CLEAR = 120 // px where the clearance bonus saturates
export const GRID_CLEAR_WEIGHT = 2.0
export const GRID_MAX_EXPANSIONS = 30000
export const GRID_STEP_PX = 50 // emitted waypoint spacing
// Weighted A* (h * 1.15): routes stay inside the inflated corridors and look
// natural, while expansions drop enough to keep a pick well under a frame at
// the 1778-1975px hero sizes. 1.0 would be optimal but measurably slower.
const GRID_HEURISTIC_WEIGHT = 1.15
const INF = 1e9

const SQRT2 = Math.SQRT2

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

export function buildNavGrid({
  width,
  height,
  pads,
  spriteHalf,
  margin = GRID_MARGIN,
  cell = GRID_CELL,
}) {
  const cols = Math.max(1, Math.ceil(width / cell))
  const rows = Math.max(1, Math.ceil(height / cell))
  const n = cols * rows
  const blocked = new Uint8Array(n)
  const inflate = spriteHalf + margin

  for (const p of pads || []) {
    // Solid pads use their tight rect; edge bands have no colRect and use
    // their routing rect (they intentionally cover the filmstrip outside).
    const r = p.colRect || p.routeRect
    if (!r) continue
    const L = r.left - inflate
    const R = r.right + inflate
    const T = r.top - inflate
    const B = r.bottom + inflate
    const c0 = Math.max(0, Math.floor(L / cell))
    const c1 = Math.min(cols - 1, Math.ceil(R / cell))
    const r0 = Math.max(0, Math.floor(T / cell))
    const r1 = Math.min(rows - 1, Math.ceil(B / cell))
    for (let y = r0; y <= r1; y++) {
      const cy = (y + 0.5) * cell
      if (cy < T || cy > B) continue
      const row = y * cols
      for (let x = c0; x <= c1; x++) {
        const cx = (x + 0.5) * cell
        if (cx >= L && cx <= R) blocked[row + x] = 1
      }
    }
  }

  // Hero edges: block a spriteHalf + 4px band inside every border so no
  // planned path can graze the hero edge (a measured bounce source). Runs
  // before the chamfer field, so the clearance cost also penalises edges.
  const edgeInflate = spriteHalf + 4
  if (edgeInflate > 0) {
    for (let y = 0; y < rows; y++) {
      const cy = (y + 0.5) * cell
      for (let x = 0; x < cols; x++) {
        const cx = (x + 0.5) * cell
        if (
          cx < edgeInflate ||
          cy < edgeInflate ||
          cx > width - edgeInflate ||
          cy > height - edgeInflate
        ) {
          blocked[y * cols + x] = 1
        }
      }
    }
  }

  // Two-pass chamfer distance to the nearest blocked cell, in px. Used for
  // the clearance cost and for the smoothing clearance check.
  const dist = new Float32Array(n)
  for (let i = 0; i < n; i++) dist[i] = blocked[i] ? 0 : INF
  const D = cell
  const DG = cell * SQRT2
  for (let y = 0; y < rows; y++) {
    const row = y * cols
    for (let x = 0; x < cols; x++) {
      const i = row + x
      let d = dist[i]
      if (x > 0) d = Math.min(d, dist[i - 1] + D)
      if (y > 0) {
        d = Math.min(d, dist[i - cols] + D)
        if (x > 0) d = Math.min(d, dist[i - cols - 1] + DG)
        if (x < cols - 1) d = Math.min(d, dist[i - cols + 1] + DG)
      }
      dist[i] = d
    }
  }
  for (let y = rows - 1; y >= 0; y--) {
    const row = y * cols
    for (let x = cols - 1; x >= 0; x--) {
      const i = row + x
      let d = dist[i]
      if (x < cols - 1) d = Math.min(d, dist[i + 1] + D)
      if (y < rows - 1) {
        d = Math.min(d, dist[i + cols] + D)
        if (x < cols - 1) d = Math.min(d, dist[i + cols + 1] + DG)
        if (x > 0) d = Math.min(d, dist[i + cols - 1] + DG)
      }
      dist[i] = d
    }
  }

  let blockedCount = 0
  for (let i = 0; i < n; i++) blockedCount += blocked[i]
  return { cell, cols, rows, width, height, blocked, dist, blockedCount }
}

export function gridStats(grid) {
  const cells = grid.cols * grid.rows
  return {
    cols: grid.cols,
    rows: grid.rows,
    cells,
    blockedPct: cells ? (grid.blockedCount / cells) * 100 : 0,
  }
}

const cellIndex = (grid, x, y) => {
  const cx = clamp(Math.floor(x / grid.cell), 0, grid.cols - 1)
  const cy = clamp(Math.floor(y / grid.cell), 0, grid.rows - 1)
  return cy * grid.cols + cx
}

export function gridFreeAt(grid, x, y, needClear = 0) {
  if (x < 0 || y < 0 || x > grid.width || y > grid.height) return false
  const i = cellIndex(grid, x, y)
  if (grid.blocked[i]) return false
  return grid.dist[i] >= needClear
}

/** Sample a straight segment against free cells with a minimum clearance. */
export function gridLineClear(grid, x0, y0, x1, y1, needClear = grid.cell * 0.9) {
  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.hypot(dx, dy)
  const step = Math.max(2, grid.cell * 0.5)
  const count = Math.max(1, Math.ceil(len / step))
  for (let k = 0; k <= count; k++) {
    const t = k / count
    if (!gridFreeAt(grid, x0 + dx * t, y0 + dy * t, needClear)) return false
  }
  return true
}

const findFreeNear = (grid, x, y, radiusCells = 4) => {
  const start = cellIndex(grid, x, y)
  if (!grid.blocked[start]) return start
  const cx = start % grid.cols
  const cy = Math.floor(start / grid.cols)
  let best = -1
  let bestD = Infinity
  for (let ry = -radiusCells; ry <= radiusCells; ry++) {
    for (let rx = -radiusCells; rx <= radiusCells; rx++) {
      const nx = cx + rx
      const ny = cy + ry
      if (nx < 0 || ny < 0 || nx >= grid.cols || ny >= grid.rows) continue
      const i = ny * grid.cols + nx
      if (grid.blocked[i]) continue
      const d = rx * rx + ry * ry
      if (d < bestD) {
        bestD = d
        best = i
      }
    }
  }
  return best
}

const octile = (ax, ay, bx, by) => {
  const dx = Math.abs(bx - ax)
  const dy = Math.abs(by - ay)
  return dx > dy ? dx + (SQRT2 - 1) * dy : dy + (SQRT2 - 1) * dx
}

// Binary min-heap over (id, f) pairs.
class MinHeap {
  constructor() {
    this.ids = []
    this.fs = []
  }
  get size() {
    return this.ids.length
  }
  push(id, f) {
    const ids = this.ids
    const fs = this.fs
    let i = ids.length
    ids.push(id)
    fs.push(f)
    while (i > 0) {
      const p = (i - 1) >> 1
      if (fs[p] <= fs[i]) break
      ;[ids[p], ids[i]] = [ids[i], ids[p]]
      ;[fs[p], fs[i]] = [fs[i], fs[p]]
      i = p
    }
  }
  pop() {
    const ids = this.ids
    const fs = this.fs
    const topId = ids[0]
    const lastId = ids.pop()
    const lastF = fs.pop()
    if (ids.length) {
      ids[0] = lastId
      fs[0] = lastF
      let i = 0
      for (;;) {
        const l = i * 2 + 1
        const r = l + 1
        let s = i
        if (l < ids.length && fs[l] < fs[s]) s = l
        if (r < ids.length && fs[r] < fs[s]) s = r
        if (s === i) break
        ;[ids[s], ids[i]] = [ids[i], ids[s]]
        ;[fs[s], fs[i]] = [fs[i], fs[s]]
        i = s
      }
    }
    return topId
  }
}

/**
 * A* from (sx,sy) to (gx,gy). Returns { points, expansions, ms } or null.
 * `points` excludes the start and ends with the exact goal.
 */
export function gridPath(grid, sx, sy, gx, gy, opts = {}) {
  // Hard blocked-start rejection: never plan from inside an inflated pad.
  // The old behaviour snapped the start to a free cell but kept the bird's
  // true position as the first polyline point, so the first leg cut back
  // through the pad and the follower milled. In-pad birds must escape
  // first; only a start in free space gets an A* route.
  if (!opts.allowBlockedStart && grid.blocked[cellIndex(grid, sx, sy)]) {
    return null
  }
  const t0 =
    typeof performance !== 'undefined' && performance.now ? performance.now() : 0
  const maxExpansions = opts.maxExpansions ?? GRID_MAX_EXPANSIONS
  const n = grid.cols * grid.rows
  const start = findFreeNear(grid, sx, sy)
  const goal = findFreeNear(grid, gx, gy)
  if (start < 0 || goal < 0) return null
  if (start === goal) {
    return { points: [{ x: gx, y: gy }], expansions: 0, ms: 0 }
  }

  const gScore = new Float32Array(n).fill(INF)
  const parent = new Int32Array(n).fill(-1)
  const closed = new Uint8Array(n)
  const open = new MinHeap()
  const gxCell = goal % grid.cols
  const gyCell = Math.floor(goal / grid.cols)
  gScore[start] = 0
  open.push(start, 0)
  let expansions = 0
  let found = false

  const cols = grid.cols
  const dirs = [
    [1, 0, 1],
    [-1, 0, 1],
    [0, 1, 1],
    [0, -1, 1],
    [1, 1, SQRT2],
    [1, -1, SQRT2],
    [-1, 1, SQRT2],
    [-1, -1, SQRT2],
  ]

  while (open.size) {
    const cur = open.pop()
    if (closed[cur]) continue
    closed[cur] = 1
    if (cur === goal) {
      found = true
      break
    }
    if (++expansions > maxExpansions) break
    const cx = cur % cols
    const cy = Math.floor(cur / cols)
    const gCur = gScore[cur]
    for (const [dx, dy, step] of dirs) {
      const nx = cx + dx
      const ny = cy + dy
      if (nx < 0 || ny < 0 || nx >= cols || ny >= grid.rows) continue
      const ni = ny * cols + nx
      if (grid.blocked[ni] || closed[ni]) continue
      // No diagonal corner cutting: both orthogonal neighbours must be free.
      if (dx && dy) {
        if (grid.blocked[cy * cols + nx] || grid.blocked[ny * cols + cx]) continue
      }
      const clear = Math.min(grid.dist[ni], GRID_MAX_CLEAR) / GRID_MAX_CLEAR
      const penalty = GRID_CLEAR_WEIGHT * (1 - clear)
      const tentative = gCur + step + penalty
      if (tentative >= gScore[ni]) continue
      gScore[ni] = tentative
      parent[ni] = cur
      const h = octile(nx, ny, gxCell, gyCell) * GRID_HEURISTIC_WEIGHT
      open.push(ni, tentative + h)
    }
  }
  if (!found) return null

  // Reconstruct cell centres, then swap in the exact requested endpoints.
  const raw = []
  let cur = goal
  while (cur !== -1) {
    raw.push({
      x: (cur % cols + 0.5) * grid.cell,
      y: (Math.floor(cur / cols) + 0.5) * grid.cell,
    })
    if (cur === start) break
    cur = parent[cur]
  }
  raw.reverse()
  raw[0] = { x: sx, y: sy }
  raw[raw.length - 1] = { x: gx, y: gy }

  // String-pull: keep the farthest visible vertex, demanding one cell of
  // clearance so the shortcut stays inside the inflated corridor.
  const need = grid.cell * 2 // ≥16px: kept vertices sit visibly inside the corridor
  const simplified = [raw[0]]
  let i = 0
  while (i < raw.length - 1) {
    let j = raw.length - 1
    while (
      j > i + 1 &&
      !gridLineClear(grid, raw[i].x, raw[i].y, raw[j].x, raw[j].y, need)
    ) {
      j--
    }
    simplified.push(raw[j])
    i = j
  }

  // Resample to GRID_STEP_PX so the follower has lookahead points.
  const points = []
  let prev = simplified[0]
  for (let k = 1; k < simplified.length; k++) {
    const to = simplified[k]
    const dx = to.x - prev.x
    const dy = to.y - prev.y
    const len = Math.hypot(dx, dy)
    const steps = Math.max(1, Math.ceil(len / GRID_STEP_PX))
    for (let s = 1; s <= steps; s++) {
      points.push({
        x: prev.x + (dx * s) / steps,
        y: prev.y + (dy * s) / steps,
      })
    }
    prev = to
  }
  const t1 =
    typeof performance !== 'undefined' && performance.now ? performance.now() : 0
  return { points, expansions, ms: t1 - t0 }
}

/**
 * Probe a few opposite-corner routes (verification: a mobile hero must keep
 * at least three usable corridors with the current inflation).
 */
export function testNavRoutes(grid) {
  const pairs = [
    [0.16, 0.2, 0.84, 0.8],
    [0.16, 0.8, 0.84, 0.2],
    [0.5, 0.16, 0.5, 0.84],
  ]
  return pairs.map(([ax, ay, bx, by]) => {
    const r = gridPath(
      grid,
      ax * grid.width,
      ay * grid.height,
      bx * grid.width,
      by * grid.height,
      { allowBlockedStart: true } // probes measure corridors, not the caller's pixel
    )
    return { ok: !!r, ms: r ? r.ms : null, pts: r ? r.points.length : 0 }
  })
}
