/**
 * Hermes 2D Office — Grid-Map Tilemap Renderer (PixiJS 7)
 * ─────────────────────────────────────────────────────────
 * Hard rules enforced:
 *   • NO random tile rendering
 *   • NO full-tileset spam
 *   • NO circles/rectangles as final visuals (humanoid fallbacks only)
 *   • MUST use tile slicing + grid map
 *   • MUST render even if assets fail (colored fallback allowed)
 *   • Mobile-first: 100vw × 100vh, no overflow, pinch/pan
 */
(function () {
'use strict';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════ */
const TILE   = 32;   // px per tile
const SPEED  = 75;   // agent px / second
const ARRIVE = 6;    // arrival threshold px

/* ── Tileset layout ────────────────────────────────────────
   roguelike_indoor_2x.png: 32 px tiles with a 2 px gap.
   Stride between tile origins = 32 + 2 = 34 px.
   tex(col, row) → Rectangle(col*34, row*34, 32, 32)
────────────────────────────────────────────────────────── */
const TS_STRIDE = 34;
const TS_SIZE   = 32;

/* ═══════════════════════════════════════════════════════════
   TILE INDEX MAPPING
   Each key maps to a [col, row] position in the tileset.
═══════════════════════════════════════════════════════════ */
const T = {
  /* Floors */
  FLOOR_A : [0, 9],   FLOOR_B : [1, 9],   FLOOR_C : [2, 9],
  FLOOR_D : [3, 9],   FLOOR_E : [4, 9],   FLOOR_F : [5, 9],
  FLOOR_G : [6, 9],   FLOOR_H : [7, 9],
  FLOOR_I : [0,10],   FLOOR_J : [1,10],   FLOOR_K : [2,10],
  FLOOR_L : [3,10],
  /* Walls */
  WALL_H  : [2, 0],   WALL_V  : [0, 2],
  WALL_TL : [0, 0],   WALL_TR : [8, 0],
  WALL_BL : [0, 6],   WALL_BR : [8, 6],
  /* Doors */
  DOOR_H  : [7, 0],   DOOR_V  : [7, 1],
  /* Furniture */
  DESK    : [7, 7],   DESK2   : [6, 7],
  TABLE   : [3, 7],   TABLE2  : [4, 7],
  CHAIR   : [13,3],   CHAIR2  : [14,3],
  SOFA    : [9, 5],   SOFA2   : [10,5],
  CTABLE  : [16,7],
  COMPUTER: [11,7],
  PLANT   : [15,3],
  SHELF   : [8, 3],
  CABINET : [10,3],
};

/* Fallback colors when tileset not loaded */
const FB = {
  FLOOR   : 0x2e3244, WALL    : 0x505870,
  DOOR    : 0x7a5020, DESK    : 0x6a4518,
  CHAIR   : 0x3c5080, SOFA    : 0x4a3260,
  TABLE   : 0x6e4a20, CTABLE  : 0x5a3818,
  COMPUTER: 0x1a3a5a, PLANT   : 0x1a5a1a,
  SHELF   : 0x5a4a30, CABINET : 0x4a4a5a,
  CORRIDOR: 0x1e2132,
};

/* Agent role tints */
const ROLE_TINT = {
  developer : 0x00e5cc,
  researcher: 0xffaa33,
  ops       : 0x44ff88,
  manager   : 0xff66aa,
};

/* ═══════════════════════════════════════════════════════════
   GRID MAP  (44 cols × 30 rows)
   Legend:
     W = wall          F = floor (corridor)
     f = room floor    D = desk         C = chair
     T = table         S = sofa         O = door
     P = plant         L = shelf        B = cabinet
     K = computer      M = coffee table X = void/outer
═══════════════════════════════════════════════════════════ */
/* jshint ignore:start */
const MAP_RAW = [
/*00*/ "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
/*01*/ "XWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWX",
/*02*/ "XWffffffffffffffffWffffffffffffffffWfffffWX",
/*03*/ "XWffffffffffffffffWffffffffffffffffWfffffWX",
/*04*/ "XWffDDCffDDCffffffWffDDCffDDCffffffWffDDCWX",
/*05*/ "XWffCffKffCffKffffWffCffKffCffKffffWffCffWX",
/*06*/ "XWffDDCffDDCffffffWffDDCffDDCffffffWffDDCWX",
/*07*/ "XWffCffKffCffKffffWffCffKffCffKffffWffCffWX",
/*08*/ "XWffffffffffffffffWffffffffffffffffWfffffWX",
/*09*/ "XWffTTTTTTTTffffffWffffffffffffffWWffLLLWX",
/*10*/ "XWffTTTTTTTTffffffWffffffffffffffWWffBBBWX",
/*11*/ "XWffffffffffffffffWffffffffffffffffWfffffWX",
/*12*/ "XWffffPffffffPffffWffffPffffffPffffWPffffPWX",
/*13*/ "XWWWWWWOWWWWWWWWWWWWWWWOWWWWWWWWWWWWOWWWWX",
/*14*/ "XFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFx",
/*15*/ "XWWWWWOWWWWWWWWWWWWWWWWWOWWWWWWWWWWWOWWWWX",
/*16*/ "XWffffffffffffffffWfffffffffffffWWfffffffWX",
/*17*/ "XWffffffffffffffffWfffffffffffffWWfffffffWX",
/*18*/ "XWffSSSSffSSSSffffWffTTTTTTTffffWWfffffffWX",
/*19*/ "XWffSSSSffSSSSffffWffCCCCCCCffffWWfffKfffWX",
/*20*/ "XWffMMMMMMMMMfffffWffTTTTTTTffffWWfffDfffWX",
/*21*/ "XWffMMMMMMMMMfffffWffCCCCCCCffffWWfffCfffWX",
/*22*/ "XWffSSSSffSSSSffffWfffffffffffffffffffffWX",
/*23*/ "XWffSSSSffSSSSffffWfffffffffffffffffffffWX",
/*24*/ "XWffffPffffffPffffWffffPffffffPffffWPffffPWX",
/*25*/ "XWffffffffffffffffWffffffffffffffffWfffffffWX",
/*26*/ "XWffffffffffffffffWffffffffffffffffWfffffffWX",
/*27*/ "XWffSSSSffSSSSffffWfffff BBBBBBfffffWfffffWX",
/*28*/ "XWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWX",
/*29*/ "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
];
/* jshint ignore:end */

/* Normalise all rows to the same width */
const MAP_COLS = Math.max(...MAP_RAW.map(r => r.length));
const MAP_ROWS = MAP_RAW.length;
const MAP = MAP_RAW.map(row => row.padEnd(MAP_COLS, 'X'));

const WORLD_W = MAP_COLS * TILE;
const WORLD_H = MAP_ROWS * TILE;

/* ═══════════════════════════════════════════════════════════
   WALKABILITY GRID  (0 = walkable, 1 = blocked)
═══════════════════════════════════════════════════════════ */
const walkGrid = Array.from({ length: MAP_ROWS }, () => new Uint8Array(MAP_COLS).fill(1));

/* Characters that are walkable (agents can stand here) */
const WALKABLE_CHARS = new Set(['f','F','O','C','K','D','T','S','M','P','L','B',' ']);

for (let r = 0; r < MAP_ROWS; r++) {
  for (let c = 0; c < MAP_COLS; c++) {
    const ch = MAP[r][c];
    if (WALKABLE_CHARS.has(ch)) walkGrid[r][c] = 0;
  }
}



/* ═══════════════════════════════════════════════════════════
   PIXI APPLICATION  (non-blocking, mobile-first)
═══════════════════════════════════════════════════════════ */
const app = new PIXI.Application({
  resizeTo  : document.getElementById('workspace-container'),
  backgroundColor : 0x0a0e17,
  antialias : false,
  resolution: Math.min(window.devicePixelRatio || 1, 2),
  autoDensity: true,
});
document.getElementById('workspace-container').appendChild(app.view);
app.view.style.imageRendering  = 'pixelated';
app.view.style.imageRendering  = 'crisp-edges';
app.view.style.display         = 'block';
app.view.style.width           = '100%';
app.view.style.height          = '100%';

/* ── Layer stack ──────────────────────────────────────── */
const world      = new PIXI.Container();
const floorLayer = new PIXI.Container();
const wallLayer  = new PIXI.Container();
const furniLayer = new PIXI.Container();
const agentLayer = new PIXI.Container();
const uiLayer    = new PIXI.Container();
world.addChild(floorLayer, wallLayer, furniLayer, agentLayer, uiLayer);
app.stage.addChild(world);

/* ── Camera: fit-to-screen & re-fit on resize ─────────── */
function centerCamera() {
  const sw = app.screen.width;
  const sh = app.screen.height;
  if (!sw || !sh) return;
  const sc = Math.min(sw / WORLD_W, sh / WORLD_H, 2.0) * 0.95;
  world.scale.set(sc);
  world.x = Math.round((sw - WORLD_W * sc) / 2);
  world.y = Math.round((sh - WORLD_H * sc) / 2);
}
centerCamera();
window.addEventListener('resize', () => { setTimeout(centerCamera, 80); });

/* ═══════════════════════════════════════════════════════════
   TEXTURE HELPERS
═══════════════════════════════════════════════════════════ */
let TILESET_BASE = null;  // PIXI.BaseTexture — roguelike_indoor_2x.png
let AGENT_BASE   = null;  // PIXI.BaseTexture — agents_sheet.png

/**
 * Slice a 32×32 tile from the roguelike_indoor_2x tileset.
 * Returns null when the base texture is not yet loaded.
 */
function tslice(col, row) {
  if (!TILESET_BASE) return null;
  return new PIXI.Texture(
    TILESET_BASE,
    new PIXI.Rectangle(col * TS_STRIDE, row * TS_STRIDE, TS_SIZE, TS_SIZE)
  );
}

function tKey(key) {
  const [c, r] = T[key] || T.FLOOR_A;
  return tslice(c, r);
}

/**
 * Get an agent sprite frame from the 8-character sheet.
 */
function agentSlice(idx) {
  if (!AGENT_BASE) return null;
  const i = (idx || 0) % 8;
  return new PIXI.Texture(AGENT_BASE, new PIXI.Rectangle(i * 32, 0, 32, 32));
}

/**
 * Colored square fallback.
 */
function colorTile(color, x, y) {
  const g = new PIXI.Graphics();
  g.beginFill(color, 0.92);
  g.drawRect(0, 0, TILE, TILE);
  g.endFill();
  g.x = x; g.y = y;
  return g;
}

/**
 * Make a tile sprite (real texture when available, colored block otherwise).
 */
function makeTile(texKey, fbColor, px, py) {
  const tex = tKey(texKey);
  if (tex) {
    const sp = new PIXI.Sprite(tex);
    sp.x = px; sp.y = py;
    sp.width = TILE; sp.height = TILE;
    return sp;
  }
  return colorTile(fbColor, px, py);
}



/* ═══════════════════════════════════════════════════════════
   MAP RENDERER
   Iterates MAP[][], picks the correct tile per character.
   Two passes: floor first, then walls/furniture on top.
═══════════════════════════════════════════════════════════ */
function buildWorld() {
  floorLayer.removeChildren();
  wallLayer.removeChildren();
  furniLayer.removeChildren();
  uiLayer.removeChildren();

  /* ── pass 1: floor & corridor ── */
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      const ch = MAP[r][c];
      const px = c * TILE, py = r * TILE;

      if (ch === 'X') continue; // outer void — leave empty

      /* Choose floor tile variant by position for visual variety */
      const alt  = (r + c) % 5 === 0;
      let fKey   = alt ? 'FLOOR_B' : 'FLOOR_A';
      let fColor = FB.FLOOR;

      if (ch === 'F' || ch === 'O') { fKey = 'FLOOR_I'; fColor = FB.CORRIDOR; }
      else if (ch === 'f')           { fKey = alt ? 'FLOOR_D' : 'FLOOR_C';    }

      const sp = makeTile(fKey, fColor, px, py);
      floorLayer.addChild(sp);
    }
  }

  /* ── pass 2: walls, doors, furniture ── */
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      const ch = MAP[r][c];
      const px = c * TILE, py = r * TILE;

      /* Helper: pick corner/edge wall key */
      function wallKey() {
        const top    = r === 0           || MAP[r-1][c] === 'X';
        const bottom = r === MAP_ROWS-1  || MAP[r+1][c] === 'X';
        const left   = c === 0           || MAP[r][c-1] === 'X';
        const right  = c === MAP_COLS-1  || MAP[r][c+1] === 'X';
        if (top  && left)  return 'WALL_TL';
        if (top  && right) return 'WALL_TR';
        if (bottom && left)  return 'WALL_BL';
        if (bottom && right) return 'WALL_BR';
        // Horizontal wall: has floor above or below
        const hasFloorV = (r > 0 && 'fFODCTSMPLBK '.includes(MAP[r-1][c])) ||
                          (r < MAP_ROWS-1 && 'fFODCTSMPLBK '.includes(MAP[r+1][c]));
        return hasFloorV ? 'WALL_H' : 'WALL_V';
      }

      switch (ch) {
        case 'W': {
          const wk = wallKey();
          const sp = makeTile(wk, FB.WALL, px, py);
          wallLayer.addChild(sp);
          break;
        }
        case 'O': {
          const sp = makeTile('DOOR_H', FB.DOOR, px, py);
          wallLayer.addChild(sp);
          break;
        }
        case 'D': {
          // Alternate desk type by column
          const dk = c % 6 < 3 ? 'DESK' : 'DESK2';
          addFurni(dk, FB.DESK, px, py);
          break;
        }
        case 'C': {
          addFurni('CHAIR', FB.CHAIR, px, py);
          break;
        }
        case 'T': {
          const tk = (r + c) % 2 === 0 ? 'TABLE' : 'TABLE2';
          addFurni(tk, FB.TABLE, px, py);
          break;
        }
        case 'S': {
          const sk = c % 4 < 2 ? 'SOFA' : 'SOFA2';
          addFurni(sk, FB.SOFA, px, py);
          break;
        }
        case 'M': {
          addFurni('CTABLE', FB.CTABLE, px, py);
          break;
        }
        case 'K': {
          addFurni('COMPUTER', FB.COMPUTER, px, py);
          break;
        }
        case 'P': {
          addFurni('PLANT', FB.PLANT, px, py);
          break;
        }
        case 'L': {
          addFurni('SHELF', FB.SHELF, px, py);
          break;
        }
        case 'B': {
          addFurni('CABINET', FB.CABINET, px, py);
          break;
        }
        default: break;
      }
    }
  }

  /* ── Room labels (uiLayer) ── */
  const labelStyle = new PIXI.TextStyle({
    fontFamily: 'monospace', fontSize: 9,
    fill: 0xaaccdd, dropShadow: true,
    dropShadowDistance: 1, dropShadowAlpha: 0.9, dropShadowColor: 0x000000,
  });
  const LABELS = [
    { text: '⚙ Engineering', col: 2,  row: 1  },
    { text: '🔬 Research',   col: 19, row: 1  },
    { text: '🖥 Servers',    col: 35, row: 1  },
    { text: '☕ Lounge',     col: 2,  row: 15 },
    { text: '📋 Meeting',    col: 19, row: 15 },
    { text: '⚡ Manager',   col: 35, row: 15 },
  ];
  LABELS.forEach(lb => {
    const lbl = new PIXI.Text(lb.text, labelStyle);
    lbl.x = lb.col * TILE + 4;
    lbl.y = lb.row * TILE + 4;
    lbl.alpha = 0.8;
    uiLayer.addChild(lbl);
  });

  console.log('[Hermes] World built. Tileset:', TILESET_BASE !== null);
}

