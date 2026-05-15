import React, { useRef, useEffect, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { useWorkspaceStore } from '../store/workspaceStore';
import { updateMovement } from '../systems/movementSystem';
import { createAgentVisual, updateAgentVisual, destroyAgentVisual } from '../systems/agentSystem';

/**
 * Main PixiJS Canvas Component
 * Renders the 2D workspace simulation with rooms, agents, and interactive elements.
 */
export default function WorkspaceCanvas() {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const agentVisualsRef = useRef({});
  const worldRef = useRef(null);
  const lastTimeRef = useRef(0);
  const agentsLocalRef = useRef([]);

  const { rooms, agents, isFullscreen, setSelectedAgent, zoom, panOffset } = useWorkspaceStore();

  // Initialize PixiJS
  useEffect(() => {
    if (!canvasRef.current || appRef.current) return;

    const app = new PIXI.Application({
      background: 0x080b14,
      resizeTo: canvasRef.current,
      antialias: false,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    canvasRef.current.appendChild(app.view);
    appRef.current = app;

    // World container (for zoom/pan)
    const world = new PIXI.Container();
    world.sortableChildren = true;
    app.stage.addChild(world);
    worldRef.current = world;

    // Draw grid background
    drawGrid(world, app);

    // Draw rooms
    drawRooms(world, rooms);

    // Create agent visuals
    const visuals = {};
    agents.forEach((agent) => {
      const visual = createAgentVisual(app, agent);
      visual.container.on('pointertap', () => {
        setSelectedAgent(agent);
      });
      world.addChild(visual.container);
      visuals[agent.id] = visual;
    });
    agentVisualsRef.current = visuals;

    // Initialize local agents copy for the simulation
    agentsLocalRef.current = agents.map((a) => ({ ...a }));

    // Main game loop
    lastTimeRef.current = performance.now();
    app.ticker.add(() => {
      const now = performance.now();
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      // Update movement
      agentsLocalRef.current = updateMovement(agentsLocalRef.current, rooms, dt);

      // Update visuals
      agentsLocalRef.current.forEach((agent) => {
        const visual = agentVisualsRef.current[agent.id];
        if (visual) {
          updateAgentVisual(visual, agent, dt);
        }
      });
    });

    // Handle resize
    const handleResize = () => {
      if (app.renderer) {
        app.renderer.resize(
          canvasRef.current.clientWidth,
          canvasRef.current.clientHeight
        );
        centerWorld(world, canvasRef.current);
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial center
    setTimeout(() => centerWorld(world, canvasRef.current), 50);

    return () => {
      window.removeEventListener('resize', handleResize);
      Object.values(agentVisualsRef.current).forEach(destroyAgentVisual);
      app.destroy(true, { children: true });
      appRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync store agents to local state (for external updates like API)
  useEffect(() => {
    agents.forEach((storeAgent) => {
      const localAgent = agentsLocalRef.current.find((a) => a.id === storeAgent.id);
      if (localAgent && storeAgent.task !== localAgent.task) {
        localAgent.task = storeAgent.task;
        localAgent.state = storeAgent.state;
      }
    });
  }, [agents]);

  // Zoom/pan updates
  useEffect(() => {
    if (worldRef.current) {
      worldRef.current.scale.set(zoom);
    }
  }, [zoom]);

  // Touch/mouse interaction for pan and zoom
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
      // Pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const pinchDist = Math.sqrt(dx * dx + dy * dy);

      if (lastPinchDist.current > 0) {
        const scale = pinchDist / lastPinchDist.current;
        const newZoom = Math.max(0.5, Math.min(3, worldRef.current.scale.x * scale));
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
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(3, worldRef.current.scale.x * delta));
    worldRef.current.scale.set(newZoom);
    useWorkspaceStore.getState().setZoom(newZoom);
  }, []);

  return (
    <div
      ref={canvasRef}
      className="canvas-container w-full h-full touch-none"
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
 * Center the world container in the viewport
 */
function centerWorld(world, container) {
  if (!container) return;
  const cw = container.clientWidth;
  const ch = container.clientHeight;
  const worldWidth = 930;
  const worldHeight = 650;

  const scaleX = cw / worldWidth;
  const scaleY = ch / worldHeight;
  const scale = Math.min(scaleX, scaleY) * 0.95;

  world.scale.set(scale);
  world.x = (cw - worldWidth * scale) / 2;
  world.y = (ch - worldHeight * scale) / 2;

  useWorkspaceStore.getState().setZoom(scale);
}

/**
 * Draw the background grid
 */
function drawGrid(world, app) {
  const grid = new PIXI.Graphics();
  grid.zIndex = -10;

  // Dark background
  grid.beginFill(0x080b14);
  grid.drawRect(0, 0, 930, 650);
  grid.endFill();

  // Grid lines
  grid.lineStyle(1, 0xffffff, 0.03);
  for (let x = 0; x <= 930; x += 40) {
    grid.moveTo(x, 0);
    grid.lineTo(x, 650);
  }
  for (let y = 0; y <= 650; y += 40) {
    grid.moveTo(0, y);
    grid.lineTo(930, y);
  }

  world.addChild(grid);
}

/**
 * Draw room boundaries and labels
 */
function drawRooms(world, rooms) {
  rooms.forEach((room) => {
    const { x, y, width, height } = room.bounds;

    // Room background
    const bg = new PIXI.Graphics();
    bg.beginFill(room.bgColor, 0.6);
    bg.drawRoundedRect(x, y, width, height, 10);
    bg.endFill();

    // Border
    bg.lineStyle(3, room.color, 0.8);
    bg.drawRoundedRect(x, y, width, height, 10);

    // Inner glow
    bg.lineStyle(1, room.color, 0.2);
    bg.drawRoundedRect(x + 4, y + 4, width - 8, height - 8, 8);

    bg.zIndex = -5;
    world.addChild(bg);

    // Room label
    const label = new PIXI.Text(room.label, {
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: 13,
      fontWeight: '700',
      fill: 0xf3f4f6,
      letterSpacing: 0.5,
    });
    label.x = x + 12;
    label.y = y + 10;
    label.zIndex = -4;

    // Label background
    const labelBg = new PIXI.Graphics();
    labelBg.beginFill(0x0b0f1a, 0.75);
    labelBg.drawRoundedRect(x + 8, y + 6, label.width + 12, label.height + 6, 5);
    labelBg.endFill();
    labelBg.zIndex = -4;
    world.addChild(labelBg);
    world.addChild(label);

    // Draw furniture
    drawFurniture(world, room);
  });
}

/**
 * Draw furniture inside rooms
 */
function drawFurniture(world, room) {
  const { x, y, width, height } = room.bounds;

  const furnitureItems = getFurnitureForRoom(room.id);
  furnitureItems.forEach((item) => {
    const g = new PIXI.Graphics();
    g.zIndex = -3;

    const fx = x + item.x;
    const fy = y + item.y;

    switch (item.type) {
      case 'desk':
        g.beginFill(0x6b4f2c);
        g.lineStyle(1, 0x8a6a3f);
        g.drawRoundedRect(fx, fy, item.w || 60, item.h || 30, 3);
        g.endFill();
        // Monitor on desk
        g.beginFill(0x1e293b);
        g.drawRoundedRect(fx + 10, fy + 2, 20, 16, 2);
        g.endFill();
        g.beginFill(0x334155);
        g.drawRect(fx + 12, fy + 4, 16, 12);
        g.endFill();
        break;
      case 'chair':
        g.beginFill(0x4b5563);
        g.lineStyle(1, 0x6b7280);
        g.drawCircle(fx, fy, 10);
        g.endFill();
        break;
      case 'table':
        g.beginFill(0x374151);
        g.lineStyle(1, 0x4b5563);
        g.drawRoundedRect(fx, fy, item.w || 80, item.h || 50, 6);
        g.endFill();
        break;
      case 'server':
        g.beginFill(0x1f2937);
        g.lineStyle(1, 0x374151);
        g.drawRoundedRect(fx, fy, 25, 40, 3);
        g.endFill();
        // LED lights
        g.beginFill(0x10b981);
        g.drawCircle(fx + 6, fy + 10, 2);
        g.drawCircle(fx + 6, fy + 18, 2);
        g.drawCircle(fx + 6, fy + 26, 2);
        g.endFill();
        break;
      case 'whiteboard':
        g.beginFill(0xf8fafc);
        g.lineStyle(2, 0x94a3b8);
        g.drawRect(fx, fy, item.w || 70, item.h || 10);
        g.endFill();
        break;
    }

    world.addChild(g);
  });
}

/**
 * Get furniture layout for each room
 */
function getFurnitureForRoom(roomId) {
  switch (roomId) {
    case 'engineering':
      return [
        { type: 'desk', x: 40, y: 60, w: 70, h: 30 },
        { type: 'desk', x: 40, y: 130, w: 70, h: 30 },
        { type: 'desk', x: 40, y: 200, w: 70, h: 30 },
        { type: 'desk', x: 200, y: 60, w: 70, h: 30 },
        { type: 'desk', x: 200, y: 130, w: 70, h: 30 },
        { type: 'desk', x: 200, y: 200, w: 70, h: 30 },
        { type: 'chair', x: 75, y: 110 },
        { type: 'chair', x: 75, y: 180 },
        { type: 'chair', x: 235, y: 110 },
        { type: 'chair', x: 235, y: 180 },
        { type: 'whiteboard', x: 310, y: 50, w: 80, h: 8 },
      ];
    case 'research':
      return [
        { type: 'desk', x: 40, y: 70, w: 80, h: 30 },
        { type: 'desk', x: 40, y: 150, w: 80, h: 30 },
        { type: 'desk', x: 250, y: 70, w: 80, h: 30 },
        { type: 'desk', x: 250, y: 150, w: 80, h: 30 },
        { type: 'table', x: 140, y: 200, w: 120, h: 50 },
        { type: 'whiteboard', x: 160, y: 50, w: 100, h: 8 },
        { type: 'chair', x: 80, y: 120 },
        { type: 'chair', x: 290, y: 120 },
      ];
    case 'operations':
      return [
        { type: 'desk', x: 40, y: 60, w: 70, h: 30 },
        { type: 'desk', x: 40, y: 140, w: 70, h: 30 },
        { type: 'desk', x: 200, y: 60, w: 70, h: 30 },
        { type: 'desk', x: 200, y: 140, w: 70, h: 30 },
        { type: 'server', x: 340, y: 60 },
        { type: 'server', x: 370, y: 60 },
        { type: 'server', x: 340, y: 160 },
        { type: 'chair', x: 75, y: 110 },
        { type: 'chair', x: 235, y: 110 },
        { type: 'chair', x: 75, y: 190 },
      ];
    case 'meeting':
      return [
        { type: 'table', x: 140, y: 100, w: 140, h: 80 },
        { type: 'chair', x: 170, y: 80 },
        { type: 'chair', x: 230, y: 80 },
        { type: 'chair', x: 170, y: 200 },
        { type: 'chair', x: 230, y: 200 },
        { type: 'chair', x: 120, y: 140 },
        { type: 'chair', x: 300, y: 140 },
        { type: 'whiteboard', x: 120, y: 40, w: 180, h: 10 },
      ];
    default:
      return [];
  }
}
