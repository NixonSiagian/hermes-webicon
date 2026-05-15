import React from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import WorkspaceCanvas from '../canvas/WorkspaceCanvas';

/**
 * Fullscreen workspace mode.
 * Takes over the entire screen with the PixiJS canvas.
 * Includes an exit button and zoom controls.
 */
export default function FullscreenWorkspace() {
  const { isFullscreen, setFullscreen, zoom, setZoom } = useWorkspaceStore();

  if (!isFullscreen) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-hermes-dark flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2">
          <span className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-600 to-purple-600 text-white inline-flex items-center justify-center text-xs font-extrabold">
            H
          </span>
          <span className="text-sm font-bold text-gray-200">
            Live Workspace
          </span>
          <span className="text-xs text-gray-500 hidden sm:inline">
            | Pan: drag | Zoom: scroll/pinch
          </span>
        </div>

        <button
          type="button"
          onClick={() => setFullscreen(false)}
          className="pointer-events-auto px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600/90 hover:bg-red-500 text-white transition-colors shadow-lg"
        >
          Exit Workspace
        </button>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 pointer-events-none">
        <button
          type="button"
          onClick={() => setZoom(zoom * 1.2)}
          className="pointer-events-auto w-9 h-9 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-white text-lg font-bold flex items-center justify-center border border-gray-700 shadow-lg transition-colors"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => setZoom(zoom / 1.2)}
          className="pointer-events-auto w-9 h-9 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-white text-lg font-bold flex items-center justify-center border border-gray-700 shadow-lg transition-colors"
        >
          -
        </button>
        <button
          type="button"
          onClick={() => setZoom(1)}
          className="pointer-events-auto w-9 h-9 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-white text-xs font-bold flex items-center justify-center border border-gray-700 shadow-lg transition-colors"
          title="Reset zoom"
        >
          1x
        </button>
      </div>

      {/* Minimap placeholder */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
        <div className="w-32 h-20 rounded-lg bg-gray-900/80 border border-gray-700 p-1.5 pointer-events-auto">
          <div className="w-full h-full relative rounded overflow-hidden bg-gray-800/50">
            {/* Mini room indicators */}
            <div className="absolute top-[5%] left-[3%] w-[45%] h-[43%] border border-blue-500/50 rounded-sm" />
            <div className="absolute top-[5%] left-[52%] w-[45%] h-[43%] border border-yellow-500/50 rounded-sm" />
            <div className="absolute top-[52%] left-[3%] w-[45%] h-[43%] border border-green-500/50 rounded-sm" />
            <div className="absolute top-[52%] left-[52%] w-[45%] h-[43%] border border-purple-500/50 rounded-sm" />
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 w-full h-full">
        <WorkspaceCanvas />
      </div>
    </div>
  );
}
