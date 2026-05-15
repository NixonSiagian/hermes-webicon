/**
 * Furniture Renderer System
 * 
 * Draws RimWorld-style furniture sprites procedurally using PixiJS Graphics.
 * Each furniture type is a detailed pixel-art sprite at tile scale.
 * Furniture casts shadows and has depth layering.
 */
import * as PIXI from 'pixi.js';
import { TILE_SIZE, ROOMS, FURNITURE } from '../store/workspaceStore';

const TS = TILE_SIZE; // 32

/**
 * Draw a desk sprite (2 tiles wide, 1 tile tall)
 */
function drawDesk(g) {
  // Table surface
  g.beginFill(0x5c3d1e);
  g.drawRoundedRect(2, 8, TS - 4, TS - 12, 2);
  g.endFill();

  // Table top highlight
  g.beginFill(0x7a5230);
  g.drawRoundedRect(3, 9, TS - 6, 4, 1);
  g.endFill();

  // Legs
  g.beginFill(0x3d2812);
  g.drawRect(4, TS - 6, 3, 6);
  g.drawRect(TS - 7, TS - 6, 3, 6);
  g.endFill();

  // Items on desk (papers/keyboard)
  g.beginFill(0xd4d4d8);
  g.drawRect(8, 10, 8, 5);
  g.endFill();
  g.beginFill(0x1e293b);
  g.drawRect(18, 10, 8, 6);
  g.endFill();
}

/**
 * Draw a chair sprite
 */
function drawChair(g) {
  // Seat (circle)
  g.beginFill(0x374151);
  g.drawCircle(TS / 2, TS / 2 + 2, 8);
  g.endFill();

  // Seat highlight
  g.beginFill(0x4b5563);
  g.drawCircle(TS / 2, TS / 2 + 1, 6);
  g.endFill();

  // Backrest
  g.beginFill(0x1f2937);
  g.drawRoundedRect(TS / 2 - 6, TS / 2 - 8, 12, 6, 2);
  g.endFill();

  // Wheels (tiny dots)
  g.beginFill(0x111827);
  g.drawCircle(TS / 2 - 6, TS / 2 + 10, 2);
  g.drawCircle(TS / 2 + 6, TS / 2 + 10, 2);
  g.drawCircle(TS / 2, TS / 2 + 12, 2);
  g.endFill();
}

/**
 * Draw a meeting table (large, 3x2 tiles visual)
 */
function drawMeetingTable(g) {
  // Large table surface
  g.beginFill(0x4a3520);
  g.drawRoundedRect(2, 4, TS * 2 - 4, TS * 2 - 8, 4);
  g.endFill();

  // Table top sheen
  g.beginFill(0x5c4025, 0.6);
  g.drawRoundedRect(6, 8, TS * 2 - 12, TS - 4, 3);
  g.endFill();

  // Edge highlight
  g.lineStyle(1, 0x6b4f2c, 0.7);
  g.drawRoundedRect(2, 4, TS * 2 - 4, TS * 2 - 8, 4);

  // Legs
  g.beginFill(0x2d1a0e);
  g.drawRect(6, TS * 2 - 6, 4, 4);
  g.drawRect(TS * 2 - 10, TS * 2 - 6, 4, 4);
  g.drawRect(6, 6, 4, 4);
  g.drawRect(TS * 2 - 10, 6, 4, 4);
  g.endFill();
}

/**
 * Draw a sofa sprite (2 tiles wide)
 */
function drawSofa(g) {
  // Back
  g.beginFill(0x4c1d95);
  g.drawRoundedRect(2, 2, TS * 2 - 4, 10, 3);
  g.endFill();

  // Seat cushions
  g.beginFill(0x6d28d9);
  g.drawRoundedRect(4, 10, TS - 6, TS - 14, 3);
  g.endFill();
  g.beginFill(0x7c3aed);
  g.drawRoundedRect(TS - 2, 10, TS - 6, TS - 14, 3);
  g.endFill();

  // Arms
  g.beginFill(0x4c1d95);
  g.drawRoundedRect(1, 4, 5, TS - 8, 2);
  g.drawRoundedRect(TS * 2 - 6, 4, 5, TS - 8, 2);
  g.endFill();

  // Pillow detail
  g.beginFill(0x8b5cf6, 0.4);
  g.drawCircle(TS / 2, 16, 4);
  g.drawCircle(TS + TS / 2 - 2, 16, 4);
  g.endFill();
}

/**
 * Draw a coffee table
 */
function drawCoffeeTable(g) {
  // Small round table
  g.beginFill(0x44332a);
  g.drawCircle(TS / 2, TS / 2, 10);
  g.endFill();

  // Top highlight
  g.beginFill(0x5c4535, 0.6);
  g.drawCircle(TS / 2, TS / 2 - 1, 7);
  g.endFill();

  // Cup on table
  g.beginFill(0xf5f5f4);
  g.drawCircle(TS / 2 + 3, TS / 2, 3);
  g.endFill();
  g.beginFill(0x78350f);
  g.drawCircle(TS / 2 + 3, TS / 2, 2);
  g.endFill();
}

