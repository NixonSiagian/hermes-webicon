/**
 * Simulation Engine — The Brain of the Agent System
 * 
 * This is the REAL simulation logic that makes agents behave intelligently.
 * Every tick, each agent evaluates their state and decides what to do next.
 * 
 * State Machine:
 * ┌──────┐    assign job    ┌────────┐   arrive   ┌─────────┐   done   ┌──────┐
 * │ IDLE │ ───────────────► │ MOVING │ ─────────► │ WORKING │ ───────► │ IDLE │
 * └──────┘                  └────────┘            └─────────┘          └──────┘
 *     │                                                                    ▲
 *     │         break/rest                                                 │
 *     └──────────────────────────────────────────────────────────────────────┘
 * 
 * Agents:
 * - Pick jobs based on their role (developer→coding, researcher→research, etc.)
 * - Move tile-by-tile to the correct room
 * - Find a workstation in that room
 * - Perform the job for a duration
 * - Complete the job and return to idle
 * - Occasionally take breaks, attend meetings, etc.
 */

import { JOBS, ROOMS, WORKSTATIONS, TILE_SIZE } from '../store/workspaceStore';

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const AGENT_SPEED = 70;           // pixels per second
const ARRIVAL_THRESHOLD = 8;      // pixels — close enough to target
const IDLE_DURATION_MIN = 1.5;    // seconds before picking new job
const IDLE_DURATION_MAX = 4.0;
const COLLISION_RADIUS = 20;      // minimum distance between agents

// Meeting system — sometimes trigger group meetings
const MEETING_CHANCE = 0.003;     // chance per tick to call a meeting
const MEETING_PARTICIPANTS = 3;   // min agents for a meeting

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function tileToPixel(col, row) {
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE / 2,
  };
}

function getRoomWalkArea(roomId) {
  const room = ROOMS.find((r) => r.id === roomId);
  if (!room) return null;
  const { col, row, w, h } = room.bounds;
  const pad = 2;
  return {
    minX: (col + pad) * TILE_SIZE,
    minY: (row + pad) * TILE_SIZE,
    maxX: (col + w - pad) * TILE_SIZE,
    maxY: (row + h - pad) * TILE_SIZE,
  };
}

function getRandomPosInRoom(roomId) {
  const area = getRoomWalkArea(roomId);
  if (!area) return { x: 200, y: 200 };
  return {
    x: area.minX + Math.random() * (area.maxX - area.minX),
    y: area.minY + Math.random() * (area.maxY - area.minY),
  };
}

function getWorkstationPosition(roomId, stationId) {
  const room = ROOMS.find((r) => r.id === roomId);
  const stations = WORKSTATIONS[roomId];
  if (!room || !stations) return getRandomPosInRoom(roomId);
  const station = stations.find((s) => s.id === stationId);
  if (!station) return getRandomPosInRoom(roomId);
  return tileToPixel(room.bounds.col + station.col, room.bounds.row + station.row);
}

function clampToRoom(agent) {
  const area = getRoomWalkArea(agent.currentRoom);
  if (!area) return;
  agent.x = Math.max(area.minX, Math.min(area.maxX, agent.x));
  agent.y = Math.max(area.minY, Math.min(area.maxY, agent.y));
}

// ═══════════════════════════════════════════════════════════════════
// JOB ASSIGNMENT LOGIC
// ═══════════════════════════════════════════════════════════════════

/**
 * Pick a job for an agent based on their role with weighted randomness
 */
function pickJobForAgent(agent) {
  const role = agent.role;
  const availableJobs = Object.values(JOBS).filter((j) => j.roles.includes(role));
  
  const homeRoom = agent.homeRoom;
  const weighted = availableJobs.map((job) => ({
    job,
    weight: job.room === homeRoom ? 5 :
            job.id.startsWith('break') ? 1.5 :
            job.id === 'meeting' || job.id === 'standup' ? 2 : 1,
  }));
  
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let rand = Math.random() * totalWeight;
  
  for (const { job, weight } of weighted) {
    rand -= weight;
    if (rand <= 0) return job;
  }
  return availableJobs[0];
}

/**
 * Find an available workstation in the target room
 */
function pickWorkstation(roomId, occupiedStations) {
  const stations = WORKSTATIONS[roomId];
  if (!stations || stations.length === 0) return null;
  
  const available = stations.filter((s) => !occupiedStations.has(s.id));
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  return stations[Math.floor(Math.random() * stations.length)];
}

// ═══════════════════════════════════════════════════════════════════
// STATE MACHINE — Each state handler
// ═══════════════════════════════════════════════════════════════════

/**
 * IDLE state: Agent waits briefly, then picks a new job
 */
