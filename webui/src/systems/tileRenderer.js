/**
 * Tile Renderer System
 * 
 * Renders the RimWorld-style tilemap using PixiJS.
 * Generates textures for floor tiles and walls procedurally.
 * Uses a static container for efficient rendering.
 */
import * as PIXI from 'pixi.js';
import { TILE, TILE_SIZE, MAP_COLS, MAP_ROWS, ROOMS } from '../store/workspaceStore';

// Floor tile color palettes
const FLOOR_COLORS = {
  [TILE.FLOOR_DARK]: { base: 0x1a1f2e, alt: 0x161b28, grid: 0x222840 },
  [TILE.FLOOR_LIGHT]: { base: 0x252a3a, alt: 0x212636, grid: 0x2e3448 },
  [TILE.FLOOR_CARPET]: { base: 0x2d1f3d, alt: 0x261a35, grid: 0x3a2850 },
  [TILE.FLOOR_WOOD]: { base: 0x3d2b1a, alt: 0x352515, grid: 0x4a3520 },
  [TILE.FLOOR_TILE]: { base: 0x1a2e2a, alt: 0x162824, grid: 0x224038 },
};

const WALL_COLORS = {
  base: 0x3d4555,
  top: 0x4a5568,
  shadow: 0x1a1f2e,
  highlight: 0x5a6577,
};

/**
 * Create a floor tile texture with visual detail
 */
function createFloorTexture(app, floorType) {
  const colors = FLOOR_COLORS[floorType] || FLOOR_COLORS[TILE.FLOOR_DARK];
  const g = new PIXI.Graphics();
  
  // Base fill
  g.beginFill(colors.base);
  g.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
  g.endFill();
  
  // Alternating subtle pattern (checkerboard)
  g.beginFill(colors.alt, 0.4);
  g.drawRect(0, 0, TILE_SIZE / 2, TILE_SIZE / 2);
  g.drawRect(TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 2);
  g.endFill();
  
  // Grid lines (subtle tile edges)
  g.lineStyle(1, colors.grid, 0.3);
  g.moveTo(0, 0);
  g.lineTo(TILE_SIZE, 0);
  g.moveTo(0, 0);
  g.lineTo(0, TILE_SIZE);
  
  // Tiny specks for texture
  g.beginFill(colors.grid, 0.15);
  for (let i = 0; i < 3; i++) {
    const sx = Math.random() * (TILE_SIZE - 4) + 2;
    const sy = Math.random() * (TILE_SIZE - 4) + 2;
    g.drawRect(sx, sy, 1, 1);
  }
  g.endFill();
  
  const texture = PIXI.RenderTexture.create({ width: TILE_SIZE, height: TILE_SIZE });
  app.renderer.render(g, { renderTexture: texture });
  g.destroy();
  return texture;
}

/**
 * Create a floor tile texture variant (for visual variety)
 */
function createFloorTextureVariant(app, floorType) {
  const colors = FLOOR_COLORS[floorType] || FLOOR_COLORS[TILE.FLOOR_DARK];
  const g = new PIXI.Graphics();
  
  // Slightly different shade
  g.beginFill(colors.alt);
  g.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
  g.endFill();
  
  // Different pattern
  g.beginFill(colors.base, 0.3);
  g.drawRect(TILE_SIZE / 4, TILE_SIZE / 4, TILE_SIZE / 2, TILE_SIZE / 2);
  g.endFill();
  
  // Grid lines
  g.lineStyle(1, colors.grid, 0.25);
  g.moveTo(0, 0);
  g.lineTo(TILE_SIZE, 0);
  g.moveTo(0, 0);
  g.lineTo(0, TILE_SIZE);
  
  const texture = PIXI.RenderTexture.create({ width: TILE_SIZE, height: TILE_SIZE });
  app.renderer.render(g, { renderTexture: texture });
  g.destroy();
  return texture;
}

/**
 * Create wall tile texture (thick block, RimWorld-style)
 */
function createWallTexture(app) {
  const g = new PIXI.Graphics();
  
  // Main wall body
  g.beginFill(WALL_COLORS.base);
  g.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
  g.endFill();
  
  // Top highlight (3D effect)
  g.beginFill(WALL_COLORS.highlight, 0.6);
  g.drawRect(0, 0, TILE_SIZE, 4);
  g.endFill();
  
  // Left highlight
  g.beginFill(WALL_COLORS.highlight, 0.3);
  g.drawRect(0, 0, 3, TILE_SIZE);
  g.endFill();
  
  // Bottom shadow
  g.beginFill(WALL_COLORS.shadow, 0.6);
  g.drawRect(0, TILE_SIZE - 4, TILE_SIZE, 4);
  g.endFill();
  
  // Right shadow
  g.beginFill(WALL_COLORS.shadow, 0.4);
  g.drawRect(TILE_SIZE - 3, 0, 3, TILE_SIZE);
  g.endFill();
  
  // Brick-like detail
  g.lineStyle(1, WALL_COLORS.shadow, 0.3);
  g.moveTo(0, TILE_SIZE / 3);
  g.lineTo(TILE_SIZE, TILE_SIZE / 3);
  g.moveTo(0, (TILE_SIZE * 2) / 3);
  g.lineTo(TILE_SIZE, (TILE_SIZE * 2) / 3);
  g.moveTo(TILE_SIZE / 2, 0);
  g.lineTo(TILE_SIZE / 2, TILE_SIZE / 3);
  g.moveTo(TILE_SIZE / 4, TILE_SIZE / 3);
  g.lineTo(TILE_SIZE / 4, (TILE_SIZE * 2) / 3);
  g.moveTo((TILE_SIZE * 3) / 4, TILE_SIZE / 3);
  g.lineTo((TILE_SIZE * 3) / 4, (TILE_SIZE * 2) / 3);
  g.moveTo(TILE_SIZE / 2, (TILE_SIZE * 2) / 3);
  g.lineTo(TILE_SIZE / 2, TILE_SIZE);
  
  const texture = PIXI.RenderTexture.create({ width: TILE_SIZE, height: TILE_SIZE });
  app.renderer.render(g, { renderTexture: texture });
  g.destroy();
  return texture;
}

