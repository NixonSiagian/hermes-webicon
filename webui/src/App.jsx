import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import AgentPanel from './components/AgentPanel';
import TasksPanel from './components/TasksPanel';
import SettingsPanel from './components/SettingsPanel';
import WorkspaceView from './components/WorkspaceView';
import FullscreenWorkspace from './components/FullscreenWorkspace';
import AgentPopup from './components/AgentPopup';
import { useWorkspaceStore } from './store/workspaceStore';

/**
 * Hermes 2D AI Agent Workspace
 *
 * A live 2D simulation dashboard where AI agents move autonomously
 * inside rooms (Engineering, Research Lab, Operations, Meeting).
 *
 * Architecture:
 * - PixiJS canvas for 2D rendering
 * - Zustand for state management
 * - Autonomous movement system with lerp interpolation
 * - Sprite-based animated agents
 * - Mobile-first responsive design
 */
export default function App() {
  const [activeView, setActiveView] = useState('workspace');
  const { isFullscreen } = useWorkspaceStore();

  const renderView = () => {
    switch (activeView) {
      case 'workspace':
        return <WorkspaceView />;
      case 'agents':
        return <AgentPanel />;
      case 'tasks':
        return <TasksPanel />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <WorkspaceView />;
    }
  };

  return (
    <div className="w-full h-full bg-hermes-dark">
      {/* Navbar */}
      <Navbar activeView={activeView} onViewChange={setActiveView} />

      {/* Main content */}
      {!isFullscreen && (
        <main className="absolute top-14 left-0 right-0 bottom-0 overflow-hidden">
          {renderView()}
        </main>
      )}

      {/* Fullscreen workspace overlay */}
      <FullscreenWorkspace />

      {/* Agent info popup */}
      <AgentPopup />
    </div>
  );
}