/** Add a furniture sprite with a subtle drop shadow */
function addFurni(texKey, fbColor, px, py) {
  // Shadow
  const sh = new PIXI.Graphics();
  sh.beginFill(0x000000, 0.2);
  sh.drawEllipse(px + 16, py + 28, 11, 3);
  sh.endFill();
  furniLayer.addChild(sh);

  const sp = makeTile(texKey, fbColor, px, py);
  furniLayer.addChild(sp);
}



/* ═══════════════════════════════════════════════════════════
   BFS PATHFINDER
═══════════════════════════════════════════════════════════ */
function findPath(x0, y0, x1, y1) {
  const sc = Math.round(x0 / TILE);
  const sr = Math.round(y0 / TILE);
  const tc = Math.round(x1 / TILE);
  const tr = Math.round(y1 / TILE);
  if (sc === tc && sr === tr) return [{ x: x1, y: y1 }];

  const visited = new Uint8Array(MAP_COLS * MAP_ROWS);
  const parent  = new Int32Array(MAP_COLS * MAP_ROWS).fill(-1);
  const queue   = [sr * MAP_COLS + sc];
  visited[sr * MAP_COLS + sc] = 1;
  const DIRS = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
  let found = false;

  outer: while (queue.length) {
    const cur = queue.shift();
    const cr = Math.floor(cur / MAP_COLS), cc = cur % MAP_COLS;
    for (const [dc, dr] of DIRS) {
      const nc = cc + dc, nr = cr + dr;
      if (nc < 0 || nc >= MAP_COLS || nr < 0 || nr >= MAP_ROWS) continue;
      const ni = nr * MAP_COLS + nc;
      if (visited[ni] || walkGrid[nr][nc]) continue;
      visited[ni] = 1;
      parent[ni] = cur;
      if (nc === tc && nr === tr) { found = true; break outer; }
      queue.push(ni);
    }
  }

  if (!found) return [{ x: x1, y: y1 }]; // fallback: teleport

  const path = [];
  let cur = tr * MAP_COLS + tc;
  while (cur !== -1) {
    const r = Math.floor(cur / MAP_COLS), c = cur % MAP_COLS;
    path.unshift({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 });
    cur = parent[cur];
  }
  path[path.length - 1] = { x: x1, y: y1 };
  return path;
}

