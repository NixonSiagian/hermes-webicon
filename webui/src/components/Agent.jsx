import React from 'react';

// PNG sprites are shipped in webui/public/sprites and copied verbatim into
// the build output. Because the Vite config uses base: './' the resolved
// path stays relative to the page, so the bundle works whether it's served
// from the site root or from a sub-mount like /session/.
const SPRITE_BY_ROLE = {
  engineering: 'sprites/dev.png',
  research: 'sprites/research.png',
  operations: 'sprites/ops.png',
  meeting: 'sprites/manager.png',
  lounge: 'sprites/manager.png',
};

/**
 * An agent rendered as a PNG sprite. Position is given in workspace
 * percentage coordinates (x, y in 0..100). The CSS `transition` on .agent
 * smoothly animates movement when those coordinates change, so the
 * simulation tick can just set new (x, y) and the browser handles the
 * tweening — no per-frame requestAnimationFrame work needed.
 */
export default function Agent({ role, name, x, y }) {
  const sprite = SPRITE_BY_ROLE[role] || 'sprites/manager.png';
  return (
    <div
      className="agent"
      style={{ left: `${x}%`, top: `${y}%` }}
      title={name}
      data-role={role}
    >
      <img className="agent-sprite" src={sprite} alt="" draggable={false} />
      <span className="agent-name">{name}</span>
    </div>
  );
}
