import React from 'react';
import { useWorkspaceStore, ROOMS } from '../store/workspaceStore';

const ROLE_BADGES = {
  developer: { label: 'Developer', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  engineer: { label: 'Engineer', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  researcher: { label: 'Researcher', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  ops: { label: 'Operations', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  manager: { label: 'Manager', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
};

const STATE_INFO = {
  idle: { label: 'Planning next task', dotColor: 'bg-gray-400' },
  moving: { label: 'Moving to destination', dotColor: 'bg-blue-400' },
  working: { label: 'Working', dotColor: 'bg-green-400' },
  thinking: { label: 'Thinking...', dotColor: 'bg-yellow-400' },
};

export default function AgentPopup() {
  const { selectedAgent, setSelectedAgent } = useWorkspaceStore();

  if (!selectedAgent) return null;

  const role = ROLE_BADGES[selectedAgent.role] || ROLE_BADGES.developer;
  const stateInfo = STATE_INFO[selectedAgent.state] || STATE_INFO.idle;
  const currentRoomObj = ROOMS.find((r) => r.id === selectedAgent.currentRoom);

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
        <div className="px-5 pb-5 space-y-3">
          {/* Status */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50">
            <span className="text-sm text-gray-400">Status</span>
            <span className="text-sm font-medium text-gray-200 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${stateInfo.dotColor}`} />
              {stateInfo.label}
            </span>
          </div>

          {/* Current Job */}
          {selectedAgent.currentJob && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <span className="text-xs text-blue-400 font-medium">Current Job</span>
              <p className="text-sm text-gray-200 mt-1 font-semibold">{selectedAgent.currentJob.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                in {ROOMS.find((r) => r.id === selectedAgent.currentJob.room)?.label || selectedAgent.currentJob.room}
              </p>
            </div>
          )}

          {/* Activity */}
          {selectedAgent.activity && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50">
              <span className="text-sm text-gray-400">Activity</span>
              <span className="text-xs font-mono text-cyan-300">
                {selectedAgent.activity}
              </span>
            </div>
          )}

          {/* Room */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50">
            <span className="text-sm text-gray-400">Location</span>
            <span className="text-sm font-medium text-gray-200">
              {currentRoomObj?.label || selectedAgent.currentRoom}
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-gray-800/50 text-center">
              <div className="text-lg font-bold text-green-400">{selectedAgent.jobsCompleted || 0}</div>
              <div className="text-[10px] text-gray-500 uppercase">Jobs Done</div>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-800/50 text-center">
              <div className="text-lg font-bold text-blue-400">{Math.round(selectedAgent.totalWorkTime || 0)}s</div>
              <div className="text-[10px] text-gray-500 uppercase">Work Time</div>
            </div>
          </div>

          {/* Position */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50">
            <span className="text-sm text-gray-400">Position</span>
            <span className="text-xs font-mono text-gray-500">
              ({Math.round(selectedAgent.x)}, {Math.round(selectedAgent.y)})
            </span>
          </div>

          {/* Close button */}
          <div className="flex gap-2 pt-2">
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
