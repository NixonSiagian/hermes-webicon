/**
 * Hermes 2D Workspace - PixiJS Tile-Based Implementation
 *
 * A complete 2D office workspace rendered with real sprite assets:
 * - Floor tiles (floor.png) filling the entire grid
 * - Wall sprites (wall.png) forming room boundaries
 * - Furniture sprites (desk.png, chair.png, table.png, sofa.png)
 * - Agent character sprites (agent.png) with smooth movement
 * - Layered rendering: floor → room tint → walls → furniture → agents → labels
 * - Responsive fullscreen canvas with camera centering
 *
 * Style: RimWorld / Dwarf Fortress inspired top-down 2D office
 */

(function () {
    'use strict';

    // ─── CONFIGURATION ───────────────────────────────────────────────────────────

    const TILE_SIZE = 32;
    const GRID_COLS = 40;
    const GRID_ROWS = 30;
    const WORLD_WIDTH = GRID_COLS * TILE_SIZE;
    const WORLD_HEIGHT = GRID_ROWS * TILE_SIZE;
    const ASSETS_PATH = 'assets/';

    // ─── ROOM DEFINITIONS ────────────────────────────────────────────────────────

    const ROOMS = {
        engineering: {
            name: 'Engineering',
            x: 1, y: 1,
            width: 14, height: 12,
            tint: 0x1a2235
        },
        research: {
            name: 'Research',
            x: 16, y: 1,
            width: 12, height: 12,
            tint: 0x1a1f35
        },
        operations: {
            name: 'Operations',
            x: 29, y: 1,
            width: 10, height: 12,
            tint: 0x1f2a1a
        },
        meeting: {
            name: 'Meeting Room',
            x: 1, y: 14,
            width: 10, height: 10,
            tint: 0x2a1a2a
        },
        lounge: {
            name: 'Lounge',
            x: 12, y: 14,
            width: 16, height: 10,
            tint: 0x1a2a2a
        },
        corridor: {
            name: 'Hallway',
            x: 29, y: 14,
            width: 10, height: 10,
            tint: 0x1a1a22
        }
    };

    // ─── FURNITURE DEFINITIONS ───────────────────────────────────────────────────

    const FURNITURE = [
        // Engineering room - desks and chairs (6 workstations)
        { type: 'desk', x: 3, y: 3 },
        { type: 'chair', x: 3, y: 5 },
        { type: 'desk', x: 6, y: 3 },
        { type: 'chair', x: 6, y: 5 },
        { type: 'desk', x: 9, y: 3 },
        { type: 'chair', x: 9, y: 5 },
        { type: 'desk', x: 3, y: 8 },
        { type: 'chair', x: 3, y: 10 },
        { type: 'desk', x: 6, y: 8 },
        { type: 'chair', x: 6, y: 10 },
        { type: 'desk', x: 9, y: 8 },
        { type: 'chair', x: 9, y: 10 },
        { type: 'desk', x: 12, y: 5 },
        { type: 'chair', x: 12, y: 7 },

        // Research room - desks and tables
        { type: 'desk', x: 18, y: 3 },
        { type: 'chair', x: 18, y: 5 },
        { type: 'desk', x: 21, y: 3 },
        { type: 'chair', x: 21, y: 5 },
        { type: 'desk', x: 24, y: 3 },
        { type: 'chair', x: 24, y: 5 },
        { type: 'table', x: 19, y: 8 },
        { type: 'chair', x: 18, y: 9 },
        { type: 'chair', x: 21, y: 9 },
        { type: 'desk', x: 24, y: 8 },
        { type: 'chair', x: 24, y: 10 },

        // Operations room
        { type: 'desk', x: 31, y: 3 },
        { type: 'chair', x: 31, y: 5 },
        { type: 'desk', x: 34, y: 3 },
        { type: 'chair', x: 34, y: 5 },
        { type: 'desk', x: 31, y: 8 },
        { type: 'chair', x: 31, y: 10 },
        { type: 'desk', x: 34, y: 8 },
        { type: 'chair', x: 34, y: 10 },

        // Meeting room - large table with chairs
        { type: 'table', x: 4, y: 17 },
        { type: 'table', x: 6, y: 17 },
        { type: 'chair', x: 3, y: 16 },
        { type: 'chair', x: 5, y: 16 },
        { type: 'chair', x: 7, y: 16 },
        { type: 'chair', x: 3, y: 19 },
        { type: 'chair', x: 5, y: 19 },
        { type: 'chair', x: 7, y: 19 },
        { type: 'chair', x: 9, y: 17 },

        // Lounge - sofas and coffee tables
        { type: 'sofa', x: 14, y: 16 },
        { type: 'sofa', x: 14, y: 20 },
        { type: 'table', x: 14, y: 18 },
        { type: 'sofa', x: 19, y: 16 },
        { type: 'sofa', x: 19, y: 20 },
        { type: 'table', x: 19, y: 18 },
        { type: 'sofa', x: 24, y: 17 },
        { type: 'table', x: 24, y: 19 },
        { type: 'chair', x: 25, y: 21 },

        // Corridor / break area
        { type: 'table', x: 32, y: 17 },
        { type: 'chair', x: 31, y: 17 },
        { type: 'chair', x: 34, y: 17 },
        { type: 'sofa', x: 31, y: 21 },
    ];

    // ─── AGENT DEFINITIONS ───────────────────────────────────────────────────────

    const AGENTS_CONFIG = [
        { name: 'Alpha', x: 4, y: 4, room: 'engineering', tint: 0x00e5cc },
        { name: 'Beta', x: 7, y: 4, room: 'engineering', tint: 0x00ccff },
        { name: 'Gamma', x: 10, y: 9, room: 'engineering', tint: 0x66ffcc },
        { name: 'Delta', x: 19, y: 4, room: 'research', tint: 0xff9944 },
        { name: 'Epsilon', x: 22, y: 4, room: 'research', tint: 0xffcc00 },
        { name: 'Zeta', x: 32, y: 4, room: 'operations', tint: 0x44ff88 },
        { name: 'Eta', x: 35, y: 9, room: 'operations', tint: 0x88ffaa },
        { name: 'Theta', x: 5, y: 18, room: 'meeting', tint: 0xff66aa },
        { name: 'Iota', x: 15, y: 17, room: 'lounge', tint: 0xaa66ff },
        { name: 'Kappa', x: 20, y: 19, room: 'lounge', tint: 0xff6666 },
        { name: 'Lambda', x: 33, y: 18, room: 'corridor', tint: 0x66ccff },
        { name: 'Mu', x: 25, y: 9, room: 'research', tint: 0xccff66 },
    ];

    // ─── PIXI APPLICATION ────────────────────────────────────────────────────────

    const app = new PIXI.Application({
        resizeTo: window,
        backgroundColor: 0x0b0f1a,
        antialias: false,  // pixel-art: keep crisp
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
    });

    document.getElementById('workspace-container').appendChild(app.view);

    // ─── LAYER CONTAINERS (z-order) ──────────────────────────────────────────────

    const floorLayer = new PIXI.Container();
    const roomTintLayer = new PIXI.Container();
    const wallLayer = new PIXI.Container();
    const furnitureLayer = new PIXI.Container();
    const agentLayer = new PIXI.Container();
    const labelLayer = new PIXI.Container();

    // World container for camera/pan
    const worldContainer = new PIXI.Container();
    worldContainer.addChild(floorLayer);
    worldContainer.addChild(roomTintLayer);
    worldContainer.addChild(wallLayer);
    worldContainer.addChild(furnitureLayer);
    worldContainer.addChild(agentLayer);
    worldContainer.addChild(labelLayer);

    app.stage.addChild(worldContainer);

    // Center the world in viewport
    function centerWorld() {
        const offsetX = (app.screen.width - WORLD_WIDTH) / 2;
        const offsetY = (app.screen.height - WORLD_HEIGHT) / 2;
        worldContainer.x = Math.max(0, offsetX);
        worldContainer.y = Math.max(0, offsetY);
    }
    centerWorld();
    window.addEventListener('resize', centerWorld);

    // ─── ASSET LOADING ───────────────────────────────────────────────────────────

    const assetManifest = [
        { alias: 'floor', src: ASSETS_PATH + 'floor.png' },
        { alias: 'wall', src: ASSETS_PATH + 'wall.png' },
        { alias: 'desk', src: ASSETS_PATH + 'desk.png' },
        { alias: 'chair', src: ASSETS_PATH + 'chair.png' },
        { alias: 'table', src: ASSETS_PATH + 'table.png' },
        { alias: 'sofa', src: ASSETS_PATH + 'sofa.png' },
        { alias: 'agent', src: ASSETS_PATH + 'agent.png' },
    ];

    // Load all assets then initialize the world
    PIXI.Assets.load(assetManifest.map(a => ({ alias: a.alias, src: a.src })))
        .then(textures => {
            // Set pixel-art scaling mode (no blurring)
            Object.values(textures).forEach(tex => {
                if (tex && tex.baseTexture) {
                    tex.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
                }
            });
            initWorld(textures);
        })
        .catch(err => {
            console.error('[Hermes Workspace] Asset loading failed, using fallback:', err);
            // Fallback: generate textures programmatically
            initWorldFallback();
        });

    // ─── WORLD INITIALIZATION (sprite-based) ─────────────────────────────────────

    function initWorld(tex) {
        renderFloor(tex.floor);
        renderRoomTints();
        renderWalls(tex.wall);
        renderRoomLabels();
        renderFurniture(tex);
        createAgents(tex.agent);
        startAnimation();
        updateHUD();
        console.log('[Hermes Workspace] Tile-based world initialized with sprite assets');
    }

    // ─── FLOOR TILE RENDERING ────────────────────────────────────────────────────

    function renderFloor(floorTex) {
        for (let row = 0; row < GRID_ROWS; row++) {
            for (let col = 0; col < GRID_COLS; col++) {
                const tile = new PIXI.Sprite(floorTex);
                tile.x = col * TILE_SIZE;
                tile.y = row * TILE_SIZE;
                tile.width = TILE_SIZE;
                tile.height = TILE_SIZE;
                floorLayer.addChild(tile);
            }
        }
    }

    // ─── ROOM TINT OVERLAYS ──────────────────────────────────────────────────────

    function renderRoomTints() {
        Object.values(ROOMS).forEach(room => {
            const tint = new PIXI.Graphics();
            tint.beginFill(room.tint, 0.45);
            tint.drawRect(
                (room.x + 1) * TILE_SIZE,
                (room.y + 1) * TILE_SIZE,
                (room.width - 2) * TILE_SIZE,
                (room.height - 2) * TILE_SIZE
            );
            tint.endFill();
            roomTintLayer.addChild(tint);
        });
    }

    // ─── WALL RENDERING ──────────────────────────────────────────────────────────

    function renderWalls(wallTex) {
        // Build a set of wall positions to avoid duplicates
        const wallPositions = new Set();

        Object.values(ROOMS).forEach(room => {
            const { x, y, width, height } = room;

            // Top wall
            for (let col = x; col < x + width; col++) {
                wallPositions.add(`${col},${y}`);
            }
            // Bottom wall
            for (let col = x; col < x + width; col++) {
                wallPositions.add(`${col},${y + height - 1}`);
            }
            // Left wall
            for (let row = y; row < y + height; row++) {
                wallPositions.add(`${x},${row}`);
            }
            // Right wall
            for (let row = y; row < y + height; row++) {
                wallPositions.add(`${x + width - 1},${row}`);
            }
        });

        // Render each wall tile as a sprite
        wallPositions.forEach(key => {
            const [col, row] = key.split(',').map(Number);
            const wall = new PIXI.Sprite(wallTex);
            wall.x = col * TILE_SIZE;
            wall.y = row * TILE_SIZE;
            wall.width = TILE_SIZE;
            wall.height = TILE_SIZE;
            wallLayer.addChild(wall);
        });
    }

    // ─── ROOM LABELS ─────────────────────────────────────────────────────────────

    function renderRoomLabels() {
        Object.values(ROOMS).forEach(room => {
            const label = new PIXI.Text(room.name, {
                fontFamily: '"Press Start 2P", "Courier New", monospace',
                fontSize: 10,
                fill: 0x00e5cc,
                fontWeight: '600',
                align: 'center',
                dropShadow: true,
                dropShadowColor: 0x000000,
                dropShadowDistance: 1,
                dropShadowAlpha: 0.7
            });
            label.alpha = 0.85;
            label.anchor.set(0.5, 0);
            label.x = (room.x + room.width / 2) * TILE_SIZE;
            label.y = (room.y + 1.3) * TILE_SIZE;
            labelLayer.addChild(label);
        });
    }

    // ─── FURNITURE RENDERING ─────────────────────────────────────────────────────

    function renderFurniture(tex) {
        FURNITURE.forEach(item => {
            const texture = tex[item.type];
            if (!texture) return;

            const sprite = new PIXI.Sprite(texture);
            sprite.x = item.x * TILE_SIZE;
            sprite.y = item.y * TILE_SIZE;
            sprite.width = TILE_SIZE;
            sprite.height = TILE_SIZE;
            furnitureLayer.addChild(sprite);
        });
    }

    // ─── AGENT RENDERING & ANIMATION ─────────────────────────────────────────────

    const agents = [];

    function createAgents(agentTex) {
        AGENTS_CONFIG.forEach(config => {
            const sprite = new PIXI.Sprite(agentTex);
            sprite.x = config.x * TILE_SIZE;
            sprite.y = config.y * TILE_SIZE;
            sprite.width = TILE_SIZE;
            sprite.height = TILE_SIZE;
            sprite.tint = config.tint;
            sprite.anchor.set(0, 0);

            // Name label below agent
            const nameLabel = new PIXI.Text(config.name, {
                fontFamily: '"Press Start 2P", "Courier New", monospace',
                fontSize: 7,
                fill: config.tint,
                align: 'center',
                dropShadow: true,
                dropShadowColor: 0x000000,
                dropShadowDistance: 1,
                dropShadowAlpha: 0.8
            });
            nameLabel.anchor.set(0.5, 0);
            nameLabel.x = sprite.x + TILE_SIZE * 0.5;
            nameLabel.y = sprite.y - 10;
            nameLabel.alpha = 0.9;

            agentLayer.addChild(sprite);
            labelLayer.addChild(nameLabel);

            // Movement state
            const room = ROOMS[config.room];
            const agent = {
                sprite,
                nameLabel,
                config,
                room,
                targetX: sprite.x,
                targetY: sprite.y,
                speed: 0.4 + Math.random() * 0.5,
                moveTimer: Math.random() * 200,
                moveInterval: 120 + Math.random() * 180,
                bobOffset: Math.random() * Math.PI * 2
            };

            agents.push(agent);
        });
    }

    // Pick a new random target within the agent's room (avoiding walls)
    function pickNewTarget(agent) {
        const room = agent.room;
        const margin = 2; // Stay away from walls
        const minX = (room.x + margin) * TILE_SIZE;
        const maxX = (room.x + room.width - margin - 1) * TILE_SIZE;
        const minY = (room.y + margin) * TILE_SIZE;
        const maxY = (room.y + room.height - margin - 1) * TILE_SIZE;

        agent.targetX = minX + Math.random() * (maxX - minX);
        agent.targetY = minY + Math.random() * (maxY - minY);
    }

    // ─── ANIMATION LOOP ──────────────────────────────────────────────────────────

    let elapsed = 0;

    function startAnimation() {
        app.ticker.add((delta) => {
            elapsed += delta;

            agents.forEach(agent => {
                agent.moveTimer += delta;

                // Pick new target periodically
                if (agent.moveTimer >= agent.moveInterval) {
                    agent.moveTimer = 0;
                    agent.moveInterval = 120 + Math.random() * 200;
                    pickNewTarget(agent);
                }

                // Smooth movement towards target
                const dx = agent.targetX - agent.sprite.x;
                const dy = agent.targetY - agent.sprite.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 1) {
                    agent.sprite.x += (dx / dist) * agent.speed * delta;
                    agent.sprite.y += (dy / dist) * agent.speed * delta;
                }

                // Subtle idle bob animation
                const bob = Math.sin(elapsed * 0.04 + agent.bobOffset) * 0.8;
                const visualY = agent.sprite.y + bob * 0.3;

                // Update name label position
                agent.nameLabel.x = agent.sprite.x + TILE_SIZE * 0.5;
                agent.nameLabel.y = agent.sprite.y - 10 + bob * 0.2;
            });
        });
    }

    // ─── HUD UPDATE ──────────────────────────────────────────────────────────────

    function updateHUD() {
        const agentCountEl = document.getElementById('agent-count');
        const roomLabelEl = document.getElementById('room-label');
        if (agentCountEl) agentCountEl.textContent = `Agents: ${agents.length}`;
        if (roomLabelEl) roomLabelEl.textContent = `Rooms: ${Object.keys(ROOMS).length} | Tiles: ${GRID_COLS}x${GRID_ROWS}`;
    }

    // ─── FALLBACK (programmatic textures if assets fail to load) ──────────────────

    function initWorldFallback() {
        console.warn('[Hermes Workspace] Using programmatic fallback textures');

        const COLORS = {
            floor: 0x2d323c,
            floorLine: 0x232832,
            wall: 0x3c4150,
            wallHighlight: 0x4a5060,
            desk: 0x503720,
            chair: 0x1e325a,
            sofa: 0x6b2d4a,
            table: 0x3d5c3a,
            agent: 0x00e5cc
        };

        // Generate fallback textures
        function makeRect(color, w, h) {
            const g = new PIXI.Graphics();
            g.beginFill(color);
            g.drawRect(0, 0, w || TILE_SIZE, h || TILE_SIZE);
            g.endFill();
            return app.renderer.generateTexture(g);
        }

        function makeFloorTex() {
            const g = new PIXI.Graphics();
            g.beginFill(COLORS.floor);
            g.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
            g.endFill();
            g.lineStyle(1, COLORS.floorLine, 0.5);
            g.moveTo(0, 0); g.lineTo(TILE_SIZE, 0);
            g.moveTo(0, 0); g.lineTo(0, TILE_SIZE);
            return app.renderer.generateTexture(g);
        }

        function makeWallTex() {
            const g = new PIXI.Graphics();
            g.beginFill(COLORS.wall);
            g.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
            g.endFill();
            g.beginFill(COLORS.wallHighlight);
            g.drawRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
            g.endFill();
            g.beginFill(COLORS.wall);
            g.drawRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8);
            g.endFill();
            return app.renderer.generateTexture(g);
        }

        function makeAgentTex(color) {
            const g = new PIXI.Graphics();
            g.beginFill(0x000000, 0.3);
            g.drawEllipse(TILE_SIZE * 0.5, TILE_SIZE * 0.85, TILE_SIZE * 0.3, TILE_SIZE * 0.1);
            g.endFill();
            g.beginFill(color, 0.9);
            g.drawRoundedRect(TILE_SIZE * 0.25, TILE_SIZE * 0.4, TILE_SIZE * 0.5, TILE_SIZE * 0.5, 3);
            g.endFill();
            g.beginFill(color);
            g.drawCircle(TILE_SIZE * 0.5, TILE_SIZE * 0.3, TILE_SIZE * 0.2);
            g.endFill();
            return app.renderer.generateTexture(g);
        }

        const floorTex = makeFloorTex();
        const wallTex = makeWallTex();

        renderFloor(floorTex);
        renderRoomTints();
        renderWalls(wallTex);
        renderRoomLabels();

        // Furniture with simple colored rects
        const furnitureTex = {
            desk: makeRect(COLORS.desk),
            chair: makeRect(COLORS.chair),
            table: makeRect(COLORS.table),
            sofa: makeRect(COLORS.sofa)
        };
        renderFurniture(furnitureTex);

        // Agents with programmatic sprites
        AGENTS_CONFIG.forEach(config => {
            const texture = makeAgentTex(config.tint);
            const sprite = new PIXI.Sprite(texture);
            sprite.x = config.x * TILE_SIZE;
            sprite.y = config.y * TILE_SIZE;
            sprite.anchor.set(0, 0);

            const nameLabel = new PIXI.Text(config.name, {
                fontFamily: 'monospace',
                fontSize: 8,
                fill: config.tint,
                align: 'center'
            });
            nameLabel.anchor.set(0.5, 0);
            nameLabel.x = sprite.x + TILE_SIZE * 0.5;
            nameLabel.y = sprite.y - 10;
            nameLabel.alpha = 0.8;

            agentLayer.addChild(sprite);
            labelLayer.addChild(nameLabel);

            const room = ROOMS[config.room];
            agents.push({
                sprite, nameLabel, config, room,
                targetX: sprite.x, targetY: sprite.y,
                speed: 0.4 + Math.random() * 0.5,
                moveTimer: Math.random() * 200,
                moveInterval: 120 + Math.random() * 180,
                bobOffset: Math.random() * Math.PI * 2
            });
        });

        startAnimation();
        updateHUD();
    }

})();
