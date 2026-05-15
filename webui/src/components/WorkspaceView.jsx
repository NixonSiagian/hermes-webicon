import React from 'react';
import WorkspaceCanvas from '../canvas/WorkspaceCanvas';
import { useWorkspaceStore } from '../store/workspaceStore';

/**
 * RimWorld-style 2D Office Workspace View
 * Fullscreen game-like canvas with minimal chrome
 */
export default function WorkspaceView() {
  const { setFullscreen } = useWorkspaceStore();

  return (
    <div className="h-full flex flex-col bg-[#050810]">
      {/* Minimal toolbar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-1.5 border-b border-gray-800/50 bg-[#080b14]/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-gray-200 tracking-wide uppercase">
              Office Map
            </span>
          </div>
          <span className="text-[10px] text-gray-500 hidden sm:inline font-mono">
            Drag: pan • Scroll: zoom • Click: select agent
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AgentCounter />
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="px-2.5 py-1 rounded text-[10px] font-bold bg-gray-800/80 hover:bg-gray-700 text-gray-300 border border-gray-700/50 transition-colors uppercase tracking-wider"
          >
            Expand
          </button>
        </div>
      </div>

      {/* Canvas (fills remaining space) */}
      <div className="flex-1 min-h-0">
        <WorkspaceCanvas />
      </div>
    </div>
  );
}

/**
 * Small agent activity counter
 */
function AgentCounter() {
  const agents = useWorkspaceStore((s) => s.agents);
  const working = agents.filter((a) => a.state === 'working').length;
  const walking = agents.filter((a) => a.state === 'walking').length;

  return (
    <div className="flex items-center gap-2 text-[10px] font-mono">
      <span className="text-green-400">{working} working</span>
      <span className="text-gray-600">•</span>
      <span className="text-blue-400">{walking} moving</span>
      <span className="text-gray-600">•</span>
      <span className="text-gray-400">{agents.length} total</span>
    </div>
  );
}
