import { create } from 'zustand';

/**
 * RimWorld-style Tile-Based Workspace Store
 * 
 * World is defined as a grid of tiles (32x32 pixels each).
 * Rooms are defined by tile regions. Walls are thick tile blocks.
 * Furniture and agents are placed at tile coordinates.
 */

export const TILE_SIZE = 32;
export const MAP_COLS = 40;
export const MAP_ROWS = 28;
export const MAP_WIDTH = MAP_COLS * TILE_SIZE;   // 1280px
export const MAP_HEIGHT = MAP_ROWS * TILE_SIZE;  // 896px

// Tile types
export const TILE = {
  VOID: 0,
  FLOOR_DARK: 1,
  FLOOR_LIGHT: 2,
  FLOOR_CARPET: 3,
  FLOOR_WOOD: 4,
  FLOOR_TILE: 5,
  WALL: 10,
  WALL_TOP: 11,
  DOOR: 12,
};

// Room definitions (tile coordinates)
export const ROOMS = [
  {
    id: 'engineering',
    label: 'Engineering',
    color: 0x3b82f6,
    floorType: TILE.FLOOR_DARK,
    // Tile bounds (col, row, width, height in tiles)
    bounds: { col: 1, row: 1, w: 14, h: 12 },
  },
  {
    id: 'research',
    label: 'Research Lab',
    color: 0xf59e0b,
    floorType: TILE.FLOOR_LIGHT,
    bounds: { col: 16, row: 1, w: 14, h: 12 },
  },
  {
    id: 'operations',
    label: 'Operations',
    color: 0x10b981,
    floorType: TILE.FLOOR_TILE,
    bounds: { col: 1, row: 14, w: 14, h: 12 },
  },
  {
    id: 'meeting',
    label: 'Meeting Room',
    color: 0xa855f7,
    floorType: TILE.FLOOR_CARPET,
    bounds: { col: 16, row: 14, w: 10, h: 12 },
  },
  {
    id: 'lounge',
    label: 'Lounge',
    color: 0xec4899,
    floorType: TILE.FLOOR_WOOD,
    bounds: { col: 27, row: 14, w: 12, h: 12 },
  },
  {
    id: 'hallway',
    label: 'Hallway',
    color: 0x6b7280,
    floorType: TILE.FLOOR_DARK,
    bounds: { col: 31, row: 1, w: 8, h: 12 },
  },
];

// Furniture definitions per room (tile-relative positions)
export const FURNITURE = {
  engineering: [
    { type: 'desk', col: 2, row: 2 },
    { type: 'desk', col: 2, row: 5 },
    { type: 'desk', col: 2, row: 8 },
    { type: 'desk', col: 7, row: 2 },
    { type: 'desk', col: 7, row: 5 },
    { type: 'desk', col: 7, row: 8 },
    { type: 'chair', col: 4, row: 2 },
    { type: 'chair', col: 4, row: 5 },
    { type: 'chair', col: 4, row: 8 },
    { type: 'chair', col: 9, row: 2 },
    { type: 'chair', col: 9, row: 5 },
    { type: 'chair', col: 9, row: 8 },
    { type: 'computer', col: 2, row: 3 },
    { type: 'computer', col: 7, row: 3 },
    { type: 'computer', col: 2, row: 6 },
    { type: 'computer', col: 7, row: 6 },
  ],
  research: [
    { type: 'desk', col: 2, row: 2 },
    { type: 'desk', col: 2, row: 5 },
    { type: 'desk', col: 8, row: 2 },
    { type: 'desk', col: 8, row: 5 },
    { type: 'meeting_table', col: 4, row: 8 },
    { type: 'whiteboard', col: 5, row: 1 },
    { type: 'chair', col: 4, row: 3 },
    { type: 'chair', col: 10, row: 3 },
    { type: 'chair', col: 4, row: 6 },
    { type: 'chair', col: 10, row: 6 },
    { type: 'bookshelf', col: 12, row: 2 },
    { type: 'bookshelf', col: 12, row: 5 },
  ],
  operations: [
    { type: 'desk', col: 2, row: 2 },
    { type: 'desk', col: 2, row: 5 },
    { type: 'desk', col: 7, row: 2 },
    { type: 'desk', col: 7, row: 5 },
    { type: 'server', col: 11, row: 2 },
    { type: 'server', col: 12, row: 2 },
    { type: 'server', col: 11, row: 5 },
    { type: 'server', col: 12, row: 5 },
    { type: 'chair', col: 4, row: 2 },
    { type: 'chair', col: 4, row: 5 },
    { type: 'chair', col: 9, row: 2 },
    { type: 'chair', col: 9, row: 5 },
    { type: 'computer', col: 2, row: 3 },
    { type: 'computer', col: 7, row: 3 },
  ],
  meeting: [
    { type: 'meeting_table', col: 3, row: 4 },
    { type: 'chair', col: 3, row: 3 },
    { type: 'chair', col: 5, row: 3 },
    { type: 'chair', col: 7, row: 3 },
    { type: 'chair', col: 3, row: 7 },
    { type: 'chair', col: 5, row: 7 },
    { type: 'chair', col: 7, row: 7 },
    { type: 'chair', col: 2, row: 5 },
    { type: 'chair', col: 8, row: 5 },
    { type: 'whiteboard', col: 3, row: 1 },
  ],
  lounge: [
    { type: 'sofa', col: 2, row: 2 },
    { type: 'sofa', col: 2, row: 6 },
    { type: 'coffee_table', col: 4, row: 3 },
    { type: 'coffee_table', col: 4, row: 7 },
    { type: 'plant', col: 1, row: 1 },
    { type: 'plant', col: 10, row: 1 },
    { type: 'plant', col: 1, row: 10 },
    { type: 'vending', col: 9, row: 2 },
    { type: 'sofa', col: 7, row: 6 },
  ],
  hallway: [
    { type: 'plant', col: 1, row: 1 },
    { type: 'plant', col: 6, row: 1 },
    { type: 'plant', col: 1, row: 10 },
    { type: 'plant', col: 6, row: 10 },
  ],
};

