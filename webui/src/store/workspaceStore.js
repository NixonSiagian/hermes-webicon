import { create } from 'zustand';

/**
 * Hermes AI Agent Simulation — Workspace Store
 * 
 * A REAL simulation system where agents have jobs, move intelligently
 * between rooms, perform tasks, and interact with the workspace.
 * 
 * Key concepts:
 * - Agents have roles that determine their behavior patterns
 * - Jobs drive agents to specific rooms/destinations
 * - State machine: idle → assigned → moving → working → complete → idle
 * - Rooms are FUNCTIONAL spaces, not decorative
 */

export const TILE_SIZE = 32;
export const MAP_COLS = 40;
export const MAP_ROWS = 28;
export const MAP_WIDTH = MAP_COLS * TILE_SIZE;
export const MAP_HEIGHT = MAP_ROWS * TILE_SIZE;

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

// ═══════════════════════════════════════════════════════════════════
// ROOM DEFINITIONS — Each room has a PURPOSE
// ═══════════════════════════════════════════════════════════════════

export const ROOMS = [
  {
    id: 'engineering',
    label: 'Engineering',
    purpose: 'coding',
    color: 0x3b82f6,
    floorType: TILE.FLOOR_DARK,
    bounds: { col: 1, row: 1, w: 14, h: 12 },
  },
  {
    id: 'research',
    label: 'Research Lab',
    purpose: 'research',
    color: 0xf59e0b,
    floorType: TILE.FLOOR_LIGHT,
    bounds: { col: 16, row: 1, w: 14, h: 12 },
  },
  {
    id: 'operations',
    label: 'Operations',
    purpose: 'ops',
    color: 0x10b981,
    floorType: TILE.FLOOR_TILE,
    bounds: { col: 1, row: 14, w: 14, h: 12 },
  },
  {
    id: 'meeting',
    label: 'Meeting Room',
    purpose: 'meeting',
    color: 0xa855f7,
    floorType: TILE.FLOOR_CARPET,
    bounds: { col: 16, row: 14, w: 10, h: 12 },
  },
  {
    id: 'lounge',
    label: 'Lounge',
    purpose: 'break',
    color: 0xec4899,
    floorType: TILE.FLOOR_WOOD,
    bounds: { col: 27, row: 14, w: 12, h: 12 },
  },
  {
    id: 'hallway',
    label: 'Hallway',
    purpose: 'transit',
    color: 0x6b7280,
    floorType: TILE.FLOOR_DARK,
    bounds: { col: 31, row: 1, w: 8, h: 12 },
  },
];

// ═══════════════════════════════════════════════════════════════════
// WORK STATIONS — Specific destinations agents go to for tasks
// ═══════════════════════════════════════════════════════════════════

