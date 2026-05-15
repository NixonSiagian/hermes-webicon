import React, { useRef, useEffect, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { useWorkspaceStore, MAP_WIDTH, MAP_HEIGHT } from '../store/workspaceStore';
import { renderTileMap, renderRoomLabels } from '../systems/tileRenderer';
import { renderFurniture } from '../systems/furnitureRenderer';
import { updateSimulation } from '../systems/simulationEngine';
import { createAgentVisual, updateAgentVisual, destroyAgentVisual } from '../systems/agentSystem';

/**
 * WorkspaceCanvas — Fullscreen PixiJS 2D Agent Simulation
 *
 * Layer hierarchy:
 *   stage
 *     └── worldContainer  (camera target: pan + zoom)
 *           ├── mapLayer       (tilemap + room labels)
 *           ├── furnitureLayer (desks, chairs, etc.)
 *           ├── agentLayer     (characters, depth-sorted)
 *           └── debugLayer     (reserved for dev overlays)
 *
 * Fixes applied vs previous version:
 *  1. PIXI.Application uses explicit width/height from the wrapper div — NOT resizeTo
 *     (resizeTo was reading 0 because the canvas hadn't been appended yet).
 *  2. Canvas element is absolutely positioned and fills 100% of the wrapper.
 *  3. centerWorld() is called AFTER the canvas is in the DOM via requestAnimationFrame.
 *  4. ResizeObserver watches the wrapper div for precise size changes.
 *  5. Mobile: pinch-to-zoom on the canvas itself (not the window).
 *  6. Zoom buttons write directly to worldRef without going through React state.
 */
export default function WorkspaceCanvas() {
  const wrapperRef   = useRef(null); // outer div — size source of truth
  const appRef       = useRef(null);
  const worldRef     = useRef(null);
  const agentVisualsRef  = useRef({});
  const agentLayerRef    = useRef(null);
  const agentsLocalRef   = useRef([]);
  const lastTimeRef      = useRef(0);

  // Pan state
  const isPanning        = useRef(false);
  const lastPanPos       = useRef({ x: 0, y: 0 });
  const lastPinchDist    = useRef(0);

  const { tileMap, rooms, agents, setSelectedAgent } = useWorkspaceStore();

  // ─────────────────────────────────────────────────────────────
  // INIT PIXI
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!wrapperRef.current || appRef.current) return;

    const wrapper = wrapperRef.current;
    const W = wrapper.clientWidth  || window.innerWidth;
    const H = wrapper.clientHeight || window.innerHeight;

    // Create app with EXPLICIT size — avoids the resizeTo-before-DOM-append bug
    const app = new PIXI.Application({
      width:         W,
      height:        H,
      background:    0x050810,
      antialias:     false,
      resolution:    Math.min(window.devicePixelRatio || 1, 2),
      autoDensity:   true,
      powerPreference: 'high-performance',
    });

    // Style the canvas to fill wrapper absolutely
    const canvas = app.view;
    canvas.style.position = 'absolute';
    canvas.style.top      = '0';
    canvas.style.left     = '0';
    canvas.style.width    = '100%';
    canvas.style.height   = '100%';
    canvas.style.display  = 'block';
    wrapper.appendChild(canvas);
    appRef.current = app;

    // ── Build layer hierarchy ──────────────────────────────────
    const worldContainer = new PIXI.Container();
    worldContainer.sortableChildren = true;
    app.stage.addChild(worldContainer);
    worldRef.current = worldContainer;

    // Layer 1 — Tilemap (rendered once to RenderTexture)
    const mapLayer = new PIXI.Container();
    mapLayer.zIndex = 0;
    const tileMapSprite = renderTileMap(app, tileMap);
    mapLayer.addChild(tileMapSprite);
    const labelsContainer = renderRoomLabels(app);
    mapLayer.addChild(labelsContainer);
    worldContainer.addChild(mapLayer);

    // Layer 2 — Furniture (depth-sorted by Y)
    const furnitureLayer = renderFurniture(app);
    furnitureLayer.zIndex = 10;
    worldContainer.addChild(furnitureLayer);

    // Layer 3 — Agents (depth-sorted by Y)
    const agentLayer = new PIXI.Container();
    agentLayer.sortableChildren = true;
    agentLayer.zIndex = 20;
    worldContainer.addChild(agentLayer);
    agentLayerRef.current = agentLayer;

    // Layer 4 — Vignette / debug overlay
    const debugLayer = createVignette();
    debugLayer.zIndex = 200;
    worldContainer.addChild(debugLayer);

    // ── Spawn agent visuals ────────────────────────────────────
    const visuals = {};
    agents.forEach((agent) => {
      const visual = createAgentVisual(app, agent);
      visual.container.on('pointertap', () => setSelectedAgent(agent));
      agentLayer.addChild(visual.container);
      visuals[agent.id] = visual;
    });
    agentVisualsRef.current = visuals;
    agentsLocalRef.current = agents.map((a) => ({ ...a }));

    // ── Game loop ──────────────────────────────────────────────
    lastTimeRef.current = performance.now();

    app.ticker.add(() => {
      const now    = performance.now();
      const rawDt  = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      const { simulationRunning, simulationSpeed } = useWorkspaceStore.getState();
      if (!simulationRunning) return;

      const dt = rawDt * simulationSpeed;

      agentsLocalRef.current = updateSimulation(agentsLocalRef.current, rooms, dt);

      agentsLocalRef.current.forEach((agent) => {
        const visual = agentVisualsRef.current[agent.id];
        if (visual) updateAgentVisual(visual, agent, dt);
      });
    });

    // ── Auto-fit camera AFTER canvas is in DOM ─────────────────
    // Double-rAF ensures the browser has laid out the wrapper
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fitWorld(worldContainer, wrapper);
      });
    });

    // ── ResizeObserver for fluid responsiveness ────────────────
    const ro = new ResizeObserver(() => {
      if (!app.renderer) return;
      const nW = wrapper.clientWidth;
      const nH = wrapper.clientHeight;
      app.renderer.resize(nW, nH);
      fitWorld(worldContainer, wrapper);
    });
    ro.observe(wrapper);

    // ── Zoom button events from UI overlay ────────────────────
    const onZoomEvent = (e) => {
      const rect = wrapper.getBoundingClientRect();
      applyZoom(
        worldContainer,
        rect.width  / 2,
        rect.height / 2,
        e.detail.factor,
      );
    };
    const onZoomFit = () => fitWorld(worldContainer, wrapper);
    window.addEventListener('hermes:zoom',     onZoomEvent);
    window.addEventListener('hermes:zoom:fit', onZoomFit);

    return () => {
      ro.disconnect();
      window.removeEventListener('hermes:zoom',     onZoomEvent);
      window.removeEventListener('hermes:zoom:fit', onZoomFit);
      Object.values(agentVisualsRef.current).forEach(destroyAgentVisual);
      app.destroy(true, { children: true });
      appRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────
  // CAMERA — pan & pinch-to-zoom
  // ─────────────────────────────────────────────────────────────
  const getXY = (e) => {
    if (e.touches) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  };

  const handlePointerDown = useCallback((e) => {
    if (e.touches && e.touches.length === 2) return; // handled by touchmove
    isPanning.current = true;
    lastPanPos.current = getXY(e);
  }, []);

  const handlePointerMove = useCallback((e) => {
    const world = worldRef.current;
    if (!world) return;

    // Pinch-to-zoom (two fingers)
    if (e.touches && e.touches.length === 2) {
      const dx   = e.touches[0].clientX - e.touches[1].clientX;
      const dy   = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (lastPinchDist.current > 0) {
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const rect = wrapperRef.current.getBoundingClientRect();
        applyZoom(world, midX - rect.left, midY - rect.top, dist / lastPinchDist.current);
      }
      lastPinchDist.current = dist;
      return;
    }

    if (!isPanning.current) return;
    const pos = getXY(e);
    world.x += pos.x - lastPanPos.current.x;
    world.y += pos.y - lastPanPos.current.y;
    lastPanPos.current = pos;
  }, []);

  const handlePointerUp = useCallback(() => {
    isPanning.current     = false;
    lastPinchDist.current = 0;
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const world = worldRef.current;
    if (!world || !wrapperRef.current) return;
    const rect   = wrapperRef.current.getBoundingClientRect();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    applyZoom(world, e.clientX - rect.left, e.clientY - rect.top, factor);
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        width:    '100%',
        height:   '100%',
        overflow: 'hidden',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        background: '#050810',
      }}
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

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

/**
 * Fit and center the world container inside the wrapper.
 * Leaves a small inset (4%) so the map isn't edge-to-edge.
 */
export function fitWorld(world, wrapper) {
  if (!world || !wrapper) return;
  const cw = wrapper.clientWidth;
  const ch = wrapper.clientHeight;
  if (cw === 0 || ch === 0) return;

  const isMobile = cw < 768;
  const inset    = isMobile ? 0.98 : 0.94;
  const scale    = Math.min(cw / MAP_WIDTH, ch / MAP_HEIGHT) * inset;

  world.scale.set(scale);
  world.x = Math.round((cw - MAP_WIDTH  * scale) / 2);
  world.y = Math.round((ch - MAP_HEIGHT * scale) / 2);

  useWorkspaceStore.getState().setZoom(scale);
}

/**
 * Apply zoom centered on a screen point.
 */
function applyZoom(world, screenX, screenY, factor) {
  const MIN_ZOOM = 0.2;
  const MAX_ZOOM = 4.0;
  const current  = world.scale.x;
  const next     = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, current * factor));
  if (next === current) return;

  // Keep the screen point stationary
  const wX = (screenX - world.x) / current;
  const wY = (screenY - world.y) / current;
  world.scale.set(next);
  world.x = screenX - wX * next;
  world.y = screenY - wY * next;

  useWorkspaceStore.getState().setZoom(next);
}

/**
 * Thin ambient vignette around the map edges.
 */
function createVignette() {
  const g = new PIXI.Graphics();
  const alpha = 0.12;
  g.beginFill(0x000000, alpha);
  g.drawRect(0, 0, MAP_WIDTH, 24);
  g.drawRect(0, MAP_HEIGHT - 24, MAP_WIDTH, 24);
  g.drawRect(0, 0, 24, MAP_HEIGHT);
  g.drawRect(MAP_WIDTH - 24, 0, 24, MAP_HEIGHT);
  g.endFill();
  return g;
}
