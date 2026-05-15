import React, { useState, useEffect } from 'react';
import WorkspaceCanvas from '../canvas/WorkspaceCanvas';
import { useWorkspaceStore } from '../store/workspaceStore';
import { getSimulationStats } from '../systems/simulationEngine';

/**
 * Workspace View — Real-time simulation dashboard
 * Shows live stats of the agent simulation
 */
export default function WorkspaceView() {
  const { setFullscreen, agents, simulationRunning, toggleSimulation, simulationSpeed, setSimulationSpeed } = useWorkspaceStore();
  const [stats, setStats] = useState({ working: 0, moving: 0, idle: 0, thinking: 0, inMeeting: 0, totalCompleted: 0, total: 0 });

  // Poll stats from store agents
  useEffect(() => {
    const interval = setInterval(() => {
      const currentAgents = useWorkspaceStore.getState().agents;
      // Use a lightweight stat calculation from the local state
      const working = currentAgents.filter((a) => a.state === 'working').length;
      const moving = currentAgents.filter((a) => a.state === 'moving').length;
      const idle = currentAgents.filter((a) => a.state === 'idle').length;
      const total = currentAgents.length;
      setStats({ working, moving, idle, thinking: 0, inMeeting: 0, totalCompleted: 0, total });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#050810]">
      {/* Simulation toolbar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-1.5 border-b border-gray-800/50 bg-[#080b14]/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${simulationRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs font-bold text-gray-200 tracking-wide uppercase">
              Agent Simulation
            </span>
          </div>
          <span className="text-[10px] text-gray-500 hidden sm:inline font-mono">
            {simulationRunning ? 'LIVE' : 'PAUSED'} • {stats.total} agents
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Live stats */}
          <SimStats stats={stats} />
          
          {/* Speed control */}
          <div className="hidden sm:flex items-center gap-1">
            {[0.5, 1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimulationSpeed(spd)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${
                  simulationSpeed === spd
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Play/Pause */}
          <button
            type="button"
            onClick={toggleSimulation}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
              simulationRunning
                ? 'bg-yellow-600/80 hover:bg-yellow-500 text-white'
                : 'bg-green-600/80 hover:bg-green-500 text-white'
            }`}
          >
            {simulationRunning ? '⏸ Pause' : '▶ Play'}
          </button>

          {/* Fullscreen */}
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
 * Live simulation statistics
 */
function SimStats({ stats }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-mono">
      <span className="text-green-400" title="Working">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-0.5" />
        {stats.working}
      </span>
      <span className="text-blue-400" title="Moving">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mr-0.5" />
        {stats.moving}
      </span>
      <span className="text-gray-400" title="Idle">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 mr-0.5" />
        {stats.idle}
      </span>
    </div>
  );
}