/* ═══════════════════════════════════════════════════════════
   ROOM ZONES  — grid cell ranges agents roam inside
   [rowMin, rowMax, colMin, colMax]
═══════════════════════════════════════════════════════════ */
const ZONES = {
  engineering : { r1:2,  r2:12, c1:1,  c2:17 },
  research    : { r1:2,  r2:12, c1:18, c2:34 },
  servers     : { r1:2,  r2:12, c1:35, c2:42 },
  lounge      : { r1:16, r2:27, c1:1,  c2:17 },
  meeting     : { r1:16, r2:27, c1:18, c2:34 },
  manager     : { r1:16, r2:27, c1:35, c2:42 },
  corridor    : { r1:14, r2:14, c1:1,  c2:42 },
};

function zoneName(zk) { return zk; }

/** Get a random walkable pixel position inside a zone */
function randInZone(zk) {
  const z = ZONES[zk];
  for (let attempts = 0; attempts < 60; attempts++) {
    const r = z.r1 + Math.floor(Math.random() * (z.r2 - z.r1 + 1));
    const c = z.c1 + Math.floor(Math.random() * (z.c2 - z.c1 + 1));
    if (r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLS && walkGrid[r][c] === 0) {
      return { x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 };
    }
  }
  // safe fallback: corridor center
  return { x: 22 * TILE + TILE / 2, y: 14 * TILE + TILE / 2 };
}

