/**
 * Agent Visual System — Living Simulation Sprites
 * 
 * Manages agent sprite instances with real visual feedback:
 * - Walking animation when moving between rooms
 * - Typing/working animation when at a desk
 * - Thinking bubble when idle/planning
 * - Activity label showing current task
 * - Status indicators (color-coded by state)
 * - Direction-aware sprite flipping
 * - Y-sorted depth rendering
 */
import * as PIXI from 'pixi.js';
import { generateSpriteTextures, createThinkingBubble, createNameLabel, createStatusDot, createActivityLabel } from './spriteFactory';

const SPRITE_SCALE = 0.85;

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
  sprite.anchor.set(0.5, 0.85);
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

  // Activity label (shows current task)
  const activityTexture = createActivityLabel(app, 'Initializing...');
  const activityLabel = new PIXI.Sprite(activityTexture);
  activityLabel.anchor.set(0.5, -1.8);
  activityLabel.zIndex = 6;
  activityLabel.alpha = 0;
  container.addChild(activityLabel);

  // Status dot (above head)
  const statusTextures = {
    idle: createStatusDot(app, 'idle'),
    moving: createStatusDot(app, 'moving'),
    working: createStatusDot(app, 'working'),
    thinking: createStatusDot(app, 'thinking'),
  };
  const statusDot = new PIXI.Sprite(statusTextures.idle);
  statusDot.anchor.set(0.5, 2.5);
  statusDot.zIndex = 6;
  container.addChild(statusDot);

  // Work effect particles (hidden by default)
  const workEffect = createWorkEffect(app);
  workEffect.visible = false;
  workEffect.zIndex = 8;
  container.addChild(workEffect);

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
    activityLabel,
    statusDot,
    statusTextures,
    workEffect,
    textures,
    currentFrame: 0,
    frameTimer: 0,
    lastState: agentData.state,
    lastActivity: '',
    activityFadeTimer: 0,
    app,
  };
}

/**
 * Create work effect (small particles for typing/working visual)
 */
function createWorkEffect(app) {
  const container = new PIXI.Container();
  
  // Create small glowing dots that float up
  for (let i = 0; i < 4; i++) {
    const g = new PIXI.Graphics();
    g.beginFill(0x60a5fa, 0.7);
    g.drawCircle(0, 0, 1.5);
    g.endFill();
    
    const texture = PIXI.RenderTexture.create({ width: 4, height: 4 });
    app.renderer.render(g, { renderTexture: texture });
    g.destroy();
    
    const particle = new PIXI.Sprite(texture);
    particle.anchor.set(0.5);
    particle.x = (Math.random() - 0.5) * 16;
    particle.y = -20 - Math.random() * 10;
    particle.alpha = 0;
    container.addChild(particle);
  }
  
  return container;
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

  // Z-sorting by Y position
  visual.container.zIndex = Math.floor(agentData.y) + 100;

  // === ANIMATION FRAMES ===
  visual.frameTimer += dt;
  const frameSpeed = agentData.state === 'moving' ? 0.12 : 
                     agentData.state === 'working' ? 0.25 : 0.4;

  if (visual.frameTimer >= frameSpeed) {
    visual.frameTimer = 0;
    visual.currentFrame = (visual.currentFrame + 1) % 4;

    // Map state to animation state
    let animState = agentData.state;
    if (animState === 'moving') animState = 'walking';
    
    const stateTextures = visual.textures[animState] || visual.textures.idle;
    if (stateTextures[visual.currentFrame]) {
      visual.sprite.texture = stateTextures[visual.currentFrame];
    }
  }

  // === STATUS DOT ===
  if (visual.lastState !== agentData.state) {
    visual.lastState = agentData.state;
    const stateKey = agentData.state === 'moving' ? 'moving' : agentData.state;
    const dotTex = visual.statusTextures[stateKey] || visual.statusTextures.idle;
    visual.statusDot.texture = dotTex;
  }

  // === THINKING BUBBLE ===
  const showBubble = agentData.state === 'idle' && agentData.idleTimer > 0.5;
  visual.bubble.visible = showBubble;
  if (showBubble) {
    visual.bubble.y = Math.sin(Date.now() * 0.003) * 2 - 20;
    visual.bubble.alpha = 0.8 + Math.sin(Date.now() * 0.005) * 0.2;
  }

  // === WORK EFFECT (particles when working) ===
  if (agentData.state === 'working') {
    visual.workEffect.visible = true;
    const particles = visual.workEffect.children;
    const time = Date.now() * 0.005;
    particles.forEach((p, i) => {
      const phase = time + i * 1.5;
      p.y = -20 - (Math.sin(phase) * 0.5 + 0.5) * 12;
      p.x = Math.cos(phase * 0.7 + i) * 8;
      p.alpha = (Math.sin(phase) * 0.5 + 0.5) * 0.7;
    });
  } else {
    visual.workEffect.visible = false;
  }

  // === IDLE BREATHING ===
  if (agentData.state === 'idle') {
    visual.sprite.y = Math.sin(Date.now() * 0.002 + agentData.x) * 0.8;
  } else if (agentData.state === 'working') {
    // Small typing jitter
    visual.sprite.y = Math.sin(Date.now() * 0.01) * 0.3;
    visual.sprite.x = (agentData.direction >= 0 ? 1 : -1) * SPRITE_SCALE + Math.sin(Date.now() * 0.008) * 0.2;
  } else {
    visual.sprite.y = 0;
  }

  // === ACTIVITY LABEL (fade in/out) ===
  if (agentData.activity && agentData.activity !== visual.lastActivity) {
    visual.lastActivity = agentData.activity;
    visual.activityFadeTimer = 3; // Show for 3 seconds
    
    // Recreate activity label texture
    const newTexture = createActivityLabel(visual.app, agentData.activity);
    visual.activityLabel.texture = newTexture;
  }
  
  if (visual.activityFadeTimer > 0) {
    visual.activityFadeTimer -= dt;
    visual.activityLabel.alpha = Math.min(1, visual.activityFadeTimer / 0.5);
  } else {
    visual.activityLabel.alpha = Math.max(0, visual.activityLabel.alpha - dt * 2);
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
