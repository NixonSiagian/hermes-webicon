/**
 * Hermes 2D Office Simulation — PixiJS Tile-Based Renderer
 * Uses REAL Kenney roguelike-indoors tileset + top-down-shooter characters
 * RimWorld/TheoTown style — fullscreen, mobile-first
 *
 * TILESET: roguelike_indoor_2x.png  (32x32 tiles, 2px margin, stride=34)
 *   Original: 16x16 tiles, 1px margin → scaled 2x → 32x32 tiles, 2px margin
 *   Sheet cols: 27, rows: 18
 * AGENTS:   agents_sheet.png (8 characters, 32x32 each, 1 row)
 */
(function () {
'use strict';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════ */
const TILE   = 32;          // world tile size in px
const COLS   = 44;          // map width in tiles
const ROWS   = 30;          // map height in tiles
const WORLD_W = COLS * TILE;
const WORLD_H = ROWS * TILE;
const SPEED   = 80;         // agent px/sec
const ARRIVE  = 6;          // arrival threshold px

// Tileset: roguelike_indoor_2x.png — 16×16 → 2× scale → 32×32, 2px margin, stride=34
const TS_STRIDE = 34;       // tile stride in source sheet (32 + 2px margin)
const TS_SIZE   = 32;       // tile size in source sheet

/* ─── Tile indices (col, row) in roguelike_indoor tileset ───
   Reference: Kenney roguelike-indoors 16×16, 1px margin
   Row 0  : top wall variants + corners
   Row 1  : mid wall
   Row 2  : bottom wall variants
   Row 9  : stone floor variants
   Row 10 : more floor
   Row 7  : furniture (desks, tables)
   Row 3  : small items (chairs, plants, lamps)
   Row 5  : sofas / large furniture
*/
const T = {
  // Floors — row 9
  FLOOR_A : [0, 9],
  FLOOR_B : [1, 9],
  FLOOR_C : [2, 9],
  FLOOR_D : [3, 9],
  FLOOR_E : [4, 9],
  FLOOR_F : [5, 9],
  FLOOR_G : [6, 9],
  FLOOR_H : [7, 9],
  // Floor row 10
  FLOOR_I : [0, 10],
  FLOOR_J : [1, 10],
  FLOOR_K : [2, 10],
  FLOOR_L : [3, 10],
  // Walls — row 0 (top-face walls, horizontal)
  WALL_H   : [2, 0],
  WALL_H2  : [3, 0],
  // Walls — row 2 (vertical face)
  WALL_V   : [0, 2],
  WALL_V2  : [0, 3],
  // Corners
  WALL_TL  : [0, 0],
  WALL_TR  : [8, 0],
  WALL_BL  : [0, 6],
  WALL_BR  : [8, 6],
  // Inner corners
  WALL_ITL : [0, 4],
  WALL_ITR : [4, 4],
  WALL_IBL : [0, 8],
  WALL_IBR : [4, 8],
  // Door tiles
  DOOR_H   : [7, 0],
  DOOR_V   : [7, 1],
  // Furniture — row 7
  DESK     : [7, 7],
  DESK2    : [6, 7],
  TABLE    : [3, 7],
  TABLE2   : [4, 7],
  COMPUTER : [11,7],
  // Furniture — row 3
  CHAIR    : [13,3],
  CHAIR2   : [14,3],
  PLANT    : [15,3],
  LAMP     : [14,3],
  SHELF    : [8, 3],
  CABINET  : [10,3],
  // Sofa row 5
  SOFA     : [9, 5],
  SOFA2    : [10,5],
  // Coffee table
  CTABLE   : [16,7],
};

/* Agent colors per role */
const ROLE_TINT = {
  developer  : 0x00e5cc,
  researcher : 0xffaa33,
  ops        : 0x44ff88,
  manager    : 0xff66aa,
};

/* ═══════════════════════════════════════════════════════════
   ROOM DEFINITIONS — tiles-based, enclosed spaces
═══════════════════════════════════════════════════════════ */
const ROOMS = [
  // Engineering — top-left, big
  { id:'engineering', name:'Engineering', purpose:'coding',
    x:1,  y:1,  w:16, h:12, floorType:'B',
    label:'⚙ Engineering',
    stations: [{x:3,y:3},{x:5,y:3},{x:7,y:3},{x:9,y:3},{x:11,y:3},{x:13,y:3},
               {x:3,y:7},{x:5,y:7},{x:7,y:7},{x:9,y:7},{x:11,y:7},{x:13,y:7}],
    furniture:[
      {t:'DESK',  x:3,y:3},{t:'COMPUTER',x:4,y:3},
      {t:'DESK',  x:6,y:3},{t:'COMPUTER',x:7,y:3},
      {t:'DESK',  x:9,y:3},{t:'COMPUTER',x:10,y:3},
      {t:'DESK',  x:12,y:3},{t:'COMPUTER',x:13,y:3},
      {t:'DESK',  x:3,y:8},{t:'COMPUTER',x:4,y:8},
      {t:'DESK',  x:6,y:8},{t:'COMPUTER',x:7,y:8},
      {t:'DESK',  x:9,y:8},{t:'COMPUTER',x:10,y:8},
      {t:'CHAIR', x:3,y:4},{t:'CHAIR',x:6,y:4},{t:'CHAIR',x:9,y:4},{t:'CHAIR',x:12,y:4},
      {t:'CHAIR', x:3,y:9},{t:'CHAIR',x:6,y:9},
      {t:'PLANT', x:14,y:10},{t:'SHELF',x:2,y:6},
    ],
    doors:[{x:8, y:12, dir:'h'}],
  },
  // Research — top-center
  { id:'research', name:'Research', purpose:'research',
    x:18, y:1,  w:12, h:12, floorType:'D',
    label:'🔬 Research',
    stations:[{x:20,y:4},{x:22,y:4},{x:24,y:4},{x:20,y:8},{x:22,y:8}],
    furniture:[
      {t:'TABLE', x:20,y:4},{t:'TABLE2',x:21,y:4},
      {t:'TABLE', x:23,y:4},{t:'TABLE2',x:24,y:4},
      {t:'TABLE', x:20,y:8},{t:'TABLE2',x:21,y:8},
      {t:'SHELF', x:19,y:3},{t:'SHELF',x:19,y:5},
      {t:'CABINET',x:28,y:3},{t:'PLANT',x:28,y:9},
      {t:'CHAIR',x:20,y:5},{t:'CHAIR',x:22,y:5},{t:'CHAIR',x:24,y:5},
      {t:'CHAIR',x:20,y:9},{t:'CHAIR',x:22,y:9},
      {t:'LAMP',x:26,y:10},
    ],
    doors:[{x:24, y:12, dir:'h'}],
  },
  // Operations — top-right
  { id:'operations', name:'Operations', purpose:'ops',
    x:31, y:1,  w:12, h:12, floorType:'F',
    label:'⚡ Operations',
    stations:[{x:33,y:4},{x:35,y:4},{x:37,y:4},{x:33,y:8},{x:35,y:8},{x:37,y:8}],
    furniture:[
      {t:'DESK2',x:33,y:4},{t:'COMPUTER',x:34,y:4},
      {t:'DESK2',x:36,y:4},{t:'COMPUTER',x:37,y:4},
      {t:'DESK2',x:33,y:8},{t:'COMPUTER',x:34,y:8},
      {t:'DESK2',x:36,y:8},{t:'COMPUTER',x:37,y:8},
      {t:'CABINET',x:32,y:10},{t:'CABINET',x:32,y:6},
      {t:'CHAIR',x:33,y:5},{t:'CHAIR',x:36,y:5},
      {t:'CHAIR',x:33,y:9},{t:'CHAIR',x:36,y:9},
      {t:'SHELF',x:40,y:3},{t:'PLANT',x:40,y:10},
    ],
    doors:[{x:37, y:12, dir:'h'}],
  },
  // Meeting Room — mid-left
  { id:'meeting', name:'Meeting Room', purpose:'meeting',
    x:1,  y:15, w:12, h:12, floorType:'J',
    label:'📋 Meeting',
    stations:[{x:4,y:18},{x:5,y:18},{x:6,y:18},{x:7,y:18},{x:8,y:18},{x:9,y:18},
              {x:4,y:20},{x:5,y:20},{x:6,y:20},{x:7,y:20},{x:8,y:20}],
    furniture:[
      {t:'TABLE',x:4,y:18},{t:'TABLE',x:5,y:18},{t:'TABLE',x:6,y:18},
      {t:'TABLE',x:7,y:18},{t:'TABLE',x:8,y:18},{t:'TABLE',x:9,y:18},
      {t:'TABLE2',x:4,y:20},{t:'TABLE2',x:5,y:20},{t:'TABLE2',x:6,y:20},
      {t:'TABLE2',x:7,y:20},{t:'TABLE2',x:8,y:20},
      {t:'CHAIR',x:4,y:17},{t:'CHAIR',x:6,y:17},{t:'CHAIR',x:8,y:17},
      {t:'CHAIR',x:4,y:21},{t:'CHAIR',x:6,y:21},{t:'CHAIR',x:8,y:21},
      {t:'CHAIR',x:3,y:19},{t:'CHAIR',x:10,y:19},
      {t:'PLANT',x:2,y:26},{t:'PLANT',x:11,y:26},
    ],
    doors:[{x:7, y:15, dir:'h'}],
  },
  // Lounge — mid-center
  { id:'lounge', name:'Lounge', purpose:'break',
    x:14, y:15, w:15, h:12, floorType:'L',
    label:'☕ Lounge',
    stations:[{x:17,y:18},{x:17,y:22},{x:21,y:18},{x:21,y:22},{x:25,y:20}],
    furniture:[
      {t:'SOFA', x:17,y:18},{t:'SOFA2',x:18,y:18},
      {t:'SOFA', x:17,y:22},{t:'SOFA2',x:18,y:22},
      {t:'SOFA', x:24,y:18},{t:'SOFA2',x:25,y:18},
      {t:'CTABLE',x:20,y:20},
      {t:'CTABLE',x:22,y:20},
      {t:'PLANT',x:15,y:16},{t:'PLANT',x:27,y:16},
      {t:'PLANT',x:15,y:25},{t:'PLANT',x:27,y:25},
      {t:'LAMP',x:19,y:17},{t:'LAMP',x:23,y:17},
    ],
    doors:[{x:21, y:15, dir:'h'}],
  },
  // Server Room — mid-right
  { id:'server', name:'Server Room', purpose:'server_check',
    x:31, y:15, w:12, h:12, floorType:'I',
    label:'🖥 Servers',
    stations:[{x:33,y:18},{x:35,y:18},{x:37,y:18},{x:33,y:22},{x:35,y:22}],
    furniture:[
      {t:'CABINET',x:33,y:17},{t:'CABINET',x:35,y:17},{t:'CABINET',x:37,y:17},
      {t:'CABINET',x:33,y:21},{t:'CABINET',x:35,y:21},{t:'CABINET',x:37,y:21},
      {t:'DESK',   x:33,y:19},{t:'COMPUTER',x:34,y:19},
      {t:'DESK',   x:36,y:19},{t:'COMPUTER',x:37,y:19},
      {t:'SHELF',  x:40,y:17},{t:'SHELF',x:40,y:21},
      {t:'PLANT',  x:32,y:26},
    ],
    doors:[{x:37, y:15, dir:'h'}],
  },
];

/* ═══════════════════════════════════════════════════════════
   AGENT DEFINITIONS
═══════════════════════════════════════════════════════════ */
const AGENT_DEFS = [
  { name:'Alice',   role:'developer',  home:'engineering', spriteIdx:0 },
  { name:'Bob',     role:'developer',  home:'engineering', spriteIdx:1 },
  { name:'Charlie', role:'developer',  home:'engineering', spriteIdx:7 },
  { name:'Diana',   role:'researcher', home:'research',    spriteIdx:2 },
  { name:'Eve',     role:'researcher', home:'research',    spriteIdx:5 },
  { name:'Frank',   role:'researcher', home:'research',    spriteIdx:4 },
  { name:'Grace',   role:'ops',        home:'operations',  spriteIdx:6 },
  { name:'Hank',    role:'ops',        home:'operations',  spriteIdx:3 },
  { name:'Iris',    role:'ops',        home:'server',      spriteIdx:6 },
  { name:'Jack',    role:'manager',    home:'meeting',     spriteIdx:4 },
  { name:'Kate',    role:'manager',    home:'engineering', spriteIdx:2 },
  { name:'Leo',     role:'developer',  home:'engineering', spriteIdx:1 },
];

/* ═══════════════════════════════════════════════════════════
   JOB DEFINITIONS
═══════════════════════════════════════════════════════════ */
const JOBS = [
  { id:'coding',       label:'Coding',       room:'engineering', dur:[8,18], roles:['developer','manager'] },
  { id:'code_review',  label:'Code Review',  room:'engineering', dur:[5,12], roles:['developer','manager'] },
  { id:'research',     label:'Researching',  room:'research',    dur:[10,20],roles:['researcher','developer'] },
  { id:'brainstorm',   label:'Brainstorm',   room:'research',    dur:[6,14], roles:['researcher','manager'] },
  { id:'monitoring',   label:'Monitoring',   room:'operations',  dur:[6,15], roles:['ops','developer'] },
  { id:'deploying',    label:'Deploying',    room:'operations',  dur:[4,10], roles:['ops'] },
  { id:'server_check', label:'Server Check', room:'server',      dur:[3,8],  roles:['ops'] },
  { id:'meeting',      label:'Meeting',      room:'meeting',     dur:[10,20],roles:['developer','researcher','ops','manager'] },
  { id:'break',        label:'Coffee Break', room:'lounge',      dur:[4,8],  roles:['developer','researcher','ops','manager'] },
];



/* ═══════════════════════════════════════════════════════════
   PIXI APPLICATION
═══════════════════════════════════════════════════════════ */
const app = new PIXI.Application({
  resizeTo: window,
  backgroundColor: 0x0a0e17,
  antialias: false,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});
document.getElementById('workspace-container').appendChild(app.view);
app.view.style.imageRendering = 'pixelated';

/* Layers */
const world        = new PIXI.Container();
const floorLayer   = new PIXI.Container();
const wallLayer    = new PIXI.Container();
const furniLayer   = new PIXI.Container();
const agentLayer   = new PIXI.Container();
const uiLayer      = new PIXI.Container();

world.addChild(floorLayer, wallLayer, furniLayer, agentLayer, uiLayer);
app.stage.addChild(world);

/* Camera */
function centerCamera() {
  const sx = app.screen.width  / WORLD_W;
  const sy = app.screen.height / WORLD_H;
  const scale = Math.min(sx, sy, 2.0) * 0.94;
  world.scale.set(scale);
  world.x = (app.screen.width  - WORLD_W * scale) / 2;
  world.y = (app.screen.height - WORLD_H * scale) / 2;
}
centerCamera();
window.addEventListener('resize', centerCamera);

/* ═══════════════════════════════════════════════════════════
   TILESET UTILITIES — roguelike_indoor_2x.png
   32×32 tiles, 2px margin → stride = 34
═══════════════════════════════════════════════════════════ */
let TILESET_TEX = null;   // loaded below

/**
 * Get a PIXI.Texture frame from the roguelike_indoor_2x tileset.
 * @param {number} col - tile column (0-indexed)
 * @param {number} row - tile row (0-indexed)
 */
function getTileTex(col, row) {
  if (!TILESET_TEX) return PIXI.Texture.WHITE;
  return new PIXI.Texture(
    TILESET_TEX,
    new PIXI.Rectangle(col * TS_STRIDE, row * TS_STRIDE, TS_SIZE, TS_SIZE)
  );
}

/** Shorthand: get texture from T.* constant */
function tTex(key) {
  const [col, row] = T[key] || T.FLOOR_A;
  return getTileTex(col, row);
}

/* ═══════════════════════════════════════════════════════════
   AGENT SPRITESHEET — agents_sheet.png (8×1 grid, 32×32)
═══════════════════════════════════════════════════════════ */
let AGENT_TEX = null;

function getAgentTex(idx) {
  if (!AGENT_TEX) return PIXI.Texture.WHITE;
  const i = (idx || 0) % 8;
  return new PIXI.Texture(
    AGENT_TEX,
    new PIXI.Rectangle(i * 32, 0, 32, 32)
  );
}

/* ═══════════════════════════════════════════════════════════
   GRID / COLLISION MAP
   0 = walkable, 1 = wall/furniture
═══════════════════════════════════════════════════════════ */
const grid = Array.from({ length: ROWS }, () => new Uint8Array(COLS).fill(1));

/** Mark a rectangle as walkable floor */
function markFloor(x, y, w, h) {
  for (let r = y; r < y + h; r++)
    for (let c = x; c < x + w; c++)
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) grid[r][c] = 0;
}

/** Mark single cell as blocked */
function blockCell(cx, cy) {
  if (cy >= 0 && cy < ROWS && cx >= 0 && cx < COLS) grid[cy][cx] = 1;
}

/** Mark door cell as walkable */
function openCell(cx, cy) {
  if (cy >= 0 && cy < ROWS && cx >= 0 && cx < COLS) grid[cy][cx] = 0;
}

/* ═══════════════════════════════════════════════════════════
   WORLD BUILD — called after textures load
═══════════════════════════════════════════════════════════ */
function buildWorld() {

  /* ── 1. Whole-map background floor (corridor/outside fill) ── */
  const corridorFloor = getTileTex(0, 9); // dark stone
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const sp = new PIXI.Sprite(corridorFloor);
      sp.x = c * TILE;  sp.y = r * TILE;
      sp.width = TILE;  sp.height = TILE;
      sp.tint = 0x2a2e38;   // darken corridors
      floorLayer.addChild(sp);
    }
  }

  /* ── 2. Rooms: floor tiles + mark grid walkable ── */
  const FLOOR_KEYS = ['FLOOR_A','FLOOR_B','FLOOR_C','FLOOR_D',
                       'FLOOR_E','FLOOR_F','FLOOR_G','FLOOR_H',
                       'FLOOR_I','FLOOR_J','FLOOR_K','FLOOR_L'];

  ROOMS.forEach(rm => {
    // Pick floor variant
    const floorKey = 'FLOOR_' + rm.floorType;
    const floorAlt = FLOOR_KEYS.indexOf(floorKey);
    const floorTex = tTex(floorKey);
    const altTex   = getTileTex((floorAlt + 1) % 8, floorAlt < 8 ? 9 : 10);

    // Mark interior as walkable
    markFloor(rm.x + 1, rm.y + 1, rm.w - 2, rm.h - 2);

    // Draw floor tiles (interior only)
    for (let r = rm.y + 1; r < rm.y + rm.h - 1; r++) {
      for (let c = rm.x + 1; c < rm.x + rm.w - 1; c++) {
        const tex = ((r + c) % 4 === 0) ? altTex : floorTex;
        const sp  = new PIXI.Sprite(tex);
        sp.x = c * TILE;  sp.y = r * TILE;
        sp.width = TILE;  sp.height = TILE;
        floorLayer.addChild(sp);
      }
    }
  });

  /* ── 3. Walls ── */
  const wallSet = new Set();

  ROOMS.forEach(rm => {
    const x1 = rm.x, y1 = rm.y;
    const x2 = rm.x + rm.w - 1, y2 = rm.y + rm.h - 1;

    // Draw wall perimeter, skip door tiles
    const doorCells = new Set((rm.doors || []).map(d => `${d.x},${d.y}`));

    for (let c = x1; c <= x2; c++) {
      addWall(c, y1, getWallTex(c, y1, x1, y1, x2, y1, 'top'), wallSet, doorCells);
      addWall(c, y2, getWallTex(c, y2, x1, y2, x2, y2, 'bot'), wallSet, doorCells);
    }
    for (let r = y1 + 1; r < y2; r++) {
      addWall(x1, r, getTileTex(T.WALL_V[0], T.WALL_V[1]), wallSet, doorCells);
      addWall(x2, r, getTileTex(T.WALL_V[0], T.WALL_V[1]), wallSet, doorCells);
    }

    // Doors
    (rm.doors || []).forEach(d => {
      const doorTex = d.dir === 'h'
        ? getTileTex(T.DOOR_H[0], T.DOOR_H[1])
        : getTileTex(T.DOOR_V[0], T.DOOR_V[1]);
      const sp = new PIXI.Sprite(doorTex);
      sp.x = d.x * TILE;  sp.y = d.y * TILE;
      sp.width = TILE;     sp.height = TILE;
      wallLayer.addChild(sp);
      openCell(d.x, d.y);
    });
  });

  /* ── 4. Furniture ── */
  ROOMS.forEach(rm => {
    (rm.furniture || []).forEach(f => {
      const tex = tTex(f.t);
      const sp  = new PIXI.Sprite(tex);
      sp.x = f.x * TILE;  sp.y = f.y * TILE;
      sp.width = TILE;     sp.height = TILE;
      // Shadow under furniture
      const shadow = new PIXI.Graphics();
      shadow.beginFill(0x000000, 0.2);
      shadow.drawEllipse(f.x * TILE + 16, f.y * TILE + 28, 12, 5);
      shadow.endFill();
      furniLayer.addChild(shadow);
      furniLayer.addChild(sp);
      // Block furniture cells from pathfinding
      blockCell(f.x, f.y);
    });
  });

  /* ── 5. Room labels ── */
  ROOMS.forEach(rm => {
    const style = new PIXI.TextStyle({
      fontFamily: 'monospace',
      fontSize: 9,
      fill: 0xaaccdd,
      dropShadow: true,
      dropShadowDistance: 1,
      dropShadowAlpha: 0.9,
      dropShadowColor: 0x000000,
    });
    const lbl = new PIXI.Text(rm.label, style);
    lbl.anchor.set(0.5, 0);
    lbl.x = (rm.x + rm.w / 2) * TILE;
    lbl.y = (rm.y + 0.8) * TILE;
    lbl.alpha = 0.7;
    uiLayer.addChild(lbl);
  });
}

