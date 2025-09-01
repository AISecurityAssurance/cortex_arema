"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Flashbar, FlashbarProps } from '@cloudscape-design/components';
import { v4 as uuidv4 } from 'uuid';

export type MessageType = 'success' | 'error' | 'warning' | 'info';

interface FlashbarContextType {
  showToast: (message: string, type?: MessageType, duration?: number) => void;
  showMessage: (message: string, type?: MessageType, duration?: number) => void;
}

const FlashbarContext = createContext<FlashbarContextType | undefined>(undefined);

export const FlashbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<FlashbarProps.MessageDefinition[]>([]);

  const showMessage = useCallback((
    message: string, 
    type: MessageType = 'info', 
    duration: number = 3000
  ) => {
    const id = uuidv4();
    const newItem: FlashbarProps.MessageDefinition = {
      id,
      type: type === 'error' ? 'error' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info',
      content: message,
      dismissible: true,
      onDismiss: () => removeItem(id)
    };

    console.log('ShowMessage called:', { message, type, id });
    
    setItems(prev => [...prev, newItem]);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        removeItem(id);
      }, duration);
    }
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  // Alias for backward compatibility
  const showToast = showMessage;

  return (
    <FlashbarContext.Provider value={{ showToast, showMessage }}>
      {children}
      <Flashbar items={items} />
    </FlashbarContext.Provider>
  );
};

export const useFlashbar = () => {
  const context = useContext(FlashbarContext);
  if (!context) {
    throw new Error('useFlashbar must be used within a FlashbarProvider');
  }
  return context;
};

// Backward compatibility export
export const useToast = () => {
  const context = useContext(FlashbarContext);
  if (!context) {
    throw new Error('useToast must be used within a FlashbarProvider');
  }
  // Return interface compatible with old ToastContext
  return {
    showToast: context.showToast
  };
};