import React from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';

const SAMPLE_TASKS = [
  { id: 't1', title: 'Implement auth flow', assignee: 'eng-1', priority: 'high', status: 'in-progress' },
  { id: 't2', title: 'Research LLM integration', assignee: 'res-1', priority: 'high', status: 'in-progress' },
  { id: 't3', title: 'Deploy v2.1 hotfix', assignee: 'ops-1', priority: 'critical', status: 'pending' },
  { id: 't4', title: 'Write unit tests for API', assignee: 'eng-2', priority: 'medium', status: 'pending' },
  { id: 't5', title: 'Optimize database queries', assignee: 'eng-3', priority: 'medium', status: 'queued' },
  { id: 't6', title: 'Security audit review', assignee: 'ops-2', priority: 'high', status: 'queued' },
];

const PRIORITY_COLORS = {
  critical: 'bg-red-500/20 text-red-300 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  medium: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  low: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

const STATUS_COLORS = {
  'in-progress': 'bg-green-400',
  pending: 'bg-yellow-400',
  queued: 'bg-gray-400',
  done: 'bg-blue-400',
};

export default function TasksPanel() {
  const { agents } = useWorkspaceStore();

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between sticky top-0 bg-hermes-dark py-2 z-10">
        <h2 className="text-lg font-bold text-gray-100">
          Task Queue
          <span className="ml-2 text-xs font-normal text-gray-500">
            ({SAMPLE_TASKS.length} tasks)
          </span>
        </h2>
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          + New Task
        </button>
      </div>

      <div className="space-y-2">
        {SAMPLE_TASKS.map((task) => {
          const agent = agents.find((a) => a.id === task.assignee);
          return (
            <div
              key={task.id}
              className="p-4 rounded-xl bg-hermes-panel border border-hermes-border hover:border-hermes-accent/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-gray-100 truncate">
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority}
                    </span>
                    {agent && (
                      <span className="text-xs text-gray-500">
                        Assigned: {agent.name}
                      </span>
                    )}
                  </div>
                </div>
                <span className="flex items-center gap-1.5 shrink-0">
                  <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[task.status]}`} />
                  <span className="text-xs text-gray-500 capitalize">
                    {task.status.replace('-', ' ')}
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-600 text-center pt-4">
        Connect Hermes API to enable real-time task assignment
      </p>
    </div>
  );
}