/* ── Wall tile selector ── */
function getWallTex(c, r, x1, y1, x2, y2, side) {
  if (side === 'top') {
    if (c === x1) return getTileTex(T.WALL_TL[0], T.WALL_TL[1]);
    if (c === x2) return getTileTex(T.WALL_TR[0], T.WALL_TR[1]);
    return getTileTex(T.WALL_H[0], T.WALL_H[1]);
  } else {
    if (c === x1) return getTileTex(T.WALL_BL[0], T.WALL_BL[1]);
    if (c === x2) return getTileTex(T.WALL_BR[0], T.WALL_BR[1]);
    return getTileTex(T.WALL_H[0], T.WALL_H[1]);
  }
}

function addWall(c, r, tex, wallSet, doorCells) {
  const key = `${c},${r}`;
  if (doorCells && doorCells.has(key)) return; // leave gap for door
  if (wallSet.has(key)) return;
  wallSet.add(key);
  const sp = new PIXI.Sprite(tex);
  sp.x = c * TILE;  sp.y = r * TILE;
  sp.width = TILE;   sp.height = TILE;
  wallLayer.addChild(sp);
  blockCell(c, r);
}



/* ═══════════════════════════════════════════════════════════
   SIMPLE PATHFINDER — BFS grid walk
═══════════════════════════════════════════════════════════ */

