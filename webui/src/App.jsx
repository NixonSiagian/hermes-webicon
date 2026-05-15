import React, { useState } from 'react';
import Navbar from './components/Navbar';
import AgentPanel from './components/AgentPanel';
import TasksPanel from './components/TasksPanel';
import SettingsPanel from './components/SettingsPanel';
import WorkspaceView from './components/WorkspaceView';
import FullscreenWorkspace from './components/FullscreenWorkspace';
import AgentPopup from './components/AgentPopup';
import { useWorkspaceStore } from './store/workspaceStore';

/**
 * Hermes 2D AI Agent Workspace — RimWorld Style
 *
 * A live tile-based 2D office simulation where AI agents move
 * autonomously inside rooms with real floor tiles, walls, and furniture.
 *
 * Architecture:
 * - PixiJS canvas with tile-based rendering
 * - Procedural floor/wall/furniture textures
 * - Zustand for state management
 * - Autonomous movement system with lerp interpolation
 * - Pixel-art animated agent sprites
 * - Depth-sorted rendering (Y-sorting like RimWorld)
 * - Mobile-first responsive design with touch pan/zoom
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
    <div className="w-full h-full bg-[#050810]">
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