// Agent definitions
const INITIAL_AGENTS = [
  { id: 'eng-1', name: 'Alice', role: 'engineer', room: 'engineering', state: 'idle' },
  { id: 'eng-2', name: 'Bob', role: 'engineer', room: 'engineering', state: 'idle' },
  { id: 'eng-3', name: 'Charlie', role: 'engineer', room: 'engineering', state: 'idle' },
  { id: 'res-1', name: 'Diana', role: 'researcher', room: 'research', state: 'idle' },
  { id: 'res-2', name: 'Eve', role: 'researcher', room: 'research', state: 'idle' },
  { id: 'res-3', name: 'Frank', role: 'researcher', room: 'research', state: 'idle' },
  { id: 'ops-1', name: 'Grace', role: 'ops', room: 'operations', state: 'idle' },
  { id: 'ops-2', name: 'Hank', role: 'ops', room: 'operations', state: 'idle' },
  { id: 'ops-3', name: 'Iris', role: 'ops', room: 'operations', state: 'idle' },
  { id: 'mgr-1', name: 'Jack', role: 'ops', room: 'meeting', state: 'idle' },
  { id: 'mgr-2', name: 'Kate', role: 'engineer', room: 'meeting', state: 'idle' },
  { id: 'lgn-1', name: 'Leo', role: 'researcher', room: 'lounge', state: 'idle' },
  { id: 'lgn-2', name: 'Maya', role: 'engineer', room: 'lounge', state: 'idle' },
];

/**
 * Convert tile coordinates to pixel position (center of tile)
 */
export function tileToPixel(col, row) {
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE / 2,
  };
}

/**
 * Get pixel bounds for a room
 */
export function getRoomPixelBounds(room) {
  const { col, row, w, h } = room.bounds;
  return {
    x: col * TILE_SIZE,
    y: row * TILE_SIZE,
    width: w * TILE_SIZE,
    height: h * TILE_SIZE,
  };
}

/**
 * Spawn agent at random walkable position inside its room
 */
function spawnPosition(roomId) {
  const room = ROOMS.find((r) => r.id === roomId);
  if (!room) return { x: 200, y: 200 };
  const { col, row, w, h } = room.bounds;
  const pad = 2; // tiles from wall
  const randCol = col + pad + Math.random() * (w - pad * 2);
  const randRow = row + pad + Math.random() * (h - pad * 2);
  return tileToPixel(randCol, randRow);
}

function initAgents() {
  return INITIAL_AGENTS.map((a) => {
    const pos = spawnPosition(a.room);
    return {
      ...a,
      x: pos.x,
      y: pos.y,
      targetX: pos.x,
      targetY: pos.y,
      direction: 1,
      animFrame: 0,
      idleTimer: Math.random() * 3 + 2,
      task: null,
    };
  });
}

/**
 * Generate the tilemap (2D array)
 */
function generateTileMap() {
  // Start with void
  const map = Array.from({ length: MAP_ROWS }, () =>
    Array.from({ length: MAP_COLS }, () => TILE.VOID)
  );

  // Fill rooms with floors
  ROOMS.forEach((room) => {
    const { col, row, w, h } = room.bounds;
    for (let r = row; r < row + h; r++) {
      for (let c = col; c < col + w; c++) {
        if (r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLS) {
          map[r][c] = room.floorType;
        }
      }
    }
  });

  // Place walls around each room
  ROOMS.forEach((room) => {
    const { col, row, w, h } = room.bounds;
    // Top & bottom walls
    for (let c = col - 1; c <= col + w; c++) {
      if (c >= 0 && c < MAP_COLS) {
        if (row - 1 >= 0 && map[row - 1][c] === TILE.VOID) map[row - 1][c] = TILE.WALL;
        if (row + h < MAP_ROWS && map[row + h][c] === TILE.VOID) map[row + h][c] = TILE.WALL;
      }
    }
    // Left & right walls
    for (let r = row - 1; r <= row + h; r++) {
      if (r >= 0 && r < MAP_ROWS) {
        if (col - 1 >= 0 && map[r][col - 1] === TILE.VOID) map[r][col - 1] = TILE.WALL;
        if (col + w < MAP_COLS && map[r][col + w] === TILE.VOID) map[r][col + w] = TILE.WALL;
      }
    }
  });

  return map;
}

export const useWorkspaceStore = create((set, get) => ({
  // Map
  tileMap: generateTileMap(),
  rooms: ROOMS,
  furniture: FURNITURE,

  // Agents
  agents: initAgents(),

  // Camera/viewport
  isFullscreen: false,
  selectedAgent: null,
  zoom: 1,
  panOffset: { x: 0, y: 0 },

  // Actions
  setFullscreen: (val) => set({ isFullscreen: val }),
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  setZoom: (z) => set({ zoom: Math.max(0.4, Math.min(3, z)) }),
  setPanOffset: (offset) => set({ panOffset: offset }),

  updateAgent: (id, updates) =>
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),

  updateAgents: (updater) =>
    set((state) => ({
      agents: state.agents.map(updater),
    })),

  assignTask: (agentId, task) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId ? { ...a, task, state: 'working' } : a
      ),
    })),

  clearTask: (agentId) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId ? { ...a, task: null, state: 'idle' } : a
      ),
    })),
}));
