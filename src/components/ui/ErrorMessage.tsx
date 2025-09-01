import React from 'react';
import { Alert } from '@cloudscape-design/components';

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  onDismiss?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  type = 'error',
  onDismiss,
  className = ''
}) => {
  return (
    <Alert
      type={type}
      dismissible={!!onDismiss}
      onDismiss={onDismiss}
      header={title}
      className={className}
    >
      {message}
    </Alert>
  );
};