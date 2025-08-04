"use client";

import React from "react";
import { Point } from "../types/pipeline";

interface ConnectionLineProps {
  from: Point;
  to: Point;
  isValid?: boolean;
  isTemporary?: boolean;
  onClick?: () => void;
}

export function ConnectionLine({ from, to, isValid = true, isTemporary = false, onClick }: ConnectionLineProps) {
  const midX = (from.x + to.x) / 2;
  const controlPoint1 = { x: midX, y: from.y };
  const controlPoint2 = { x: midX, y: to.y };

  const pathData = `M ${from.x} ${from.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${to.x} ${to.y}`;

  return (
    <g>
      <path
        d={pathData}
        fill="none"
        stroke={isValid ? "var(--connection-default)" : "var(--connection-invalid)"}
        strokeWidth="2"
        strokeDasharray={isTemporary ? "5,5" : undefined}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
        onClick={onClick}
      />
      {!isTemporary && (
        <path
          d={pathData}
          fill="none"
          stroke="transparent"
          strokeWidth="10"
          style={{ cursor: onClick ? 'pointer' : 'default' }}
          onClick={onClick}
        />
      )}
    </g>
  );
}