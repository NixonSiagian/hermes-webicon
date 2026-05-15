import React from 'react';

/**
 * One floor-plan room. Positioned absolutely inside the workspace canvas
 * using percentage bounds so it scales to any viewport without overflow.
 *
 * `furniture` is an array of {type, top, left, width?, height?} where
 * `type` is one of: desk | chair | table | sofa.
 */
export default function Room({ id, label, bounds, furniture = [] }) {
  const style = {
    top: `${bounds.top}%`,
    left: `${bounds.left}%`,
    width: `${bounds.width}%`,
    height: `${bounds.height}%`,
  };

  return (
    <section className={`room room--${id}`} data-room={id} style={style}>
      <div className="room-label">{label}</div>
      <div className="furniture-layer" aria-hidden="true">
        {furniture.map((piece, i) => (
          <div
            key={i}
            className={`furniture furniture--${piece.type}`}
            style={{
              top: `${piece.top}%`,
              left: `${piece.left}%`,
              width: piece.width ? `${piece.width}%` : undefined,
              height: piece.height ? `${piece.height}%` : undefined,
            }}
          />
        ))}
      </div>
    </section>
  );
}