/**
 * BFS from (sc, sr) to (tc, tr).
 * Returns array of {x, y} world-pixel waypoints, or direct line if blocked.
 */
function findPath(sx, sy, tx, ty) {
  const sc = Math.round(sx / TILE);
  const sr = Math.round(sy / TILE);
  const tc = Math.round(tx / TILE);
  const tr = Math.round(ty / TILE);

  if (sc === tc && sr === tr) return [{ x: tx, y: ty }];

  // BFS
  const visited = new Uint8Array(COLS * ROWS);
  const parent  = new Int32Array(COLS * ROWS).fill(-1);
  const queue   = [sr * COLS + sc];
  visited[sr * COLS + sc] = 1;

  const DIRS = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
  let found = false;

  outer: while (queue.length) {
    const cur = queue.shift();
    const cr  = Math.floor(cur / COLS);
    const cc  = cur % COLS;
    for (const [dc, dr] of DIRS) {
      const nc = cc + dc, nr = cr + dr;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      const ni = nr * COLS + nc;
      if (visited[ni] || grid[nr][nc]) continue;
      visited[ni] = 1;
      parent[ni] = cur;
      if (nc === tc && nr === tr) { found = true; break outer; }
      queue.push(ni);
    }
  }

  if (!found) return [{ x: tx, y: ty }]; // fallback: direct

  // Reconstruct path
  const path = [];
  let cur = tr * COLS + tc;
  while (cur !== -1) {
    const r = Math.floor(cur / COLS);
    const c = cur % COLS;
    path.unshift({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 });
    cur = parent[cur];
  }
  path[path.length - 1] = { x: tx, y: ty }; // exact target
  return path;
}

