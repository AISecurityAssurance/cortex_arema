"use client";

import { Point } from "../types/pipeline";

interface ConnectionLineProps {
  from: Point;
  to: Point;
  isValid?: boolean;
  isTemporary?: boolean;
  isSelected?: boolean;
  isAnimated?: boolean;
  isHovered?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function ConnectionLine({ from, to, isValid = true, isTemporary = false, isSelected = false, isAnimated = false, isHovered = false, onClick, onMouseEnter, onMouseLeave }: ConnectionLineProps) {
  // Calculate control points for smoother bezier curves
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  
  // Dynamic control point offset based on distance
  const controlOffset = Math.min(Math.abs(deltaX) * 0.5, 150);
  
  // Create smoother curves that exit horizontally from nodes
  const controlPoint1 = { 
    x: from.x + controlOffset, 
    y: from.y 
  };
  const controlPoint2 = { 
    x: to.x - controlOffset, 
    y: to.y 
  };

  const pathData = `M ${from.x} ${from.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${to.x} ${to.y}`;

  const connectionId = `connection-${from.x}-${from.y}-${to.x}-${to.y}`;
  
  return (
    <g>
      {/* Define gradient for animated flow */}
      {isAnimated && (
        <defs>
          <linearGradient id={`flow-gradient-${connectionId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--connection-active)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--connection-active)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--connection-active)" stopOpacity="0" />
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              from="-1 0"
              to="1 0"
              dur="2s"
              repeatCount="indefinite"
            />
          </linearGradient>
        </defs>
      )}
      
      <path
        d={pathData}
        fill="none"
        stroke={isSelected ? "var(--connection-active)" : (isHovered ? "var(--connection-hover)" : (isValid ? "var(--connection-default)" : "var(--connection-invalid)"))}
        strokeWidth={isSelected ? "3" : (isHovered ? "3" : "2")}
        strokeDasharray={isTemporary ? "5,5" : undefined}
        style={{ 
          cursor: onClick ? 'pointer' : 'default',
          filter: isSelected ? 'drop-shadow(0 0 4px var(--connection-active))' : (isHovered ? 'drop-shadow(0 0 3px var(--connection-hover))' : undefined),
          transition: 'all 0.2s ease'
        }}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
      
      {/* Animated flow overlay */}
      {isAnimated && (
        <path
          d={pathData}
          fill="none"
          stroke={`url(#flow-gradient-${connectionId})`}
          strokeWidth="4"
          opacity="0.8"
          pointerEvents="none"
        />
      )}
      
      {/* Invisible hit area for easier selection */}
      {!isTemporary && (
        <path
          d={pathData}
          fill="none"
          stroke="transparent"
          strokeWidth="15"
          style={{ cursor: onClick ? 'pointer' : 'default' }}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        />
      )}
      
      {/* Tooltip when hovered */}
      {isHovered && !isTemporary && (
        <g transform={`translate(${(from.x + to.x) / 2}, ${(from.y + to.y) / 2})`}>
          <rect
            x="-135"
            y="-10"
            width="270"
            height="20"
            rx="4"
            fill="rgba(0, 0, 0, 0.8)"
            style={{ pointerEvents: 'none' }}
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="12"
            fontWeight="500"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            Select the connection and press the Delete key to delete
          </text>
        </g>
      )}
    </g>
  );
}