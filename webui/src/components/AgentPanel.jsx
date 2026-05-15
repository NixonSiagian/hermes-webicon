import React from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';

const STATE_COLORS = {
  idle: 'bg-gray-500',
  walking: 'bg-blue-400',
  working: 'bg-green-400',
  thinking: 'bg-yellow-400',
};

const STATE_LABELS = {
  idle: 'Idle',
  walking: 'Walking',
  working: 'Working',
  thinking: 'Thinking',
};

const ROLE_COLORS = {
  engineer: 'text-blue-400',
  researcher: 'text-yellow-400',
  ops: 'text-green-400',
};

export default function AgentPanel() {
  const { agents, setSelectedAgent } = useWorkspaceStore();

  return (
    <div className="h-full overflow-y-auto p-4 space-y-3">
      <h2 className="text-lg font-bold text-gray-100 sticky top-0 bg-hermes-dark py-2 z-10">
        Active Agents
        <span className="ml-2 text-xs font-normal text-gray-500">
          ({agents.length} total)
        </span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {agents.map((agent) => (
          <button
            key={agent.id}
            type="button"
            onClick={() => setSelectedAgent(agent)}
            className="flex items-center gap-3 p-3 rounded-xl bg-hermes-panel border border-hermes-border hover:border-hermes-accent/50 transition-all text-left group"
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-lg font-bold text-gray-300 shrink-0 group-hover:scale-105 transition-transform">
              {agent.name[0]}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-gray-100 truncate">
                {agent.name}
              </div>
              <div className={`text-xs ${ROLE_COLORS[agent.role] || 'text-gray-400'} capitalize`}>
                {agent.role}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`w-2 h-2 rounded-full ${STATE_COLORS[agent.state]} ${agent.state === 'working' ? 'status-pulse' : ''}`} />
              <span className="text-xs text-gray-500">
                {STATE_LABELS[agent.state]}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