/* ═══════════════════════════════════════════════════════════
   AGENT SYSTEM
═══════════════════════════════════════════════════════════ */
const agents = [];

function spawnAgents() {
  AGENT_DEFS.forEach((def, i) => {
    const rm = ROOMS.find(r => r.id === def.home) || ROOMS[0];

    // Start in room interior
    const sx = (rm.x + 2 + Math.floor(Math.random() * (rm.w - 4))) * TILE + TILE / 2;
    const sy = (rm.y + 2 + Math.floor(Math.random() * (rm.h - 4))) * TILE + TILE / 2;

    const tint = ROLE_TINT[def.role] || 0xffffff;

    /* Agent sprite */
    const agentTex  = getAgentTex(def.spriteIdx);
    const sprite    = new PIXI.Sprite(agentTex);
    sprite.anchor.set(0.5, 0.9);
    sprite.width    = TILE;
    sprite.height   = TILE;
    sprite.tint     = tint;
    sprite.x        = sx;
    sprite.y        = sy;

    /* Shadow */
    const shadow = new PIXI.Graphics();
    shadow.beginFill(0x000000, 0.22);
    shadow.drawEllipse(0, 4, 9, 4);
    shadow.endFill();
    shadow.x = sx;
    shadow.y = sy;

    /* Name tag */
    const nameStyle = new PIXI.TextStyle({ fontFamily:'monospace', fontSize:7, fill:tint,
      dropShadow:true, dropShadowDistance:1, dropShadowAlpha:0.9, dropShadowColor:0x000000 });
    const nameTag = new PIXI.Text(def.name, nameStyle);
    nameTag.anchor.set(0.5, 1);
    nameTag.x = sx;
    nameTag.y = sy - TILE * 0.55;

    /* Job bubble */
    const jobStyle = new PIXI.TextStyle({ fontFamily:'monospace', fontSize:6, fill:0xa5f3fc,
      dropShadow:true, dropShadowDistance:1, dropShadowAlpha:0.8, dropShadowColor:0x000000 });
    const jobTag = new PIXI.Text('', jobStyle);
    jobTag.anchor.set(0.5, 1);
    jobTag.alpha = 0;
    jobTag.x = sx;
    jobTag.y = sy - TILE * 0.9;

    agentLayer.addChild(shadow);
    agentLayer.addChild(sprite);
    uiLayer.addChild(nameTag);
    uiLayer.addChild(jobTag);

    agents.push({
      def, sprite, shadow, nameTag, jobTag,
      x: sx, y: sy,
      path: [],       // waypoints
      pathIdx: 0,
      state: 'idle',
      currentRoom: def.home,
      targetRoom: null,
      job: null,
      jobTimer: 0,
      idleTimer: 0.5 + Math.random() * 2,
      bobPhase: Math.random() * Math.PI * 2,
      bobDir: Math.random() > 0.5 ? 1 : -1,
    });
  });
}

