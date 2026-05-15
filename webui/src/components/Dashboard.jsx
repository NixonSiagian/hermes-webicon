import React from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function Dashboard() {
  const { agents, rooms } = useWorkspaceStore();

  const stats = {
    total: agents.length,
    working: agents.filter((a) => a.state === 'working').length,
    thinking: agents.filter((a) => a.state === 'thinking').length,
    idle: agents.filter((a) => a.state === 'idle').length,
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Agents" value={stats.total} color="blue" />
        <StatCard label="Working" value={stats.working} color="green" />
        <StatCard label="Thinking" value={stats.thinking} color="yellow" />
        <StatCard label="Idle" value={stats.idle} color="gray" />
      </div>

      {/* Rooms Overview */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Active Rooms
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rooms.map((room) => {
            const roomAgents = agents.filter((a) => a.room === room.id);
            return (
              <div
                key={room.id}
                className="p-4 rounded-xl bg-hermes-panel border border-hermes-border"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `#${room.color.toString(16).padStart(6, '0')}` }}
                  />
                  <span className="text-sm font-semibold text-gray-100">
                    {room.label}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {roomAgents.length} agents active
                </div>
                <div className="mt-2 flex gap-1 flex-wrap">
                  {roomAgents.map((a) => (
                    <span
                      key={a.id}
                      className="px-2 py-0.5 text-xs bg-gray-800 text-gray-300 rounded-full"
                    >
                      {a.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          System Status
        </h3>
        <div className="space-y-2">
          <ActivityItem
            time="Now"
            text="Workspace simulation running"
            type="success"
          />
          <ActivityItem
            time="Ready"
            text="API integration prepared (connect backend to activate)"
            type="info"
          />
          <ActivityItem
            time="Active"
            text={`${agents.length} agents autonomous in ${rooms.length} rooms`}
            type="info"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colorMap = {
    blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-400',
    green: 'from-green-500/10 to-green-500/5 border-green-500/20 text-green-400',
    yellow: 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/20 text-yellow-400',
    gray: 'from-gray-500/10 to-gray-500/5 border-gray-500/20 text-gray-400',
  };

  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br border ${colorMap[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function ActivityItem({ time, text, type }) {
  const dot = {
    success: 'bg-green-400',
    info: 'bg-blue-400',
    warning: 'bg-yellow-400',
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-hermes-panel/50">
      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dot[type]}`} />
      <div className="min-w-0 flex-1">
        <span className="text-sm text-gray-300">{text}</span>
      </div>
      <span className="text-xs text-gray-600 shrink-0">{time}</span>
    </div>
  );
}
