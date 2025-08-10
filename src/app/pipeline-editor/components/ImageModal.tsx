"use client";

import React, { useEffect } from "react";

interface ImageModalProps {
  imageUrl: string;
  fileName: string;
  onClose: () => void;
}

export function ImageModal({ imageUrl, fileName, onClose }: ImageModalProps) {
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  return (
    <div 
      className="image-modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        cursor: 'pointer',
      }}
    >
      <div
        className="image-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90%',
          maxHeight: '90%',
          position: 'relative',
          cursor: 'default',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '-40px',
            right: 0,
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '2rem',
            cursor: 'pointer',
            padding: '0.5rem',
          }}
          aria-label="Close modal"
        >
          ×
        </button>
        <div
          style={{
            color: 'white',
            marginBottom: '1rem',
            fontSize: '1rem',
          }}
        >
          {fileName}
        </div>
        <img
          src={imageUrl}
          alt={fileName}
          style={{
            maxWidth: '100%',
            maxHeight: 'calc(90vh - 100px)',
            objectFit: 'contain',
            borderRadius: '0.5rem',
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
          }}
        />
      </div>
    </div>
  );
}