/**
 * Create void/darkness texture
 */
function createVoidTexture(app) {
  const g = new PIXI.Graphics();
  g.beginFill(0x050810);
  g.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
  g.endFill();
  
  // Very subtle noise
  g.beginFill(0x0a0e18, 0.3);
  g.drawRect(4, 4, 2, 2);
  g.drawRect(20, 12, 2, 2);
  g.drawRect(10, 24, 2, 2);
  g.endFill();
  
  const texture = PIXI.RenderTexture.create({ width: TILE_SIZE, height: TILE_SIZE });
  app.renderer.render(g, { renderTexture: texture });
  g.destroy();
  return texture;
}

/**
 * Render the entire tilemap as a static container
 */
export function renderTileMap(app, tileMap) {
  const container = new PIXI.Container();
  container.sortableChildren = true;
  container.zIndex = -100;

  // Generate textures
  const floorTextures = {};
  const floorVariants = {};
  Object.keys(FLOOR_COLORS).forEach((type) => {
    const t = parseInt(type);
    floorTextures[t] = createFloorTexture(app, t);
    floorVariants[t] = createFloorTextureVariant(app, t);
  });
  const wallTexture = createWallTexture(app);
  const voidTexture = createVoidTexture(app);

  // Render tiles
  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const tileType = tileMap[row][col];
      let texture;

      if (tileType === TILE.VOID) {
        texture = voidTexture;
      } else if (tileType === TILE.WALL || tileType === TILE.WALL_TOP) {
        texture = wallTexture;
      } else {
        // Floor tile - use variant based on position for variety
        const useVariant = (col + row) % 3 === 0;
        texture = useVariant
          ? (floorVariants[tileType] || floorTextures[TILE.FLOOR_DARK])
          : (floorTextures[tileType] || floorTextures[TILE.FLOOR_DARK]);
      }

      const sprite = new PIXI.Sprite(texture);
      sprite.x = col * TILE_SIZE;
      sprite.y = row * TILE_SIZE;
      sprite.width = TILE_SIZE;
      sprite.height = TILE_SIZE;
      container.addChild(sprite);
    }
  }

  // Cache as texture for performance
  const cachedTexture = PIXI.RenderTexture.create({
    width: MAP_COLS * TILE_SIZE,
    height: MAP_ROWS * TILE_SIZE,
  });
  app.renderer.render(container, { renderTexture: cachedTexture });
  container.destroy({ children: true });

  // Return a single sprite with the cached tilemap
  const tileMapSprite = new PIXI.Sprite(cachedTexture);
  tileMapSprite.zIndex = -100;
  return tileMapSprite;
}

/**
 * Render room labels as overlays
 */
export function renderRoomLabels(app) {
  const container = new PIXI.Container();
  container.zIndex = -50;

  ROOMS.forEach((room) => {
    const { col, row, w, h } = room.bounds;
    const px = col * TILE_SIZE;
    const py = row * TILE_SIZE;
    const pw = w * TILE_SIZE;

    // Room label with background
    const labelText = new PIXI.Text(room.label.toUpperCase(), {
      fontFamily: 'monospace',
      fontSize: 11,
      fontWeight: '700',
      fill: room.color,
      letterSpacing: 1.5,
    });

    // Label background
    const labelBg = new PIXI.Graphics();
    labelBg.beginFill(0x0b0f1a, 0.85);
    labelBg.drawRoundedRect(
      px + 6,
      py + 4,
      labelText.width + 12,
      labelText.height + 6,
      3
    );
    labelBg.endFill();

    // Accent line
    labelBg.beginFill(room.color, 0.8);
    labelBg.drawRect(px + 6, py + 4, 3, labelText.height + 6);
    labelBg.endFill();

    labelText.x = px + 14;
    labelText.y = py + 7;

    container.addChild(labelBg);
    container.addChild(labelText);

    // Subtle room border glow
    const glow = new PIXI.Graphics();
    glow.lineStyle(1, room.color, 0.15);
    glow.drawRect(px + 1, py + 1, pw - 2, h * TILE_SIZE - 2);
    container.addChild(glow);
  });

  return container;
}

/**
 * Render shadow layer under furniture/agents for depth
 */
export function createShadowLayer() {
  const container = new PIXI.Container();
  container.zIndex = -10;
  return container;
}
