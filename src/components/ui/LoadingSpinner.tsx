import React from 'react';
import { Spinner } from '@cloudscape-design/components';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}

// Map our sizes to Cloudscape sizes
const sizeMap = {
  small: 'normal' as const,
  medium: 'normal' as const,
  large: 'large' as const
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  className = ''
}) => {
  return (
    <Spinner 
      size={sizeMap[size]}
      className={className}
    />
  );
};