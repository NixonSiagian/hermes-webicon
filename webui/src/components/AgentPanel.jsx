import React from 'react';
import { useWorkspaceStore, ROOMS } from '../store/workspaceStore';

const ROLE_COLORS = {
  developer: 'text-blue-400',
  engineer: 'text-blue-400',
  researcher: 'text-yellow-400',
  ops: 'text-green-400',
  manager: 'text-purple-400',
};

const STATE_DOTS = {
  idle: 'bg-gray-400',
  moving: 'bg-blue-400 animate-pulse',
  working: 'bg-green-400',
  thinking: 'bg-yellow-400 animate-pulse',
};

/**
 * Agent Panel — Real-time agent roster with live status
 */
export default function AgentPanel() {
  const { agents, setSelectedAgent } = useWorkspaceStore();

  // Group agents by current room
  const byRoom = {};
  agents.forEach((agent) => {
    const room = agent.currentRoom || agent.homeRoom;
    if (!byRoom[room]) byRoom[room] = [];
    byRoom[room].push(agent);
  });

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Agent Roster</h2>
        <span className="text-xs text-gray-500 font-mono">{agents.length} agents</span>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <StatCard label="Working" count={agents.filter(a => a.state === 'working').length} color="text-green-400" />
        <StatCard label="Moving" count={agents.filter(a => a.state === 'moving').length} color="text-blue-400" />
        <StatCard label="Idle" count={agents.filter(a => a.state === 'idle').length} color="text-gray-400" />
        <StatCard label="Thinking" count={agents.filter(a => a.state === 'thinking').length} color="text-yellow-400" />
      </div>

      {/* Agents grouped by room */}
      {ROOMS.map((room) => {
        const roomAgents = byRoom[room.id];
        if (!roomAgents || roomAgents.length === 0) return null;
        
        return (
          <div key={room.id} className="rounded-xl bg-gray-800/40 border border-gray-700/30 overflow-hidden">
            <div className="px-3 py-2 bg-gray-800/60 border-b border-gray-700/30 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `#${room.color.toString(16).padStart(6, '0')}` }} />
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{room.label}</span>
              <span className="text-[10px] text-gray-500 ml-auto">{roomAgents.length}</span>
            </div>
            <div className="divide-y divide-gray-700/20">
              {roomAgents.map((agent) => (
                <AgentRow key={agent.id} agent={agent} onClick={() => setSelectedAgent(agent)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AgentRow({ agent, onClick }) {
  const roleColor = ROLE_COLORS[agent.role] || 'text-gray-400';
  const stateDot = STATE_DOTS[agent.state] || STATE_DOTS.idle;
  
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-700/30 transition-colors text-left"
    >
      {/* Status dot */}
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${stateDot}`} />
      
      {/* Name & role */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-200 truncate">{agent.name}</div>
        <div className={`text-[10px] ${roleColor} capitalize`}>{agent.role}</div>
      </div>
      
      {/* Activity */}
      <div className="text-right flex-shrink-0">
        <div className="text-[10px] text-gray-400 truncate max-w-[120px]">
          {agent.currentJob ? agent.currentJob.label : agent.activity || 'Idle'}
        </div>
        <div className="text-[9px] text-gray-600 capitalize">{agent.state}</div>
      </div>
    </button>
  );
}

function StatCard({ label, count, color }) {
  return (
    <div className="p-2 rounded-lg bg-gray-800/50 text-center">
      <div className={`text-base font-bold ${color}`}>{count}</div>
      <div className="text-[9px] text-gray-500 uppercase">{label}</div>
    </div>
  );
}
