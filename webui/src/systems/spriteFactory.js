/**
 * Sprite Factory — RimWorld-style Character Sprites
 * 
 * Generates detailed pixel-art character sprites with:
 * - 4 animation frames per state (idle, walking, working, thinking)
 * - Role-specific color palettes and details
 * - Shadow, name label, and thought bubble
 * - Crisp 32x32 base scaled 2x for rendering
 */
import * as PIXI from 'pixi.js';

// Color palettes per role (more detailed RimWorld style)
const PALETTES = {
  engineer: {
    skin: 0xffdbac,
    hair: 0x3d2314,
    shirt: 0x2563eb,
    shirtDark: 0x1d4ed8,
    pants: 0x1e3a5f,
    pantsDark: 0x172e4a,
    shoes: 0x1f2937,
    accessory: 0x60a5fa, // headphones
  },
  developer: {
    skin: 0xffdbac,
    hair: 0x3d2314,
    shirt: 0x2563eb,
    shirtDark: 0x1d4ed8,
    pants: 0x1e3a5f,
    pantsDark: 0x172e4a,
    shoes: 0x1f2937,
    accessory: 0x60a5fa, // headphones
  },
  researcher: {
    skin: 0xf5c5a3,
    hair: 0xfbbf24,
    shirt: 0xd97706,
    shirtDark: 0xb45309,
    pants: 0x4a3000,
    pantsDark: 0x3d2600,
    shoes: 0x292524,
    accessory: 0xfde68a, // goggles
  },
  ops: {
    skin: 0xc68642,
    hair: 0x1a1a1a,
    shirt: 0x059669,
    shirtDark: 0x047857,
    pants: 0x1a3d2e,
    pantsDark: 0x143026,
    shoes: 0x111827,
    accessory: 0x34d399, // badge
  },
  manager: {
    skin: 0xffe0bd,
    hair: 0x2c1810,
    shirt: 0x7c3aed,
    shirtDark: 0x6d28d9,
    pants: 0x2e1065,
    pantsDark: 0x1e0a45,
    shoes: 0x1f2937,
    accessory: 0xc084fc, // tie
  },
};

const SPRITE_SIZE = 32;
const SCALE = 2; // Render at 2x

/**
 * Draw a single character frame with RimWorld-style detail
 */
