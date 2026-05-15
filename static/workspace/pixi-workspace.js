/**
 * Hermes 2D Office Simulation — PixiJS 7 Renderer
 * Non-blocking init: renders IMMEDIATELY, loads assets async.
 * Full fallback: colored tiles if any asset fails.
 */
(function () {
'use strict';

/* ═══════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════ */
const TILE    = 32;
const COLS    = 44;
const ROWS    = 30;
const WORLD_W = COLS * TILE;
const WORLD_H = ROWS * TILE;
const SPEED   = 80;
const ARRIVE  = 5;

/* Tileset: roguelike_indoor_2x.png — 32px tiles, 2px gap → stride=34 */
const TS_STRIDE = 34;
const TS_SIZE   = 32;

/* Tile coords [col, row] in roguelike_indoor_2x tileset */
const T = {
  FLOOR_A:[0,9], FLOOR_B:[1,9], FLOOR_C:[2,9], FLOOR_D:[3,9],
  FLOOR_E:[4,9], FLOOR_F:[5,9], FLOOR_G:[6,9], FLOOR_H:[7,9],
  FLOOR_I:[0,10],FLOOR_J:[1,10],FLOOR_K:[2,10],FLOOR_L:[3,10],
  WALL_H:[2,0],  WALL_V:[0,2],
  WALL_TL:[0,0], WALL_TR:[8,0], WALL_BL:[0,6], WALL_BR:[8,6],
  DOOR_H:[7,0],  DOOR_V:[7,1],
  DESK:[7,7],    DESK2:[6,7],   TABLE:[3,7],   TABLE2:[4,7],
  COMPUTER:[11,7],CHAIR:[13,3], CHAIR2:[14,3], PLANT:[15,3],
  SHELF:[8,3],   CABINET:[10,3],SOFA:[9,5],    SOFA2:[10,5],
  CTABLE:[16,7],
};

const FLOOR_KEYS = ['FLOOR_A','FLOOR_B','FLOOR_C','FLOOR_D',
                    'FLOOR_E','FLOOR_F','FLOOR_G','FLOOR_H',
                    'FLOOR_I','FLOOR_J','FLOOR_K','FLOOR_L'];

/* Fallback colors per tile type */
const FALLBACK = {
  floor:   0x3c3848,
  wall:    0x6a6e80,
  door:    0x7a5020,
  desk:    0x6a4518,
  chair:   0x3c5080,
  sofa:    0x4a3260,
  table:   0x6e4a20,
  plant:   0x1a5a1a,
  shelf:   0x5a4a30,
  cabinet: 0x4a4a5a,
};

const ROLE_TINT = {
  developer : 0x00e5cc,
  researcher: 0xffaa33,
  ops       : 0x44ff88,
  manager   : 0xff66aa,
};



/* ═══════════════════════════════════════
   ROOM LAYOUT
═══════════════════════════════════════ */
const ROOMS = [
  { id:'engineering', name:'Engineering', x:1,  y:1,  w:16, h:12, floorType:'B',
    label:'⚙ Engineering',
    stations:[{x:3,y:4},{x:5,y:4},{x:7,y:4},{x:9,y:4},{x:11,y:4},{x:13,y:4},
              {x:3,y:8},{x:5,y:8},{x:7,y:8},{x:9,y:8},{x:11,y:8}],
    furniture:[
      {t:'DESK',x:3,y:4},{t:'COMPUTER',x:4,y:4},
      {t:'DESK',x:6,y:4},{t:'COMPUTER',x:7,y:4},
      {t:'DESK',x:9,y:4},{t:'COMPUTER',x:10,y:4},
      {t:'DESK',x:12,y:4},{t:'COMPUTER',x:13,y:4},
      {t:'DESK',x:3,y:8},{t:'COMPUTER',x:4,y:8},
      {t:'DESK',x:6,y:8},{t:'COMPUTER',x:7,y:8},
      {t:'CHAIR',x:3,y:5},{t:'CHAIR',x:6,y:5},{t:'CHAIR',x:9,y:5},{t:'CHAIR',x:12,y:5},
      {t:'CHAIR',x:3,y:9},{t:'CHAIR',x:6,y:9},
      {t:'PLANT',x:14,y:10},{t:'SHELF',x:2,y:6},
    ],
    doors:[{x:8,y:12,dir:'h'}],
  },
  { id:'research', name:'Research', x:18, y:1,  w:12, h:12, floorType:'D',
    label:'🔬 Research',
    stations:[{x:20,y:4},{x:22,y:4},{x:24,y:4},{x:20,y:8},{x:22,y:8}],
    furniture:[
      {t:'TABLE',x:20,y:4},{t:'TABLE2',x:21,y:4},
      {t:'TABLE',x:23,y:4},{t:'TABLE2',x:24,y:4},
      {t:'TABLE',x:20,y:8},{t:'TABLE2',x:21,y:8},
      {t:'SHELF',x:19,y:3},{t:'SHELF',x:19,y:5},
      {t:'CABINET',x:28,y:3},{t:'PLANT',x:28,y:9},
      {t:'CHAIR',x:20,y:5},{t:'CHAIR',x:22,y:5},{t:'CHAIR',x:24,y:5},
      {t:'CHAIR',x:20,y:9},{t:'CHAIR',x:22,y:9},
    ],
    doors:[{x:24,y:12,dir:'h'}],
  },
  { id:'operations', name:'Operations', x:31, y:1,  w:12, h:12, floorType:'F',
    label:'⚡ Ops',
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
    doors:[{x:37,y:12,dir:'h'}],
  },
  { id:'meeting', name:'Meeting', x:1,  y:15, w:12, h:12, floorType:'J',
    label:'📋 Meeting',
    stations:[{x:4,y:18},{x:5,y:18},{x:6,y:18},{x:7,y:18},{x:8,y:18},{x:9,y:18},
              {x:4,y:20},{x:5,y:20},{x:6,y:20},{x:7,y:20},{x:8,y:20}],
    furniture:[
      {t:'TABLE',x:4,y:18},{t:'TABLE',x:5,y:18},{t:'TABLE',x:6,y:18},
      {t:'TABLE',x:7,y:18},{t:'TABLE',x:8,y:18},{t:'TABLE',x:9,y:18},
      {t:'TABLE2',x:4,y:20},{t:'TABLE2',x:5,y:20},{t:'TABLE2',x:6,y:20},
      {t:'CHAIR',x:4,y:17},{t:'CHAIR',x:6,y:17},{t:'CHAIR',x:8,y:17},
      {t:'CHAIR',x:4,y:21},{t:'CHAIR',x:6,y:21},{t:'CHAIR',x:8,y:21},
      {t:'CHAIR',x:3,y:19},{t:'CHAIR',x:10,y:19},
      {t:'PLANT',x:2,y:26},{t:'PLANT',x:11,y:26},
    ],
    doors:[{x:7,y:15,dir:'h'}],
  },
  { id:'lounge', name:'Lounge', x:14, y:15, w:15, h:12, floorType:'L',
    label:'☕ Lounge',
    stations:[{x:17,y:18},{x:17,y:22},{x:21,y:18},{x:21,y:22},{x:25,y:20}],
    furniture:[
      {t:'SOFA',x:17,y:18},{t:'SOFA2',x:18,y:18},
      {t:'SOFA',x:17,y:22},{t:'SOFA2',x:18,y:22},
      {t:'SOFA',x:24,y:18},{t:'SOFA2',x:25,y:18},
      {t:'CTABLE',x:20,y:20},{t:'CTABLE',x:22,y:20},
      {t:'PLANT',x:15,y:16},{t:'PLANT',x:27,y:16},
      {t:'PLANT',x:15,y:25},{t:'PLANT',x:27,y:25},
    ],
    doors:[{x:21,y:15,dir:'h'}],
  },
  { id:'server', name:'Server Room', x:31, y:15, w:12, h:12, floorType:'I',
    label:'🖥 Servers',
    stations:[{x:33,y:18},{x:35,y:18},{x:37,y:18},{x:33,y:22},{x:35,y:22}],
    furniture:[
      {t:'CABINET',x:33,y:17},{t:'CABINET',x:35,y:17},{t:'CABINET',x:37,y:17},
      {t:'CABINET',x:33,y:21},{t:'CABINET',x:35,y:21},{t:'CABINET',x:37,y:21},
      {t:'DESK',x:33,y:19},{t:'COMPUTER',x:34,y:19},
      {t:'DESK',x:36,y:19},{t:'COMPUTER',x:37,y:19},
      {t:'SHELF',x:40,y:17},{t:'SHELF',x:40,y:21},
      {t:'PLANT',x:32,y:26},
    ],
    doors:[{x:37,y:15,dir:'h'}],
  },
];



/* ═══════════════════════════════════════
   AGENTS & JOBS
═══════════════════════════════════════ */
const AGENT_DEFS = [
  {name:'Alice',   role:'developer',  home:'engineering', idx:0},
  {name:'Bob',     role:'developer',  home:'engineering', idx:1},
  {name:'Charlie', role:'developer',  home:'engineering', idx:7},
  {name:'Diana',   role:'researcher', home:'research',    idx:2},
  {name:'Eve',     role:'researcher', home:'research',    idx:5},
  {name:'Frank',   role:'researcher', home:'research',    idx:4},
  {name:'Grace',   role:'ops',        home:'operations',  idx:6},
  {name:'Hank',    role:'ops',        home:'operations',  idx:3},
  {name:'Iris',    role:'ops',        home:'server',      idx:6},
  {name:'Jack',    role:'manager',    home:'meeting',     idx:4},
  {name:'Kate',    role:'manager',    home:'engineering', idx:2},
  {name:'Leo',     role:'developer',  home:'engineering', idx:1},
];

const JOBS = [
  {id:'coding',      label:'Coding',       room:'engineering', dur:[8,18], roles:['developer','manager']},
  {id:'code_review', label:'Code Review',  room:'engineering', dur:[5,12], roles:['developer','manager']},
  {id:'research',    label:'Researching',  room:'research',    dur:[10,20],roles:['researcher','developer']},
  {id:'brainstorm',  label:'Brainstorm',   room:'research',    dur:[6,14], roles:['researcher','manager']},
  {id:'monitoring',  label:'Monitoring',   room:'operations',  dur:[6,15], roles:['ops','developer']},
  {id:'deploying',   label:'Deploying',    room:'operations',  dur:[4,10], roles:['ops']},
  {id:'server_check',label:'Server Check', room:'server',      dur:[3,8],  roles:['ops']},
  {id:'meeting',     label:'Meeting',      room:'meeting',     dur:[10,20],roles:['developer','researcher','ops','manager']},
  {id:'break',       label:'Coffee Break', room:'lounge',      dur:[4,8],  roles:['developer','researcher','ops','manager']},
];

/* ═══════════════════════════════════════
   PIXI APPLICATION — created immediately
═══════════════════════════════════════ */
const app = new PIXI.Application({
  resizeTo: window,
  backgroundColor: 0x0a0e17,
  antialias: false,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});
document.getElementById('workspace-container').appendChild(app.view);
app.view.style.imageRendering = 'pixelated';

/* Layer stack */
const world      = new PIXI.Container();
const floorLayer = new PIXI.Container();
const wallLayer  = new PIXI.Container();
const furniLayer = new PIXI.Container();
const agentLayer = new PIXI.Container();
const uiLayer    = new PIXI.Container();
world.addChild(floorLayer, wallLayer, furniLayer, agentLayer, uiLayer);
app.stage.addChild(world);

/* Camera fit */
function centerCamera() {
  const sx = app.screen.width  / WORLD_W;
  const sy = app.screen.height / WORLD_H;
  const sc = Math.min(sx, sy, 2.0) * 0.94;
  world.scale.set(sc);
  world.x = (app.screen.width  - WORLD_W * sc) / 2;
  world.y = (app.screen.height - WORLD_H * sc) / 2;
}
centerCamera();
window.addEventListener('resize', centerCamera);



/* ═══════════════════════════════════════
   TEXTURE HELPERS
═══════════════════════════════════════ */
let TILESET_TEX = null;   /* roguelike_indoor_2x.png */
let AGENT_TEX   = null;   /* agents_sheet.png */

/**
 * Get a texture frame from the roguelike_indoor_2x tileset.
 * Falls back to a colored Graphics rect if tileset not loaded.
 */
function getTileTex(col, row) {
  if (!TILESET_TEX) return null;
  return new PIXI.Texture(
    TILESET_TEX,
    new PIXI.Rectangle(col * TS_STRIDE, row * TS_STRIDE, TS_SIZE, TS_SIZE)
  );
}

function tTex(key) {
  const [col, row] = T[key] || T.FLOOR_A;
  return getTileTex(col, row);
}

/**
 * Make a colored fallback sprite (when texture is missing).
 */
function makeFallbackSprite(color, x, y, w, h) {
  const g = new PIXI.Graphics();
  g.beginFill(color, 0.9);
  g.drawRect(0, 0, w || TILE, h || TILE);
  g.endFill();
  g.x = x; g.y = y;
  return g;
}

/**
 * Make a tile sprite (uses tileset if loaded, else colored fallback).
 */
function makeTile(texKey, fallbackColor, tx, ty) {
  const tex = tTex(texKey);
  if (tex) {
    const sp = new PIXI.Sprite(tex);
    sp.x = tx; sp.y = ty;
    sp.width = TILE; sp.height = TILE;
    return sp;
  }
  return makeFallbackSprite(fallbackColor, tx, ty, TILE, TILE);
}

/**
 * Get a character frame from agents_sheet.png (8 chars × 32px wide).
 * Falls back to null if sheet not loaded.
 */
function getAgentTex(idx) {
  if (!AGENT_TEX) return null;
  const i = (idx || 0) % 8;
  return new PIXI.Texture(AGENT_TEX, new PIXI.Rectangle(i * 32, 0, 32, 32));
}

/* ═══════════════════════════════════════
   GRID / COLLISION
═══════════════════════════════════════ */
const grid = Array.from({length: ROWS}, () => new Uint8Array(COLS).fill(1));

function markFloor(x, y, w, h) {
  for (let r = y; r < y + h; r++)
    for (let c = x; c < x + w; c++)
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) grid[r][c] = 0;
}
function blockCell(cx, cy) {
  if (cy >= 0 && cy < ROWS && cx >= 0 && cx < COLS) grid[cy][cx] = 1;
}
function openCell(cx, cy) {
  if (cy >= 0 && cy < ROWS && cx >= 0 && cx < COLS) grid[cy][cx] = 0;
}



/* ═══════════════════════════════════════
   WORLD BUILD
═══════════════════════════════════════ */
function buildWorld() {
  floorLayer.removeChildren();
  wallLayer.removeChildren();
  furniLayer.removeChildren();
  uiLayer.removeChildren();

  /* ── 1. Dark corridor floor across whole map ── */
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tex = getTileTex(0, 9);
      if (tex) {
        const sp = new PIXI.Sprite(tex);
        sp.x = c * TILE; sp.y = r * TILE;
        sp.width = TILE; sp.height = TILE;
        sp.tint = 0x2a2e38;
        floorLayer.addChild(sp);
      } else {
        floorLayer.addChild(makeFallbackSprite(0x1e2030, c * TILE, r * TILE, TILE, TILE));
      }
    }
  }

  /* ── 2. Room floors + walkable grid ── */
  ROOMS.forEach(rm => {
    const floorIdx = FLOOR_KEYS.indexOf('FLOOR_' + rm.floorType);
    const fc = floorIdx >= 0 ? floorIdx % 8 : 0;
    const fr = floorIdx >= 8 ? 10 : 9;
    const fc2 = (fc + 1) % 8;

    markFloor(rm.x + 1, rm.y + 1, rm.w - 2, rm.h - 2);

    for (let r = rm.y + 1; r < rm.y + rm.h - 1; r++) {
      for (let c = rm.x + 1; c < rm.x + rm.w - 1; c++) {
        const alt = (r + c) % 4 === 0;
        const tex = getTileTex(alt ? fc2 : fc, fr);
        if (tex) {
          const sp = new PIXI.Sprite(tex);
          sp.x = c * TILE; sp.y = r * TILE;
          sp.width = TILE; sp.height = TILE;
          floorLayer.addChild(sp);
        } else {
          const col = alt ? 0x3a3848 : 0x343244;
          floorLayer.addChild(makeFallbackSprite(col, c * TILE, r * TILE, TILE, TILE));
        }
      }
    }
  });

  /* ── 3. Walls ── */
  const wallSet = new Set();

  ROOMS.forEach(rm => {
    const x1 = rm.x, y1 = rm.y, x2 = rm.x + rm.w - 1, y2 = rm.y + rm.h - 1;
    const doorKeys = new Set((rm.doors || []).map(d => d.x + ',' + d.y));

    function addWall(c, r, tKey) {
      const key = c + ',' + r;
      if (doorKeys.has(key) || wallSet.has(key)) return;
      wallSet.add(key);
      const tx = c * TILE, ty = r * TILE;
      const tex = tTex(tKey);
      if (tex) {
        const sp = new PIXI.Sprite(tex);
        sp.x = tx; sp.y = ty; sp.width = TILE; sp.height = TILE;
        wallLayer.addChild(sp);
      } else {
        wallLayer.addChild(makeFallbackSprite(FALLBACK.wall, tx, ty, TILE, TILE));
      }
      blockCell(c, r);
    }

    for (let c = x1; c <= x2; c++) {
      const topKey = c === x1 ? 'WALL_TL' : c === x2 ? 'WALL_TR' : 'WALL_H';
      const botKey = c === x1 ? 'WALL_BL' : c === x2 ? 'WALL_BR' : 'WALL_H';
      addWall(c, y1, topKey);
      addWall(c, y2, botKey);
    }
    for (let r = y1 + 1; r < y2; r++) {
      addWall(x1, r, 'WALL_V');
      addWall(x2, r, 'WALL_V');
    }

    /* Doors */
    (rm.doors || []).forEach(d => {
      const dKey = d.dir === 'h' ? 'DOOR_H' : 'DOOR_V';
      const tx = d.x * TILE, ty = d.y * TILE;
      const tex = tTex(dKey);
      if (tex) {
        const sp = new PIXI.Sprite(tex);
        sp.x = tx; sp.y = ty; sp.width = TILE; sp.height = TILE;
        wallLayer.addChild(sp);
      } else {
        wallLayer.addChild(makeFallbackSprite(FALLBACK.door, tx, ty, TILE, TILE));
      }
      openCell(d.x, d.y);
    });
  });

  /* ── 4. Furniture ── */
  ROOMS.forEach(rm => {
    (rm.furniture || []).forEach(f => {
      const tx = f.x * TILE, ty = f.y * TILE;
      const tex = tTex(f.t);
      const fbColor = FALLBACK[f.t.toLowerCase()] ||
        FALLBACK[f.t.replace(/\d/g,'').toLowerCase()] ||
        0x554455;

      /* Shadow */
      const sh = new PIXI.Graphics();
      sh.beginFill(0x000000, 0.22);
      sh.drawEllipse(tx + 16, ty + 28, 12, 4);
      sh.endFill();
      furniLayer.addChild(sh);

      if (tex) {
        const sp = new PIXI.Sprite(tex);
        sp.x = tx; sp.y = ty; sp.width = TILE; sp.height = TILE;
        furniLayer.addChild(sp);
      } else {
        furniLayer.addChild(makeFallbackSprite(fbColor, tx, ty, TILE, TILE));
      }
      blockCell(f.x, f.y);
    });
  });

  /* ── 5. Room labels ── */
  const labelStyle = new PIXI.TextStyle({
    fontFamily: 'monospace', fontSize: 9,
    fill: 0xaaccdd,
    dropShadow: true, dropShadowDistance: 1,
    dropShadowAlpha: 0.9, dropShadowColor: 0x000000,
  });
  ROOMS.forEach(rm => {
    const lbl = new PIXI.Text(rm.label, labelStyle);
    lbl.anchor.set(0.5, 0);
    lbl.x = (rm.x + rm.w / 2) * TILE;
    lbl.y = (rm.y + 0.8) * TILE;
    lbl.alpha = 0.75;
    uiLayer.addChild(lbl);
  });

  console.log('[Hermes] World built. Tileset loaded:', TILESET_TEX !== null);
}



