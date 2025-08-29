import React from 'react';
import { Badge as CloudscapeBadge } from '@cloudscape-design/components';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  rounded?: boolean;
  className?: string;
}

// Map our variants to Cloudscape colors
const variantMap = {
  default: 'grey' as const,
  primary: 'blue' as const,
  success: 'green' as const,
  warning: 'severity-medium' as const, // Use severity color for warning
  error: 'red' as const,
  info: 'blue' as const
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'medium',
  rounded = false,
  className = ''
}) => {
  return (
    <CloudscapeBadge 
      color={variantMap[variant]}
      className={className}
    >
      {children}
    </CloudscapeBadge>
  );
};