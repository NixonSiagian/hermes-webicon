/**
 * Movement System — RimWorld-style Tile-Based
 * 
 * Handles autonomous agent movement within tile-based rooms.
 * Agents move between random positions inside their assigned room,
 * with smooth lerp interpolation and collision avoidance.
 * Positions are in pixel coordinates (tile * TILE_SIZE).
 */
import { TILE_SIZE, ROOMS } from '../store/workspaceStore';

const SPEED = 55; // pixels per second
const ARRIVAL_THRESHOLD = 6; // pixels
const IDLE_MIN = 2.5; // seconds
const IDLE_MAX = 6; // seconds
const COLLISION_RADIUS = 24; // pixels
const THINK_MIN = 3;
const THINK_MAX = 7;

/**
 * Linear interpolation
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Distance between two points
 */
function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Get pixel bounds for a room (with padding to keep agents inside walkable area)
 */
function getRoomWalkArea(roomId) {
  const room = ROOMS.find((r) => r.id === roomId);
  if (!room) return null;
  
  const { col, row, w, h } = room.bounds;
  const pad = 2; // tiles padding from walls
  
  return {
    minX: (col + pad) * TILE_SIZE,
    minY: (row + pad) * TILE_SIZE,
    maxX: (col + w - pad) * TILE_SIZE,
    maxY: (row + h - pad) * TILE_SIZE,
  };
}

/**
 * Get a random target position inside the agent's assigned room
 */
function getRandomTarget(agent) {
  const area = getRoomWalkArea(agent.room);
  if (!area) return { x: agent.x, y: agent.y };

  return {
    x: area.minX + Math.random() * (area.maxX - area.minX),
    y: area.minY + Math.random() * (area.maxY - area.minY),
  };
}

/**
 * Simple collision avoidance - nudge agents apart if overlapping
 */
function avoidCollisions(agents) {
  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      const a = agents[i];
      const b = agents[j];
      const d = dist(a.x, a.y, b.x, b.y);
      if (d < COLLISION_RADIUS && d > 0) {
        const overlap = (COLLISION_RADIUS - d) / 2;
        const dx = (b.x - a.x) / d;
        const dy = (b.y - a.y) / d;
        a.x -= dx * overlap * 0.4;
        a.y -= dy * overlap * 0.4;
        b.x += dx * overlap * 0.4;
        b.y += dy * overlap * 0.4;
      }
    }
  }
}

/**
 * Clamp agent position to room walkable area
 */
function clampToRoom(agent) {
  const area = getRoomWalkArea(agent.room);
  if (!area) return;

  agent.x = Math.max(area.minX, Math.min(area.maxX, agent.x));
  agent.y = Math.max(area.minY, Math.min(area.maxY, agent.y));
}

/**
 * Update all agents for one frame
 * @param {Array} agents - mutable agent array
 * @param {Array} rooms - room definitions (unused, kept for API compat)
 * @param {number} dt - delta time in seconds
 * @returns {Array} updated agents
 */
export function updateMovement(agents, rooms, dt) {
  const updated = agents.map((agent) => {
    const a = { ...agent };

    switch (a.state) {
      case 'idle': {
        a.idleTimer -= dt;
        if (a.idleTimer <= 0) {
          // Decide next action
          const rand = Math.random();
          if (rand < 0.6) {
            // Walk to new position
            const target = getRandomTarget(a);
            a.targetX = target.x;
            a.targetY = target.y;
            a.state = 'walking';
            if (target.x !== a.x) {
              a.direction = target.x > a.x ? 1 : -1;
            }
          } else if (rand < 0.85) {
            // Start thinking
            a.state = 'thinking';
            a.idleTimer = THINK_MIN + Math.random() * (THINK_MAX - THINK_MIN);
          } else {
            // Start working
            a.state = 'working';
            a.idleTimer = 4 + Math.random() * 8;
          }
        }
        break;
      }

      case 'walking': {
        const d = dist(a.x, a.y, a.targetX, a.targetY);
        if (d < ARRIVAL_THRESHOLD) {
          // Arrived
          const rand = Math.random();
          if (rand < 0.4) {
            a.state = 'working';
            a.idleTimer = 4 + Math.random() * 6;
          } else if (rand < 0.6) {
            a.state = 'thinking';
            a.idleTimer = THINK_MIN + Math.random() * (THINK_MAX - THINK_MIN);
          } else {
            a.state = 'idle';
            a.idleTimer = IDLE_MIN + Math.random() * (IDLE_MAX - IDLE_MIN);
          }
        } else {
          // Move toward target
          const moveSpeed = SPEED * dt;
          const t = Math.min(moveSpeed / d, 1);
          a.x = lerp(a.x, a.targetX, t);
          a.y = lerp(a.y, a.targetY, t);

          // Update facing direction
          if (Math.abs(a.targetX - a.x) > 2) {
            a.direction = a.targetX > a.x ? 1 : -1;
          }

          // Animate
          a.animFrame = (a.animFrame + dt * 8) % 4;
        }
        break;
      }

      case 'working': {
        a.idleTimer -= dt;
        if (a.idleTimer <= 0) {
          a.state = 'idle';
          a.idleTimer = IDLE_MIN + Math.random() * (IDLE_MAX - IDLE_MIN);
        }
        // Tiny shift while working (typing animation)
        if (Math.random() < 0.02) {
          a.x += (Math.random() - 0.5) * 1.5;
        }
        break;
      }

      case 'thinking': {
        a.idleTimer -= dt;
        if (a.idleTimer <= 0) {
          // After thinking, walk somewhere
          const target = getRandomTarget(a);
          a.targetX = target.x;
          a.targetY = target.y;
          a.state = 'walking';
          if (target.x !== a.x) {
            a.direction = target.x > a.x ? 1 : -1;
          }
        }
        break;
      }

      default:
        break;
    }

    return a;
  });

  // Apply collision avoidance
  avoidCollisions(updated);

  // Clamp all agents to their rooms
  updated.forEach((a) => clampToRoom(a));

  return updated;
}
