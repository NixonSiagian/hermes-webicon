/**
 * Hermes Workspace - Standalone 2D Simulation
 * Simple sprite-based office simulation with agent movement
 */
(function() {
'use strict';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════ */
const TILE_SIZE = 32;
const AGENT_SPEED = 60; // pixels per second

/* ═══════════════════════════════════════════════════════════
   SIMPLE GRID MAP
   W = wall, F = floor, D = desk, C = chair, A = agent spawn
═══════════════════════════════════════════════════════════ */
const MAP = [
  "WWWWWWWWWW",
  "WFFFFFFFFW",
  "WFFDDCFFFW", 
  "WFFCCDFAFW",
  "WFFFFFFFFW",
  "WFFDDCFFFW",
  "WFFCCDFCFW",
  "WFFFFFFFFW",
  "WWWWWWWWWW"
];

const MAP_WIDTH = MAP[0].length;
const MAP_HEIGHT = MAP.length;
const WORLD_WIDTH = MAP_WIDTH * TILE_SIZE;
const WORLD_HEIGHT = MAP_HEIGHT * TILE_SIZE;

/* ═══════════════════════════════════════════════════════════
   PIXI APPLICATION SETUP
═══════════════════════════════════════════════════════════ */
const app = new PIXI.Application({
  resizeTo: document.getElementById('game-container'),
  backgroundColor: 0x0a0e17,
  antialias: false,
  resolution: Math.min(window.devicePixelRatio || 1, 2),
  autoDensity: true,
});

document.getElementById('game-container').appendChild(app.view);

// Layer containers
const world = new PIXI.Container();
const mapLayer = new PIXI.Container();
const agentLayer = new PIXI.Container();

world.addChild(mapLayer, agentLayer);
app.stage.addChild(world);

/* ═══════════════════════════════════════════════════════════
   CAMERA SYSTEM
═══════════════════════════════════════════════════════════ */
function centerCamera() {
  const screenWidth = app.screen.width;
  const screenHeight = app.screen.height;
  
  if (!screenWidth || !screenHeight) return;
  
  // Calculate scale to fit world on screen
  const scale = Math.min(
    screenWidth / WORLD_WIDTH,
    screenHeight / WORLD_HEIGHT,
    2.0
  ) * 0.9; // Leave some padding
  
  world.scale.set(scale);
  
  // Center the world
  world.x = Math.round((screenWidth - WORLD_WIDTH * scale) / 2);
  world.y = Math.round((screenHeight - WORLD_HEIGHT * scale) / 2);
}

// Initial camera setup
centerCamera();
window.addEventListener('resize', () => {
  setTimeout(centerCamera, 100);
});

/* ═══════════════════════════════════════════════════════════
   SPRITE LOADING SYSTEM
═══════════════════════════════════════════════════════════ */
const sprites = {};
let assetsLoaded = false;

async function loadAssets() {
  try {
    console.log('Loading assets...');
    
    const assetPaths = {
      floor: 'assets/floor.png',
      wall: 'assets/wall.png', 
      desk: 'assets/desk.png',
      chair: 'assets/chair.png',
      agent: 'assets/agent.png'
    };
    
    // Load all assets
    const loadPromises = Object.entries(assetPaths).map(async ([key, path]) => {
      try {
        const texture = await PIXI.Assets.load(path);
        texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
        sprites[key] = texture;
        console.log(`Loaded: ${key}`);
      } catch (error) {
        console.warn(`Failed to load ${key}:`, error);
        // Create fallback colored rectangle
        sprites[key] = createFallbackTexture(key);
      }
    });
    
    await Promise.all(loadPromises);
    assetsLoaded = true;
    console.log('All assets loaded');
    
  } catch (error) {
    console.error('Asset loading failed:', error);
    // Create fallback textures for all sprites
    createAllFallbacks();
    assetsLoaded = true;
  }
}

function createFallbackTexture(type) {
  const colors = {
    floor: 0x2e3244,
    wall: 0x505870, 
    desk: 0x6a4518,
    chair: 0x3c5080,
    agent: 0x00e5cc
  };
  
  const graphics = new PIXI.Graphics();
  graphics.beginFill(colors[type] || 0xffffff);
  graphics.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
  graphics.endFill();
  
  return app.renderer.generateTexture(graphics);
}

function createAllFallbacks() {
  const types = ['floor', 'wall', 'desk', 'chair', 'agent'];
  types.forEach(type => {
    sprites[type] = createFallbackTexture(type);
  });
}

/* ═══════════════════════════════════════════════════════════
   MAP RENDERING
═══════════════════════════════════════════════════════════ */
function renderMap() {
  mapLayer.removeChildren();
  
  if (!assetsLoaded) return;
  
  for (let row = 0; row < MAP_HEIGHT; row++) {
    for (let col = 0; col < MAP_WIDTH; col++) {
      const tile = MAP[row][col];
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;
      
      // Always place floor first (except for walls)
      if (tile !== 'W') {
        const floorSprite = new PIXI.Sprite(sprites.floor);
        floorSprite.x = x;
        floorSprite.y = y;
        floorSprite.width = TILE_SIZE;
        floorSprite.height = TILE_SIZE;
        mapLayer.addChild(floorSprite);
      }
      
      // Then place the specific tile
      let spriteTexture = null;
      switch (tile) {
        case 'W':
          spriteTexture = sprites.wall;
          break;
        case 'D':
          spriteTexture = sprites.desk;
          break;
        case 'C':
          spriteTexture = sprites.chair;
          break;
        case 'F':
        case 'A':
          // Floor already placed, agent spawn handled separately
          continue;
      }
      
      if (spriteTexture) {
        const sprite = new PIXI.Sprite(spriteTexture);
        sprite.x = x;
        sprite.y = y;
        sprite.width = TILE_SIZE;
        sprite.height = TILE_SIZE;
        mapLayer.addChild(sprite);
      }
    }
  }
  
  console.log('Map rendered');
}

/* ═══════════════════════════════════════════════════════════
   AGENT SYSTEM
═══════════════════════════════════════════════════════════ */
const agents = [];

class Agent {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.isMoving = false;
    this.moveTimer = 0;
    this.idleTimer = Math.random() * 3 + 2; // 2-5 seconds initial idle
    
    // Create sprite
    this.sprite = new PIXI.Sprite(sprites.agent);
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.width = TILE_SIZE;
    this.sprite.height = TILE_SIZE;
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.x += TILE_SIZE / 2;
    this.sprite.y += TILE_SIZE / 2;
    
    agentLayer.addChild(this.sprite);
  }
  
  update(deltaTime) {
    if (this.isMoving) {
      this.updateMovement(deltaTime);
    } else {
      this.updateIdle(deltaTime);
    }
  }
  
  updateMovement(deltaTime) {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 2) {
      // Reached target
      this.x = this.targetX;
      this.y = this.targetY;
      this.isMoving = false;
      this.idleTimer = Math.random() * 4 + 2; // 2-6 seconds idle
    } else {
      // Move towards target
      const moveDistance = AGENT_SPEED * deltaTime;
      this.x += (dx / distance) * moveDistance;
      this.y += (dy / distance) * moveDistance;
    }
    
    // Update sprite position
    this.sprite.x = this.x + TILE_SIZE / 2;
    this.sprite.y = this.y + TILE_SIZE / 2;
  }
  
  updateIdle(deltaTime) {
    this.idleTimer -= deltaTime;
    
    if (this.idleTimer <= 0) {
      this.pickNewTarget();
    }
  }
  
  pickNewTarget() {
    // Find random walkable position
    const maxAttempts = 50;
    for (let i = 0; i < maxAttempts; i++) {
      const col = Math.floor(Math.random() * MAP_WIDTH);
      const row = Math.floor(Math.random() * MAP_HEIGHT);
      const tile = MAP[row][col];
      
      // Can walk on floor, agent spawn, and furniture
      if (tile === 'F' || tile === 'A' || tile === 'C' || tile === 'D') {
        this.targetX = col * TILE_SIZE;
        this.targetY = row * TILE_SIZE;
        this.isMoving = true;
        return;
      }
    }
    
    // If no valid target found, idle longer
    this.idleTimer = 2;
  }
}

function spawnAgents() {
  // Find agent spawn points
  for (let row = 0; row < MAP_HEIGHT; row++) {
    for (let col = 0; col < MAP_WIDTH; col++) {
      if (MAP[row][col] === 'A') {
        const agent = new Agent(col * TILE_SIZE, row * TILE_SIZE);
        agents.push(agent);
      }
    }
  }
  
  console.log(`Spawned ${agents.length} agents`);
}

/* ═══════════════════════════════════════════════════════════
   GAME LOOP
═══════════════════════════════════════════════════════════ */
function gameLoop(ticker) {
  const deltaTime = Math.min(ticker.deltaMS / 1000, 0.1);
  
  // Update all agents
  agents.forEach(agent => {
    agent.update(deltaTime);
  });
}

/* ═══════════════════════════════════════════════════════════
   INITIALIZATION
═══════════════════════════════════════════════════════════ */
async function init() {
  console.log('Initializing Hermes Workspace Simulation...');
  
  // Load assets
  await loadAssets();
  
  // Render map
  renderMap();
  
  // Spawn agents
  spawnAgents();
  
  // Start game loop
  app.ticker.add(gameLoop);
  
  console.log('Simulation started!');
}

// Start the simulation
init();

})();