/* ═══════════════════════════════════════
   BFS PATHFINDER
═══════════════════════════════════════ */
function findPath(sx, sy, tx, ty) {
  const sc = Math.round(sx / TILE);
  const sr = Math.round(sy / TILE);
  const tc = Math.round(tx / TILE);
  const tr = Math.round(ty / TILE);
  if (sc === tc && sr === tr) return [{x: tx, y: ty}];

  const visited = new Uint8Array(COLS * ROWS);
  const parent  = new Int32Array(COLS * ROWS).fill(-1);
  const queue   = [sr * COLS + sc];
  visited[sr * COLS + sc] = 1;
  const DIRS = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
  let found = false;

  outer: while (queue.length) {
    const cur = queue.shift();
    const cr = Math.floor(cur / COLS), cc = cur % COLS;
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

  if (!found) return [{x: tx, y: ty}];
  const path = [];
  let cur = tr * COLS + tc;
  while (cur !== -1) {
    const r = Math.floor(cur / COLS), c = cur % COLS;
    path.unshift({x: c * TILE + TILE / 2, y: r * TILE + TILE / 2});
    cur = parent[cur];
  }
  path[path.length - 1] = {x: tx, y: ty};
  return path;
}

/* ═══════════════════════════════════════
   AGENT SYSTEM
═══════════════════════════════════════ */
const agents = [];

/**
 * Build a humanoid fallback shape (NOT a circle).
 * Returns a PIXI.Graphics.
 */
function makeHumanoidFallback(tint) {
  const g = new PIXI.Graphics();
  const r = (tint >> 16) & 0xff;
  const gn = (tint >> 8) & 0xff;
  const b = tint & 0xff;
  // Head
  g.beginFill(tint, 1.0);
  g.drawRect(-6, -28, 12, 12);
  g.endFill();
  // Body
  g.beginFill(tint, 0.85);
  g.drawRect(-7, -16, 14, 14);
  g.endFill();
  // Arms
  g.beginFill(tint, 0.75);
  g.drawRect(-11, -15, 4, 10);
  g.drawRect(7, -15, 4, 10);
  g.endFill();
  // Legs
  g.beginFill(tint, 0.7);
  g.drawRect(-6, -2, 5, 10);
  g.drawRect(1, -2, 5, 10);
  g.endFill();
  return g;
}

function spawnAgents() {
  AGENT_DEFS.forEach((def) => {
    const rm = ROOMS.find(r => r.id === def.home) || ROOMS[0];
    const sx = (rm.x + 2 + Math.floor(Math.random() * (rm.w - 4))) * TILE + TILE / 2;
    const sy = (rm.y + 2 + Math.floor(Math.random() * (rm.h - 4))) * TILE + TILE / 2;
    const tint = ROLE_TINT[def.role] || 0xffffff;

    /* Shadow */
    const shadow = new PIXI.Graphics();
    shadow.beginFill(0x000000, 0.25);
    shadow.drawEllipse(0, 4, 9, 4);
    shadow.endFill();
    shadow.x = sx; shadow.y = sy;

    /* Sprite or humanoid fallback */
    const agentTex = getAgentTex(def.idx);
    let sprite;
    if (agentTex) {
      sprite = new PIXI.Sprite(agentTex);
      sprite.anchor.set(0.5, 0.9);
      sprite.width = TILE; sprite.height = TILE;
      sprite.tint = tint;
    } else {
      sprite = makeHumanoidFallback(tint);
    }
    sprite.x = sx; sprite.y = sy;

    /* Name tag */
    const nameStyle = new PIXI.TextStyle({
      fontFamily: 'monospace', fontSize: 7, fill: tint,
      dropShadow: true, dropShadowDistance: 1,
      dropShadowAlpha: 0.9, dropShadowColor: 0x000000,
    });
    const nameTag = new PIXI.Text(def.name, nameStyle);
    nameTag.anchor.set(0.5, 1);
    nameTag.x = sx; nameTag.y = sy - TILE * 0.55;

    /* Job bubble */
    const jobStyle = new PIXI.TextStyle({
      fontFamily: 'monospace', fontSize: 6, fill: 0xa5f3fc,
      dropShadow: true, dropShadowDistance: 1,
      dropShadowAlpha: 0.8, dropShadowColor: 0x000000,
    });
    const jobTag = new PIXI.Text('', jobStyle);
    jobTag.anchor.set(0.5, 1);
    jobTag.alpha = 0;
    jobTag.x = sx; jobTag.y = sy - TILE * 0.95;

    agentLayer.addChild(shadow);
    agentLayer.addChild(sprite);
    uiLayer.addChild(nameTag);
    uiLayer.addChild(jobTag);

    agents.push({
      def, sprite, shadow, nameTag, jobTag,
      x: sx, y: sy,
      path: [], pathIdx: 0,
      state: 'idle',
      job: null, jobTimer: 0,
      idleTimer: 0.5 + Math.random() * 2,
      bobPhase: Math.random() * Math.PI * 2,
      usingFallback: !agentTex,
    });
  });
}



/* ═══════════════════════════════════════
   JOB / STATION HELPERS
═══════════════════════════════════════ */
function pickJob(agent) {
  const valid = JOBS.filter(j => j.roles.includes(agent.def.role));
  const weights = valid.map(j => {
    let w = 1;
    if (j.room === agent.def.home) w = 5;
    if (j.id === 'meeting')        w = 2;
    if (j.id === 'break')          w = 1.5;
    return {j, w};
  });
  const total = weights.reduce((s, {w}) => s + w, 0);
  let rnd = Math.random() * total;
  for (const {j, w} of weights) { rnd -= w; if (rnd <= 0) return j; }
  return valid[0];
}

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
  return {x: st.x * TILE + TILE / 2, y: st.y * TILE + TILE / 2};
}