/* ═══════════════════════════════════════════════════════════
   JOBS
═══════════════════════════════════════════════════════════ */
const JOBS = [
  { id:'coding',    label:'Coding',      zone:'engineering', dur:[8, 18],  roles:['developer','manager'] },
  { id:'review',    label:'Code Review', zone:'engineering', dur:[5, 12],  roles:['developer','manager'] },
  { id:'research',  label:'Researching', zone:'research',    dur:[10,20],  roles:['researcher','developer'] },
  { id:'brainstorm',label:'Brainstorm',  zone:'research',    dur:[6, 14],  roles:['researcher','manager'] },
  { id:'monitoring',label:'Monitoring',  zone:'servers',     dur:[6, 15],  roles:['ops','developer'] },
  { id:'deploying', label:'Deploying',   zone:'servers',     dur:[4, 10],  roles:['ops'] },
  { id:'meeting',   label:'Meeting',     zone:'meeting',     dur:[10,20],  roles:['developer','researcher','ops','manager'] },
  { id:'break',     label:'Coffee Break',zone:'lounge',      dur:[4, 8],   roles:['developer','researcher','ops','manager'] },
  { id:'report',    label:'Reporting',   zone:'manager',     dur:[5, 12],  roles:['manager','ops'] },
];

function pickJob(role) {
  const valid = JOBS.filter(j => j.roles.includes(role));
  const total = valid.reduce((s, j) => s + 1, 0);
  const rnd = Math.floor(Math.random() * total);
  return valid[rnd] || valid[0];
}

