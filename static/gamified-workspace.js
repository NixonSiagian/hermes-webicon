/* ════════════════════════════════════════════════════════════════════════
   GAMIFIED 2D WORKSPACE CONTROLLER
   Now delegates to the PixiJS tile-based renderer (pixi-workspace.html).
   All div-based room/furniture/agent rendering has been removed.
   The workspace is rendered entirely via PixiJS sprites on a <canvas>.
   ════════════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  const PIXI_WORKSPACE_URL = 'static/workspace/pixi-workspace.html';

  // ── Global Workspace State ──
  const WorkspaceState = {
    active: false,
    agents: [],
    rooms: [],
    scale: 1,
  };

  // ══════════════════════════════════════════════════════════════════════
  // WORKSPACE INITIALIZATION
  // ══════════════════════════════════════════════════════════════════════

  function initWorkspace() {
    console.log('[Workspace] Initializing tile-based PixiJS workspace...');
    createWorkspaceHTML();
    bindWorkspaceEvents();
    console.log('[Workspace] Initialization complete (PixiJS tile renderer)');
  }

  // ── Create Workspace DOM Structure (fullscreen iframe to PixiJS canvas) ──
  function createWorkspaceHTML() {
    if (document.getElementById('workspace-fullscreen')) {
      console.log('[Workspace] Already exists, skipping creation');
      return;
    }

    const workspaceHTML = `
      <div id="workspace-fullscreen" class="workspace-fullscreen">
        <!-- Outer topbar hidden via CSS — topbar lives inside iframe -->
        <div class="workspace-topbar" style="display:none;">
          <button class="workspace-close-btn" id="workspace-close-btn">Exit</button>
        </div>

        <!-- PixiJS Tile-Based Workspace (fullscreen iframe) -->
        <iframe id="workspace-pixi-frame"
                src="${PIXI_WORKSPACE_URL}"
                style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;"
                allowfullscreen></iframe>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', workspaceHTML);
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
    console.log('[Workspace] Opened tile-based workspace');
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

  // ══════════════════════════════════════════════════════════════════════
  // EVENT BINDINGS
  // ══════════════════════════════════════════════════════════════════════

  function bindWorkspaceEvents() {
    const closeBtn = document.getElementById('workspace-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeWorkspace);
    }

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && WorkspaceState.active) {
        closeWorkspace();
      }
    });

    // Listen for postMessage from the iframe exit button
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'workspace-close') {
        closeWorkspace();
      }
    });

    console.log('[Workspace] Events bound');
  }

  // ══════════════════════════════════════════════════════════════════════
  // PUBLIC API (preserved for backwards compatibility)
  // ══════════════════════════════════════════════════════════════════════

  window.GamifiedWorkspace = {
    init: initWorkspace,
    open: openWorkspace,
    close: closeWorkspace,
    toggle: toggleWorkspace,
    addAgent: (agent) => { WorkspaceState.agents.push(agent); },
    removeAgent: (agentId) => { WorkspaceState.agents = WorkspaceState.agents.filter(a => a.id !== agentId); },
    updateAgent: (agentId, updates) => {
      const agent = WorkspaceState.agents.find(a => a.id === agentId);
      if (agent) Object.assign(agent, updates);
    },
    getState: () => WorkspaceState,
    startSimulation: () => { /* handled by pixi-workspace.js internally */ },
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
