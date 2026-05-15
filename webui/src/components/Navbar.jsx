import React, { useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';

const NAV_ITEMS = [
  { id: 'workspace', label: 'Workspace', icon: '2D' },
  { id: 'agents', label: 'Agents', icon: 'AG' },
  { id: 'tasks', label: 'Tasks', icon: 'TK' },
  { id: 'settings', label: 'Settings', icon: 'ST' },
];

export default function Navbar({ activeView, onViewChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isFullscreen, setFullscreen } = useWorkspaceStore();

  if (isFullscreen) return null;

  return (
    <header className="fixed top-0 left-0 w-full h-14 z-50 bg-hermes-dark border-b border-hermes-border shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white inline-flex items-center justify-center text-sm font-extrabold">
            H
          </span>
          <span className="text-sm font-bold text-gray-100 hidden sm:inline">
            Hermes Workspace
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 ml-4 flex-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onViewChange(item.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === item.id
                  ? 'bg-blue-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Enter workspace button */}
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400 transition-all shadow-md shadow-blue-900/30"
        >
          Enter Workspace
        </button>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden w-9 h-9 rounded-lg flex flex-col items-center justify-center gap-1 bg-gray-800"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className={`block w-4 h-0.5 bg-gray-200 rounded transition-transform ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
          <span className={`block w-4 h-0.5 bg-gray-200 rounded transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-4 h-0.5 bg-gray-200 rounded transition-transform ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <nav className="md:hidden absolute top-14 left-0 right-0 bg-hermes-dark border-b border-hermes-border shadow-xl shadow-black/50 p-2 z-50">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onViewChange(item.id);
                setMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeView === item.id
                  ? 'bg-blue-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