function handleIdle(agent, dt, context) {
  agent.idleTimer -= dt;
  
  if (agent.idleTimer <= 0) {
    // Pick a new job
    const job = pickJobForAgent(agent);
    const targetRoom = job.room;
    
    // Find a workstation
    const station = pickWorkstation(targetRoom, context.occupiedStations);
    
    // Calculate target position
    let targetPos;
    if (station) {
      targetPos = getWorkstationPosition(targetRoom, station.id);
      context.occupiedStations.add(station.id);
      agent.workstation = station.id;
    } else {
      targetPos = getRandomPosInRoom(targetRoom);
      agent.workstation = null;
    }
    
    // Assign the job
    agent.currentJob = job;
    agent.targetRoom = targetRoom;
    agent.targetX = targetPos.x;
    agent.targetY = targetPos.y;
    agent.state = 'moving';
    agent.activity = `Going to ${ROOMS.find(r => r.id === targetRoom)?.label || targetRoom}`;
    agent.jobTimer = job.duration.min + Math.random() * (job.duration.max - job.duration.min);
    
    // Update direction
    if (agent.targetX !== agent.x) {
      agent.direction = agent.targetX > agent.x ? 1 : -1;
    }
  }
}

/**
 * MOVING state: Agent moves tile-by-tile toward target
 */
function handleMoving(agent, dt) {
  const d = dist(agent.x, agent.y, agent.targetX, agent.targetY);
  
  if (d < ARRIVAL_THRESHOLD) {
    // Arrived at destination
    agent.state = 'working';
    agent.currentRoom = agent.targetRoom || agent.currentRoom;
    agent.activity = agent.currentJob ? agent.currentJob.label : 'Working';
    
    // Snap to target
    agent.x = agent.targetX;
    agent.y = agent.targetY;
    return;
  }
  
  // Move toward target at constant speed
  const moveAmount = AGENT_SPEED * dt;
  const dx = agent.targetX - agent.x;
  const dy = agent.targetY - agent.y;
  const angle = Math.atan2(dy, dx);
  
  agent.x += Math.cos(angle) * moveAmount;
  agent.y += Math.sin(angle) * moveAmount;
  
  // Update facing direction
  if (Math.abs(dx) > 2) {
    agent.direction = dx > 0 ? 1 : -1;
  }
  
  // Animate walking
  agent.animFrame = (agent.animFrame + dt * 8) % 4;
  
  // Update current room based on position (for room transitions)
  const room = findRoomAtPosition(agent.x, agent.y);
  if (room) {
    agent.currentRoom = room.id;
  }
}

/**
 * WORKING state: Agent performs task at workstation
 */
function handleWorking(agent, dt, context) {
  agent.jobTimer -= dt;
  agent.totalWorkTime += dt;
  
  // Small fidget while working (typing/movement)
  if (Math.random() < 0.03) {
    agent.x += (Math.random() - 0.5) * 1.2;
    agent.y += (Math.random() - 0.5) * 0.5;
  }
  
  if (agent.jobTimer <= 0) {
    // Job complete!
    agent.jobsCompleted++;
    context.totalJobsCompleted++;
    
    // Release workstation
    if (agent.workstation) {
      context.occupiedStations.delete(agent.workstation);
      agent.workstation = null;
    }
    
    // Transition back to idle
    agent.state = 'idle';
    agent.currentJob = null;
    agent.targetRoom = null;
    agent.idleTimer = IDLE_DURATION_MIN + Math.random() * (IDLE_DURATION_MAX - IDLE_DURATION_MIN);
    agent.activity = 'Idle — planning next task';
  }
}

/**
 * THINKING state: Agent pauses to think (used for transitions)
 */
function handleThinking(agent, dt) {
  agent.idleTimer -= dt;
  if (agent.idleTimer <= 0) {
    agent.state = 'idle';
    agent.idleTimer = 0.5 + Math.random() * 1.5;
    agent.activity = 'Ready for next task';
  }
}

// ═══════════════════════════════════════════════════════════════════
// ROOM DETECTION
// ═══════════════════════════════════════════════════════════════════

