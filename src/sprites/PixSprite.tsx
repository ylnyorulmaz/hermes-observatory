// src/sprites/PixSprite.tsx — renders a Frame as crisp SVG <rect> pixels.
import type { ReactElement } from 'react';
import { PALETTE } from './palette';
import type { Frame } from './frames';

export function PixSprite({
  frame,
  size = 128,
  className,
}: {
  frame: Frame;
  size?: number;
  className?: string;
}): ReactElement {
  const cols = frame[0]?.length ?? 16;
  const rows = frame.length;
  const rects: ReactElement[] = [];
  for (let y = 0; y < rows; y++) {
    const row = frame[y] ?? '';
    for (let x = 0; x < cols; x++) {
      const key = row[x] ?? '.';
      const color = PALETTE[key];
      if (!color || color === 'transparent') continue;
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} />);
    }
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${cols} ${rows}`}
      className={className}
      style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}
      aria-hidden="true"
      focusable="false"
    >
      {rects}
    </svg>
  );
}
