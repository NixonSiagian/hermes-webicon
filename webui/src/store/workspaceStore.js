import { create } from 'zustand';

// Room definitions with pixel-based boundaries (will be scaled to canvas)
const ROOMS = [
  {
    id: 'engineering',
    label: 'Engineering',
    color: 0x3b82f6,
    bgColor: 0x131a2a,
    bounds: { x: 30, y: 30, width: 420, height: 280 },
  },
  {
    id: 'research',
    label: 'Research Lab',
    color: 0xf59e0b,
    bgColor: 0x1a1520,
    bounds: { x: 480, y: 30, width: 420, height: 280 },
  },
  {
    id: 'operations',
    label: 'Operations',
    color: 0x10b981,
    bgColor: 0x0f1a1a,
    bounds: { x: 30, y: 340, width: 420, height: 280 },
  },
  {
    id: 'meeting',
    label: 'Meeting Room',
    color: 0xa855f7,
    bgColor: 0x1a1328,
    bounds: { x: 480, y: 340, width: 420, height: 280 },
  },
];

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
  { id: 'mgr-3', name: 'Leo', role: 'researcher', room: 'meeting', state: 'idle' },
];

// Spawn agent at random position inside its room
function spawnPosition(roomId, rooms) {
  const room = rooms.find((r) => r.id === roomId);
  if (!room) return { x: 200, y: 200 };
  const pad = 50;
  return {
    x: room.bounds.x + pad + Math.random() * (room.bounds.width - pad * 2),
    y: room.bounds.y + pad + Math.random() * (room.bounds.height - pad * 2),
  };
}

function initAgents(rooms) {
  return INITIAL_AGENTS.map((a) => {
    const pos = spawnPosition(a.room, rooms);
    return {
      ...a,
      x: pos.x,
      y: pos.y,
      targetX: pos.x,
      targetY: pos.y,
      velocity: { x: 0, y: 0 },
      direction: 1, // 1 = right, -1 = left
      animFrame: 0,
      idleTimer: Math.random() * 3 + 2,
      task: null,
    };
  });
}

export const useWorkspaceStore = create((set, get) => ({
  // State
  rooms: ROOMS,
  agents: initAgents(ROOMS),
  isFullscreen: false,
  selectedAgent: null,
  canvasSize: { width: 930, height: 650 },
  zoom: 1,
  panOffset: { x: 0, y: 0 },

  // Actions
  setFullscreen: (val) => set({ isFullscreen: val }),
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  setCanvasSize: (size) => set({ canvasSize: size }),
  setZoom: (z) => set({ zoom: Math.max(0.5, Math.min(3, z)) }),
  setPanOffset: (offset) => set({ panOffset: offset }),

  updateAgent: (id, updates) =>
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),

  updateAgents: (updater) =>
    set((state) => ({
      agents: state.agents.map(updater),
    })),

  // Assign a task to an agent (for future API integration)
  assignTask: (agentId, task) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId ? { ...a, task, state: 'working' } : a
      ),
    })),

  // Clear task from agent
  clearTask: (agentId) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId ? { ...a, task: null, state: 'idle' } : a
      ),
    })),
}));