/* ═══════════════════════════════════════════════════════════
   AGENT DEFINITIONS
═══════════════════════════════════════════════════════════ */
const AGENT_DEFS = [
  { name:'Alice',   role:'developer',  home:'engineering', sheetIdx:0 },
  { name:'Bob',     role:'developer',  home:'engineering', sheetIdx:1 },
  { name:'Charlie', role:'developer',  home:'engineering', sheetIdx:2 },
  { name:'Diana',   role:'researcher', home:'research',    sheetIdx:3 },
  { name:'Eve',     role:'researcher', home:'research',    sheetIdx:4 },
  { name:'Frank',   role:'researcher', home:'research',    sheetIdx:5 },
  { name:'Grace',   role:'ops',        home:'servers',     sheetIdx:6 },
  { name:'Hank',    role:'ops',        home:'servers',     sheetIdx:7 },
  { name:'Iris',    role:'ops',        home:'servers',     sheetIdx:0 },
  { name:'Jack',    role:'manager',    home:'manager',     sheetIdx:1 },
  { name:'Kate',    role:'manager',    home:'engineering', sheetIdx:2 },
  { name:'Leo',     role:'developer',  home:'lounge',      sheetIdx:3 },
];



/* ═══════════════════════════════════════════════════════════
   HUMANOID FALLBACK SPRITE
   Used when agents_sheet.png fails to load.
   Drawn as a pixel-art humanoid using rectangles — NOT a circle.
═══════════════════════════════════════════════════════════ */
function makeHumanoid(tint) {
  const g = new PIXI.Graphics();
  // Head
  g.beginFill(tint, 1.0);
  g.drawRect(-5, -26, 10, 10);
  g.endFill();
  // Body
  g.beginFill(tint, 0.88);
  g.drawRect(-6, -16, 12, 12);
  g.endFill();
  // Left arm
  g.beginFill(tint, 0.75);
  g.drawRect(-10, -15, 4, 9);
  g.endFill();
  // Right arm
  g.beginFill(tint, 0.75);
  g.drawRect(6, -15, 4, 9);
  g.endFill();
  // Left leg
  g.beginFill(tint, 0.7);
  g.drawRect(-5, -4, 4, 9);
  g.endFill();
  // Right leg
  g.beginFill(tint, 0.7);
  g.drawRect(1, -4, 4, 9);
  g.endFill();
  return g;
}