/* ═══════════════════════════════════════
   SIMULATION TICK
═══════════════════════════════════════ */
function simulate(ticker) {
  const dt = Math.min(ticker.deltaMS / 1000, 0.1);

  agents.forEach(a => {
    switch (a.state) {

      case 'idle': {
        a.idleTimer -= dt;
        a.bobPhase += dt * 1.5;
        a.sprite.y = a.y + Math.sin(a.bobPhase) * 0.8;

        if (a.idleTimer <= 0) {
          const job = pickJob(a);
          const pos = getStation(job.room);
          if (!pos) break;
          a.job       = job;
          a.jobTimer  = job.dur[0] + Math.random() * (job.dur[1] - job.dur[0]);
          a.jobTag.text = job.label;
          a.path    = findPath(a.x, a.y, pos.x, pos.y);
          a.pathIdx = 0;
          a.state   = 'moving';
        }
        break;
      }

      case 'moving': {
        if (a.pathIdx >= a.path.length) {
          a.state = 'working';
          a.jobTag.alpha = 0.85;
          break;
        }
        const wp = a.path[a.pathIdx];
        const dx = wp.x - a.x;
        const dy = wp.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < ARRIVE) {
          a.x = wp.x; a.y = wp.y; a.pathIdx++;
        } else {
          const move = SPEED * dt;
          a.x += dx / dist * move;
          a.y += dy / dist * move;
        }
        a.bobPhase += dt * 8;
        a.sprite.x = a.x;
        a.sprite.y = a.y + Math.sin(a.bobPhase) * 1.5;
        if (!a.usingFallback) a.sprite.scale.x = dx < 0 ? -1 : 1;
        a.jobTag.alpha = Math.max(0, a.jobTag.alpha - dt * 0.8);
        break;
      }

      case 'working': {
        a.jobTimer -= dt;
        if (Math.random() < 0.06) {
          a.sprite.x = a.x + (Math.random() - 0.5) * 1.2;
          a.sprite.y = a.y + (Math.random() - 0.5) * 0.7;
        } else {
          a.sprite.x = a.x;
          a.sprite.y = a.y;
        }
        a.jobTag.alpha = 0.75 + Math.sin(Date.now() * 0.004) * 0.25;
        if (a.jobTimer <= 0) {
          a.state = 'idle';
          a.job = null;
          a.path = []; a.pathIdx = 0;
          a.idleTimer = 1.5 + Math.random() * 3;
          a.jobTag.alpha = 0;
          if (!a.usingFallback) a.sprite.scale.x = 1;
        }
        break;
      }
    }

    /* Sync shadow + labels */
    a.shadow.x  = a.sprite.x;
    a.shadow.y  = a.sprite.y + 2;
    a.nameTag.x = a.sprite.x;
    a.nameTag.y = a.sprite.y - TILE * 0.5;
    a.jobTag.x  = a.sprite.x;
    a.jobTag.y  = a.sprite.y - TILE * 0.95;
  });
}

