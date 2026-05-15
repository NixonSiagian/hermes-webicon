/**
 * Agent System — RimWorld-style
 * 
 * Manages agent sprite instances in the PixiJS scene.
 * Agents are rendered as animated pixel-art characters
 * with shadows, name labels, status indicators, and thought bubbles.
 * Z-sorted by Y position for proper depth layering.
 */
import * as PIXI from 'pixi.js';
import { generateSpriteTextures, createThinkingBubble, createNameLabel, createStatusDot } from './spriteFactory';

const SPRITE_SCALE = 0.85; // Scale factor for agent sprites relative to tile

/**
 * Create a visual agent instance in the PixiJS scene
 */
export function createAgentVisual(app, agentData) {
  const container = new PIXI.Container();
  container.sortableChildren = true;

  // Generate textures for this role
  const textures = generateSpriteTextures(app, agentData.role);

  // Main character sprite
  const sprite = new PIXI.Sprite(textures.idle[0]);
  sprite.anchor.set(0.5, 0.85); // Bottom-center anchor for proper ground alignment
  sprite.scale.set(SPRITE_SCALE);
  sprite.zIndex = 1;
  container.addChild(sprite);

  // Thinking bubble (hidden by default)
  const bubbleTexture = createThinkingBubble(app);
  const bubble = new PIXI.Sprite(bubbleTexture);
  bubble.anchor.set(0.3, 1.2);
  bubble.scale.set(0.6);
  bubble.visible = false;
  bubble.zIndex = 10;
  container.addChild(bubble);

  // Name label below character
  const labelTexture = createNameLabel(app, agentData.name);
  const label = new PIXI.Sprite(labelTexture);
  label.anchor.set(0.5, -0.3);
  label.zIndex = 5;
  container.addChild(label);

  // Status dot (above head)
  const statusTextures = {
    idle: createStatusDot(app, 'idle'),
    walking: createStatusDot(app, 'walking'),
    working: createStatusDot(app, 'working'),
    thinking: createStatusDot(app, 'thinking'),
  };
  const statusDot = new PIXI.Sprite(statusTextures.idle);
  statusDot.anchor.set(0.5, 2.5);
  statusDot.zIndex = 6;
  container.addChild(statusDot);

  // Position
  container.x = agentData.x;
  container.y = agentData.y;

  // Make clickable
  container.eventMode = 'static';
  container.cursor = 'pointer';
  container.hitArea = new PIXI.Rectangle(-20, -50, 40, 70);

  return {
    container,
    sprite,
    bubble,
    label,
    statusDot,
    statusTextures,
    textures,
    currentFrame: 0,
    frameTimer: 0,
    lastState: agentData.state,
  };
}

/**
 * Update agent visual based on current state and position
 */
export function updateAgentVisual(visual, agentData, dt) {
  // Smooth position interpolation
  visual.container.x = agentData.x;
  visual.container.y = agentData.y;

  // Direction (flip sprite horizontally)
  visual.sprite.scale.x = (agentData.direction >= 0 ? 1 : -1) * SPRITE_SCALE;

  // Z-sorting by Y position (agents lower on screen appear in front)
  visual.container.zIndex = Math.floor(agentData.y) + 100;

  // Animation frame update
  visual.frameTimer += dt;
  const frameSpeed = agentData.state === 'walking' ? 0.12 : 0.35;

  if (visual.frameTimer >= frameSpeed) {
    visual.frameTimer = 0;
    visual.currentFrame = (visual.currentFrame + 1) % 4;

    // Set texture based on state
    const stateTextures = visual.textures[agentData.state] || visual.textures.idle;
    if (stateTextures[visual.currentFrame]) {
      visual.sprite.texture = stateTextures[visual.currentFrame];
    }
  }

  // Update status dot when state changes
  if (visual.lastState !== agentData.state) {
    visual.lastState = agentData.state;
    const dotTex = visual.statusTextures[agentData.state] || visual.statusTextures.idle;
    visual.statusDot.texture = dotTex;
  }

  // Thinking bubble visibility and animation
  visual.bubble.visible = agentData.state === 'thinking';
  if (agentData.state === 'thinking') {
    visual.bubble.y = Math.sin(Date.now() * 0.003) * 2 - 20;
  }

  // Subtle breathing/bob for idle
  if (agentData.state === 'idle') {
    visual.sprite.y = Math.sin(Date.now() * 0.002 + agentData.x) * 0.5;
  } else {
    visual.sprite.y = 0;
  }
}

/**
 * Destroy agent visual and free resources
 */
export function destroyAgentVisual(visual) {
  Object.values(visual.textures).forEach((frames) => {
    if (Array.isArray(frames)) {
      frames.forEach((t) => t.destroy(true));
    }
  });
  Object.values(visual.statusTextures).forEach((t) => t.destroy(true));
  visual.container.destroy({ children: true });
}
