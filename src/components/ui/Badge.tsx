import React from 'react';
import './Badge.css';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  rounded?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'medium',
  rounded = false,
  className = ''
}) => {
  return (
    <span 
      className={`badge badge-${variant} badge-${size} ${rounded ? 'badge-rounded' : ''} ${className}`}
    >
      {children}
    </span>
  );
};