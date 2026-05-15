/**
 * Hermes 2D Workspace - PixiJS Implementation
 * 
 * A complete 2D office workspace with:
 * - Floor tile grid system
 * - Wall rendering around rooms
 * - Furniture placement (desks, chairs, tables, sofas)
 * - Animated agent sprites
 * - Layered rendering (floor -> furniture -> agents)
 * - Responsive fullscreen canvas
 */

(function () {
    'use strict';

    // ─── CONFIGURATION ───────────────────────────────────────────────────────────

    const TILE_SIZE = 32;
    const GRID_COLS = 40;
    const GRID_ROWS = 30;
    const WORLD_WIDTH = GRID_COLS * TILE_SIZE;
    const WORLD_HEIGHT = GRID_ROWS * TILE_SIZE;

    // Colors for programmatic fallback rendering
    const COLORS = {
        floor: 0x2d323c,
        floorLine: 0x232832,
        wall: 0x3c4150,
        wallHighlight: 0x4a5060,
        desk: 0x503720,
        chair: 0x1e325a,
        sofa: 0x6b2d4a,
        table: 0x3d5c3a,
        agent: 0x00e5cc,
        agentShadow: 0x007766,
        roomLabel: 0x00e5cc
    };

    // ─── ROOM DEFINITIONS ────────────────────────────────────────────────────────

    const ROOMS = {
        engineering: {
            name: 'Engineering',
            x: 1, y: 1,
            width: 14, height: 12,
            color: 0x1a2235
        },
        research: {
            name: 'Research',
            x: 16, y: 1,
            width: 12, height: 12,
            color: 0x1a1f35
        },
        operations: {
            name: 'Operations',
            x: 29, y: 1,
            width: 10, height: 12,
            color: 0x1f2a1a
        },
        meeting: {
            name: 'Meeting Room',
            x: 1, y: 14,
            width: 10, height: 10,
            color: 0x2a1a2a
        },
        lounge: {
            name: 'Lounge',
            x: 12, y: 14,
            width: 16, height: 10,
            color: 0x1a2a2a
        }
    };

    // ─── FURNITURE DEFINITIONS ───────────────────────────────────────────────────

    const FURNITURE = [
        // Engineering room - desks and chairs
        { type: 'desk', x: 3, y: 3 },
        { type: 'chair', x: 3, y: 5 },
        { type: 'desk', x: 7, y: 3 },
        { type: 'chair', x: 7, y: 5 },
        { type: 'desk', x: 11, y: 3 },
        { type: 'chair', x: 11, y: 5 },
        { type: 'desk', x: 3, y: 8 },
        { type: 'chair', x: 3, y: 10 },
        { type: 'desk', x: 7, y: 8 },
        { type: 'chair', x: 7, y: 10 },
        { type: 'desk', x: 11, y: 8 },
        { type: 'chair', x: 11, y: 10 },

        // Research room - desks
        { type: 'desk', x: 18, y: 3 },
        { type: 'chair', x: 18, y: 5 },
        { type: 'desk', x: 22, y: 3 },
        { type: 'chair', x: 22, y: 5 },
        { type: 'desk', x: 18, y: 8 },
        { type: 'chair', x: 18, y: 10 },
        { type: 'desk', x: 22, y: 8 },
        { type: 'chair', x: 22, y: 10 },

        // Operations room
        { type: 'desk', x: 31, y: 3 },
        { type: 'chair', x: 31, y: 5 },
        { type: 'desk', x: 35, y: 3 },
        { type: 'chair', x: 35, y: 5 },
        { type: 'desk', x: 31, y: 8 },
        { type: 'chair', x: 31, y: 10 },

        // Meeting room - table in center
        { type: 'table', x: 4, y: 17 },
        { type: 'chair', x: 3, y: 16 },
        { type: 'chair', x: 6, y: 16 },
        { type: 'chair', x: 3, y: 19 },
        { type: 'chair', x: 6, y: 19 },
        { type: 'chair', x: 8, y: 17 },

        // Lounge - sofas and tables
        { type: 'sofa', x: 14, y: 16 },
        { type: 'sofa', x: 14, y: 20 },
        { type: 'table', x: 14, y: 18 },
        { type: 'sofa', x: 20, y: 16 },
        { type: 'sofa', x: 20, y: 20 },
        { type: 'table', x: 20, y: 18 },
        { type: 'sofa', x: 25, y: 18 },
    ];

    // ─── AGENT DEFINITIONS ───────────────────────────────────────────────────────

    const AGENTS_CONFIG = [
        { name: 'Agent Alpha', x: 4, y: 4, room: 'engineering', color: 0x00e5cc },
        { name: 'Agent Beta', x: 8, y: 4, room: 'engineering', color: 0x00ccff },
        { name: 'Agent Gamma', x: 12, y: 9, room: 'engineering', color: 0x66ffcc },
        { name: 'Agent Delta', x: 19, y: 4, room: 'research', color: 0xff9944 },
        { name: 'Agent Epsilon', x: 23, y: 9, room: 'research', color: 0xffcc00 },
        { name: 'Agent Zeta', x: 32, y: 4, room: 'operations', color: 0x44ff88 },
        { name: 'Agent Eta', x: 36, y: 9, room: 'operations', color: 0x88ffaa },
        { name: 'Agent Theta', x: 5, y: 18, room: 'meeting', color: 0xff66aa },
        { name: 'Agent Iota', x: 16, y: 17, room: 'lounge', color: 0xaa66ff },
        { name: 'Agent Kappa', x: 22, y: 19, room: 'lounge', color: 0xff6666 },
    ];

    // ─── PIXI APPLICATION ────────────────────────────────────────────────────────

    const app = new PIXI.Application({
        resizeTo: window,
        backgroundColor: 0x0b0f1a,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
    });

    document.getElementById('workspace-container').appendChild(app.view);

    // ─── LAYER CONTAINERS (z-order) ──────────────────────────────────────────────

    const floorLayer = new PIXI.Container();
    const wallLayer = new PIXI.Container();
    const furnitureLayer = new PIXI.Container();
    const agentLayer = new PIXI.Container();
    const labelLayer = new PIXI.Container();

    // World container for camera/pan
    const worldContainer = new PIXI.Container();
    worldContainer.addChild(floorLayer);
    worldContainer.addChild(wallLayer);
    worldContainer.addChild(furnitureLayer);
    worldContainer.addChild(agentLayer);
    worldContainer.addChild(labelLayer);

    app.stage.addChild(worldContainer);

    // Center the world
    function centerWorld() {
        const offsetX = (app.screen.width - WORLD_WIDTH) / 2;
        const offsetY = (app.screen.height - WORLD_HEIGHT) / 2;
        worldContainer.x = Math.max(0, offsetX);
        worldContainer.y = Math.max(0, offsetY);
    }
    centerWorld();
    window.addEventListener('resize', centerWorld);

    // ─── TEXTURE GENERATION (Programmatic fallback) ──────────────────────────────

    function createFloorTexture() {
        const g = new PIXI.Graphics();
        g.beginFill(COLORS.floor);
        g.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.endFill();
        g.lineStyle(1, COLORS.floorLine, 0.5);
        g.moveTo(0, 0);
        g.lineTo(TILE_SIZE, 0);
        g.moveTo(0, 0);
        g.lineTo(0, TILE_SIZE);
        return app.renderer.generateTexture(g);
    }

    function createWallTexture() {
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

    function createDeskTexture() {
        const g = new PIXI.Graphics();
        // Desk surface
        g.beginFill(COLORS.desk);
        g.drawRoundedRect(0, 0, TILE_SIZE * 1.5, TILE_SIZE, 3);
        g.endFill();
        // Surface detail
        g.beginFill(0x604830);
        g.drawRoundedRect(3, 3, TILE_SIZE * 1.5 - 6, TILE_SIZE - 6, 2);
        g.endFill();
        // Monitor
        g.beginFill(0x1a1a2e);
        g.drawRoundedRect(8, 6, 20, 14, 2);
        g.endFill();
        g.beginFill(0x2d4a6e);
        g.drawRoundedRect(10, 8, 16, 10, 1);
        g.endFill();
        return app.renderer.generateTexture(g);
    }

    function createChairTexture() {
        const g = new PIXI.Graphics();
        g.beginFill(COLORS.chair);
        g.drawCircle(TILE_SIZE * 0.375, TILE_SIZE * 0.375, TILE_SIZE * 0.35);
        g.endFill();
        g.beginFill(0x283d6e);
        g.drawCircle(TILE_SIZE * 0.375, TILE_SIZE * 0.375, TILE_SIZE * 0.22);
        g.endFill();
        return app.renderer.generateTexture(g);
    }

    function createTableTexture() {
        const g = new PIXI.Graphics();
        g.beginFill(COLORS.table);
        g.drawRoundedRect(0, 0, TILE_SIZE * 1.5, TILE_SIZE, 4);
        g.endFill();
        g.beginFill(0x4d7c4a);
        g.drawRoundedRect(3, 3, TILE_SIZE * 1.5 - 6, TILE_SIZE - 6, 3);
        g.endFill();
        return app.renderer.generateTexture(g);
    }

    function createSofaTexture() {
        const g = new PIXI.Graphics();
        // Back
        g.beginFill(COLORS.sofa);
        g.drawRoundedRect(0, 0, TILE_SIZE * 2, TILE_SIZE * 0.8, 5);
        g.endFill();
        // Seat
        g.beginFill(0x7d3858);
        g.drawRoundedRect(4, 6, TILE_SIZE * 2 - 8, TILE_SIZE * 0.8 - 8, 4);
        g.endFill();
        // Cushion divider
        g.lineStyle(1, 0x5a2040, 0.6);
        g.moveTo(TILE_SIZE, 6);
        g.lineTo(TILE_SIZE, TILE_SIZE * 0.8 - 2);
        return app.renderer.generateTexture(g);
    }

    function createAgentTexture(color) {
        const g = new PIXI.Graphics();
        // Shadow
        g.beginFill(0x000000, 0.3);
        g.drawEllipse(TILE_SIZE * 0.5, TILE_SIZE * 1.35, TILE_SIZE * 0.35, TILE_SIZE * 0.12);
        g.endFill();
        // Body
        g.beginFill(color, 0.9);
        g.drawRoundedRect(TILE_SIZE * 0.2, TILE_SIZE * 0.5, TILE_SIZE * 0.6, TILE_SIZE * 0.8, 4);
        g.endFill();
        // Head
        g.beginFill(color);
        g.drawCircle(TILE_SIZE * 0.5, TILE_SIZE * 0.35, TILE_SIZE * 0.25);
        g.endFill();
        // Eyes
        g.beginFill(0xffffff);
        g.drawCircle(TILE_SIZE * 0.4, TILE_SIZE * 0.32, 3);
        g.drawCircle(TILE_SIZE * 0.6, TILE_SIZE * 0.32, 3);
        g.endFill();
        g.beginFill(0x0b0f1a);
        g.drawCircle(TILE_SIZE * 0.4, TILE_SIZE * 0.33, 1.5);
        g.drawCircle(TILE_SIZE * 0.6, TILE_SIZE * 0.33, 1.5);
        g.endFill();
        // Glow effect
        g.lineStyle(1, color, 0.4);
        g.drawCircle(TILE_SIZE * 0.5, TILE_SIZE * 0.35, TILE_SIZE * 0.28);
        return app.renderer.generateTexture(g);
    }

    // ─── TEXTURES ────────────────────────────────────────────────────────────────

    const textures = {
        floor: createFloorTexture(),
        wall: createWallTexture(),
        desk: createDeskTexture(),
        chair: createChairTexture(),
        table: createTableTexture(),
        sofa: createSofaTexture()
    };

    // ─── FLOOR TILE RENDERING ────────────────────────────────────────────────────

    function renderFloor() {
        for (let row = 0; row < GRID_ROWS; row++) {
            for (let col = 0; col < GRID_COLS; col++) {
                const tile = new PIXI.Sprite(textures.floor);
                tile.x = col * TILE_SIZE;
                tile.y = row * TILE_SIZE;
                floorLayer.addChild(tile);
            }
        }
    }

    // ─── ROOM FLOOR RENDERING ────────────────────────────────────────────────────

    function renderRoomFloors() {
        Object.values(ROOMS).forEach(room => {
            const roomFloor = new PIXI.Graphics();
            roomFloor.beginFill(room.color, 0.6);
            roomFloor.drawRect(
                room.x * TILE_SIZE,
                room.y * TILE_SIZE,
                room.width * TILE_SIZE,
                room.height * TILE_SIZE
            );
            roomFloor.endFill();
            floorLayer.addChild(roomFloor);
        });
    }

    // ─── WALL RENDERING ──────────────────────────────────────────────────────────

    function renderWalls() {
        Object.values(ROOMS).forEach(room => {
            const { x, y, width, height } = room;

            // Top wall
            for (let col = x; col < x + width; col++) {
                const wall = new PIXI.Sprite(textures.wall);
                wall.x = col * TILE_SIZE;
                wall.y = y * TILE_SIZE;
                wallLayer.addChild(wall);
            }

            // Bottom wall
            for (let col = x; col < x + width; col++) {
                const wall = new PIXI.Sprite(textures.wall);
                wall.x = col * TILE_SIZE;
                wall.y = (y + height - 1) * TILE_SIZE;
                wallLayer.addChild(wall);
            }

            // Left wall
            for (let row = y; row < y + height; row++) {
                const wall = new PIXI.Sprite(textures.wall);
                wall.x = x * TILE_SIZE;
                wall.y = row * TILE_SIZE;
                wallLayer.addChild(wall);
            }

            // Right wall
            for (let row = y; row < y + height; row++) {
                const wall = new PIXI.Sprite(textures.wall);
                wall.x = (x + width - 1) * TILE_SIZE;
                wall.y = row * TILE_SIZE;
                wallLayer.addChild(wall);
            }
        });
    }

    // ─── ROOM LABELS ─────────────────────────────────────────────────────────────

    function renderRoomLabels() {
        Object.values(ROOMS).forEach(room => {
            const label = new PIXI.Text(room.name, {
                fontFamily: 'Segoe UI, sans-serif',
                fontSize: 12,
                fill: COLORS.roomLabel,
                fontWeight: '600',
                align: 'center'
            });
            label.alpha = 0.7;
            label.x = (room.x + room.width / 2) * TILE_SIZE - label.width / 2;
            label.y = (room.y + 1.5) * TILE_SIZE;
            labelLayer.addChild(label);
        });
    }

    // ─── FURNITURE RENDERING ─────────────────────────────────────────────────────

    function renderFurniture() {
        FURNITURE.forEach(item => {
            let sprite;
            switch (item.type) {
                case 'desk':
                    sprite = new PIXI.Sprite(textures.desk);
                    break;
                case 'chair':
                    sprite = new PIXI.Sprite(textures.chair);
                    break;
                case 'table':
                    sprite = new PIXI.Sprite(textures.table);
                    break;
                case 'sofa':
                    sprite = new PIXI.Sprite(textures.sofa);
                    break;
                default:
                    return;
            }
            sprite.x = item.x * TILE_SIZE;
            sprite.y = item.y * TILE_SIZE;
            furnitureLayer.addChild(sprite);
        });
    }

    // ─── AGENT RENDERING & ANIMATION ─────────────────────────────────────────────

    const agents = [];

    function createAgents() {
        AGENTS_CONFIG.forEach(config => {
            const texture = createAgentTexture(config.color);
            const sprite = new PIXI.Sprite(texture);
            sprite.x = config.x * TILE_SIZE;
            sprite.y = config.y * TILE_SIZE;
            sprite.anchor.set(0, 0);

            // Name label
            const nameLabel = new PIXI.Text(config.name, {
                fontFamily: 'Segoe UI, sans-serif',
                fontSize: 9,
                fill: config.color,
                align: 'center'
            });
            nameLabel.anchor.set(0.5, 0);
            nameLabel.x = sprite.x + TILE_SIZE * 0.5;
            nameLabel.y = sprite.y - 12;
            nameLabel.alpha = 0.8;

            agentLayer.addChild(sprite);
            labelLayer.addChild(nameLabel);

            // Movement state
            const room = ROOMS[config.room];
            const agent = {
                sprite,
                nameLabel,
                config,
                room,
                // Movement parameters
                targetX: sprite.x,
                targetY: sprite.y,
                speed: 0.3 + Math.random() * 0.4,
                moveTimer: Math.random() * 200,
                moveInterval: 150 + Math.random() * 200,
                idleTimer: 0,
                bobOffset: Math.random() * Math.PI * 2
            };

            agents.push(agent);
        });

        // Update HUD
        document.getElementById('agent-count').textContent = `Agents: ${agents.length}`;
    }

    // Pick a new random target within the agent's room
    function pickNewTarget(agent) {
        const room = agent.room;
        const margin = 2; // Stay away from walls
        const minX = (room.x + margin) * TILE_SIZE;
        const maxX = (room.x + room.width - margin) * TILE_SIZE;
        const minY = (room.y + margin) * TILE_SIZE;
        const maxY = (room.y + room.height - margin) * TILE_SIZE;

        agent.targetX = minX + Math.random() * (maxX - minX);
        agent.targetY = minY + Math.random() * (maxY - minY);
    }

    // ─── ANIMATION LOOP ──────────────────────────────────────────────────────────

    let elapsed = 0;

    app.ticker.add((delta) => {
        elapsed += delta;

        agents.forEach(agent => {
            agent.moveTimer += delta;

            // Pick new target periodically
            if (agent.moveTimer >= agent.moveInterval) {
                agent.moveTimer = 0;
                agent.moveInterval = 150 + Math.random() * 250;
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

            // Idle bob animation
            const bob = Math.sin(elapsed * 0.03 + agent.bobOffset) * 1.5;
            agent.sprite.y += bob * 0.02;

            // Update name label position
            agent.nameLabel.x = agent.sprite.x + TILE_SIZE * 0.5;
            agent.nameLabel.y = agent.sprite.y - 12;
        });
    });

    // ─── INITIALIZE ──────────────────────────────────────────────────────────────

    function init() {
        renderFloor();
        renderRoomFloors();
        renderWalls();
        renderRoomLabels();
        renderFurniture();
        createAgents();

        // Set initial room label
        document.getElementById('room-label').textContent = 'Room: Overview (5 zones)';

        console.log('[Hermes Workspace] Initialized successfully');
        console.log(`[Hermes Workspace] Grid: ${GRID_COLS}x${GRID_ROWS} (${WORLD_WIDTH}x${WORLD_HEIGHT}px)`);
        console.log(`[Hermes Workspace] Rooms: ${Object.keys(ROOMS).length}`);
        console.log(`[Hermes Workspace] Furniture: ${FURNITURE.length} items`);
        console.log(`[Hermes Workspace] Agents: ${agents.length}`);
    }

    init();

})();
