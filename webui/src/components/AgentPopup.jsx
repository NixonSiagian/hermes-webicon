import React from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';

const ROLE_BADGES = {
  engineer: { label: 'Engineer', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  researcher: { label: 'Researcher', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  ops: { label: 'Operations', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
};

const STATE_INFO = {
  idle: { label: 'Standing by', icon: 'pause' },
  walking: { label: 'Moving', icon: 'walk' },
  working: { label: 'Working on task', icon: 'code' },
  thinking: { label: 'Analyzing...', icon: 'brain' },
};

export default function AgentPopup() {
  const { selectedAgent, setSelectedAgent } = useWorkspaceStore();

  if (!selectedAgent) return null;

  const role = ROLE_BADGES[selectedAgent.role] || ROLE_BADGES.engineer;
  const stateInfo = STATE_INFO[selectedAgent.state] || STATE_INFO.idle;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => setSelectedAgent(null)}
    >
      <div
        className="agent-popup bg-hermes-panel border border-hermes-border rounded-2xl shadow-2xl shadow-black/50 w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-5 pb-4 bg-gradient-to-br from-gray-800/50 to-transparent">
          <button
            type="button"
            onClick={() => setSelectedAgent(null)}
            className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            x
          </button>

          <div className="flex items-center gap-4">
            {/* Large avatar */}
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
              {selectedAgent.name[0]}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-100">{selectedAgent.name}</h3>
              <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border ${role.color}`}>
                {role.label}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50">
            <span className="text-sm text-gray-400">Status</span>
            <span className="text-sm font-medium text-gray-200 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                selectedAgent.state === 'working' ? 'bg-green-400' :
                selectedAgent.state === 'thinking' ? 'bg-yellow-400' :
                selectedAgent.state === 'walking' ? 'bg-blue-400' : 'bg-gray-400'
              }`} />
              {stateInfo.label}
            </span>
          </div>

          {/* Room */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50">
            <span className="text-sm text-gray-400">Room</span>
            <span className="text-sm font-medium text-gray-200 capitalize">
              {selectedAgent.room}
            </span>
          </div>

          {/* Position */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50">
            <span className="text-sm text-gray-400">Position</span>
            <span className="text-xs font-mono text-gray-400">
              ({Math.round(selectedAgent.x)}, {Math.round(selectedAgent.y)})
            </span>
          </div>

          {/* Task */}
          {selectedAgent.task && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <span className="text-xs text-blue-400 font-medium">Current Task</span>
              <p className="text-sm text-gray-200 mt-1">{selectedAgent.task}</p>
            </div>
          )}

          {/* Actions (placeholder for future API integration) */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              onClick={() => {
                // Future: assign task via API
                setSelectedAgent(null);
              }}
            >
              Assign Task
            </button>
            <button
              type="button"
              className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
              onClick={() => setSelectedAgent(null)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