/* ── Pick a job for agent ── */
function pickJob(agent) {
  const valid = JOBS.filter(j => j.roles.includes(agent.def.role));
  const weights = valid.map(j => {
    let w = 1;
    if (j.room === agent.def.home) w = 5;
    if (j.id === 'meeting')        w = 2;
    if (j.id === 'break')          w = 1.5;
    return { j, w };
  });
  const total = weights.reduce((s, {w}) => s + w, 0);
  let r = Math.random() * total;
  for (const {j, w} of weights) { r -= w; if (r <= 0) return j; }
  return valid[0];
}

/* ── Get a free station position for a room ── */
function getStation(roomId) {
  const rm = ROOMS.find(r => r.id === roomId);
  if (!rm) return null;
  const sts = rm.stations || [];
  if (!sts.length) {
    return {
      x: (rm.x + 2 + Math.random() * (rm.w - 4)) * TILE + TILE / 2,
      y: (rm.y + 2 + Math.random() * (rm.h - 4)) * TILE + TILE / 2,
    };
  }
  const st = sts[Math.floor(Math.random() * sts.length)];
  return { x: st.x * TILE + TILE / 2, y: st.y * TILE + TILE / 2 };
}

/* ═══════════════════════════════════════════════════════════
   SIMULATION TICK
═══════════════════════════════════════════════════════════ */
function simulate(ticker) {
  const dt = Math.min(ticker.deltaMS / 1000, 0.1);

  agents.forEach(a => {
    switch (a.state) {
      /* ── IDLE: wait, then pick a job ── */
      case 'idle': {
        a.idleTimer -= dt;
        // Subtle idle bob
        a.bobPhase += dt * 1.5;
        a.sprite.y = a.y + Math.sin(a.bobPhase) * 0.8;

        if (a.idleTimer <= 0) {
          const job  = pickJob(a);
          const pos  = getStation(job.room);
          if (!pos) break;

          a.job       = job;
          a.targetRoom = job.room;
          a.jobTimer  = job.dur[0] + Math.random() * (job.dur[1] - job.dur[0]);
          a.jobTag.text = job.label;

          // Pathfind
          a.path    = findPath(a.x, a.y, pos.x, pos.y);
          a.pathIdx = 0;
          a.state   = 'moving';
        }
        break;
      }

      /* ── MOVING: follow path waypoints ── */
      case 'moving': {
        if (a.pathIdx >= a.path.length) {
          // Arrived
          a.state = 'working';
          a.currentRoom = a.targetRoom;
          a.jobTag.alpha = 0.85;
          break;
        }

        const wp = a.path[a.pathIdx];
        const dx = wp.x - a.x;
        const dy = wp.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < ARRIVE) {
          a.x = wp.x;
          a.y = wp.y;
          a.pathIdx++;
        } else {
          const move = SPEED * dt;
          const ratio = move / dist;
          a.x += dx * ratio;
          a.y += dy * ratio;
        }

        // Walk bob
        a.bobPhase += dt * 8;
        a.sprite.x  = a.x;
        a.sprite.y  = a.y + Math.sin(a.bobPhase) * 1.5;

        // Flip sprite for direction
        a.sprite.scale.x = dx < 0 ? -1 : 1;

        // Job tag fades while moving
        a.jobTag.alpha = Math.max(0, a.jobTag.alpha - dt * 0.8);
        break;
      }

      /* ── WORKING: jitter at desk ── */
      case 'working': {
        a.jobTimer -= dt;

        // Typing micro-jitter
        if (Math.random() < 0.06) {
          a.sprite.x = a.x + (Math.random() - 0.5) * 1.2;
          a.sprite.y = a.y + (Math.random() - 0.5) * 0.7;
        } else {
          a.sprite.x = a.x;
          a.sprite.y = a.y;
        }

        // Pulse job bubble
        a.jobTag.alpha = 0.75 + Math.sin(Date.now() * 0.004) * 0.25;

        if (a.jobTimer <= 0) {
          a.state    = 'idle';
          a.job      = null;
          a.path     = [];
          a.pathIdx  = 0;
          a.idleTimer = 1.5 + Math.random() * 3;
          a.jobTag.alpha = 0;
          a.sprite.scale.x = 1;
        }
        break;
      }
    }

    /* Sync shadow + labels to sprite position */
    a.shadow.x  = a.sprite.x;
    a.shadow.y  = a.sprite.y + 2;
    a.nameTag.x = a.sprite.x;
    a.nameTag.y = a.sprite.y - TILE * 0.5;
    a.jobTag.x  = a.sprite.x;
    a.jobTag.y  = a.sprite.y - TILE * 0.9;
  });
}