/**
 * Draw a computer monitor
 */
function drawComputer(g) {
  // Monitor frame
  g.beginFill(0x1e293b);
  g.drawRoundedRect(6, 4, 20, 16, 2);
  g.endFill();

  // Screen
  g.beginFill(0x0f172a);
  g.drawRect(8, 6, 16, 12);
  g.endFill();

  // Screen glow (code lines)
  g.beginFill(0x3b82f6, 0.6);
  g.drawRect(10, 8, 10, 1);
  g.endFill();
  g.beginFill(0x10b981, 0.6);
  g.drawRect(10, 11, 8, 1);
  g.endFill();
  g.beginFill(0xf59e0b, 0.5);
  g.drawRect(10, 14, 12, 1);
  g.endFill();

  // Stand
  g.beginFill(0x374151);
  g.drawRect(14, 20, 4, 4);
  g.endFill();
  g.beginFill(0x4b5563);
  g.drawRect(10, 24, 12, 2);
  g.endFill();
}

/**
 * Draw a server rack
 */
function drawServer(g) {
  // Rack body
  g.beginFill(0x1f2937);
  g.drawRoundedRect(4, 2, TS - 8, TS - 4, 2);
  g.endFill();

  // Border
  g.lineStyle(1, 0x374151);
  g.drawRoundedRect(4, 2, TS - 8, TS - 4, 2);

  // Drive bays
  g.beginFill(0x111827);
  g.drawRect(7, 5, TS - 14, 5);
  g.drawRect(7, 12, TS - 14, 5);
  g.drawRect(7, 19, TS - 14, 5);
  g.endFill();

  // LED indicators
  g.beginFill(0x10b981);
  g.drawCircle(9, 7, 1.5);
  g.drawCircle(9, 14, 1.5);
  g.endFill();
  g.beginFill(0xf59e0b);
  g.drawCircle(9, 21, 1.5);
  g.endFill();

  // Blinking effect (different server states)
  g.beginFill(0x3b82f6, 0.5);
  g.drawCircle(TS - 11, 7, 1.5);
  g.endFill();
}

/**
 * Draw a whiteboard
 */
function drawWhiteboard(g) {
  // Frame
  g.beginFill(0x6b7280);
  g.drawRect(2, 8, TS - 4, TS - 16, 1);
  g.endFill();

  // Board surface
  g.beginFill(0xf1f5f9);
  g.drawRect(4, 10, TS - 8, TS - 20);
  g.endFill();

  // Scribbles
  g.lineStyle(1, 0x3b82f6, 0.6);
  g.moveTo(7, 14);
  g.lineTo(18, 14);
  g.moveTo(7, 18);
  g.lineTo(22, 18);
  g.lineStyle(1, 0xef4444, 0.5);
  g.moveTo(7, 22);
  g.lineTo(14, 22);

  // Marker tray
  g.lineStyle(0);
  g.beginFill(0x4b5563);
  g.drawRect(6, TS - 8, TS - 12, 3);
  g.endFill();
}

/**
 * Draw a bookshelf
 */
function drawBookshelf(g) {
  // Shelf frame
  g.beginFill(0x5c3d1e);
  g.drawRect(4, 2, TS - 8, TS - 4);
  g.endFill();

  // Shelves
  g.beginFill(0x3d2812);
  g.drawRect(4, 10, TS - 8, 2);
  g.drawRect(4, 20, TS - 8, 2);
  g.endFill();

  // Books (colorful)
  const bookColors = [0x3b82f6, 0xef4444, 0x10b981, 0xf59e0b, 0xa855f7, 0xec4899];
  let bx = 6;
  for (let i = 0; i < 5; i++) {
    g.beginFill(bookColors[i % bookColors.length]);
    g.drawRect(bx, 3, 3, 7);
    g.endFill();
    bx += 4;
  }
  bx = 6;
  for (let i = 0; i < 5; i++) {
    g.beginFill(bookColors[(i + 2) % bookColors.length]);
    g.drawRect(bx, 12, 3, 7);
    g.endFill();
    bx += 4;
  }
  bx = 6;
  for (let i = 0; i < 4; i++) {
    g.beginFill(bookColors[(i + 4) % bookColors.length]);
    g.drawRect(bx, 22, 3, 7);
    g.endFill();
    bx += 5;
  }
}

/**
 * Draw a plant/potted plant
 */
