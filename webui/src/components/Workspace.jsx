import React, { useEffect, useState } from 'react';
import Room from './Room.jsx';
import Agent from './Agent.jsx';

// ── Floor plan ─────────────────────────────────────────────────────────────
// All coordinates are percentages of the workspace canvas, so the entire
// floor plan stays inside the viewport on any screen size (no overflow,
// no horizontal scrollbars, no zoom required on mobile).
const ROOMS = [
  {
    id: 'engineering',
    label: 'Engineering',
    bounds: { top: 4, left: 3, width: 44, height: 44 },
    furniture: [
      { type: 'desk', top: 18, left: 12, width: 30, height: 14 },
      { type: 'chair', top: 38, left: 22 },
      { type: 'desk', top: 18, left: 56, width: 30, height: 14 },
      { type: 'chair', top: 38, left: 66 },
      { type: 'desk', top: 64, left: 32, width: 30, height: 14 },
      { type: 'chair', top: 84, left: 42 },
    ],
  },
  {
    id: 'research',
    label: 'Research',
    bounds: { top: 4, left: 53, width: 44, height: 44 },
    furniture: [
      { type: 'desk', top: 22, left: 14, width: 26, height: 14 },
      { type: 'chair', top: 42, left: 22 },
      { type: 'desk', top: 22, left: 58, width: 26, height: 14 },
      { type: 'chair', top: 42, left: 66 },
      { type: 'table', top: 62, left: 30, width: 38, height: 18 },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    bounds: { top: 52, left: 3, width: 44, height: 44 },
    furniture: [
      { type: 'desk', top: 18, left: 12, width: 30, height: 14 },
      { type: 'chair', top: 38, left: 22 },
      { type: 'desk', top: 18, left: 56, width: 30, height: 14 },
      { type: 'chair', top: 38, left: 66 },
      { type: 'desk', top: 64, left: 32, width: 30, height: 14 },
    ],
  },
  {
    id: 'meeting',
    label: 'Meeting',
    bounds: { top: 52, left: 53, width: 44, height: 44 },
    furniture: [
      { type: 'table', top: 36, left: 18, width: 64, height: 26 },
      { type: 'chair', top: 18, left: 30 },
      { type: 'chair', top: 18, left: 60 },
      { type: 'chair', top: 70, left: 30 },
      { type: 'chair', top: 70, left: 60 },
    ],
  },
  {
    id: 'lounge',
    label: 'Lounge',
    bounds: { top: 38, left: 38, width: 24, height: 24 },
    furniture: [
      { type: 'sofa', top: 30, left: 18, width: 64, height: 18 },
      { type: 'table', top: 56, left: 35, width: 30, height: 14 },
    ],
  },
];

const ROOMS_BY_ID = Object.fromEntries(ROOMS.map((r) => [r.id, r]));

const INITIAL_AGENTS = [
  { id: 'eng-1', name: 'Dev 1', role: 'engineering', room: 'engineering' },
  { id: 'eng-2', name: 'Dev 2', role: 'engineering', room: 'engineering' },
  { id: 'res-1', name: 'Researcher', role: 'research', room: 'research' },
  { id: 'res-2', name: 'Analyst', role: 'research', room: 'research' },
  { id: 'ops-1', name: 'DevOps', role: 'operations', room: 'operations' },
  { id: 'ops-2', name: 'Sec', role: 'operations', room: 'operations' },
  { id: 'mgr-1', name: 'Coord', role: 'meeting', room: 'meeting' },
];

// Pick a random point inside a room, in workspace-percent coordinates.
// We pad inwards so the sprite never overlaps the room walls or label.
function pointInRoom(roomId) {
  const r = ROOMS_BY_ID[roomId];
  if (!r) return { x: 50, y: 50 };
  const padX = 4;
  const padTop = 8; // extra room at the top so we don't sit on the label
  const padBottom = 4;
  const minX = r.bounds.left + padX;
  const maxX = r.bounds.left + r.bounds.width - padX;
  const minY = r.bounds.top + padTop;
  const maxY = r.bounds.top + r.bounds.height - padBottom;
  return {
    x: minX + Math.random() * (maxX - minX),
    y: minY + Math.random() * (maxY - minY),
  };
}

function seedAgents(defs) {
  return defs.map((a) => {
    const p = pointInRoom(a.room);
    return { ...a, x: p.x, y: p.y };
  });
}

/**
 * The 2D simulation surface. Renders the floor (rooms + furniture) and the
 * agent sprites on top of it. A simple tick mutates agent positions; the
 * .agent CSS transition handles the smooth movement.
 */
export default function Workspace() {
  const [agents, setAgents] = useState(() => seedAgents(INITIAL_AGENTS));

  useEffect(() => {
    const ROOM_IDS = ROOMS.map((r) => r.id);
    const tick = () => {
      setAgents((prev) =>
        prev.map((a) => {
          // 30% chance to wander to a different room, otherwise just shuffle
          // within the current one. Keeps the scene lively without chaos.
          const nextRoom =
            Math.random() < 0.3
              ? ROOM_IDS[Math.floor(Math.random() * ROOM_IDS.length)]
              : a.room;
          const p = pointInRoom(nextRoom);
          return { ...a, room: nextRoom, x: p.x, y: p.y };
        }),
      );
    };
    const id = setInterval(tick, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="workspace" aria-label="Hermes 2D Workspace">
      <div className="workspace-floor">
        {ROOMS.map((room) => (
          <Room key={room.id} {...room} />
        ))}
        {agents.map((a) => (
          <Agent key={a.id} role={a.role} name={a.name} x={a.x} y={a.y} />
        ))}
      </div>
    </main>
  );
}