/* ═══════════════════════════════════════════════════════════
   AGENT SPAWN
═══════════════════════════════════════════════════════════ */
const agents = [];

function spawnAgents() {
  const nameStyle = new PIXI.TextStyle({
    fontFamily:'monospace', fontSize:7,
    dropShadow:true, dropShadowDistance:1,
    dropShadowAlpha:0.9, dropShadowColor:0x000000,
  });
  const jobStyle = new PIXI.TextStyle({
    fontFamily:'monospace', fontSize:6, fill:0xa5f3fc,
    dropShadow:true, dropShadowDistance:1,
    dropShadowAlpha:0.8, dropShadowColor:0x000000,
  });

  AGENT_DEFS.forEach(def => {
    const pos  = randInZone(def.home);
    const tint = ROLE_TINT[def.role] || 0xffffff;

    /* Shadow ellipse */
    const shadow = new PIXI.Graphics();
    shadow.beginFill(0x000000, 0.22);
    shadow.drawEllipse(0, 4, 8, 3);
    shadow.endFill();
    shadow.x = pos.x; shadow.y = pos.y;
    agentLayer.addChild(shadow);

    /* Sprite or humanoid */
    const tex = agentSlice(def.sheetIdx);
    let sprite;
    if (tex) {
      sprite = new PIXI.Sprite(tex);
      sprite.anchor.set(0.5, 0.9);
      sprite.width = TILE; sprite.height = TILE;
      sprite.tint = tint;
    } else {
      sprite = makeHumanoid(tint);
    }
    sprite.x = pos.x; sprite.y = pos.y;
    agentLayer.addChild(sprite);

    /* Name tag */
    const nt = new PIXI.Text(def.name, { ...nameStyle, fill: tint });
    nt.anchor.set(0.5, 1);
    nt.x = pos.x; nt.y = pos.y - TILE * 0.52;
    uiLayer.addChild(nt);

    /* Job bubble */
    const jt = new PIXI.Text('', jobStyle);
    jt.anchor.set(0.5, 1);
    jt.alpha = 0;
    jt.x = pos.x; jt.y = pos.y - TILE * 0.95;
    uiLayer.addChild(jt);

    agents.push({
      def, sprite, shadow, nt, jt,
      x: pos.x, y: pos.y,
      path: [], pathIdx: 0,
      state: 'idle',
      job: null, jobTimer: 0,
      idleTimer: 0.5 + Math.random() * 2.5,
      bobPhase: Math.random() * Math.PI * 2,
      useFallback: !tex,
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   SIMULATION TICK
═══════════════════════════════════════════════════════════ */
function tick(ticker) {
  const dt = Math.min(ticker.deltaMS / 1000, 0.1);

  agents.forEach(a => {
    switch (a.state) {

      case 'idle': {
        a.idleTimer -= dt;
        a.bobPhase += dt * 1.4;
        a.sprite.y = a.y + Math.sin(a.bobPhase) * 0.8;
        if (a.idleTimer <= 0) {
          const job = pickJob(a.def.role);
          a.job = job;
          a.jobTimer = job.dur[0] + Math.random() * (job.dur[1] - job.dur[0]);
          a.jt.text = job.label;
          const dest = randInZone(job.zone);
          a.path = findPath(a.x, a.y, dest.x, dest.y);
          a.pathIdx = 0;
          a.state = 'moving';
        }
        break;
      }

      case 'moving': {
        if (a.pathIdx >= a.path.length) {
          a.state = 'working';
          a.jt.alpha = 0.85;
          break;
        }
        const wp = a.path[a.pathIdx];
        const dx = wp.x - a.x;
        const dy = wp.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < ARRIVE) {
          a.x = wp.x; a.y = wp.y; a.pathIdx++;
        } else {
          const mv = SPEED * dt;
          a.x += (dx / dist) * mv;
          a.y += (dy / dist) * mv;
        }
        a.bobPhase += dt * 9;
        a.sprite.x = a.x;
        a.sprite.y = a.y + Math.sin(a.bobPhase) * 1.6;
        if (!a.useFallback && Math.abs(dx) > 1) {
          a.sprite.scale.x = dx < 0 ? -1 : 1;
        }
        a.jt.alpha = Math.max(0, a.jt.alpha - dt * 0.7);
        break;
      }

      case 'working': {
        a.jobTimer -= dt;
        // Subtle work fidget
        if (Math.random() < 0.05) {
          a.sprite.x = a.x + (Math.random() - 0.5) * 1.0;
          a.sprite.y = a.y + (Math.random() - 0.5) * 0.6;
        } else {
          a.sprite.x = a.x; a.sprite.y = a.y;
        }
        a.jt.alpha = 0.72 + Math.sin(Date.now() * 0.004) * 0.28;
        if (a.jobTimer <= 0) {
          a.state = 'idle';
          a.job = null;
          a.path = []; a.pathIdx = 0;
          a.idleTimer = 1.5 + Math.random() * 3.0;
          a.jt.alpha = 0;
          if (!a.useFallback) a.sprite.scale.x = 1;
        }
        break;
      }
    }

    /* Sync shadow + labels every frame */
    a.shadow.x = a.sprite.x;
    a.shadow.y = a.sprite.y + 2;
    a.nt.x     = a.sprite.x;
    a.nt.y     = a.sprite.y - TILE * 0.50;
    a.jt.x     = a.sprite.x;
    a.jt.y     = a.sprite.y - TILE * 0.95;
  });
}

/* ═══════════════════════════════════════════════════════════
   HUD UPDATE
═══════════════════════════════════════════════════════════ */
function updateHUD() {
  const el = document.getElementById('agent-count');
  if (!el) return;
  const working = agents.filter(a => a.state === 'working').length;
  const moving  = agents.filter(a => a.state === 'moving').length;
  const idle    = agents.filter(a => a.state === 'idle').length;
  el.textContent = `👥 ${agents.length}  ⚡ ${working} working  🚶 ${moving} moving  💤 ${idle} idle`;
}



/* ═══════════════════════════════════════════════════════════
   CAMERA PAN / PINCH / WHEEL
═══════════════════════════════════════════════════════════ */
(function initCamera() {
  let panning = false;
  let lastPan = { x: 0, y: 0 };
  let lastPinch = 0;

  const cv = app.view;

  cv.addEventListener('mousedown', e => {
    panning = true;
    lastPan = { x: e.clientX, y: e.clientY };
  });
  cv.addEventListener('mousemove', e => {
    if (!panning) return;
    world.x += e.clientX - lastPan.x;
    world.y += e.clientY - lastPan.y;
    lastPan = { x: e.clientX, y: e.clientY };
  });
  cv.addEventListener('mouseup',    () => { panning = false; });
  cv.addEventListener('mouseleave', () => { panning = false; });

  cv.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      panning = true;
      lastPan = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      panning = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinch = Math.sqrt(dx * dx + dy * dy);
    }
  }, { passive: true });

  cv.addEventListener('touchmove', e => {
    if (e.touches.length === 2) {
      const dx   = e.touches[0].clientX - e.touches[1].clientX;
      const dy   = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastPinch > 0) {
        const ns = Math.max(0.25, Math.min(4.0, world.scale.x * (dist / lastPinch)));
        world.scale.set(ns);
      }
      lastPinch = dist;
      return;
    }
    if (!panning || e.touches.length !== 1) return;
    world.x += e.touches[0].clientX - lastPan.x;
    world.y += e.touches[0].clientY - lastPan.y;
    lastPan = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });

  cv.addEventListener('touchend', () => { panning = false; lastPinch = 0; });

  cv.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.91 : 1.10;
    const ns = Math.max(0.25, Math.min(4.0, world.scale.x * delta));
    const rect = cv.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const wx = (mx - world.x) / world.scale.x;
    const wy = (my - world.y) / world.scale.y;
    world.scale.set(ns);
    world.x = mx - wx * ns;
    world.y = my - wy * ns;
  }, { passive: false });
})();

