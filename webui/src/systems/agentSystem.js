/**
 * Agent System
 * Manages agent sprite instances in the PixiJS scene.
 * Handles animation frame updates and state visual changes.
 */
import * as PIXI from 'pixi.js';
import { generateSpriteTextures, createThinkingBubble, createNameLabel } from './spriteFactory';

/**
 * Create a visual agent instance in the PixiJS scene
 */
export function createAgentVisual(app, agentData) {
  const container = new PIXI.Container();
  container.sortableChildren = true;

  // Generate textures for this role
  const textures = generateSpriteTextures(app, agentData.role);

  // Main sprite
  const sprite = new PIXI.Sprite(textures.idle[0]);
  sprite.anchor.set(0.5, 0.8);
  sprite.zIndex = 1;
  container.addChild(sprite);

  // Thinking bubble (hidden by default)
  const bubbleTexture = createThinkingBubble(app);
  const bubble = new PIXI.Sprite(bubbleTexture);
  bubble.anchor.set(0.5, 1);
  bubble.y = -sprite.height * 0.5;
  bubble.x = 10;
  bubble.visible = false;
  bubble.zIndex = 2;
  container.addChild(bubble);

  // Name label
  const labelTexture = createNameLabel(app, agentData.name);
  const label = new PIXI.Sprite(labelTexture);
  label.anchor.set(0.5, 0);
  label.y = 10;
  label.zIndex = 3;
  container.addChild(label);

  // Position
  container.x = agentData.x;
  container.y = agentData.y;

  // Make clickable
  container.eventMode = 'static';
  container.cursor = 'pointer';
  container.hitArea = new PIXI.Rectangle(-20, -40, 40, 60);

  return {
    container,
    sprite,
    bubble,
    label,
    textures,
    currentFrame: 0,
    frameTimer: 0,
  };
}

/**
 * Update agent visual based on current state
 */
export function updateAgentVisual(visual, agentData, dt) {
  // Smooth position update
  visual.container.x = agentData.x;
  visual.container.y = agentData.y;

  // Direction (flip sprite)
  visual.sprite.scale.x = agentData.direction >= 0 ? 1 : -1;

  // Z-sorting by Y position (agents further down appear in front)
  visual.container.zIndex = Math.floor(agentData.y);

  // Animation frame update
  visual.frameTimer += dt;
  const frameSpeed = agentData.state === 'walking' ? 0.15 : 0.4;

  if (visual.frameTimer >= frameSpeed) {
    visual.frameTimer = 0;
    visual.currentFrame = (visual.currentFrame + 1) % 4;

    // Set texture based on state
    const stateTextures = visual.textures[agentData.state] || visual.textures.idle;
    if (stateTextures[visual.currentFrame]) {
      visual.sprite.texture = stateTextures[visual.currentFrame];
    }
  }

  // Thinking bubble visibility
  visual.bubble.visible = agentData.state === 'thinking';
  if (agentData.state === 'thinking') {
    // Floating animation for bubble
    visual.bubble.y = -visual.sprite.height * 0.5 + Math.sin(Date.now() * 0.003) * 3;
  }
}

/**
 * Destroy agent visual and free resources
 */
export function destroyAgentVisual(visual) {
  // Destroy textures
  Object.values(visual.textures).forEach((frames) => {
    frames.forEach((t) => t.destroy(true));
  });
  visual.container.destroy({ children: true });
}
