import type * as React from "react";
import { AGENT_FRAMES, type SpriteAgent, type SpriteState } from "./frames";
import { colorForKey } from "./palette";

export interface PixSpriteProps {
  agent: SpriteAgent;
  state: SpriteState;
  size?: number;
  frameIndex?: number;
  className?: string;
}

/**
 * Renders a single sprite frame as an SVG grid of crisp <rect>s.
 * Data lives in frames.ts (16x16 palette-key grid); this component is
 * purely a renderer and scales with `image-rendering: pixelated`.
 */
export function PixSprite({
  agent,
  state,
  size = 96,
  frameIndex = 0,
  className,
}: PixSpriteProps) {
  const frames = AGENT_FRAMES[agent]?.[state];
  const frame = frames && frames.length > 0 ? frames[frameIndex % frames.length] : [];

  const cell = size / 16;
  const rects: React.ReactNode[] = [];

  for (let y = 0; y < frame.length; y++) {
    const row = frame[y];
    for (let x = 0; x < row.length; x++) {
      const key = row[x];
      if (!key || key === ".") continue;
      rects.push(
        <rect
          key={`${x}-${y}`}
          x={x * cell}
          y={y * cell}
          width={cell}
          height={cell}
          fill={colorForKey(key)}
        />
      );
    }
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={className}
      style={{ imageRendering: "pixelated" }}
      aria-hidden="true"
    >
      {rects}
    </svg>
  );
}
