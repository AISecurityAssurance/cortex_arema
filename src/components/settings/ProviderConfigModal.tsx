"use client";

import React from 'react';
import './ProviderConfigModal.css';

interface ProviderConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSave?: () => void;
  showSaveButton?: boolean;
}

export const ProviderConfigModal: React.FC<ProviderConfigModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onSave,
  showSaveButton = true
}) => {
  if (!isOpen) return null;

  const handleSave = () => {
    onSave?.();
    onClose();
  };

  return (
    <>
      <div className="provider-modal-backdrop" onClick={onClose} />
      <div className="provider-modal">
        <div className="provider-modal-header">
          <h2>{title}</h2>
          <button className="provider-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="provider-modal-content">
          {children}
        </div>

        <div className="provider-modal-footer">
          <button className="provider-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          {showSaveButton && (
            <button className="provider-modal-save" onClick={handleSave}>
              Save Configuration
            </button>
          )}
        </div>
      </div>
    </>
  );
};