function drawCharacter(g, palette, frame, state) {
  const s = SCALE;
  g.clear();

  // Shadow on ground
  g.beginFill(0x000000, 0.25);
  g.drawEllipse(16 * s, 30 * s, 7 * s, 2.5 * s);
  g.endFill();

  const bob = state === 'walking' ? Math.sin(frame * Math.PI * 0.5) * 1.2 * s : 0;
  const breathe = state === 'idle' ? Math.sin(frame * Math.PI * 0.25) * 0.3 * s : 0;
  const yOff = bob + breathe;

  // === BODY ===
  
  // Pants/legs
  const legSpread = state === 'walking' ? Math.sin(frame * Math.PI * 0.5) * 1.5 * s : 0;
  g.beginFill(palette.pants);
  g.drawRect((11 - legSpread * 0.3) * s, (24 + yOff) * s, 5 * s, 6 * s);
  g.drawRect((16 + legSpread * 0.3) * s, (24 + yOff) * s, 5 * s, 6 * s);
  g.endFill();
  
  // Darker inner leg
  g.beginFill(palette.pantsDark);
  g.drawRect((13) * s, (25 + yOff) * s, 6 * s, 5 * s);
  g.endFill();

  // Shoes
  g.beginFill(palette.shoes);
  g.drawRoundedRect((10 - legSpread * 0.4) * s, (29 + yOff) * s, 6 * s, 2.5 * s, 1 * s);
  g.drawRoundedRect((16 + legSpread * 0.4) * s, (29 + yOff) * s, 6 * s, 2.5 * s, 1 * s);
  g.endFill();

  // Torso/shirt
  g.beginFill(palette.shirt);
  g.drawRoundedRect(9 * s, (14 + yOff) * s, 14 * s, 11 * s, 2 * s);
  g.endFill();

  // Shirt shading (dark side)
  g.beginFill(palette.shirtDark, 0.5);
  g.drawRect(9 * s, (18 + yOff) * s, 4 * s, 7 * s);
  g.endFill();

  // Collar
  g.beginFill(palette.skin, 0.6);
  g.drawRect(13 * s, (13.5 + yOff) * s, 6 * s, 2 * s);
  g.endFill();

  // Arms
  const armSwing = state === 'walking' ? Math.sin(frame * Math.PI * 0.5) * 2.5 * s : 0;
  const armY = state === 'working' ? -1.5 * s : 0;
  
  g.beginFill(palette.shirt);
  g.drawRoundedRect(6 * s, (15 + armSwing + yOff) * s, 4 * s, 9 * s, 1.5 * s);
  g.drawRoundedRect(22 * s, (15 - armSwing + yOff + armY) * s, 4 * s, 9 * s, 1.5 * s);
  g.endFill();

  // Hands
  g.beginFill(palette.skin);
  g.drawCircle(8 * s, (24 + armSwing + yOff) * s, 2 * s);
  g.drawCircle(24 * s, (24 - armSwing + yOff + armY) * s, 2 * s);
  g.endFill();

  // === HEAD ===
  
  // Head
  g.beginFill(palette.skin);
  g.drawCircle(16 * s, (9 + yOff) * s, 6.5 * s);
  g.endFill();

  // Ear
  g.beginFill(palette.skin);
  g.drawCircle(9.5 * s, (10 + yOff) * s, 1.5 * s);
  g.endFill();

  // Hair
  g.beginFill(palette.hair);
  g.drawEllipse(16 * s, (5.5 + yOff) * s, 6.5 * s, 4 * s);
  // Side hair
  g.drawRect(9.5 * s, (5 + yOff) * s, 2 * s, 5 * s);
  g.endFill();

  // Eyes
  const blinkFrame = state === 'idle' && frame === 3;
  const eyeY = (9.5 + yOff) * s;
  
  if (!blinkFrame) {
    // Eye whites
    g.beginFill(0xffffff);
    g.drawEllipse(13.5 * s, eyeY, 2 * s, 1.8 * s);
    g.drawEllipse(18.5 * s, eyeY, 2 * s, 1.8 * s);
    g.endFill();

    // Pupils
    const lookDir = state === 'thinking' ? 0.5 : 0;
    g.beginFill(0x1a1a1a);
    g.drawCircle((13.5 + lookDir) * s, eyeY, 1.2 * s);
    g.drawCircle((18.5 + lookDir) * s, eyeY, 1.2 * s);
    g.endFill();

    // Eye highlight
    g.beginFill(0xffffff, 0.6);
    g.drawCircle((13) * s, (eyeY - 0.3 * s), 0.4 * s);
    g.drawCircle((18) * s, (eyeY - 0.3 * s), 0.4 * s);
    g.endFill();
  } else {
    // Closed eyes (blink)
    g.lineStyle(1.5 * s, 0x1a1a1a);
    g.moveTo(12 * s, eyeY);
    g.lineTo(15 * s, eyeY);
    g.moveTo(17 * s, eyeY);
    g.lineTo(20 * s, eyeY);
    g.lineStyle(0);
  }

  // Mouth
  g.beginFill(0xc0846a, 0.5);
  if (state === 'thinking') {
    g.drawCircle(16 * s, (12.5 + yOff) * s, 1 * s);
  } else {
    g.drawRect(14.5 * s, (12 + yOff) * s, 3 * s, 1 * s);
  }
  g.endFill();

  // === STATE INDICATORS ===
  
  if (state === 'working') {
    // Laptop held in hands
    g.beginFill(0x374151);
    g.drawRoundedRect(20 * s, (20 + yOff) * s, 8 * s, 5 * s, 1 * s);
    g.endFill();
    g.beginFill(0x1e40af, 0.7);
    g.drawRect(21 * s, (21 + yOff) * s, 6 * s, 3 * s);
    g.endFill();
  }

  // Role-specific accessory
  if (palette.accessory) {
    g.beginFill(palette.accessory, 0.7);
    if (palette === PALETTES.engineer) {
      // Headphones
      g.drawRect(9 * s, (6 + yOff) * s, 2 * s, 4 * s);
      g.drawRect(21 * s, (6 + yOff) * s, 2 * s, 4 * s);
    } else if (palette === PALETTES.researcher) {
      // Goggles on forehead
      g.drawRect(12 * s, (5 + yOff) * s, 3 * s, 2 * s);
      g.drawRect(17 * s, (5 + yOff) * s, 3 * s, 2 * s);
    } else if (palette === PALETTES.ops) {
      // Badge on shirt
      g.drawRect(11 * s, (16 + yOff) * s, 3 * s, 3 * s);
    }
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
 */
export function generateSpriteTextures(app, role) {
  const palette = PALETTES[role] || PALETTES.engineer;

  const textures = {
    idle: [],
    walking: [],
    working: [],
    thinking: [],
  };

  for (let frame = 0; frame < 4; frame++) {
    textures.idle.push(createFrameTexture(app, palette, frame, 'idle'));
    textures.walking.push(createFrameTexture(app, palette, frame, 'walking'));
    textures.working.push(createFrameTexture(app, palette, frame, 'working'));
    textures.thinking.push(createFrameTexture(app, palette, frame, 'thinking'));
  }

  return textures;
}

/**
 * Create the thinking bubble texture
 */
export function createThinkingBubble(app) {
  const g = new PIXI.Graphics();
  const s = SCALE;

  // Main bubble
  g.beginFill(0xffffff, 0.92);
  g.lineStyle(1, 0xd1d5db);
  g.drawRoundedRect(0, 0, 18 * s, 12 * s, 4 * s);
  g.endFill();

  // Dots animation
  g.beginFill(0x6b7280);
  g.drawCircle(5 * s, 6 * s, 1.5 * s);
  g.drawCircle(9 * s, 6 * s, 1.5 * s);
  g.drawCircle(13 * s, 6 * s, 1.5 * s);
  g.endFill();

  // Tail bubbles
  g.lineStyle(0);
  g.beginFill(0xffffff, 0.85);
  g.drawCircle(4 * s, 14 * s, 2 * s);
  g.drawCircle(2 * s, 17 * s, 1.2 * s);
  g.endFill();

  const texture = PIXI.RenderTexture.create({
    width: 20 * s,
    height: 20 * s,
  });
  app.renderer.render(g, { renderTexture: texture });
  g.destroy();
  return texture;
}

/**
 * Create a name label texture with dark background
 */
export function createNameLabel(app, name) {
  const text = new PIXI.Text(name, {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    fill: 0xf9fafb,
    align: 'center',
  });

  const padding = 5;
  const container = new PIXI.Container();
  
  const bg = new PIXI.Graphics();
  bg.beginFill(0x0b0f1a, 0.85);
  bg.lineStyle(1, 0x374151, 0.5);
  bg.drawRoundedRect(0, 0, text.width + padding * 2, text.height + 4, 3);
  bg.endFill();

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

/**
 * Create a status indicator dot
 */
export function createStatusDot(app, state) {
  const g = new PIXI.Graphics();
  const colors = {
    idle: 0x6b7280,
    moving: 0x3b82f6,
    walking: 0x3b82f6,
    working: 0x10b981,
    thinking: 0xf59e0b,
  };
  const color = colors[state] || colors.idle;

  g.beginFill(color);
  g.drawCircle(4, 4, 3);
  g.endFill();

  // Glow
  g.beginFill(color, 0.3);
  g.drawCircle(4, 4, 5);
  g.endFill();

  const texture = PIXI.RenderTexture.create({ width: 10, height: 10 });
  app.renderer.render(g, { renderTexture: texture });
  g.destroy();
  return texture;
}

/**
 * Create an activity label texture (shows current task above agent)
 */
export function createActivityLabel(app, activity) {
  const text = new PIXI.Text(activity || '', {
    fontFamily: 'monospace',
    fontSize: 8,
    fontWeight: '600',
    fill: 0xa5f3fc,
    align: 'center',
  });

  const padding = 4;
  const container = new PIXI.Container();
  
  const bg = new PIXI.Graphics();
  bg.beginFill(0x0b1628, 0.9);
  bg.lineStyle(1, 0x22d3ee, 0.4);
  bg.drawRoundedRect(0, 0, text.width + padding * 2, text.height + 4, 3);
  bg.endFill();

  container.addChild(bg);
  text.x = padding;
  text.y = 2;
  container.addChild(text);

  const texture = PIXI.RenderTexture.create({
    width: Math.max(text.width + padding * 2, 10),
    height: text.height + 4,
  });
  app.renderer.render(container, { renderTexture: texture });
  container.destroy(true);
  return texture;
}