/* ═══════════════════════════════════════
   HUD
═══════════════════════════════════════ */
function updateHUD() {
  const working = agents.filter(a => a.state === 'working').length;
  const moving  = agents.filter(a => a.state === 'moving').length;
  const idle    = agents.filter(a => a.state === 'idle').length;
  const el = document.getElementById('agent-count');
  if (el) el.textContent =
    '👥 ' + agents.length +
    '  ⚡ ' + working + ' working' +
    '  🚶 ' + moving + ' moving' +
    '  💤 ' + idle + ' idle';
}



/* ═══════════════════════════════════════
   CAMERA PAN / PINCH / WHEEL
═══════════════════════════════════════ */
(function initCamera() {
  let panning = false, lastPan = {x:0, y:0}, lastPinch = 0;

  app.view.addEventListener('mousedown', e => {
    panning = true; lastPan = {x: e.clientX, y: e.clientY};
  });
  app.view.addEventListener('mousemove', e => {
    if (!panning) return;
    world.x += e.clientX - lastPan.x;
    world.y += e.clientY - lastPan.y;
    lastPan = {x: e.clientX, y: e.clientY};
  });
  app.view.addEventListener('mouseup',    () => { panning = false; });
  app.view.addEventListener('mouseleave', () => { panning = false; });

  app.view.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      panning = true;
      lastPan = {x: e.touches[0].clientX, y: e.touches[0].clientY};
    } else if (e.touches.length === 2) {
      panning = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinch = Math.sqrt(dx*dx + dy*dy);
    }
  }, {passive: true});

  app.view.addEventListener('touchmove', e => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (lastPinch > 0) {
        const ns = Math.max(0.3, Math.min(3.0, world.scale.x * (dist / lastPinch)));
        world.scale.set(ns);
      }
      lastPinch = dist;
      return;
    }
    if (!panning || e.touches.length !== 1) return;
    world.x += e.touches[0].clientX - lastPan.x;
    world.y += e.touches[0].clientY - lastPan.y;
    lastPan = {x: e.touches[0].clientX, y: e.touches[0].clientY};
  }, {passive: true});

  app.view.addEventListener('touchend', () => { panning = false; lastPinch = 0; });

  app.view.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.92 : 1.09;
    const ns = Math.max(0.3, Math.min(3.0, world.scale.x * delta));
    const rect = app.view.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const wx = (mx - world.x) / world.scale.x;
    const wy = (my - world.y) / world.scale.y;
    world.scale.set(ns);
    world.x = mx - wx * ns;
    world.y = my - wy * ns;
  }, {passive: false});
})();

