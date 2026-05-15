/**
 * Sprite Factory
 * Generates animated pixel-art character sprites using PixiJS Graphics.
 * Each character has 4 animation frames for walking and distinct idle/working/thinking states.
 */
import * as PIXI from 'pixi.js';

// Color palettes per role
const PALETTES = {
  engineer: {
    skin: 0xffdbac,
    hair: 0x3d2314,
    shirt: 0x3b82f6,
    pants: 0x1e3a5f,
    shoes: 0x333333,
  },
  researcher: {
    skin: 0xf5c5a3,
    hair: 0xffd700,
    shirt: 0xf59e0b,
    pants: 0x4a3000,
    shoes: 0x444444,
  },
  ops: {
    skin: 0xc68642,
    hair: 0x1a1a1a,
    shirt: 0x10b981,
    pants: 0x1a3d2e,
    shoes: 0x222222,
  },
};

const SPRITE_SIZE = 32;
const SCALE = 2; // Render at 2x for crispness

/**
 * Draw a single character frame
 * @param {PIXI.Graphics} g - Graphics object to draw on
 * @param {object} palette - Color palette
 * @param {number} frame - Animation frame (0-3)
 * @param {string} state - Agent state
 */
function drawCharacter(g, palette, frame, state) {
  const s = SCALE;
  g.clear();

  // Shadow
  g.beginFill(0x000000, 0.3);
  g.drawEllipse(16 * s, 30 * s, 8 * s, 3 * s);
  g.endFill();

  // Body/shirt
  const bodyBob = state === 'walking' ? Math.sin(frame * Math.PI * 0.5) * s : 0;
  g.beginFill(palette.shirt);
  g.drawRoundedRect(9 * s, (14 + bodyBob) * s, 14 * s, 12 * s, 3 * s);
  g.endFill();

  // Pants
  g.beginFill(palette.pants);
  g.drawRect(10 * s, (24 + bodyBob) * s, 5 * s, 6 * s);
  g.drawRect(17 * s, (24 + bodyBob) * s, 5 * s, 6 * s);
  g.endFill();

  // Legs/shoes animation
  const legOffset = state === 'walking' ? Math.sin(frame * Math.PI * 0.5) * 2 * s : 0;
  g.beginFill(palette.shoes);
  g.drawRect((11 - legOffset * 0.3) * s, (29 + bodyBob) * s, 4 * s, 2 * s);
  g.drawRect((17 + legOffset * 0.3) * s, (29 + bodyBob) * s, 4 * s, 2 * s);
  g.endFill();

  // Arms
  const armSwing = state === 'walking' ? Math.sin(frame * Math.PI * 0.5) * 2 * s : 0;
  g.beginFill(palette.skin);
  g.drawRoundedRect(6 * s, (16 + armSwing + bodyBob) * s, 3 * s, 8 * s, 1.5 * s);
  g.drawRoundedRect(23 * s, (16 - armSwing + bodyBob) * s, 3 * s, 8 * s, 1.5 * s);
  g.endFill();

  // Head
  g.beginFill(palette.skin);
  g.drawCircle(16 * s, (10 + bodyBob) * s, 7 * s);
  g.endFill();

  // Hair
  g.beginFill(palette.hair);
  g.drawEllipse(16 * s, (6 + bodyBob) * s, 7 * s, 4 * s);
  g.endFill();

  // Eyes
  const eyeY = (10 + bodyBob) * s;
  g.beginFill(0xffffff);
  g.drawCircle(13.5 * s, eyeY, 1.8 * s);
  g.drawCircle(18.5 * s, eyeY, 1.8 * s);
  g.endFill();

  // Pupils (blink occasionally based on frame)
  const blink = state === 'idle' && frame === 3;
  if (!blink) {
    g.beginFill(0x222222);
    g.drawCircle(14 * s, eyeY, 1 * s);
    g.drawCircle(19 * s, eyeY, 1 * s);
    g.endFill();
  }

  // State-specific indicators
  if (state === 'working') {
    // Small laptop/tool icon
    g.beginFill(0x60a5fa);
    g.drawRoundedRect(20 * s, (20 + bodyBob) * s, 6 * s, 4 * s, 1 * s);
    g.endFill();
    g.beginFill(0x93c5fd);
    g.drawRect(21 * s, (21 + bodyBob) * s, 4 * s, 2 * s);
    g.endFill();
  }
}

/**
 * Create a texture for a specific character frame
 */
function createFrameTexture(app, palette, frame, state) {
  const g = new PIXI.Graphics();
  drawCharacter(g, palette, frame, state);

  const renderTexture = PIXI.RenderTexture.create({
    width: SPRITE_SIZE * SCALE,
    height: SPRITE_SIZE * SCALE,
  });
  app.renderer.render(g, { renderTexture });
  g.destroy();
  return renderTexture;
}

/**
 * Generate all animation textures for a role
 * Returns an object with textures organized by state and frame
 */
export function generateSpriteTextures(app, role) {
  const palette = PALETTES[role] || PALETTES.engineer;

  const textures = {
    idle: [],
    walking: [],
    working: [],
    thinking: [],
  };

  // Generate 4 frames per state
  for (let frame = 0; frame < 4; frame++) {
    textures.idle.push(createFrameTexture(app, palette, frame, 'idle'));
    textures.walking.push(createFrameTexture(app, palette, frame, 'walking'));
    textures.working.push(createFrameTexture(app, palette, frame, 'working'));
    textures.thinking.push(createFrameTexture(app, palette, frame, 'thinking'));
  }

  return textures;
}

/**
 * Create the thinking bubble indicator
 */
export function createThinkingBubble(app) {
  const g = new PIXI.Graphics();
  const s = SCALE;

  // Bubble
  g.beginFill(0xffffff, 0.9);
  g.drawRoundedRect(0, 0, 16 * s, 12 * s, 4 * s);
  g.endFill();

  // Dots
  g.beginFill(0x666666);
  g.drawCircle(4 * s, 6 * s, 1.5 * s);
  g.drawCircle(8 * s, 6 * s, 1.5 * s);
  g.drawCircle(12 * s, 6 * s, 1.5 * s);
  g.endFill();

  // Tail
  g.beginFill(0xffffff, 0.9);
  g.drawCircle(3 * s, 13 * s, 2 * s);
  g.drawCircle(1 * s, 16 * s, 1.5 * s);
  g.endFill();

  const texture = PIXI.RenderTexture.create({
    width: 18 * s,
    height: 18 * s,
  });
  app.renderer.render(g, { renderTexture: texture });
  g.destroy();
  return texture;
}

/**
 * Create a name label texture
 */
export function createNameLabel(app, name) {
  const text = new PIXI.Text(name, {
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: 11,
    fontWeight: '600',
    fill: 0xf9fafb,
    align: 'center',
  });

  const padding = 6;
  const bg = new PIXI.Graphics();
  bg.beginFill(0x0b0f1a, 0.8);
  bg.drawRoundedRect(0, 0, text.width + padding * 2, text.height + 4, 4);
  bg.endFill();

  const container = new PIXI.Container();
  container.addChild(bg);
  text.x = padding;
  text.y = 2;
  container.addChild(text);

  const texture = PIXI.RenderTexture.create({
    width: text.width + padding * 2,
    height: text.height + 4,
  });
  app.renderer.render(container, { renderTexture: texture });
  container.destroy(true);
  return texture;
}