/* ═══════════════════════════════════════════════════════════
   HUD UPDATER
═══════════════════════════════════════════════════════════ */
function updateHUD() {
  const working = agents.filter(a => a.state === 'working').length;
  const moving  = agents.filter(a => a.state === 'moving').length;
  const idle    = agents.filter(a => a.state === 'idle').length;

  const ac = document.getElementById('agent-count');
  if (ac) ac.textContent = `👥 ${agents.length}  ⚡ ${working} working  🚶 ${moving} moving  💤 ${idle} idle`;

  const rl = document.getElementById('room-label');
  if (rl) rl.textContent = `${ROOMS.length} rooms • LIVE simulation`;
}

/* ═══════════════════════════════════════════════════════════
   TOUCH / PAN / PINCH CAMERA CONTROLS
═══════════════════════════════════════════════════════════ */
(function initCamera() {
  let isPanning = false;
  let lastPan   = { x: 0, y: 0 };
  let lastPinch = 0;

  app.view.addEventListener('mousedown', e => {
    isPanning = true;
    lastPan = { x: e.clientX, y: e.clientY };
  });
  app.view.addEventListener('mousemove', e => {
    if (!isPanning) return;
    world.x += e.clientX - lastPan.x;
    world.y += e.clientY - lastPan.y;
    lastPan  = { x: e.clientX, y: e.clientY };
  });
  app.view.addEventListener('mouseup',   () => { isPanning = false; });
  app.view.addEventListener('mouseleave',() => { isPanning = false; });

  app.view.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      isPanning = true;
      lastPan = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isPanning = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinch = Math.sqrt(dx*dx + dy*dy);
    }
  }, { passive: true });

  app.view.addEventListener('touchmove', e => {
    if (e.touches.length === 2) {
      const dx   = e.touches[0].clientX - e.touches[1].clientX;
      const dy   = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (lastPinch > 0) {
        const factor   = dist / lastPinch;
        const newScale = Math.max(0.3, Math.min(3.0, world.scale.x * factor));
        world.scale.set(newScale);
      }
      lastPinch = dist;
      return;
    }
    if (!isPanning || e.touches.length !== 1) return;
    world.x += e.touches[0].clientX - lastPan.x;
    world.y += e.touches[0].clientY - lastPan.y;
    lastPan  = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });

  app.view.addEventListener('touchend', () => {
    isPanning = false;
    lastPinch = 0;
  });

  // Wheel zoom
  app.view.addEventListener('wheel', e => {
    e.preventDefault();
    const delta    = e.deltaY > 0 ? 0.92 : 1.09;
    const newScale = Math.max(0.3, Math.min(3.0, world.scale.x * delta));
    const rect     = app.view.getBoundingClientRect();
    const mx       = e.clientX - rect.left;
    const my       = e.clientY - rect.top;
    const wx       = (mx - world.x) / world.scale.x;
    const wy       = (my - world.y) / world.scale.y;
    world.scale.set(newScale);
    world.x = mx - wx * newScale;
    world.y = my - wy * newScale;
  }, { passive: false });
})();

/* ═══════════════════════════════════════════════════════════
   BOOTSTRAP — load textures then build world
═══════════════════════════════════════════════════════════ */
const ASSET_BASE = 'assets/';

PIXI.Assets.load([
  ASSET_BASE + 'roguelike_indoor_2x.png',
  ASSET_BASE + 'agents_sheet.png',
]).then(textures => {

  TILESET_TEX = textures[ASSET_BASE + 'roguelike_indoor_2x.png'];
  AGENT_TEX   = textures[ASSET_BASE + 'agents_sheet.png'];

  // Nearest-neighbor scaling for crisp pixels
  if (TILESET_TEX) TILESET_TEX.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
  if (AGENT_TEX)   AGENT_TEX.baseTexture.scaleMode   = PIXI.SCALE_MODES.NEAREST;

  buildWorld();
  spawnAgents();

  app.ticker.add(simulate);
  setInterval(updateHUD, 800);
  updateHUD();

  console.log('[Hermes] PixiJS office simulation live — ' + agents.length + ' agents');

}).catch(err => {
  console.error('[Hermes] Asset load error:', err);
  // Fallback: build with generated textures
  buildWorld();
  spawnAgents();
  app.ticker.add(simulate);
  setInterval(updateHUD, 800);
});

})();