function findRoomAtPosition(x, y) {
  for (const room of ROOMS) {
    const { col, row, w, h } = room.bounds;
    const rx = col * TILE_SIZE;
    const ry = row * TILE_SIZE;
    const rw = w * TILE_SIZE;
    const rh = h * TILE_SIZE;
    if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) {
      return room;
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// COLLISION AVOIDANCE
// ═══════════════════════════════════════════════════════════════════

function resolveCollisions(agents) {
  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      const a = agents[i];
      const b = agents[j];
      const d = dist(a.x, a.y, b.x, b.y);
      
      if (d < COLLISION_RADIUS && d > 0) {
        const overlap = (COLLISION_RADIUS - d) / 2;
        const dx = (b.x - a.x) / d;
        const dy = (b.y - a.y) / d;
        
        // Only nudge agents that aren't working at a station
        const aMovable = a.state !== 'working';
        const bMovable = b.state !== 'working';
        
        if (aMovable && bMovable) {
          a.x -= dx * overlap * 0.4;
          a.y -= dy * overlap * 0.4;
          b.x += dx * overlap * 0.4;
          b.y += dy * overlap * 0.4;
        } else if (aMovable) {
          a.x -= dx * overlap * 0.8;
          a.y -= dy * overlap * 0.8;
        } else if (bMovable) {
          b.x += dx * overlap * 0.8;
          b.y += dy * overlap * 0.8;
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// MEETING SYSTEM — Occasionally trigger group meetings
// ═══════════════════════════════════════════════════════════════════

function maybeCallMeeting(agents, context) {
  if (Math.random() > MEETING_CHANCE) return;
  
  // Only call meeting if no meeting is in progress
  const inMeeting = agents.filter((a) => a.currentJob?.id === 'meeting' || a.currentJob?.id === 'standup');
  if (inMeeting.length >= MEETING_PARTICIPANTS) return;
  
  // Find idle agents to pull into a meeting
  const idle = agents.filter((a) => a.state === 'idle');
  if (idle.length < MEETING_PARTICIPANTS) return;
  
  const meetingJob = Math.random() < 0.6 ? JOBS.meeting : JOBS.standup;
  const participants = idle.slice(0, MEETING_PARTICIPANTS + Math.floor(Math.random() * 3));
  
  participants.forEach((agent, i) => {
    const stations = WORKSTATIONS.meeting;
    const station = stations[i % stations.length];
    const room = ROOMS.find((r) => r.id === 'meeting');
    const targetPos = tileToPixel(room.bounds.col + station.col, room.bounds.row + station.row);
    
    agent.currentJob = meetingJob;
    agent.targetRoom = 'meeting';
    agent.targetX = targetPos.x;
    agent.targetY = targetPos.y;
    agent.state = 'moving';
    agent.workstation = station.id;
    agent.activity = `Going to ${meetingJob.label}`;
    agent.jobTimer = meetingJob.duration.min + Math.random() * (meetingJob.duration.max - meetingJob.duration.min);
    
    if (agent.targetX !== agent.x) {
      agent.direction = agent.targetX > agent.x ? 1 : -1;
    }
  });
}

// ═══════════════════════════════════════════════════════════════════
// MAIN SIMULATION TICK
// ═══════════════════════════════════════════════════════════════════

/**
 * Update all agents for one frame.
 * This is the main simulation function called every tick.
 * 
 * @param {Array} agents - mutable agent array
 * @param {Array} rooms - room definitions 
 * @param {number} dt - delta time in seconds
 * @returns {Array} updated agents
 */
export function updateSimulation(agents, rooms, dt) {
  // Build context (shared state for this tick)
  const occupiedStations = new Set(
    agents.filter((a) => a.workstation && a.state === 'working').map((a) => a.workstation)
  );
  
  const context = {
    occupiedStations,
    totalJobsCompleted: 0,
  };
  
  // Maybe trigger a meeting
  maybeCallMeeting(agents, context);
  
  // Update each agent's state machine
  const updated = agents.map((agent) => {
    const a = { ...agent };
    
    switch (a.state) {
      case 'idle':
        handleIdle(a, dt, context);
        break;
      case 'moving':
        handleMoving(a, dt);
        break;
      case 'working':
        handleWorking(a, dt, context);
        break;
      case 'thinking':
        handleThinking(a, dt);
        break;
      default:
        a.state = 'idle';
        a.idleTimer = 1;
        break;
    }
    
    return a;
  });
  
  // Resolve collisions
  resolveCollisions(updated);
  
  // Clamp agents to their current room boundaries
  updated.forEach((a) => clampToRoom(a));
  
  return updated;
}

/**
 * Get simulation statistics
 */
export function getSimulationStats(agents) {
  const working = agents.filter((a) => a.state === 'working').length;
  const moving = agents.filter((a) => a.state === 'moving').length;
  const idle = agents.filter((a) => a.state === 'idle').length;
  const thinking = agents.filter((a) => a.state === 'thinking').length;
  
  const inMeeting = agents.filter((a) => a.currentJob?.id === 'meeting' || a.currentJob?.id === 'standup').length;
  const totalCompleted = agents.reduce((sum, a) => sum + a.jobsCompleted, 0);
  
  return { working, moving, idle, thinking, inMeeting, totalCompleted, total: agents.length };
}
