/**
 * Hermes 2D Office Simulation - PixiJS Tile-Based Renderer
 *
 * A complete RimWorld-style 2D office simulation:
 * - 32x32 pixel floor tiles filling entire canvas
 * - Wall block sprites forming room boundaries
 * - Pixel-art furniture sprites (desk, chair, table, sofa)
 * - Animated agent character sprites with movement AI
 * - Proper layer ordering: floor → walls → furniture → agents
 * - Fullscreen responsive canvas, mobile-ready
 *
 * All sprites are generated programmatically as pixel-art.
 * No external image dependencies required.
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    const TILE = 32;
    const COLS = 40;
    const ROWS = 28;
    const WORLD_W = COLS * TILE;
    const WORLD_H = ROWS * TILE;

    // ═══════════════════════════════════════════════════════════════════════
    // ROOM LAYOUT (tile coordinates)
    // ═══════════════════════════════════════════════════════════════════════

    const ROOMS = [
        { id: 'engineering', name: 'Engineering', x: 1, y: 1, w: 13, h: 11, color: 0x1c2840 },
        { id: 'research',    name: 'Research',    x: 15, y: 1, w: 11, h: 11, color: 0x1c1f3d },
        { id: 'operations',  name: 'Operations',  x: 27, y: 1, w: 12, h: 11, color: 0x1f301c },
        { id: 'meeting',     name: 'Meeting',     x: 1, y: 13, w: 10, h: 10, color: 0x301c30 },
        { id: 'lounge',      name: 'Lounge',      x: 12, y: 13, w: 14, h: 10, color: 0x1c302e },
        { id: 'server',      name: 'Server Room', x: 27, y: 13, w: 12, h: 10, color: 0x1a1a28 },
    ];

    // ═══════════════════════════════════════════════════════════════════════
    // FURNITURE PLACEMENT (tile coordinates)
    // ═══════════════════════════════════════════════════════════════════════

    const FURNITURE = [
        // Engineering - workstations
        { type: 'desk', x: 3, y: 3 }, { type: 'chair', x: 3, y: 4 },
        { type: 'desk', x: 5, y: 3 }, { type: 'chair', x: 5, y: 4 },
        { type: 'desk', x: 7, y: 3 }, { type: 'chair', x: 7, y: 4 },
        { type: 'desk', x: 9, y: 3 }, { type: 'chair', x: 9, y: 4 },
        { type: 'desk', x: 11, y: 3 }, { type: 'chair', x: 11, y: 4 },
        { type: 'desk', x: 3, y: 7 }, { type: 'chair', x: 3, y: 8 },
        { type: 'desk', x: 5, y: 7 }, { type: 'chair', x: 5, y: 8 },
        { type: 'desk', x: 7, y: 7 }, { type: 'chair', x: 7, y: 8 },
        { type: 'desk', x: 9, y: 7 }, { type: 'chair', x: 9, y: 8 },
        { type: 'desk', x: 11, y: 7 }, { type: 'chair', x: 11, y: 8 },

        // Research - tables and desks
        { type: 'table', x: 17, y: 3 }, { type: 'table', x: 19, y: 3 },
        { type: 'chair', x: 17, y: 4 }, { type: 'chair', x: 19, y: 4 },
        { type: 'desk', x: 17, y: 7 }, { type: 'chair', x: 17, y: 8 },
        { type: 'desk', x: 19, y: 7 }, { type: 'chair', x: 19, y: 8 },
        { type: 'desk', x: 21, y: 7 }, { type: 'chair', x: 21, y: 8 },
        { type: 'table', x: 23, y: 5 },

        // Operations - server racks and desks
        { type: 'desk', x: 29, y: 3 }, { type: 'chair', x: 29, y: 4 },
        { type: 'desk', x: 31, y: 3 }, { type: 'chair', x: 31, y: 4 },
        { type: 'desk', x: 33, y: 3 }, { type: 'chair', x: 33, y: 4 },
        { type: 'desk', x: 35, y: 3 }, { type: 'chair', x: 35, y: 4 },
        { type: 'desk', x: 29, y: 7 }, { type: 'desk', x: 31, y: 7 },
        { type: 'desk', x: 33, y: 7 }, { type: 'desk', x: 35, y: 7 },

        // Meeting - conference table
        { type: 'table', x: 4, y: 16 }, { type: 'table', x: 5, y: 16 },
        { type: 'table', x: 6, y: 16 }, { type: 'table', x: 7, y: 16 },
        { type: 'chair', x: 4, y: 15 }, { type: 'chair', x: 5, y: 15 },
        { type: 'chair', x: 6, y: 15 }, { type: 'chair', x: 7, y: 15 },
        { type: 'chair', x: 4, y: 17 }, { type: 'chair', x: 5, y: 17 },
        { type: 'chair', x: 6, y: 17 }, { type: 'chair', x: 7, y: 17 },

        // Lounge - sofas and coffee tables
        { type: 'sofa', x: 14, y: 15 }, { type: 'sofa', x: 14, y: 19 },
        { type: 'table', x: 14, y: 17 },
        { type: 'sofa', x: 18, y: 15 }, { type: 'sofa', x: 18, y: 19 },
        { type: 'table', x: 18, y: 17 },
        { type: 'sofa', x: 22, y: 15 }, { type: 'table', x: 22, y: 17 },
        { type: 'chair', x: 22, y: 19 },

        // Server room
        { type: 'desk', x: 29, y: 15 }, { type: 'desk', x: 31, y: 15 },
        { type: 'desk', x: 33, y: 15 }, { type: 'desk', x: 35, y: 15 },
        { type: 'desk', x: 29, y: 19 }, { type: 'desk', x: 31, y: 19 },
        { type: 'desk', x: 33, y: 19 }, { type: 'desk', x: 35, y: 19 },
        { type: 'chair', x: 30, y: 17 }, { type: 'chair', x: 34, y: 17 },
    ];

    // ═══════════════════════════════════════════════════════════════════════
    // AGENT DEFINITIONS
    // ═══════════════════════════════════════════════════════════════════════

    const AGENT_DEFS = [
        { name: 'Alpha',   x: 4,  y: 5,  room: 'engineering', color: 0x00e5cc },
        { name: 'Beta',    x: 6,  y: 5,  room: 'engineering', color: 0x00bbff },
        { name: 'Gamma',   x: 8,  y: 9,  room: 'engineering', color: 0x55ffaa },
        { name: 'Delta',   x: 18, y: 5,  room: 'research',    color: 0xff9944 },
        { name: 'Epsilon', x: 20, y: 5,  room: 'research',    color: 0xffcc00 },
        { name: 'Zeta',    x: 30, y: 5,  room: 'operations',  color: 0x44ff88 },
        { name: 'Eta',     x: 34, y: 5,  room: 'operations',  color: 0x88ffcc },
        { name: 'Theta',   x: 5,  y: 18, room: 'meeting',     color: 0xff66aa },
        { name: 'Iota',    x: 15, y: 17, room: 'lounge',      color: 0xaa66ff },
        { name: 'Kappa',   x: 19, y: 17, room: 'lounge',      color: 0xff6666 },
        { name: 'Lambda',  x: 30, y: 17, room: 'server',      color: 0x66ccff },
        { name: 'Mu',      x: 34, y: 17, room: 'server',      color: 0xccff66 },
    ];



    // ═══════════════════════════════════════════════════════════════════════
    // PIXI APPLICATION SETUP
    // ═══════════════════════════════════════════════════════════════════════

    const app = new PIXI.Application({
        resizeTo: window,
        backgroundColor: 0x0a0e17,
        antialias: false,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
    });

    document.getElementById('workspace-container').appendChild(app.view);

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER LAYERS (strict z-order)
    // Layer 1: Floor tiles (bottom)
    // Layer 2: Room tint overlays
    // Layer 3: Walls
    // Layer 4: Furniture
    // Layer 5: Agents (top)
    // Layer 6: Labels (overlay)
    // ═══════════════════════════════════════════════════════════════════════

    const world = new PIXI.Container();
    const floorLayer = new PIXI.Container();
    const tintLayer = new PIXI.Container();
    const wallLayer = new PIXI.Container();
    const furnitureLayer = new PIXI.Container();
    const agentLayer = new PIXI.Container();
    const labelLayer = new PIXI.Container();

    world.addChild(floorLayer);
    world.addChild(tintLayer);
    world.addChild(wallLayer);
    world.addChild(furnitureLayer);
    world.addChild(agentLayer);
    world.addChild(labelLayer);
    app.stage.addChild(world);

    // Camera centering
    function centerCamera() {
        const sx = app.screen.width / WORLD_W;
        const sy = app.screen.height / WORLD_H;
        const scale = Math.min(sx, sy, 1.5);
        world.scale.set(scale);
        world.x = (app.screen.width - WORLD_W * scale) / 2;
        world.y = (app.screen.height - WORLD_H * scale) / 2;
    }
    centerCamera();
    window.addEventListener('resize', centerCamera);

    // ═══════════════════════════════════════════════════════════════════════
    // PIXEL-ART TEXTURE GENERATION
    // These create detailed pixel-art sprites procedurally
    // ═══════════════════════════════════════════════════════════════════════

    function generateTextures() {
        const textures = {};

        // ── Floor Tile ──────────────────────────────────────────────
        // Stone-like floor with subtle grid lines and texture variation
        (function () {
            const g = new PIXI.Graphics();
            // Base color
            g.beginFill(0x3a3f4a);
            g.drawRect(0, 0, TILE, TILE);
            g.endFill();
            // Subtle stone texture - lighter patches
            g.beginFill(0x3e4450, 0.6);
            g.drawRect(2, 2, 12, 12);
            g.endFill();
            g.beginFill(0x35394a, 0.5);
            g.drawRect(16, 4, 10, 8);
            g.endFill();
            g.beginFill(0x404858, 0.4);
            g.drawRect(4, 18, 8, 10);
            g.endFill();
            g.beginFill(0x3c4250, 0.3);
            g.drawRect(20, 20, 10, 8);
            g.endFill();
            // Grid lines (mortar between tiles)
            g.beginFill(0x2a2f38, 0.8);
            g.drawRect(0, 0, TILE, 1);
            g.drawRect(0, 0, 1, TILE);
            g.endFill();
            // Small highlight dots (pebble effect)
            g.beginFill(0x4a5060, 0.4);
            g.drawRect(8, 8, 2, 2);
            g.drawRect(22, 14, 2, 2);
            g.drawRect(14, 24, 2, 2);
            g.endFill();
            textures.floor = app.renderer.generateTexture(g);
            g.destroy();
        })();

        // ── Wall Tile ───────────────────────────────────────────────
        // Brick-like wall block with depth shading
        (function () {
            const g = new PIXI.Graphics();
            // Outer dark edge (depth shadow)
            g.beginFill(0x1a1e28);
            g.drawRect(0, 0, TILE, TILE);
            g.endFill();
            // Main brick face
            g.beginFill(0x4a5568);
            g.drawRect(2, 2, TILE - 4, TILE - 4);
            g.endFill();
            // Inner highlight (top-left light)
            g.beginFill(0x5a6578);
            g.drawRect(3, 3, TILE - 8, 2);
            g.drawRect(3, 3, 2, TILE - 8);
            g.endFill();
            // Inner shadow (bottom-right)
            g.beginFill(0x3a4050);
            g.drawRect(5, TILE - 5, TILE - 8, 2);
            g.drawRect(TILE - 5, 5, 2, TILE - 8);
            g.endFill();
            // Brick line detail
            g.beginFill(0x404a5c);
            g.drawRect(4, 14, TILE - 8, 1);
            g.endFill();
            // Mortar dots
            g.beginFill(0x606a7a, 0.3);
            g.drawRect(8, 7, 2, 2);
            g.drawRect(18, 7, 2, 2);
            g.drawRect(13, 20, 2, 2);
            g.endFill();
            textures.wall = app.renderer.generateTexture(g);
            g.destroy();
        })();

        // ── Desk Sprite ─────────────────────────────────────────────
        // Top-down desk with monitor/keyboard suggestion
        (function () {
            const g = new PIXI.Graphics();
            // Desk surface (wooden brown)
            g.beginFill(0x6b4c2a);
            g.drawRect(2, 6, 28, 20);
            g.endFill();
            // Desk edge highlight
            g.beginFill(0x7d5c38);
            g.drawRect(2, 6, 28, 2);
            g.endFill();
            // Desk shadow
            g.beginFill(0x5a3e1e);
            g.drawRect(2, 24, 28, 2);
            g.endFill();
            // Monitor (dark rectangle)
            g.beginFill(0x1a2030);
            g.drawRect(8, 9, 16, 10);
            g.endFill();
            // Monitor screen glow
            g.beginFill(0x2244aa, 0.6);
            g.drawRect(9, 10, 14, 8);
            g.endFill();
            // Keyboard
            g.beginFill(0x2a2e38);
            g.drawRect(10, 21, 12, 3);
            g.endFill();
            textures.desk = app.renderer.generateTexture(g);
            g.destroy();
        })();

        // ── Chair Sprite ────────────────────────────────────────────
        // Top-down office chair (round seat with back)
        (function () {
            const g = new PIXI.Graphics();
            // Chair base (star shape simplified as circle)
            g.beginFill(0x2a2a2a, 0.5);
            g.drawCircle(16, 18, 10);
            g.endFill();
            // Seat cushion
            g.beginFill(0x2952a3);
            g.drawCircle(16, 16, 8);
            g.endFill();
            // Seat highlight
            g.beginFill(0x3b6bc9, 0.5);
            g.drawCircle(14, 14, 4);
            g.endFill();
            // Chair back (arc at top)
            g.beginFill(0x1e3d7a);
            g.drawRect(9, 6, 14, 4);
            g.endFill();
            g.beginFill(0x274da6);
            g.drawRect(10, 7, 12, 2);
            g.endFill();
            textures.chair = app.renderer.generateTexture(g);
            g.destroy();
        })();

        // ── Table Sprite ────────────────────────────────────────────
        // Larger table top-down (meeting/work table)
        (function () {
            const g = new PIXI.Graphics();
            // Table surface
            g.beginFill(0x5c7c5a);
            g.drawRect(2, 4, 28, 24);
            g.endFill();
            // Table edge top highlight
            g.beginFill(0x6d8d6a);
            g.drawRect(2, 4, 28, 2);
            g.endFill();
            // Table edge shadow
            g.beginFill(0x4a6448);
            g.drawRect(2, 26, 28, 2);
            g.endFill();
            // Center detail (grain pattern)
            g.beginFill(0x527252, 0.4);
            g.drawRect(6, 10, 20, 1);
            g.drawRect(6, 16, 20, 1);
            g.drawRect(6, 22, 20, 1);
            g.endFill();
            textures.table = app.renderer.generateTexture(g);
            g.destroy();
        })();

        // ── Sofa Sprite ─────────────────────────────────────────────
        // Comfy sofa top-down
        (function () {
            const g = new PIXI.Graphics();
            // Sofa frame
            g.beginFill(0x7a2e4a);
            g.drawRoundedRect(2, 4, 28, 24, 4);
            g.endFill();
            // Cushion area
            g.beginFill(0x9e4060);
            g.drawRoundedRect(5, 8, 22, 16, 3);
            g.endFill();
            // Cushion highlights
            g.beginFill(0xb05070, 0.5);
            g.drawRoundedRect(6, 9, 9, 14, 2);
            g.endFill();
            g.beginFill(0xb05070, 0.5);
            g.drawRoundedRect(17, 9, 9, 14, 2);
            g.endFill();
            // Arm rests
            g.beginFill(0x6a2440);
            g.drawRect(2, 6, 3, 20);
            g.drawRect(27, 6, 3, 20);
            g.endFill();
            textures.sofa = app.renderer.generateTexture(g);
            g.destroy();
        })();

        // ── Agent Sprite ────────────────────────────────────────────
        // Top-down character (head + body, like RimWorld pawns)
        (function () {
            const g = new PIXI.Graphics();
            // Shadow
            g.beginFill(0x000000, 0.25);
            g.drawEllipse(16, 26, 8, 4);
            g.endFill();
            // Body (torso)
            g.beginFill(0xffffff);
            g.drawRoundedRect(8, 14, 16, 14, 3);
            g.endFill();
            // Body shading
            g.beginFill(0xdddddd, 0.5);
            g.drawRect(18, 16, 4, 10);
            g.endFill();
            // Head
            g.beginFill(0xffffff);
            g.drawCircle(16, 10, 7);
            g.endFill();
            // Head highlight
            g.beginFill(0xffffff, 0.3);
            g.drawCircle(14, 8, 3);
            g.endFill();
            textures.agent = app.renderer.generateTexture(g);
            g.destroy();
        })();

        return textures;
    }



    // ═══════════════════════════════════════════════════════════════════════
    // WORLD RENDERING
    // ═══════════════════════════════════════════════════════════════════════

    function buildWorld(tex) {
        renderFloorTiles(tex);
        renderRoomTints();
        renderWallTiles(tex);
        renderFurnitureSprites(tex);
        spawnAgents(tex);
        renderRoomLabels();
        startSimulation();
        updateHUD();
        console.log('[Hermes Sim] World built: ' + COLS + 'x' + ROWS + ' tiles');
    }

    // ── Floor: fill entire grid with floor tiles ─────────────────────────

    function renderFloorTiles(tex) {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const s = new PIXI.Sprite(tex.floor);
                s.x = c * TILE;
                s.y = r * TILE;
                s.width = TILE;
                s.height = TILE;
                floorLayer.addChild(s);
            }
        }
    }

    // ── Room tint overlays (colored floor areas) ─────────────────────────

    function renderRoomTints() {
        ROOMS.forEach(room => {
            const g = new PIXI.Graphics();
            g.beginFill(room.color, 0.5);
            g.drawRect(
                (room.x + 1) * TILE,
                (room.y + 1) * TILE,
                (room.w - 2) * TILE,
                (room.h - 2) * TILE
            );
            g.endFill();
            tintLayer.addChild(g);
        });
    }

    // ── Walls: build boundaries around each room using wall sprites ──────

    function renderWallTiles(tex) {
        const placed = new Set();

        ROOMS.forEach(room => {
            const { x, y, w, h } = room;

            // Top and bottom walls
            for (let c = x; c < x + w; c++) {
                placeWall(c, y, tex, placed);
                placeWall(c, y + h - 1, tex, placed);
            }
            // Left and right walls
            for (let r = y; r < y + h; r++) {
                placeWall(x, r, tex, placed);
                placeWall(x + w - 1, r, tex, placed);
            }
        });
    }

    function placeWall(col, row, tex, placed) {
        const key = col + ',' + row;
        if (placed.has(key)) return;
        placed.add(key);

        const s = new PIXI.Sprite(tex.wall);
        s.x = col * TILE;
        s.y = row * TILE;
        s.width = TILE;
        s.height = TILE;
        wallLayer.addChild(s);
    }

    // ── Furniture: place sprites at grid positions ───────────────────────

    function renderFurnitureSprites(tex) {
        FURNITURE.forEach(item => {
            const t = tex[item.type];
            if (!t) return;
            const s = new PIXI.Sprite(t);
            s.x = item.x * TILE;
            s.y = item.y * TILE;
            s.width = TILE;
            s.height = TILE;
            furnitureLayer.addChild(s);
        });
    }

    // ── Room Labels ──────────────────────────────────────────────────────

    function renderRoomLabels() {
        ROOMS.forEach(room => {
            const label = new PIXI.Text(room.name, {
                fontFamily: 'Courier New, monospace',
                fontSize: 9,
                fill: 0x88ccbb,
                align: 'center',
                dropShadow: true,
                dropShadowColor: 0x000000,
                dropShadowDistance: 1,
                dropShadowAlpha: 0.9,
            });
            label.anchor.set(0.5, 0.5);
            label.x = (room.x + room.w / 2) * TILE;
            label.y = (room.y + 1.5) * TILE;
            label.alpha = 0.85;
            labelLayer.addChild(label);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // AGENT SYSTEM
    // ═══════════════════════════════════════════════════════════════════════

    const agents = [];

    function spawnAgents(tex) {
        AGENT_DEFS.forEach(def => {
            const sprite = new PIXI.Sprite(tex.agent);
            sprite.x = def.x * TILE;
            sprite.y = def.y * TILE;
            sprite.width = TILE;
            sprite.height = TILE;
            sprite.tint = def.color;
            agentLayer.addChild(sprite);

            // Name tag
            const tag = new PIXI.Text(def.name, {
                fontFamily: 'Courier New, monospace',
                fontSize: 7,
                fill: def.color,
                align: 'center',
                dropShadow: true,
                dropShadowColor: 0x000000,
                dropShadowDistance: 1,
                dropShadowAlpha: 0.9,
            });
            tag.anchor.set(0.5, 1);
            tag.x = sprite.x + TILE / 2;
            tag.y = sprite.y - 2;
            tag.alpha = 0.9;
            labelLayer.addChild(tag);

            // Find this agent's room bounds
            const room = ROOMS.find(r => r.id === def.room);
            const bounds = room ? {
                minX: (room.x + 2) * TILE,
                maxX: (room.x + room.w - 3) * TILE,
                minY: (room.y + 2) * TILE,
                maxY: (room.y + room.h - 3) * TILE,
            } : { minX: TILE * 2, maxX: WORLD_W - TILE * 3, minY: TILE * 2, maxY: WORLD_H - TILE * 3 };

            agents.push({
                sprite,
                tag,
                bounds,
                tx: sprite.x,
                ty: sprite.y,
                speed: 0.3 + Math.random() * 0.4,
                timer: Math.random() * 150,
                interval: 100 + Math.random() * 200,
                bobPhase: Math.random() * Math.PI * 2,
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SIMULATION LOOP (agent movement + idle animation)
    // ═══════════════════════════════════════════════════════════════════════

    function startSimulation() {
        app.ticker.add((delta) => {
            agents.forEach(a => {
                a.timer += delta;

                // Pick new random target in room
                if (a.timer >= a.interval) {
                    a.timer = 0;
                    a.interval = 80 + Math.random() * 220;
                    a.tx = a.bounds.minX + Math.random() * (a.bounds.maxX - a.bounds.minX);
                    a.ty = a.bounds.minY + Math.random() * (a.bounds.maxY - a.bounds.minY);
                }

                // Move towards target
                const dx = a.tx - a.sprite.x;
                const dy = a.ty - a.sprite.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 1.5) {
                    a.sprite.x += (dx / dist) * a.speed * delta;
                    a.sprite.y += (dy / dist) * a.speed * delta;
                }

                // Idle bob
                a.bobPhase += 0.03 * delta;
                const bob = Math.sin(a.bobPhase) * 0.6;

                // Update name tag position
                a.tag.x = a.sprite.x + TILE / 2;
                a.tag.y = a.sprite.y - 2 + bob;
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HUD UPDATE
    // ═══════════════════════════════════════════════════════════════════════

    function updateHUD() {
        const ac = document.getElementById('agent-count');
        const rl = document.getElementById('room-label');
        if (ac) ac.textContent = 'Agents: ' + agents.length + ' active';
        if (rl) rl.textContent = 'Rooms: ' + ROOMS.length + ' | Grid: ' + COLS + 'x' + ROWS + ' | Tile: ' + TILE + 'px';
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // Always use programmatic pixel-art textures (reliable, no network deps)
    // ═══════════════════════════════════════════════════════════════════════

    const textures = generateTextures();
    buildWorld(textures);
    console.log('[Hermes Sim] Tile-based 2D office simulation ready');

})();
