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
 * App — Root shell.
 *
 * Layout:
 *   ┌──────────────────────────────────┐
 *   │  Navbar (fixed, h-14 = 56px)     │
 *   ├──────────────────────────────────┤
 *   │  Main content (fills rest)       │
 *   │  — WorkspaceView has its own     │
 *   │    top-bar + PixiJS canvas that  │
 *   │    fills 100% of this area       │
 *   └──────────────────────────────────┘
 *
 * The key fix: main uses calc(100vh - 56px) so the canvas
 * always has a real pixel height to measure.
 */
export default function App() {
  const [activeView, setActiveView] = useState('workspace');
  const { isFullscreen } = useWorkspaceStore();

  const renderView = () => {
    switch (activeView) {
      case 'workspace': return <WorkspaceView />;
      case 'agents':    return <AgentPanel />;
      case 'tasks':     return <TasksPanel />;
      case 'settings':  return <SettingsPanel />;
      default:          return <WorkspaceView />;
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', background: '#050810', overflow: 'hidden' }}>
      {/* Fixed top navbar */}
      <Navbar activeView={activeView} onViewChange={setActiveView} />

      {/* Main content area — sits below the 56px navbar */}
      {!isFullscreen && (
        <main style={{
          position: 'absolute',
          top: 56,           /* exactly navbar height */
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {renderView()}
        </main>
      )}

      {/* Fullscreen overlay (replaces everything) */}
      <FullscreenWorkspace />

      {/* Agent click popup */}
      <AgentPopup />
    </div>
  );
}