export const WORKSTATIONS = {
  engineering: [
    { id: 'eng-desk-1', type: 'desk', col: 3, row: 3, task: 'coding' },
    { id: 'eng-desk-2', type: 'desk', col: 3, row: 6, task: 'coding' },
    { id: 'eng-desk-3', type: 'desk', col: 3, row: 9, task: 'coding' },
    { id: 'eng-desk-4', type: 'desk', col: 8, row: 3, task: 'coding' },
    { id: 'eng-desk-5', type: 'desk', col: 8, row: 6, task: 'coding' },
    { id: 'eng-desk-6', type: 'desk', col: 8, row: 9, task: 'coding' },
  ],
  research: [
    { id: 'res-desk-1', type: 'desk', col: 2, row: 3, task: 'research' },
    { id: 'res-desk-2', type: 'desk', col: 2, row: 6, task: 'research' },
    { id: 'res-desk-3', type: 'desk', col: 8, row: 3, task: 'research' },
    { id: 'res-desk-4', type: 'desk', col: 8, row: 6, task: 'research' },
    { id: 'res-whiteboard', type: 'whiteboard', col: 6, row: 2, task: 'thinking' },
  ],
  operations: [
    { id: 'ops-desk-1', type: 'desk', col: 3, row: 3, task: 'monitoring' },
    { id: 'ops-desk-2', type: 'desk', col: 3, row: 6, task: 'monitoring' },
    { id: 'ops-desk-3', type: 'desk', col: 8, row: 3, task: 'deploying' },
    { id: 'ops-desk-4', type: 'desk', col: 8, row: 6, task: 'deploying' },
    { id: 'ops-server-1', type: 'server', col: 11, row: 3, task: 'server_check' },
    { id: 'ops-server-2', type: 'server', col: 11, row: 6, task: 'server_check' },
  ],
  meeting: [
    { id: 'meet-seat-1', type: 'chair', col: 3, row: 4, task: 'meeting' },
    { id: 'meet-seat-2', type: 'chair', col: 5, row: 4, task: 'meeting' },
    { id: 'meet-seat-3', type: 'chair', col: 7, row: 4, task: 'meeting' },
    { id: 'meet-seat-4', type: 'chair', col: 3, row: 8, task: 'meeting' },
    { id: 'meet-seat-5', type: 'chair', col: 5, row: 8, task: 'meeting' },
    { id: 'meet-seat-6', type: 'chair', col: 7, row: 8, task: 'meeting' },
  ],
  lounge: [
    { id: 'lounge-sofa-1', type: 'sofa', col: 3, row: 3, task: 'resting' },
    { id: 'lounge-sofa-2', type: 'sofa', col: 3, row: 7, task: 'resting' },
    { id: 'lounge-sofa-3', type: 'sofa', col: 8, row: 5, task: 'resting' },
    { id: 'lounge-vending', type: 'vending', col: 10, row: 2, task: 'snacking' },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// FURNITURE (visual only — used by furnitureRenderer)
// ═══════════════════════════════════════════════════════════════════

export const FURNITURE = {
  engineering: [
    { type: 'desk', col: 3, row: 3 },
    { type: 'desk', col: 3, row: 6 },
    { type: 'desk', col: 3, row: 9 },
    { type: 'desk', col: 8, row: 3 },
    { type: 'desk', col: 8, row: 6 },
    { type: 'desk', col: 8, row: 9 },
    { type: 'chair', col: 5, row: 3 },
    { type: 'chair', col: 5, row: 6 },
    { type: 'chair', col: 5, row: 9 },
    { type: 'chair', col: 10, row: 3 },
    { type: 'chair', col: 10, row: 6 },
    { type: 'chair', col: 10, row: 9 },
    { type: 'computer', col: 3, row: 4 },
    { type: 'computer', col: 8, row: 4 },
    { type: 'computer', col: 3, row: 7 },
    { type: 'computer', col: 8, row: 7 },
  ],
  research: [
    { type: 'desk', col: 2, row: 3 },
    { type: 'desk', col: 2, row: 6 },
    { type: 'desk', col: 8, row: 3 },
    { type: 'desk', col: 8, row: 6 },
    { type: 'whiteboard', col: 6, row: 2 },
    { type: 'chair', col: 4, row: 3 },
    { type: 'chair', col: 4, row: 6 },
    { type: 'chair', col: 10, row: 3 },
    { type: 'chair', col: 10, row: 6 },
    { type: 'bookshelf', col: 12, row: 3 },
    { type: 'bookshelf', col: 12, row: 6 },
  ],
  operations: [
    { type: 'desk', col: 3, row: 3 },
    { type: 'desk', col: 3, row: 6 },
    { type: 'desk', col: 8, row: 3 },
    { type: 'desk', col: 8, row: 6 },
    { type: 'server', col: 11, row: 3 },
    { type: 'server', col: 12, row: 3 },
    { type: 'server', col: 11, row: 6 },
    { type: 'server', col: 12, row: 6 },
    { type: 'chair', col: 5, row: 3 },
    { type: 'chair', col: 5, row: 6 },
    { type: 'chair', col: 10, row: 3 },
    { type: 'chair', col: 10, row: 6 },
    { type: 'computer', col: 3, row: 4 },
    { type: 'computer', col: 8, row: 4 },
  ],
  meeting: [
    { type: 'meeting_table', col: 4, row: 5 },
    { type: 'chair', col: 3, row: 4 },
    { type: 'chair', col: 5, row: 4 },
    { type: 'chair', col: 7, row: 4 },
    { type: 'chair', col: 3, row: 8 },
    { type: 'chair', col: 5, row: 8 },
    { type: 'chair', col: 7, row: 8 },
    { type: 'whiteboard', col: 4, row: 2 },
  ],
  lounge: [
    { type: 'sofa', col: 3, row: 3 },
    { type: 'sofa', col: 3, row: 7 },
    { type: 'sofa', col: 8, row: 5 },
    { type: 'coffee_table', col: 5, row: 4 },
    { type: 'coffee_table', col: 5, row: 8 },
    { type: 'plant', col: 1, row: 1 },
    { type: 'plant', col: 10, row: 1 },
    { type: 'plant', col: 1, row: 10 },
    { type: 'vending', col: 10, row: 2 },
  ],
  hallway: [
    { type: 'plant', col: 1, row: 1 },
    { type: 'plant', col: 6, row: 1 },
    { type: 'plant', col: 1, row: 10 },
    { type: 'plant', col: 6, row: 10 },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// JOB DEFINITIONS — What agents actually DO
// ═══════════════════════════════════════════════════════════════════

export const JOBS = {
  coding: {
    id: 'coding',
    label: 'Writing Code',
    room: 'engineering',
    duration: { min: 8, max: 18 },  // seconds
    roles: ['developer', 'manager'],
  },
  code_review: {
    id: 'code_review',
    label: 'Code Review',
    room: 'engineering',
    duration: { min: 5, max: 12 },
    roles: ['developer', 'manager'],
  },
  research: {
    id: 'research',
    label: 'Research',
    room: 'research',
    duration: { min: 10, max: 20 },
    roles: ['researcher', 'developer'],
  },
  brainstorm: {
    id: 'brainstorm',
    label: 'Brainstorming',
    room: 'research',
    duration: { min: 6, max: 14 },
    roles: ['researcher', 'manager'],
  },
  monitoring: {
    id: 'monitoring',
    label: 'System Monitoring',
    room: 'operations',
    duration: { min: 6, max: 15 },
    roles: ['ops', 'developer'],
  },
  deploying: {
    id: 'deploying',
    label: 'Deploying',
    room: 'operations',
    duration: { min: 4, max: 10 },
    roles: ['ops'],
  },
  server_check: {
    id: 'server_check',
    label: 'Server Check',
    room: 'operations',
    duration: { min: 3, max: 8 },
    roles: ['ops'],
  },
  meeting: {
    id: 'meeting',
    label: 'Team Meeting',
    room: 'meeting',
    duration: { min: 10, max: 25 },
    roles: ['developer', 'researcher', 'ops', 'manager'],
  },
  standup: {
    id: 'standup',
    label: 'Standup',
    room: 'meeting',
    duration: { min: 3, max: 6 },
    roles: ['developer', 'researcher', 'ops', 'manager'],
  },
  break_coffee: {
    id: 'break_coffee',
    label: 'Coffee Break',
    room: 'lounge',
    duration: { min: 4, max: 8 },
    roles: ['developer', 'researcher', 'ops', 'manager'],
  },
  break_rest: {
    id: 'break_rest',
    label: 'Resting',
    room: 'lounge',
    duration: { min: 5, max: 12 },
    roles: ['developer', 'researcher', 'ops', 'manager'],
  },
};

// ═══════════════════════════════════════════════════════════════════
// AGENT DEFINITIONS — Real AI agents with roles
// ═══════════════════════════════════════════════════════════════════

const INITIAL_AGENTS = [
  { id: 'dev-1', name: 'Alice', role: 'developer', homeRoom: 'engineering' },
  { id: 'dev-2', name: 'Bob', role: 'developer', homeRoom: 'engineering' },
  { id: 'dev-3', name: 'Charlie', role: 'developer', homeRoom: 'engineering' },
  { id: 'res-1', name: 'Diana', role: 'researcher', homeRoom: 'research' },
  { id: 'res-2', name: 'Eve', role: 'researcher', homeRoom: 'research' },
  { id: 'res-3', name: 'Frank', role: 'researcher', homeRoom: 'research' },
  { id: 'ops-1', name: 'Grace', role: 'ops', homeRoom: 'operations' },
  { id: 'ops-2', name: 'Hank', role: 'ops', homeRoom: 'operations' },
  { id: 'ops-3', name: 'Iris', role: 'ops', homeRoom: 'operations' },
  { id: 'mgr-1', name: 'Jack', role: 'manager', homeRoom: 'meeting' },
  { id: 'mgr-2', name: 'Kate', role: 'manager', homeRoom: 'engineering' },
  { id: 'dev-4', name: 'Leo', role: 'developer', homeRoom: 'engineering' },
  { id: 'res-4', name: 'Maya', role: 'researcher', homeRoom: 'research' },
];

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export function tileToPixel(col, row) {
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE / 2,
  };
}

export function getRoomPixelBounds(room) {
  const { col, row, w, h } = room.bounds;
  return {
    x: col * TILE_SIZE,
    y: row * TILE_SIZE,
    width: w * TILE_SIZE,
    height: h * TILE_SIZE,
  };
}

function getRoomCenter(roomId) {
  const room = ROOMS.find((r) => r.id === roomId);
  if (!room) return { x: 200, y: 200 };
  const { col, row, w, h } = room.bounds;
  return tileToPixel(col + w / 2, row + h / 2);
}

function getRandomPosInRoom(roomId) {
  const room = ROOMS.find((r) => r.id === roomId);
  if (!room) return { x: 200, y: 200 };
  const { col, row, w, h } = room.bounds;
  const pad = 2;
  const randCol = col + pad + Math.random() * (w - pad * 2);
  const randRow = row + pad + Math.random() * (h - pad * 2);
  return tileToPixel(randCol, randRow);
}

function getWorkstationPos(roomId, workstationId) {
  const stations = WORKSTATIONS[roomId];
  if (!stations) return getRandomPosInRoom(roomId);
  const station = stations.find((s) => s.id === workstationId);
  if (!station) return getRandomPosInRoom(roomId);
  const room = ROOMS.find((r) => r.id === roomId);
  if (!room) return getRandomPosInRoom(roomId);
  return tileToPixel(room.bounds.col + station.col, room.bounds.row + station.row);
}

/**
 * Pick a job for an agent based on their role and weighted randomness
 */
function pickJobForAgent(agent) {
  const role = agent.role;
  const availableJobs = Object.values(JOBS).filter((j) => j.roles.includes(role));
  
  // Weight jobs: home room jobs are more likely
  const homeRoom = agent.homeRoom;
  const weighted = availableJobs.map((job) => ({
    job,
    weight: job.room === homeRoom ? 4 : 
            job.id.startsWith('break') ? 1.5 : 
            job.id === 'meeting' || job.id === 'standup' ? 2 : 1,
  }));
  
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let rand = Math.random() * totalWeight;
  
  for (const { job, weight } of weighted) {
    rand -= weight;
    if (rand <= 0) return job;
  }
  
  return availableJobs[0];
}

/**
 * Pick a workstation in the target room
 */
function pickWorkstation(roomId, occupiedStations) {
  const stations = WORKSTATIONS[roomId];
  if (!stations || stations.length === 0) return null;
  
  // Prefer unoccupied stations
  const available = stations.filter((s) => !occupiedStations.has(s.id));
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  // Fall back to any station
  return stations[Math.floor(Math.random() * stations.length)];
}

// ═══════════════════════════════════════════════════════════════════
// INITIALIZE AGENTS
// ═══════════════════════════════════════════════════════════════════

function initAgents() {
  return INITIAL_AGENTS.map((def) => {
    const pos = getRandomPosInRoom(def.homeRoom);
    return {
      ...def,
      // Position
      x: pos.x,
      y: pos.y,
      targetX: pos.x,
      targetY: pos.y,
      // State machine
      state: 'idle',       // idle | moving | working | thinking
      direction: 1,
      animFrame: 0,
      // Job system
      currentJob: null,    // Job object
      currentRoom: def.homeRoom,
      targetRoom: null,
      workstation: null,   // Current workstation ID
      // Timers
      jobTimer: 0,         // Time remaining on current job
      idleTimer: Math.random() * 2 + 0.5, // Brief idle before first job
      taskCooldown: 0,     // Cooldown before accepting new task
      // Stats for display
      jobsCompleted: 0,
      totalWorkTime: 0,
      // Activity log
      activity: 'Initializing...',
    };
  });
}

// ═══════════════════════════════════════════════════════════════════
// TILEMAP GENERATION
// ═══════════════════════════════════════════════════════════════════

function generateTileMap() {
  const map = Array.from({ length: MAP_ROWS }, () =>
    Array.from({ length: MAP_COLS }, () => TILE.VOID)
  );

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

  ROOMS.forEach((room) => {
    const { col, row, w, h } = room.bounds;
    for (let c = col - 1; c <= col + w; c++) {
      if (c >= 0 && c < MAP_COLS) {
        if (row - 1 >= 0 && map[row - 1][c] === TILE.VOID) map[row - 1][c] = TILE.WALL;
        if (row + h < MAP_ROWS && map[row + h][c] === TILE.VOID) map[row + h][c] = TILE.WALL;
      }
    }
    for (let r = row - 1; r <= row + h; r++) {
      if (r >= 0 && r < MAP_ROWS) {
        if (col - 1 >= 0 && map[r][col - 1] === TILE.VOID) map[r][col - 1] = TILE.WALL;
        if (col + w < MAP_COLS && map[r][col + w] === TILE.VOID) map[r][col + w] = TILE.WALL;
      }
    }
  });

  return map;
}

// ═══════════════════════════════════════════════════════════════════
// ZUSTAND STORE
// ═══════════════════════════════════════════════════════════════════

export const useWorkspaceStore = create((set, get) => ({
  // Map
  tileMap: generateTileMap(),
  rooms: ROOMS,
  furniture: FURNITURE,

  // Agents
  agents: initAgents(),

  // Simulation state
  simulationRunning: true,
  simulationSpeed: 1,
  totalJobsCompleted: 0,
  meetingInProgress: false,

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
  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),
  toggleSimulation: () => set((s) => ({ simulationRunning: !s.simulationRunning })),

  // Job system helpers (exposed for external use)
  pickJobForAgent,
  pickWorkstation,
  getWorkstationPos,
  getRandomPosInRoom,
  getRoomCenter,

  updateAgent: (id, updates) =>
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),

  incrementJobsCompleted: () =>
    set((state) => ({ totalJobsCompleted: state.totalJobsCompleted + 1 })),
}));
