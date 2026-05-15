import React, { useRef, useEffect, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { useWorkspaceStore, MAP_WIDTH, MAP_HEIGHT } from '../store/workspaceStore';
import { renderTileMap, renderRoomLabels } from '../systems/tileRenderer';
import { renderFurniture } from '../systems/furnitureRenderer';
import { updateSimulation, getSimulationStats } from '../systems/simulationEngine';
import { createAgentVisual, updateAgentVisual, destroyAgentVisual } from '../systems/agentSystem';

/**
 * Main 2D Workspace Canvas — Real Agent Simulation
 * 
 * This is a LIVING simulation where agents:
 * - Pick jobs based on their role
 * - Move to the correct room
 * - Work at specific workstations
 * - Complete tasks and pick new ones
 * - Attend meetings, take breaks
 * 
 * NOT a static demo. Agents behave autonomously.
 */
export default function WorkspaceCanvas() {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const agentVisualsRef = useRef({});
  const worldRef = useRef(null);
  const agentLayerRef = useRef(null);
  const lastTimeRef = useRef(0);
  const agentsLocalRef = useRef([]);
  const statsCallbackRef = useRef(null);

  const { tileMap, rooms, agents, setSelectedAgent, simulationRunning, simulationSpeed } = useWorkspaceStore();

  // Initialize PixiJS application and render world
  useEffect(() => {
    if (!canvasRef.current || appRef.current) return;

    const app = new PIXI.Application({
      background: 0x050810,
      resizeTo: canvasRef.current,
      antialias: false,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    canvasRef.current.appendChild(app.view);
    appRef.current = app;

    // World container (camera target)
    const world = new PIXI.Container();
    world.sortableChildren = true;
    app.stage.addChild(world);
    worldRef.current = world;

    // === LAYER 1: Tilemap (floor + walls) ===
    const tileMapSprite = renderTileMap(app, tileMap);
    world.addChild(tileMapSprite);

    // === LAYER 2: Room labels ===
    const labelsContainer = renderRoomLabels(app);
    world.addChild(labelsContainer);

    // === LAYER 3: Furniture ===
    const furnitureContainer = renderFurniture(app);
    world.addChild(furnitureContainer);

    // === LAYER 4: Agents (depth-sorted) ===
    const agentLayer = new PIXI.Container();
    agentLayer.sortableChildren = true;
    agentLayer.zIndex = 50;
    world.addChild(agentLayer);
    agentLayerRef.current = agentLayer;

    // Create agent visuals
    const visuals = {};
    agents.forEach((agent) => {
      const visual = createAgentVisual(app, agent);
      visual.container.on('pointertap', () => {
        setSelectedAgent(agent);
      });
      agentLayer.addChild(visual.container);
      visuals[agent.id] = visual;
    });
    agentVisualsRef.current = visuals;

    // Initialize local agents copy for simulation
    agentsLocalRef.current = agents.map((a) => ({ ...a }));

    // === LAYER 5: Ambient overlay (vignette) ===
    const vignette = createVignette();
    vignette.zIndex = 200;
    world.addChild(vignette);

    // === GAME LOOP — The heart of the simulation ===
    lastTimeRef.current = performance.now();
    app.ticker.add(() => {
      const now = performance.now();
      const rawDt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      // Apply simulation speed
      const running = useWorkspaceStore.getState().simulationRunning;
      const speed = useWorkspaceStore.getState().simulationSpeed;
      if (!running) return;
      
      const dt = rawDt * speed;

      // === SIMULATION TICK ===
      agentsLocalRef.current = updateSimulation(agentsLocalRef.current, rooms, dt);

      // === UPDATE VISUALS ===
      agentsLocalRef.current.forEach((agent) => {
        const visual = agentVisualsRef.current[agent.id];
        if (visual) {
          updateAgentVisual(visual, agent, dt);
        }
      });

      // Update stats in store periodically (every ~30 frames)
      if (Math.random() < 0.033) {
        const stats = getSimulationStats(agentsLocalRef.current);
        if (statsCallbackRef.current) {
          statsCallbackRef.current(stats);
        }
      }
    });

    // === RESIZE HANDLER ===
    const handleResize = () => {
      if (app.renderer && canvasRef.current) {
        app.renderer.resize(
          canvasRef.current.clientWidth,
          canvasRef.current.clientHeight
        );
        centerWorld(world, canvasRef.current);
      }
    };

    window.addEventListener('resize', handleResize);
    setTimeout(() => centerWorld(world, canvasRef.current), 60);

    return () => {
      window.removeEventListener('resize', handleResize);
      Object.values(agentVisualsRef.current).forEach(destroyAgentVisual);
      app.destroy(true, { children: true });
      appRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync external state changes into local sim
  useEffect(() => {
    agents.forEach((storeAgent) => {
      const localAgent = agentsLocalRef.current.find((a) => a.id === storeAgent.id);
      if (localAgent && storeAgent.currentJob !== localAgent.currentJob) {
        localAgent.currentJob = storeAgent.currentJob;
        localAgent.state = storeAgent.state;
      }
    });
  }, [agents]);

  // === CAMERA CONTROLS ===
  const isPanning = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef(0);

  const handlePointerDown = useCallback((e) => {
    if (e.touches && e.touches.length === 2) return;
    isPanning.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    lastPanPos.current = { x: clientX, y: clientY };
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!isPanning.current || !worldRef.current) return;

    if (e.touches && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const pinchDist = Math.sqrt(dx * dx + dy * dy);

      if (lastPinchDist.current > 0) {
        const scale = pinchDist / lastPinchDist.current;
        const newZoom = Math.max(0.4, Math.min(3, worldRef.current.scale.x * scale));
        worldRef.current.scale.set(newZoom);
        useWorkspaceStore.getState().setZoom(newZoom);
      }
      lastPinchDist.current = pinchDist;
      return;
    }

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - lastPanPos.current.x;
    const dy = clientY - lastPanPos.current.y;
    lastPanPos.current = { x: clientX, y: clientY };

    worldRef.current.x += dx;
    worldRef.current.y += dy;
  }, []);

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
    lastPinchDist.current = 0;
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (!worldRef.current) return;

    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    const newZoom = Math.max(0.4, Math.min(3, worldRef.current.scale.x * delta));
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const worldPos = {
      x: (mouseX - worldRef.current.x) / worldRef.current.scale.x,
      y: (mouseY - worldRef.current.y) / worldRef.current.scale.y,
    };
    
    worldRef.current.scale.set(newZoom);
    worldRef.current.x = mouseX - worldPos.x * newZoom;
    worldRef.current.y = mouseY - worldPos.y * newZoom;
    
    useWorkspaceStore.getState().setZoom(newZoom);
  }, []);

  return (
    <div
      ref={canvasRef}
      className="canvas-container w-full h-full touch-none select-none"
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      onWheel={handleWheel}
    />
  );
}

/**
 * Center and fit the world in the viewport
 */
function centerWorld(world, container) {
  if (!container) return;
  const cw = container.clientWidth;
  const ch = container.clientHeight;

  const scaleX = cw / MAP_WIDTH;
  const scaleY = ch / MAP_HEIGHT;
  const scale = Math.min(scaleX, scaleY) * 0.92;

  world.scale.set(scale);
  world.x = (cw - MAP_WIDTH * scale) / 2;
  world.y = (ch - MAP_HEIGHT * scale) / 2;

  useWorkspaceStore.getState().setZoom(scale);
}

/**
 * Create ambient vignette overlay for atmosphere
 */
function createVignette() {
  const gradient = new PIXI.Graphics();
  gradient.beginFill(0x000000, 0.15);
  gradient.drawRect(0, 0, MAP_WIDTH, 20);
  gradient.drawRect(0, MAP_HEIGHT - 20, MAP_WIDTH, 20);
  gradient.drawRect(0, 0, 20, MAP_HEIGHT);
  gradient.drawRect(MAP_WIDTH - 20, 0, 20, MAP_HEIGHT);
  gradient.endFill();

  gradient.beginFill(0x000000, 0.08);
  gradient.drawRect(0, 0, MAP_WIDTH, 40);
  gradient.drawRect(0, MAP_HEIGHT - 40, MAP_WIDTH, 40);
  gradient.drawRect(0, 0, 40, MAP_HEIGHT);
  gradient.drawRect(MAP_WIDTH - 40, 0, 40, MAP_HEIGHT);
  gradient.endFill();

  return gradient;
}
