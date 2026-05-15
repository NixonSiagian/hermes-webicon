/**
 * Movement System — DEPRECATED (kept for API compatibility)
 * 
 * Real movement logic is now in simulationEngine.js
 * This file re-exports the simulation update function.
 */
import { updateSimulation } from './simulationEngine';

/**
 * Update all agents for one frame
 * @param {Array} agents - mutable agent array
 * @param {Array} rooms - room definitions
 * @param {number} dt - delta time in seconds
 * @returns {Array} updated agents
 */
export function updateMovement(agents, rooms, dt) {
  return updateSimulation(agents, rooms, dt);
}
