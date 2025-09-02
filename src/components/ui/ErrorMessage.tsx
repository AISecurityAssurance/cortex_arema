import React from 'react';
import './ErrorMessage.css';

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
  const icons = {
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className={`error-message error-message-${type} ${className}`}>
      <div className="error-message-content">
        <span className="error-message-icon">{icons[type]}</span>
        <div className="error-message-text">
          {title && <div className="error-message-title">{title}</div>}
          <div className="error-message-body">{message}</div>
        </div>
      </div>
      {onDismiss && (
        <button
          className="error-message-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss message"
        >
          ×
        </button>
      )}
    </div>
  );
};