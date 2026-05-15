/**
 * Hermes AI Agent Simulation — PixiJS Standalone Renderer
 * REAL simulation: agents have jobs, move intelligently, work at stations.
 * NOT a static demo.
 */
(function () {
'use strict';

const TILE = 32, COLS = 40, ROWS = 28;
const WORLD_W = COLS * TILE, WORLD_H = ROWS * TILE;
const SPEED = 70; // pixels/sec
const ARRIVE = 8;

// ROOMS — each has a PURPOSE
const ROOMS = [
  { id:'engineering', name:'Engineering', purpose:'coding', x:1,y:1,w:13,h:11, color:0x1c2840 },
  { id:'research', name:'Research', purpose:'research', x:15,y:1,w:11,h:11, color:0x1c1f3d },
  { id:'operations', name:'Operations', purpose:'ops', x:27,y:1,w:12,h:11, color:0x1f301c },
  { id:'meeting', name:'Meeting Room', purpose:'meeting', x:1,y:13,w:10,h:10, color:0x301c30 },
  { id:'lounge', name:'Lounge', purpose:'break', x:12,y:13,w:14,h:10, color:0x1c302e },
  { id:'server', name:'Server Room', purpose:'server_check', x:27,y:13,w:12,h:10, color:0x1a1a28 },
];

// WORKSTATIONS per room
const STATIONS = {
  engineering: [
    {x:3,y:3},{x:5,y:3},{x:7,y:3},{x:9,y:3},{x:11,y:3},
    {x:3,y:7},{x:5,y:7},{x:7,y:7},{x:9,y:7},{x:11,y:7}
  ],
  research: [{x:17,y:4},{x:19,y:4},{x:21,y:4},{x:17,y:8},{x:19,y:8}],
  operations: [{x:29,y:4},{x:31,y:4},{x:33,y:4},{x:35,y:4},{x:29,y:8},{x:31,y:8}],
  meeting: [{x:4,y:15},{x:5,y:15},{x:6,y:15},{x:7,y:15},{x:4,y:17},{x:5,y:17},{x:6,y:17},{x:7,y:17}],
  lounge: [{x:14,y:15},{x:14,y:19},{x:18,y:15},{x:18,y:19},{x:22,y:17}],
  server: [{x:29,y:15},{x:31,y:15},{x:33,y:15},{x:35,y:15}],
};

// JOBS — what agents actually do
const JOBS = [
  { id:'coding', label:'Writing Code', room:'engineering', dur:[8,18], roles:['developer','manager'] },
  { id:'code_review', label:'Code Review', room:'engineering', dur:[5,12], roles:['developer','manager'] },
  { id:'research', label:'Research', room:'research', dur:[10,20], roles:['researcher','developer'] },
  { id:'brainstorm', label:'Brainstorming', room:'research', dur:[6,14], roles:['researcher','manager'] },
  { id:'monitoring', label:'Monitoring', room:'operations', dur:[6,15], roles:['ops','developer'] },
  { id:'deploying', label:'Deploying', room:'operations', dur:[4,10], roles:['ops'] },
  { id:'server_check', label:'Server Check', room:'server', dur:[3,8], roles:['ops'] },
  { id:'meeting', label:'Team Meeting', room:'meeting', dur:[10,20], roles:['developer','researcher','ops','manager'] },
  { id:'break', label:'Coffee Break', room:'lounge', dur:[4,8], roles:['developer','researcher','ops','manager'] },
];

// AGENTS
const AGENT_DEFS = [
  { name:'Alice', role:'developer', home:'engineering', color:0x00e5cc },
  { name:'Bob', role:'developer', home:'engineering', color:0x00bbff },
  { name:'Charlie', role:'developer', home:'engineering', color:0x55ffaa },
  { name:'Diana', role:'researcher', home:'research', color:0xff9944 },
  { name:'Eve', role:'researcher', home:'research', color:0xffcc00 },
  { name:'Frank', role:'researcher', home:'research', color:0xffaa77 },
  { name:'Grace', role:'ops', home:'operations', color:0x44ff88 },
  { name:'Hank', role:'ops', home:'operations', color:0x88ffcc },
  { name:'Iris', role:'ops', home:'server', color:0x66ffaa },
  { name:'Jack', role:'manager', home:'meeting', color:0xff66aa },
  { name:'Kate', role:'manager', home:'engineering', color:0xaa66ff },
  { name:'Leo', role:'developer', home:'engineering', color:0x66ccff },
];

// FURNITURE
const FURNITURE = [
  {type:'desk',x:3,y:3},{type:'desk',x:5,y:3},{type:'desk',x:7,y:3},{type:'desk',x:9,y:3},{type:'desk',x:11,y:3},
  {type:'desk',x:3,y:7},{type:'desk',x:5,y:7},{type:'desk',x:7,y:7},{type:'desk',x:9,y:7},{type:'desk',x:11,y:7},
  {type:'desk',x:17,y:3},{type:'desk',x:19,y:3},{type:'desk',x:21,y:3},
  {type:'desk',x:17,y:7},{type:'desk',x:19,y:7},
  {type:'desk',x:29,y:3},{type:'desk',x:31,y:3},{type:'desk',x:33,y:3},{type:'desk',x:35,y:3},
  {type:'desk',x:29,y:7},{type:'desk',x:31,y:7},{type:'desk',x:33,y:7},{type:'desk',x:35,y:7},
  {type:'table',x:4,y:16},{type:'table',x:5,y:16},{type:'table',x:6,y:16},{type:'table',x:7,y:16},
  {type:'sofa',x:14,y:15},{type:'sofa',x:14,y:19},{type:'sofa',x:18,y:15},{type:'sofa',x:18,y:19},
  {type:'table',x:16,y:17},
  {type:'desk',x:29,y:15},{type:'desk',x:31,y:15},{type:'desk',x:33,y:15},{type:'desk',x:35,y:15},
];

// ═══════════════════════════════════════════════════
// PIXI SETUP
// ═══════════════════════════════════════════════════
const app = new PIXI.Application({
  resizeTo: window,
  backgroundColor: 0x0a0e17,
  antialias: false,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});
document.getElementById('workspace-container').appendChild(app.view);

const world = new PIXI.Container();
const floorLayer = new PIXI.Container();
const tintLayer = new PIXI.Container();
const wallLayer = new PIXI.Container();
const furnitureLayer = new PIXI.Container();
const agentLayer = new PIXI.Container();
const labelLayer = new PIXI.Container();
world.addChild(floorLayer, tintLayer, wallLayer, furnitureLayer, agentLayer, labelLayer);
app.stage.addChild(world);

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

// ═══════════════════════════════════════════════════
// TEXTURE GENERATION
// ═══════════════════════════════════════════════════
function genTextures() {
  const t = {};
  let g;
  // Floor
  g = new PIXI.Graphics();
  g.beginFill(0x3a3f4a); g.drawRect(0,0,TILE,TILE); g.endFill();
  g.beginFill(0x3e4450,0.6); g.drawRect(2,2,12,12); g.endFill();
  g.beginFill(0x2a2f38,0.8); g.drawRect(0,0,TILE,1); g.drawRect(0,0,1,TILE); g.endFill();
  t.floor = app.renderer.generateTexture(g); g.destroy();
  // Wall
  g = new PIXI.Graphics();
  g.beginFill(0x1a1e28); g.drawRect(0,0,TILE,TILE); g.endFill();
  g.beginFill(0x4a5568); g.drawRect(2,2,TILE-4,TILE-4); g.endFill();
  g.beginFill(0x5a6578); g.drawRect(3,3,TILE-8,2); g.endFill();
  t.wall = app.renderer.generateTexture(g); g.destroy();
  // Desk
  g = new PIXI.Graphics();
  g.beginFill(0x6b4c2a); g.drawRect(2,6,28,20); g.endFill();
  g.beginFill(0x1a2030); g.drawRect(8,9,16,10); g.endFill();
  g.beginFill(0x2244aa,0.6); g.drawRect(9,10,14,8); g.endFill();
  t.desk = app.renderer.generateTexture(g); g.destroy();
  // Table
  g = new PIXI.Graphics();
  g.beginFill(0x5c7c5a); g.drawRect(2,4,28,24); g.endFill();
  g.beginFill(0x6d8d6a); g.drawRect(2,4,28,2); g.endFill();
  t.table = app.renderer.generateTexture(g); g.destroy();
  // Sofa
  g = new PIXI.Graphics();
  g.beginFill(0x7a2e4a); g.drawRoundedRect(2,4,28,24,4); g.endFill();
  g.beginFill(0x9e4060); g.drawRoundedRect(5,8,22,16,3); g.endFill();
  t.sofa = app.renderer.generateTexture(g); g.destroy();
  // Chair
  g = new PIXI.Graphics();
  g.beginFill(0x374151); g.drawCircle(16,16,8); g.endFill();
  g.beginFill(0x4b5563); g.drawCircle(16,15,6); g.endFill();
  t.chair = app.renderer.generateTexture(g); g.destroy();
  // Agent base
  g = new PIXI.Graphics();
  g.beginFill(0x000000,0.25); g.drawEllipse(16,26,8,4); g.endFill();
  g.beginFill(0xffffff); g.drawRoundedRect(8,14,16,14,3); g.endFill();
  g.beginFill(0xffffff); g.drawCircle(16,10,7); g.endFill();
  t.agent = app.renderer.generateTexture(g); g.destroy();
  return t;
}

// ═══════════════════════════════════════════════════
// WORLD BUILD
// ═══════════════════════════════════════════════════
function buildWorld(tex) {
  // Floor
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    const s = new PIXI.Sprite(tex.floor); s.x=c*TILE; s.y=r*TILE; floorLayer.addChild(s);
  }
  // Room tints
  ROOMS.forEach(rm => {
    const g = new PIXI.Graphics();
    g.beginFill(rm.color,0.5); g.drawRect((rm.x+1)*TILE,(rm.y+1)*TILE,(rm.w-2)*TILE,(rm.h-2)*TILE); g.endFill();
    tintLayer.addChild(g);
  });
  // Walls
  const placed = new Set();
  ROOMS.forEach(rm => {
    for (let c=rm.x;c<rm.x+rm.w;c++) { pw(c,rm.y,tex,placed); pw(c,rm.y+rm.h-1,tex,placed); }
    for (let r=rm.y;r<rm.y+rm.h;r++) { pw(rm.x,r,tex,placed); pw(rm.x+rm.w-1,r,tex,placed); }
  });
  // Furniture
  FURNITURE.forEach(f => {
    const t = tex[f.type]; if(!t)return;
    const s = new PIXI.Sprite(t); s.x=f.x*TILE; s.y=f.y*TILE; s.width=TILE; s.height=TILE;
    furnitureLayer.addChild(s);
  });
  // Room labels
  ROOMS.forEach(rm => {
    const l = new PIXI.Text(rm.name, {fontFamily:'monospace',fontSize:9,fill:0x88ccbb,dropShadow:true,dropShadowDistance:1,dropShadowAlpha:0.9});
    l.anchor.set(0.5); l.x=(rm.x+rm.w/2)*TILE; l.y=(rm.y+1.5)*TILE; l.alpha=0.85;
    labelLayer.addChild(l);
  });
}
function pw(c,r,tex,placed) {
  const k=c+','+r; if(placed.has(k))return; placed.add(k);
  const s=new PIXI.Sprite(tex.wall); s.x=c*TILE; s.y=r*TILE; wallLayer.addChild(s);
}

// ═══════════════════════════════════════════════════
// AGENT SIMULATION SYSTEM
// ═══════════════════════════════════════════════════
const agents = [];

function spawnAgents(tex) {
  AGENT_DEFS.forEach(def => {
    const rm = ROOMS.find(r=>r.id===def.home);
    const sx = (rm.x+2+Math.random()*(rm.w-4))*TILE;
    const sy = (rm.y+2+Math.random()*(rm.h-4))*TILE;

    const sprite = new PIXI.Sprite(tex.agent);
    sprite.x=sx; sprite.y=sy; sprite.width=TILE; sprite.height=TILE; sprite.tint=def.color;
    agentLayer.addChild(sprite);

    const tag = new PIXI.Text(def.name, {fontFamily:'monospace',fontSize:7,fill:def.color,dropShadow:true,dropShadowDistance:1,dropShadowAlpha:0.9});
    tag.anchor.set(0.5,1); tag.x=sx+TILE/2; tag.y=sy-2;
    labelLayer.addChild(tag);

    // Job label
    const jobTag = new PIXI.Text('', {fontFamily:'monospace',fontSize:6,fill:0xa5f3fc});
    jobTag.anchor.set(0.5,1); jobTag.x=sx+TILE/2; jobTag.y=sy-12; jobTag.alpha=0;
    labelLayer.addChild(jobTag);

    agents.push({
      sprite, tag, jobTag, def,
      x:sx, y:sy, tx:sx, ty:sy,
      state:'idle', // idle | moving | working
      currentRoom: def.home,
      targetRoom: null,
      job: null,
      jobTimer: 0,
      idleTimer: 1+Math.random()*3,
      bobPhase: Math.random()*Math.PI*2,
    });
  });
}

function pickJob(agent) {
  const valid = JOBS.filter(j => j.roles.includes(agent.def.role));
  // Weight home room jobs higher
  const weighted = valid.map(j => ({ j, w: j.room===agent.def.home?5 : j.id==='break'?1.5 : j.id==='meeting'?2 : 1 }));
  const total = weighted.reduce((s,w)=>s+w.w, 0);
  let r = Math.random()*total;
  for (const {j,w} of weighted) { r-=w; if(r<=0) return j; }
  return valid[0];
}

function getStationPos(roomId) {
  const sts = STATIONS[roomId];
  if (!sts||!sts.length) {
    const rm = ROOMS.find(r=>r.id===roomId);
    return { x:(rm.x+2+Math.random()*(rm.w-4))*TILE, y:(rm.y+2+Math.random()*(rm.h-4))*TILE };
  }
  const st = sts[Math.floor(Math.random()*sts.length)];
  return { x:st.x*TILE+TILE/2, y:st.y*TILE+TILE/2 };
}

// ═══════════════════════════════════════════════════
// SIMULATION TICK
// ═══════════════════════════════════════════════════
function simulate(delta) {
  const dt = delta / 60; // normalize to seconds at 60fps

  agents.forEach(a => {
    switch(a.state) {
      case 'idle':
        a.idleTimer -= dt;
        if (a.idleTimer <= 0) {
          // Pick a job
          const job = pickJob(a);
          a.job = job;
          a.targetRoom = job.room;
          const pos = getStationPos(job.room);
          a.tx = pos.x; a.ty = pos.y;
          a.state = 'moving';
          a.jobTimer = job.dur[0] + Math.random()*(job.dur[1]-job.dur[0]);
          a.jobTag.text = job.label;
          a.jobTag.alpha = 1;
        }
        // Idle bob
        a.bobPhase += 0.02*delta;
        a.sprite.y = a.y + Math.sin(a.bobPhase)*0.8;
        break;

      case 'moving': {
        const dx = a.tx - a.x;
        const dy = a.ty - a.y;
        const d = Math.sqrt(dx*dx+dy*dy);
        if (d < ARRIVE) {
          a.x = a.tx; a.y = a.ty;
          a.state = 'working';
          a.currentRoom = a.targetRoom;
          a.sprite.x = a.x; a.sprite.y = a.y;
        } else {
          const move = SPEED * dt;
          a.x += (dx/d)*move;
          a.y += (dy/d)*move;
          a.sprite.x = a.x;
          a.sprite.y = a.y;
          // Walk bob
          a.bobPhase += 0.08*delta;
          a.sprite.y += Math.sin(a.bobPhase)*1.2;
        }
        break;
      }

      case 'working':
        a.jobTimer -= dt;
        // Typing jitter
        if (Math.random()<0.04) {
          a.sprite.x = a.x + (Math.random()-0.5)*1.5;
          a.sprite.y = a.y + (Math.random()-0.5)*0.8;
        }
        if (a.jobTimer <= 0) {
          a.state = 'idle';
          a.job = null;
          a.idleTimer = 1.5 + Math.random()*3;
          a.jobTag.alpha = 0;
        }
        break;
    }

    // Update tags
    a.tag.x = a.sprite.x + TILE/2;
    a.tag.y = a.sprite.y - 2;
    a.jobTag.x = a.sprite.x + TILE/2;
    a.jobTag.y = a.sprite.y - 12;
    // Fade job tag
    if (a.state==='working') a.jobTag.alpha = 0.8+Math.sin(Date.now()*0.003)*0.2;
    else if (a.state==='moving') a.jobTag.alpha = Math.max(0, a.jobTag.alpha-dt*0.5);
  });
}

// ═══════════════════════════════════════════════════
// HUD
// ═══════════════════════════════════════════════════
function updateHUD() {
  const ac = document.getElementById('agent-count');
  const rl = document.getElementById('room-label');
  const working = agents.filter(a=>a.state==='working').length;
  const moving = agents.filter(a=>a.state==='moving').length;
  if(ac) ac.textContent = `Agents: ${agents.length} | Working: ${working} | Moving: ${moving}`;
  if(rl) rl.textContent = `Rooms: ${ROOMS.length} | Simulation: LIVE`;
}

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════
const textures = genTextures();
buildWorld(textures);
spawnAgents(textures);
app.ticker.add(simulate);
setInterval(updateHUD, 1000);
updateHUD();
console.log('[Hermes Sim] Real agent simulation initialized — ' + agents.length + ' agents with jobs');

})();
