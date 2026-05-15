/* ════════════════════════════════════════════════════════════════════════
   GAMIFIED 2D WORKSPACE CONTROLLER
   Manages office layout, sprite agents, and workspace interactions
   ════════════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ── Global Workspace State ──
  const WorkspaceState = {
    active: false,
    agents: [],
    rooms: [],
    scale: 1,
    minScale: 0.5,
    maxScale: 2,
  };

  // ── Agent Emoji Sprites (fallback for now) ──
  const AGENT_SPRITES = {
    'engineering': '🔧',
    'research': '🔬',
    'operations': '⚙️',
    'meeting': '💼',
    'lounge': '☕',
    'frontend': '🎨',
    'backend': '💻',
    'devops': '🚀',
    'data': '📊',
    'security': '🔒',
    'qa': '🧪',
    'design': '✏️',
  };

  // ── Agent Status Types ──
  const AGENT_STATUS = {
    IDLE: 'idle',
    WORKING: 'working',
    BUSY: 'busy',
    OFFLINE: 'offline',
  };

  // ── Default Agents ──
  const DEFAULT_AGENTS = [
    { id: 'agent-1', name: 'Alice', role: 'frontend', status: 'working', room: 'engineering', x: 50, y: 50 },
    { id: 'agent-2', name: 'Bob', role: 'backend', status: 'working', room: 'engineering', x: 150, y: 50 },
    { id: 'agent-3', name: 'Carol', role: 'research', status: 'idle', room: 'research', x: 50, y: 50 },
    { id: 'agent-4', name: 'Dave', role: 'devops', status: 'busy', room: 'operations', x: 100, y: 80 },
    { id: 'agent-5', name: 'Eve', role: 'design', status: 'working', room: 'meeting', x: 80, y: 60 },
    { id: 'agent-6', name: 'Frank', role: 'qa', status: 'idle', room: 'lounge', x: 120, y: 90 },
  ];

  // ── Room Definitions ──
  const ROOMS = [
    { id: 'engineering', label: 'Engineering', furniture: ['desk', 'desk', 'chair', 'chair'] },
    { id: 'research', label: 'Research Lab', furniture: ['table', 'chair'] },
    { id: 'operations', label: 'Operations', furniture: ['desk', 'chair'] },
    { id: 'meeting', label: 'Meeting Room', furniture: ['table'] },
    { id: 'lounge', label: 'Lounge', furniture: ['sofa', 'chair'] },
  ];

  // ══════════════════════════════════════════════════════════════════════
  // WORKSPACE INITIALIZATION
  // ══════════════════════════════════════════════════════════════════════

  function initWorkspace() {
    console.log('[Workspace] Initializing gamified 2D workspace...');
    
    // Create workspace HTML structure
    createWorkspaceHTML();
    
    // Initialize agents
    WorkspaceState.agents = [...DEFAULT_AGENTS];
    WorkspaceState.rooms = [...ROOMS];
    
    // Bind events
    bindWorkspaceEvents();
    
    console.log('[Workspace] Initialization complete');
  }

  // ── Create Workspace DOM Structure ──
  function createWorkspaceHTML() {
    // Check if workspace already exists
    if (document.getElementById('workspace-fullscreen')) {
      console.log('[Workspace] Already exists, skipping creation');
      return;
    }

    const workspaceHTML = `
      <div id="workspace-fullscreen" class="workspace-fullscreen">
        <!-- Topbar -->
        <div class="workspace-topbar">
          <div class="workspace-topbar-title">🏢 Hermes Office HQ</div>
          <button class="workspace-close-btn" id="workspace-close-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Exit Workspace
          </button>
        </div>

        <!-- 2D Map -->
        <div id="workspace-map">
          <div class="office-layout" id="office-layout">
            <!-- Rooms will be dynamically inserted here -->
          </div>
        </div>

        <!-- Legend -->
        <div class="workspace-legend">
          <div class="workspace-legend-title">Agent Status</div>
          <div class="workspace-legend-item">
            <div class="workspace-legend-dot working"></div>
            <span>Working</span>
          </div>
          <div class="workspace-legend-item">
            <div class="workspace-legend-dot idle"></div>
            <span>Idle</span>
          </div>
          <div class="workspace-legend-item">
            <div class="workspace-legend-dot busy"></div>
            <span>Busy</span>
          </div>
          <div class="workspace-legend-item">
            <div class="workspace-legend-dot offline"></div>
            <span>Offline</span>
          </div>
        </div>

        <!-- Zoom Controls -->
        <div class="workspace-zoom-controls">
          <button class="workspace-zoom-btn" id="workspace-zoom-in" title="Zoom In">+</button>
          <button class="workspace-zoom-btn" id="workspace-zoom-reset" title="Reset Zoom">⊙</button>
          <button class="workspace-zoom-btn" id="workspace-zoom-out" title="Zoom Out">−</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', workspaceHTML);
  }

  // ══════════════════════════════════════════════════════════════════════
  // ROOM RENDERING
  // ══════════════════════════════════════════════════════════════════════

  function renderRooms() {
    const layout = document.getElementById('office-layout');
    if (!layout) return;

    layout.innerHTML = '';

    WorkspaceState.rooms.forEach(room => {
      const roomEl = document.createElement('div');
      roomEl.className = `room ${room.id}`;
      roomEl.id = `room-${room.id}`;
      roomEl.dataset.roomId = room.id;

      // Room label
      const label = document.createElement('div');
      label.className = 'room-label';
      label.textContent = room.label;
      roomEl.appendChild(label);

      // Add furniture
      room.furniture.forEach((furnitureType, idx) => {
        const furniture = document.createElement('div');
        furniture.className = `furniture ${furnitureType}`;
        furniture.style.left = `${30 + (idx * 60)}px`;
        furniture.style.top = `${80 + (idx % 2) * 60}px`;
        roomEl.appendChild(furniture);
      });

      layout.appendChild(roomEl);
    });

    console.log('[Workspace] Rendered', WorkspaceState.rooms.length, 'rooms');
  }

  // ══════════════════════════════════════════════════════════════════════
  // AGENT RENDERING
  // ══════════════════════════════════════════════════════════════════════

  function renderAgents() {
    // Remove existing agents
    document.querySelectorAll('.agent').forEach(el => el.remove());

    WorkspaceState.agents.forEach(agent => {
      const roomEl = document.getElementById(`room-${agent.room}`);
      if (!roomEl) {
        console.warn('[Workspace] Room not found for agent:', agent.room);
        return;
      }

      const agentEl = document.createElement('div');
      agentEl.className = `agent status-${agent.status}`;
      agentEl.id = agent.id;
      agentEl.dataset.agentId = agent.id;
      agentEl.style.left = `${agent.x}px`;
      agentEl.style.top = `${agent.y}px`;

      // Sprite icon
      const sprite = AGENT_SPRITES[agent.role] || '👤';
      agentEl.textContent = sprite;

      // Status badge
      const badge = document.createElement('div');
      badge.className = 'agent-status-badge';
      agentEl.appendChild(badge);

      // Tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'agent-tooltip';
      tooltip.textContent = `${agent.name} (${agent.role})`;
      agentEl.appendChild(tooltip);

      // Add click handler
      agentEl.addEventListener('click', () => onAgentClick(agent));

      roomEl.appendChild(agentEl);
    });

    console.log('[Workspace] Rendered', WorkspaceState.agents.length, 'agents');
  }

  // ══════════════════════════════════════════════════════════════════════
  // AGENT INTERACTIONS
  // ══════════════════════════════════════════════════════════════════════

  function onAgentClick(agent) {
    console.log('[Workspace] Agent clicked:', agent);
    
    // Show agent details (could open a modal or side panel)
    alert(`Agent: ${agent.name}\nRole: ${agent.role}\nStatus: ${agent.status}\nRoom: ${agent.room}`);
    
    // Optional: trigger status change or movement
    // cycleAgentStatus(agent);
  }

  function cycleAgentStatus(agent) {
    const statuses = [AGENT_STATUS.IDLE, AGENT_STATUS.WORKING, AGENT_STATUS.BUSY, AGENT_STATUS.OFFLINE];
    const currentIndex = statuses.indexOf(agent.status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    agent.status = statuses[nextIndex];
    
    renderAgents();
    console.log('[Workspace] Agent status changed:', agent.name, '→', agent.status);
  }

  function moveAgent(agentId, targetRoom) {
    const agent = WorkspaceState.agents.find(a => a.id === agentId);
    if (!agent) return;

    const oldRoom = agent.room;
    agent.room = targetRoom;
    
    // Reset position in new room
    agent.x = 50 + Math.random() * 100;
    agent.y = 50 + Math.random() * 80;
    
    renderAgents();
    console.log('[Workspace] Agent moved:', agent.name, oldRoom, '→', targetRoom);
  }

  // ══════════════════════════════════════════════════════════════════════
  // WORKSPACE CONTROLS
  // ══════════════════════════════════════════════════════════════════════

  function openWorkspace() {
    const workspace = document.getElementById('workspace-fullscreen');
    if (!workspace) {
      console.error('[Workspace] Workspace element not found');
      return;
    }

    WorkspaceState.active = true;
    workspace.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Render rooms and agents
    renderRooms();
    renderAgents();

    console.log('[Workspace] Opened fullscreen workspace');
  }

  function closeWorkspace() {
    const workspace = document.getElementById('workspace-fullscreen');
    if (!workspace) return;

    WorkspaceState.active = false;
    workspace.classList.remove('active');
    document.body.style.overflow = '';

    console.log('[Workspace] Closed workspace');
  }

  function toggleWorkspace() {
    if (WorkspaceState.active) {
      closeWorkspace();
    } else {
      openWorkspace();
    }
  }

  // ── Zoom Controls ──
  function zoomIn() {
    const layout = document.getElementById('office-layout');
    if (!layout) return;

    WorkspaceState.scale = Math.min(WorkspaceState.scale + 0.2, WorkspaceState.maxScale);
    layout.style.transform = `scale(${WorkspaceState.scale})`;
    console.log('[Workspace] Zoom in:', WorkspaceState.scale);
  }

  function zoomOut() {
    const layout = document.getElementById('office-layout');
    if (!layout) return;

    WorkspaceState.scale = Math.max(WorkspaceState.scale - 0.2, WorkspaceState.minScale);
    layout.style.transform = `scale(${WorkspaceState.scale})`;
    console.log('[Workspace] Zoom out:', WorkspaceState.scale);
  }

  function zoomReset() {
    const layout = document.getElementById('office-layout');
    if (!layout) return;

    WorkspaceState.scale = 1;
    layout.style.transform = `scale(1)`;
    console.log('[Workspace] Zoom reset');
  }

  // ══════════════════════════════════════════════════════════════════════
  // EVENT BINDINGS
  // ══════════════════════════════════════════════════════════════════════

  function bindWorkspaceEvents() {
    // Close button
    const closeBtn = document.getElementById('workspace-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeWorkspace);
    }

    // Zoom controls
    const zoomInBtn = document.getElementById('workspace-zoom-in');
    const zoomOutBtn = document.getElementById('workspace-zoom-out');
    const zoomResetBtn = document.getElementById('workspace-zoom-reset');

    if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn);
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut);
    if (zoomResetBtn) zoomResetBtn.addEventListener('click', zoomReset);

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && WorkspaceState.active) {
        closeWorkspace();
      }
    });

    console.log('[Workspace] Events bound');
  }

  // ══════════════════════════════════════════════════════════════════════
  // AUTO-MOVEMENT SIMULATION (Optional)
  // ══════════════════════════════════════════════════════════════════════

  function startAgentSimulation() {
    setInterval(() => {
      if (!WorkspaceState.active) return;

      // Randomly move an agent
      const randomAgent = WorkspaceState.agents[Math.floor(Math.random() * WorkspaceState.agents.length)];
      if (randomAgent && Math.random() > 0.7) {
        const rooms = ['engineering', 'research', 'operations', 'meeting', 'lounge'];
        const newRoom = rooms[Math.floor(Math.random() * rooms.length)];
        moveAgent(randomAgent.id, newRoom);
      }

      // Randomly change status
      if (Math.random() > 0.8) {
        const randomAgent = WorkspaceState.agents[Math.floor(Math.random() * WorkspaceState.agents.length)];
        if (randomAgent) {
          cycleAgentStatus(randomAgent);
        }
      }
    }, 5000); // Every 5 seconds
  }

  // ══════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════════════════

  window.GamifiedWorkspace = {
    init: initWorkspace,
    open: openWorkspace,
    close: closeWorkspace,
    toggle: toggleWorkspace,
    addAgent: (agent) => {
      WorkspaceState.agents.push(agent);
      if (WorkspaceState.active) renderAgents();
    },
    removeAgent: (agentId) => {
      WorkspaceState.agents = WorkspaceState.agents.filter(a => a.id !== agentId);
      if (WorkspaceState.active) renderAgents();
    },
    updateAgent: (agentId, updates) => {
      const agent = WorkspaceState.agents.find(a => a.id === agentId);
      if (agent) {
        Object.assign(agent, updates);
        if (WorkspaceState.active) renderAgents();
      }
    },
    getState: () => WorkspaceState,
    startSimulation: startAgentSimulation,
  };

  // ══════════════════════════════════════════════════════════════════════
  // AUTO-INIT ON DOM READY
  // ══════════════════════════════════════════════════════════════════════

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWorkspace);
  } else {
    initWorkspace();
  }

})();
