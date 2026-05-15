/**
 * Movement System
 * Handles autonomous agent movement with lerp interpolation,
 * idle delays, target selection, and collision avoidance.
 */

const SPEED = 60; // pixels per second
const ARRIVAL_THRESHOLD = 5; // pixels
const IDLE_MIN = 2; // seconds
const IDLE_MAX = 5; // seconds
const COLLISION_RADIUS = 30; // pixels

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
 * Get a random target position inside the agent's assigned room
 */
function getRandomTarget(agent, rooms) {
  const room = rooms.find((r) => r.id === agent.room);
  if (!room) return { x: agent.x, y: agent.y };

  const pad = 50;
  return {
    x: room.bounds.x + pad + Math.random() * (room.bounds.width - pad * 2),
    y: room.bounds.y + pad + Math.random() * (room.bounds.height - pad * 2),
  };
}

/**
 * Simple collision avoidance - push agents apart if too close
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
        a.x -= dx * overlap * 0.5;
        a.y -= dy * overlap * 0.5;
        b.x += dx * overlap * 0.5;
        b.y += dy * overlap * 0.5;
      }
    }
  }
}

/**
 * Clamp agent position to room bounds
 */
function clampToRoom(agent, rooms) {
  const room = rooms.find((r) => r.id === agent.room);
  if (!room) return;

  const pad = 30;
  agent.x = Math.max(room.bounds.x + pad, Math.min(room.bounds.x + room.bounds.width - pad, agent.x));
  agent.y = Math.max(room.bounds.y + pad, Math.min(room.bounds.y + room.bounds.height - pad, agent.y));
}

/**
 * Update all agents for one frame
 * @param {Array} agents - mutable agent array
 * @param {Array} rooms - room definitions
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
          // Pick new target and start walking
          const target = getRandomTarget(a, rooms);
          a.targetX = target.x;
          a.targetY = target.y;
          a.state = 'walking';
          // Set direction based on target
          if (target.x !== a.x) {
            a.direction = target.x > a.x ? 1 : -1;
          }
        }
        break;
      }

      case 'walking': {
        const d = dist(a.x, a.y, a.targetX, a.targetY);
        if (d < ARRIVAL_THRESHOLD) {
          // Arrived at target
          a.state = Math.random() < 0.3 ? 'thinking' : 'idle';
          a.idleTimer = IDLE_MIN + Math.random() * (IDLE_MAX - IDLE_MIN);
          a.velocity = { x: 0, y: 0 };
        } else {
          // Move toward target with lerp
          const moveSpeed = SPEED * dt;
          const t = Math.min(moveSpeed / d, 1);
          a.x = lerp(a.x, a.targetX, t);
          a.y = lerp(a.y, a.targetY, t);

          // Update direction
          if (Math.abs(a.targetX - a.x) > 1) {
            a.direction = a.targetX > a.x ? 1 : -1;
          }

          // Animate walking
          a.animFrame = (a.animFrame + dt * 8) % 4;
        }
        break;
      }

      case 'working': {
        // Stay in place, occasionally shift slightly
        a.idleTimer -= dt;
        if (a.idleTimer <= 0) {
          a.idleTimer = 3 + Math.random() * 4;
          // Small shift while working
          a.x += (Math.random() - 0.5) * 4;
          a.y += (Math.random() - 0.5) * 4;
        }
        break;
      }

      case 'thinking': {
        a.idleTimer -= dt;
        if (a.idleTimer <= 0) {
          a.state = 'idle';
          a.idleTimer = IDLE_MIN + Math.random() * (IDLE_MAX - IDLE_MIN);
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
  updated.forEach((a) => clampToRoom(a, rooms));

  return updated;
}
