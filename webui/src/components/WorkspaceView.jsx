import React from 'react';
import WorkspaceCanvas from '../canvas/WorkspaceCanvas';
import { useWorkspaceStore } from '../store/workspaceStore';

/**
 * Embedded workspace view (within the dashboard layout, not fullscreen)
 */
export default function WorkspaceView() {
  const { setFullscreen } = useWorkspaceStore();

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-hermes-border bg-hermes-panel/50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-200">2D Workspace</span>
          <span className="text-xs text-gray-500 hidden sm:inline">
            Live simulation | Drag to pan | Scroll to zoom
          </span>
        </div>
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
        >
          Fullscreen
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 min-h-0">
        <WorkspaceCanvas />
      </div>
    </div>
  );
}