/* ═══════════════════════════════════════
   BOOTSTRAP — non-blocking
═══════════════════════════════════════ */
const ASSET_BASE = 'assets/';

async function initPixi() {
  /* Try to load tilesheet + agent sheet with a hard 6s timeout */
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Asset load timeout')), 6000)
    );

    const loadPromise = PIXI.Assets.load([
      ASSET_BASE + 'roguelike_indoor_2x.png',
      ASSET_BASE + 'agents_sheet.png',
    ]);

    const result = await Promise.race([loadPromise, timeoutPromise]);

    /* PIXI.Assets.load returns an object keyed by the original URLs */
    TILESET_TEX = result[ASSET_BASE + 'roguelike_indoor_2x.png'] || null;
    AGENT_TEX   = result[ASSET_BASE + 'agents_sheet.png']        || null;

    if (TILESET_TEX) TILESET_TEX.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    if (AGENT_TEX)   AGENT_TEX.baseTexture.scaleMode   = PIXI.SCALE_MODES.NEAREST;

    console.log('[Hermes] Assets loaded. Tileset:', !!TILESET_TEX, 'Agents:', !!AGENT_TEX);
  } catch (err) {
    console.warn('[Hermes] Asset load failed/timed-out, using fallback colors:', err.message);
    TILESET_TEX = null;
    AGENT_TEX   = null;
  }

  /* Always proceed — with or without textures */
  buildWorld();
  spawnAgents();
  app.ticker.add(simulate);
  setInterval(updateHUD, 800);
  updateHUD();

  console.log('[Hermes] Simulation live —', agents.length, 'agents,', ROOMS.length, 'rooms');
}

/* Fire immediately — no blocking wait */
initPixi();

})(); /* end IIFE */
