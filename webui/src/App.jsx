import React, { useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Workspace from './components/Workspace.jsx';

/**
 * Top-level shell.
 *
 * Layout invariant (matches spec):
 *   .navbar     -> position: fixed, top: 0, height: 60px, z-index: 100
 *   .workspace  -> position: absolute, top: 60px, height: calc(100vh - 60px)
 *
 * The navbar therefore always wins z-index and is always clickable;
 * the workspace fills everything below it on every screen size.
 */
export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState('overview');

  return (
    <div className="app">
      <Navbar
        active={activeView}
        onSelect={(view) => {
          setActiveView(view);
          setMenuOpen(false);
        }}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((v) => !v)}
      />
      <Workspace />
    </div>
  );
}