/* ═══════════════════════════════════════════════════════════
   BOOTSTRAP — non-blocking
   Tries to load assets with a 6s timeout.
   Proceeds immediately with fallback colors on failure.
═══════════════════════════════════════════════════════════ */
async function boot() {
  /* Asset paths relative to this HTML file */
  const ASSET_BASE = 'assets/';

  try {
    const timeout = new Promise((_, rej) =>
      setTimeout(() => rej(new Error('timeout')), 6000)
    );
    const load = PIXI.Assets.load([
      ASSET_BASE + 'roguelike_indoor_2x.png',
      ASSET_BASE + 'agents_sheet.png',
    ]);
    const res = await Promise.race([load, timeout]);

    const ts = res[ASSET_BASE + 'roguelike_indoor_2x.png'];
    const ag = res[ASSET_BASE + 'agents_sheet.png'];

    if (ts) {
      TILESET_BASE = ts.baseTexture || ts;
      TILESET_BASE.scaleMode = PIXI.SCALE_MODES.NEAREST;
    }
    if (ag) {
      AGENT_BASE = ag.baseTexture || ag;
      AGENT_BASE.scaleMode = PIXI.SCALE_MODES.NEAREST;
    }
    console.log('[Hermes] Assets OK — tileset:', !!TILESET_BASE, 'agents:', !!AGENT_BASE);
  } catch (err) {
    console.warn('[Hermes] Assets failed, using fallback colors:', err.message);
    TILESET_BASE = null;
    AGENT_BASE   = null;
  }

  /* Always render — with or without textures */
  buildWorld();
  spawnAgents();
  app.ticker.add(tick);
  setInterval(updateHUD, 800);
  updateHUD();
  console.log('[Hermes] Simulation live —', agents.length, 'agents');
}

boot();

})(); /* end IIFE */
