import React, { useState } from 'react';

export default function SettingsPanel() {
  const [agentCount, setAgentCount] = useState(12);
  const [animSpeed, setAnimSpeed] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      <h2 className="text-lg font-bold text-gray-100 sticky top-0 bg-hermes-dark py-2 z-10">
        Settings
      </h2>

      {/* Simulation Settings */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Simulation
        </h3>

        <div className="p-4 rounded-xl bg-hermes-panel border border-hermes-border space-y-4">
          <div>
            <label className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Agent Count</span>
              <span className="text-sm font-mono text-gray-500">{agentCount}</span>
            </label>
            <input
              type="range"
              min="3"
              max="30"
              value={agentCount}
              onChange={(e) => setAgentCount(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Animation Speed</span>
              <span className="text-sm font-mono text-gray-500">{animSpeed}x</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.5"
              value={animSpeed}
              onChange={(e) => setAnimSpeed(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* Display Settings */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Display
        </h3>

        <div className="p-4 rounded-xl bg-hermes-panel border border-hermes-border space-y-3">
          <Toggle label="Show Agent Names" checked={showLabels} onChange={setShowLabels} />
          <Toggle label="Show Grid" checked={showGrid} onChange={setShowGrid} />
        </div>
      </section>

      {/* API Connection */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          API Connection
        </h3>

        <div className="p-4 rounded-xl bg-hermes-panel border border-hermes-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-300">Hermes Backend</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-500" />
              <span className="text-xs text-gray-500">Disconnected</span>
            </span>
          </div>
          <p className="text-xs text-gray-600">
            Connect to the Hermes API to enable real-time agent state sync,
            task assignment, and workspace collaboration.
          </p>
          <button
            type="button"
            className="mt-3 w-full px-3 py-2 rounded-lg text-xs font-semibold bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
          >
            Configure Connection
          </button>
        </div>
      </section>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-gray-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-700'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  );
}
