import React, { useEffect, useRef, useCallback } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import WorkspaceCanvas from '../canvas/WorkspaceCanvas';

/**
 * FullscreenWorkspace — takes over the entire screen.
 * Uses the same WorkspaceCanvas but inside a fixed full-screen container.
 * Zoom buttons dispatch custom events so WorkspaceCanvas handles them.
 */
export default function FullscreenWorkspace() {
  const { isFullscreen, setFullscreen, zoom } = useWorkspaceStore();
  if (!isFullscreen) return null;

  const pct = Math.round((zoom || 1) * 100);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 150,
      display: 'flex', flexDirection: 'column',
      background: '#050810',
    }}>
      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)',
        pointerEvents: 'none',
      }}>
        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg,#3b82f6,#a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 12, color: '#fff',
          }}>H</div>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#e5e7eb' }}>Live Workspace</span>
          <span style={{ fontSize: 10, color: '#6b7280' }}>| drag to pan · scroll to zoom</span>
        </div>

        <button
          style={{ pointerEvents: 'auto', padding: '5px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: 'rgba(220,38,38,0.85)', color: '#fff' }}
          onClick={() => setFullscreen(false)}
        >
          ✕ Exit
        </button>
      </div>

      {/* ── Canvas (fills everything) ─────────────────────────── */}
      <div style={{ flex: 1, position: 'relative' }}>
        <WorkspaceCanvas />

        {/* Zoom controls */}
        <div style={{
          position: 'absolute', bottom: 16, right: 16,
          display: 'flex', flexDirection: 'column', gap: 4, zIndex: 20,
        }}>
          <FSZoomBtn onClick={() => window.dispatchEvent(new CustomEvent('hermes:zoom', { detail: { factor: 1.25 } }))}>＋</FSZoomBtn>
          <FSZoomBtn onClick={() => window.dispatchEvent(new CustomEvent('hermes:zoom', { detail: { factor: 0.8  } }))}>－</FSZoomBtn>
          <FSZoomBtn onClick={() => window.dispatchEvent(new CustomEvent('hermes:zoom:fit'))} style={{ fontSize: 9 }}>
            {pct}%
          </FSZoomBtn>
        </div>

        {/* Mini-map */}
        <MiniMapFS />
      </div>
    </div>
  );
}

function FSZoomBtn({ children, onClick, style = {} }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 36, height: 36, borderRadius: 8,
        border: '1px solid rgba(75,85,99,0.5)',
        background: 'rgba(17,24,39,0.85)',
        color: '#e5e7eb', fontSize: 18, fontWeight: 700,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(6px)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

const ROOM_FRACS = [
  { id: 'engineering', col: 1,  row: 1,  w: 14, h: 12, color: '#3b82f6' },
  { id: 'research',    col: 16, row: 1,  w: 14, h: 12, color: '#f59e0b' },
  { id: 'operations',  col: 1,  row: 14, w: 14, h: 12, color: '#10b981' },
  { id: 'meeting',     col: 16, row: 14, w: 10, h: 12, color: '#a855f7' },
  { id: 'lounge',      col: 27, row: 14, w: 12, h: 12, color: '#ec4899' },
  { id: 'hallway',     col: 31, row: 1,  w: 8,  h: 12, color: '#6b7280' },
];
const COLS = 40, ROWS = 28;

function MiniMapFS() {
  return (
    <div style={{
      position: 'absolute', bottom: 16, left: 16,
      width: 140, height: 90,
      borderRadius: 10,
      background: 'rgba(8,11,20,0.9)',
      border: '1px solid rgba(55,65,99,0.6)',
      overflow: 'hidden',
      zIndex: 20,
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', padding: '4px 6px 2px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Mini Map
      </div>
      <div style={{ position: 'relative', margin: '0 5px 5px', height: 70, background: '#050810', borderRadius: 5, overflow: 'hidden' }}>
        {ROOM_FRACS.map((r) => (
          <div
            key={r.id}
            style={{
              position: 'absolute',
              left:   `${(r.col / COLS) * 100}%`,
              top:    `${(r.row / ROWS) * 100}%`,
              width:  `${(r.w   / COLS) * 100}%`,
              height: `${(r.h   / ROWS) * 100}%`,
              background: r.color,
              opacity: 0.35,
              border: `1px solid ${r.color}`,
              boxSizing: 'border-box',
              borderRadius: 2,
            }}
          />
        ))}
      </div>
    </div>
  );
}
