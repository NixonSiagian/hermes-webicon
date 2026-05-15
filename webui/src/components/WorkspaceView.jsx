import React, { useState, useEffect, useRef, useCallback } from 'react';
import WorkspaceCanvas, { fitWorld } from '../canvas/WorkspaceCanvas';
import { useWorkspaceStore } from '../store/workspaceStore';

/**
 * WorkspaceView
 *
 * ┌─────────────────────────────────────────────┐
 * │  TOP BAR  — sim stats + controls            │
 * ├─────────────────────────────────────────────┤
 * │                                             │
 * │  PixiJS canvas (fills remaining space)      │
 * │                                             │
 * │  [MINI-MAP]       [ZOOM BUTTONS]            │
 * └─────────────────────────────────────────────┘
 */
export default function WorkspaceView() {
  const {
    simulationRunning, toggleSimulation,
    simulationSpeed,   setSimulationSpeed,
    setFullscreen,
    zoom,
  } = useWorkspaceStore();

  const [stats, setStats] = useState({
    total: 0, working: 0, moving: 0, idle: 0, thinking: 0, inMeeting: 0,
  });

  // Poll agent states from store every 800ms (lightweight)
  useEffect(() => {
    const id = setInterval(() => {
      const ags = useWorkspaceStore.getState().agents;
      setStats({
        total:     ags.length,
        working:   ags.filter((a) => a.state === 'working').length,
        moving:    ags.filter((a) => a.state === 'moving').length,
        idle:      ags.filter((a) => a.state === 'idle').length,
        thinking:  ags.filter((a) => a.state === 'thinking').length,
        inMeeting: ags.filter((a) => a.currentJob?.room === 'meeting').length,
      });
    }, 800);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#050810' }}>

      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <TopBar
        stats={stats}
        simulationRunning={simulationRunning}
        toggleSimulation={toggleSimulation}
        simulationSpeed={simulationSpeed}
        setSimulationSpeed={setSimulationSpeed}
        setFullscreen={setFullscreen}
      />

      {/* ── CANVAS (fills all remaining height) ──────────────── */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <WorkspaceCanvas />

        {/* Zoom buttons (bottom-right) */}
        <ZoomControls zoom={zoom} />

        {/* Mini-map (bottom-left) */}
        <MiniMap stats={stats} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TOP BAR
// ─────────────────────────────────────────────────────────────────
function TopBar({ stats, simulationRunning, toggleSimulation, simulationSpeed, setSimulationSpeed, setFullscreen }) {
  return (
    <div style={{
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 12px',
      height: '44px',
      background: 'rgba(8,11,20,0.96)',
      borderBottom: '1px solid rgba(55,65,81,0.5)',
      backdropFilter: 'blur(8px)',
      gap: '8px',
      zIndex: 10,
    }}>

      {/* Left — brand + live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 6,
          background: 'linear-gradient(135deg,#3b82f6,#a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 11, color: '#fff',
        }}>H</div>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#e5e7eb', letterSpacing: '0.02em' }}>
          Hermes
        </span>
        <LivePulse running={simulationRunning} />
      </div>

      {/* Center — stat pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <StatPill label="Agents"   value={stats.total}    color="#94a3b8" />
        <StatPill label="Working"  value={stats.working}  color="#10b981" dot />
        <StatPill label="Moving"   value={stats.moving}   color="#3b82f6" dot />
        <StatPill label="Idle"     value={stats.idle}     color="#6b7280" dot />
        {stats.inMeeting > 0 && (
          <StatPill label="Meeting" value={stats.inMeeting} color="#a855f7" dot />
        )}
      </div>

      {/* Right — controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {/* Speed selector */}
        <div style={{ display: 'flex', gap: '3px' }}>
          {[0.5, 1, 2, 4].map((spd) => (
            <button
              key={spd}
              onClick={() => setSimulationSpeed(spd)}
              style={{
                padding: '2px 7px',
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: 700,
                background: simulationSpeed === spd ? '#2563eb' : 'rgba(55,65,81,0.7)',
                color:      simulationSpeed === spd ? '#fff'    : '#9ca3af',
                transition: 'background 0.15s',
              }}
            >
              {spd}×
            </button>
          ))}
        </div>

        {/* Play / Pause */}
        <button
          onClick={toggleSimulation}
          style={{
            padding: '3px 10px',
            borderRadius: 5,
            border: 'none',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 700,
            background: simulationRunning ? 'rgba(202,138,4,0.85)' : 'rgba(22,163,74,0.85)',
            color: '#fff',
            transition: 'background 0.15s',
          }}
        >
          {simulationRunning ? '⏸ Pause' : '▶ Play'}
        </button>

        {/* Fullscreen */}
        <button
          onClick={() => setFullscreen(true)}
          style={{
            padding: '3px 10px',
            borderRadius: 5,
            border: '1px solid rgba(75,85,99,0.6)',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 700,
            background: 'rgba(31,41,55,0.8)',
            color: '#d1d5db',
            transition: 'background 0.15s',
          }}
        >
          ⛶ Expand
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ZOOM CONTROLS
// ─────────────────────────────────────────────────────────────────
function ZoomControls({ zoom }) {
  // Access the world container via the store's zoom setter + direct canvas manipulation
  const applyZoomBtn = useCallback((factor) => {
    // Find the PixiJS world container via the global app reference
    // We emit a custom event that WorkspaceCanvas listens to
    window.dispatchEvent(new CustomEvent('hermes:zoom', { detail: { factor } }));
  }, []);

  const resetZoom = useCallback(() => {
    window.dispatchEvent(new CustomEvent('hermes:zoom:fit'));
  }, []);

  const pct = Math.round((zoom || 1) * 100);

  return (
    <div style={{
      position: 'absolute', bottom: 12, right: 12,
      display: 'flex', flexDirection: 'column', gap: 4,
      zIndex: 20,
    }}>
      <ZoomBtn onClick={() => applyZoomBtn(1.25)}>＋</ZoomBtn>
      <ZoomBtn onClick={() => applyZoomBtn(0.8)}>－</ZoomBtn>
      <ZoomBtn onClick={resetZoom} style={{ fontSize: 9 }}>{pct}%</ZoomBtn>
    </div>
  );
}

function ZoomBtn({ children, onClick, style = {} }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 32, height: 32,
        borderRadius: 7,
        border: '1px solid rgba(75,85,99,0.5)',
        background: 'rgba(17,24,39,0.85)',
        color: '#e5e7eb',
        fontSize: 16,
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(6px)',
        transition: 'background 0.1s',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
// MINI-MAP
// ─────────────────────────────────────────────────────────────────
const ROOM_COLORS = {
  engineering: '#3b82f6',
  research:    '#f59e0b',
  operations:  '#10b981',
  meeting:     '#a855f7',
  lounge:      '#ec4899',
  hallway:     '#6b7280',
};

// Room bounds as fractions of map (col/40, row/28, w/40, h/28)
const ROOM_FRACS = [
  { id: 'engineering', col: 1,  row: 1,  w: 14, h: 12 },
  { id: 'research',    col: 16, row: 1,  w: 14, h: 12 },
  { id: 'operations',  col: 1,  row: 14, w: 14, h: 12 },
  { id: 'meeting',     col: 16, row: 14, w: 10, h: 12 },
  { id: 'lounge',      col: 27, row: 14, w: 12, h: 12 },
  { id: 'hallway',     col: 31, row: 1,  w: 8,  h: 12 },
];
const COLS = 40, ROWS = 28;

function MiniMap({ stats }) {
  return (
    <div style={{
      position: 'absolute', bottom: 12, left: 12,
      width: 120, height: 78,
      borderRadius: 8,
      background: 'rgba(8,11,20,0.88)',
      border: '1px solid rgba(55,65,81,0.6)',
      overflow: 'hidden',
      zIndex: 20,
      backdropFilter: 'blur(6px)',
    }}>
      {/* Title */}
      <div style={{
        fontSize: 8, fontWeight: 700, color: '#6b7280',
        padding: '3px 5px 1px', letterSpacing: '0.05em', textTransform: 'uppercase',
      }}>
        Map
      </div>

      {/* Room rects */}
      <div style={{ position: 'relative', margin: '0 4px 4px', height: 60, background: '#050810', borderRadius: 4, overflow: 'hidden' }}>
        {ROOM_FRACS.map((r) => (
          <div
            key={r.id}
            title={r.id}
            style={{
              position: 'absolute',
              left:   `${(r.col  / COLS) * 100}%`,
              top:    `${(r.row  / ROWS) * 100}%`,
              width:  `${(r.w   / COLS) * 100}%`,
              height: `${(r.h   / ROWS) * 100}%`,
              background: ROOM_COLORS[r.id] || '#6b7280',
              opacity: 0.35,
              border: `1px solid ${ROOM_COLORS[r.id] || '#6b7280'}`,
              boxSizing: 'border-box',
              borderRadius: 1,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SMALL UTILITIES
// ─────────────────────────────────────────────────────────────────
function StatPill({ label, value, color, dot }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '2px 7px',
      borderRadius: 4,
      background: 'rgba(31,41,55,0.7)',
      border: '1px solid rgba(55,65,81,0.4)',
      fontSize: 10,
      fontWeight: 600,
      color,
      whiteSpace: 'nowrap',
    }}>
      {dot && (
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: color, display: 'inline-block', flexShrink: 0,
        }} />
      )}
      <span style={{ color: '#9ca3af', marginRight: 1 }}>{label}</span>
      <span style={{ color, fontWeight: 800 }}>{value}</span>
    </div>
  );
}

function LivePulse({ running }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: running ? '#22c55e' : '#ef4444',
        display: 'inline-block',
        animation: running ? 'pulse 1.5s ease-in-out infinite' : 'none',
      }} />
      <span style={{ fontSize: 9, fontWeight: 600, color: running ? '#4ade80' : '#f87171', letterSpacing: '0.08em' }}>
        {running ? 'LIVE' : 'PAUSED'}
      </span>
    </div>
  );
}
