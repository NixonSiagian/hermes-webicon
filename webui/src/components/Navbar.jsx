import React from 'react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'agents', label: 'Agents' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'settings', label: 'Settings' },
];

/**
 * Fixed top navbar. Always on top (z-index 100), always clickable.
 *
 * On narrow screens the link list collapses behind a hamburger; the
 * brand + hamburger always remain visible so the user can never get
 * "stuck" with no navigation, which was the core bug in the old layout.
 */
export default function Navbar({ active, onSelect, menuOpen, onToggleMenu }) {
  return (
    <header className="navbar" role="banner">
      <div className="navbar-inner">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">H</span>
          <span className="brand-text">Hermes Workspace</span>
        </div>

        <nav
          className={`nav-links${menuOpen ? ' is-open' : ''}`}
          aria-label="Primary"
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-link${active === item.id ? ' active' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="menu-toggle"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={onToggleMenu}
        >
          <span className="menu-toggle-bar" />
          <span className="menu-toggle-bar" />
          <span className="menu-toggle-bar" />
        </button>
      </div>
    </header>
  );
}