function drawPlant(g) {
  // Pot
  g.beginFill(0x92400e);
  g.drawRect(10, 20, 12, 10);
  g.endFill();
  g.beginFill(0x78350f);
  g.drawRect(8, 18, 16, 4);
  g.endFill();

  // Soil
  g.beginFill(0x3d2008);
  g.drawRect(10, 18, 12, 2);
  g.endFill();

  // Leaves (green blob)
  g.beginFill(0x166534);
  g.drawCircle(16, 12, 7);
  g.drawCircle(12, 10, 5);
  g.drawCircle(20, 10, 5);
  g.drawCircle(16, 6, 4);
  g.endFill();

  // Leaf highlights
  g.beginFill(0x22c55e, 0.3);
  g.drawCircle(14, 8, 3);
  g.drawCircle(18, 12, 3);
  g.endFill();
}

/**
 * Draw a vending machine
 */
function drawVending(g) {
  // Body
  g.beginFill(0x1e3a5f);
  g.drawRoundedRect(4, 2, TS - 8, TS - 4, 3);
  g.endFill();

  // Window/display
  g.beginFill(0x0f172a);
  g.drawRect(7, 5, TS - 14, 14);
  g.endFill();

  // Items inside (colored dots)
  g.beginFill(0xef4444);
  g.drawRect(9, 7, 4, 3);
  g.endFill();
  g.beginFill(0x3b82f6);
  g.drawRect(15, 7, 4, 3);
  g.endFill();
  g.beginFill(0xfbbf24);
  g.drawRect(9, 12, 4, 3);
  g.endFill();
  g.beginFill(0x10b981);
  g.drawRect(15, 12, 4, 3);
  g.endFill();

  // Slot
  g.beginFill(0x111827);
  g.drawRect(10, 22, 12, 5);
  g.endFill();

  // Button panel
  g.beginFill(0x374151);
  g.drawRect(8, 20, 6, 2);
  g.endFill();
}

/**
 * Get the draw function and size for a furniture type
 */
function getFurnitureDrawer(type) {
  switch (type) {
    case 'desk': return { draw: drawDesk, w: 1, h: 1 };
    case 'chair': return { draw: drawChair, w: 1, h: 1 };
    case 'meeting_table': return { draw: drawMeetingTable, w: 2, h: 2 };
    case 'sofa': return { draw: drawSofa, w: 2, h: 1 };
    case 'coffee_table': return { draw: drawCoffeeTable, w: 1, h: 1 };
    case 'computer': return { draw: drawComputer, w: 1, h: 1 };
    case 'server': return { draw: drawServer, w: 1, h: 1 };
    case 'whiteboard': return { draw: drawWhiteboard, w: 1, h: 1 };
    case 'bookshelf': return { draw: drawBookshelf, w: 1, h: 1 };
    case 'plant': return { draw: drawPlant, w: 1, h: 1 };
    case 'vending': return { draw: drawVending, w: 1, h: 1 };
    default: return { draw: () => {}, w: 1, h: 1 };
  }
}

/**
 * Create a texture for a furniture type
 */
function createFurnitureTexture(app, type) {
  const { draw, w, h } = getFurnitureDrawer(type);
  const g = new PIXI.Graphics();
  draw(g);

  const texture = PIXI.RenderTexture.create({
    width: TS * w,
    height: TS * h,
  });
  app.renderer.render(g, { renderTexture: texture });
  g.destroy();
  return { texture, w, h };
}

/**
 * Render all furniture in all rooms
 * Returns a container with all furniture sprites
 */
export function renderFurniture(app) {
  const container = new PIXI.Container();
  container.sortableChildren = true;
  container.zIndex = 0;

  // Cache textures by type
  const textureCache = {};

  ROOMS.forEach((room) => {
    const roomFurniture = FURNITURE[room.id] || [];
    const { col: roomCol, row: roomRow } = room.bounds;

    roomFurniture.forEach((item) => {
      // Get or create texture
      if (!textureCache[item.type]) {
        textureCache[item.type] = createFurnitureTexture(app, item.type);
      }
      const { texture, w, h } = textureCache[item.type];

      // Create sprite
      const sprite = new PIXI.Sprite(texture);
      const pixelX = (roomCol + item.col) * TS;
      const pixelY = (roomRow + item.row) * TS;
      sprite.x = pixelX;
      sprite.y = pixelY;
      sprite.width = TS * w;
      sprite.height = TS * h;

      // Z-index based on Y position (for depth sorting)
      sprite.zIndex = pixelY + TS * h;

      container.addChild(sprite);

      // Shadow under furniture
      const shadow = new PIXI.Graphics();
      shadow.beginFill(0x000000, 0.2);
      shadow.drawEllipse(
        pixelX + (TS * w) / 2,
        pixelY + TS * h - 2,
        (TS * w) / 2.5,
        3
      );
      shadow.endFill();
      shadow.zIndex = pixelY + TS * h - 1;
      container.addChild(shadow);
    });
  });

  return container;
}
