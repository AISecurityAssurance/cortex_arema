"use client";

import React, { useState, useEffect } from 'react';
import './ValidationNotes.css';

interface ValidationNotesProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export const ValidationNotes: React.FC<ValidationNotesProps> = ({
  value,
  onChange,
  placeholder = 'Add notes...',
  maxLength = 1000
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localValue !== value) {
        setIsSaving(true);
        onChange(localValue);
        setTimeout(() => setIsSaving(false), 500);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [localValue, value, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      setLocalValue(newValue);
    }
  };

  const remainingChars = maxLength - localValue.length;
  const percentUsed = (localValue.length / maxLength) * 100;

  return (
    <div className="validation-notes">
      <div className="notes-header">
        <span className="notes-label">Notes</span>
        {isSaving && (
          <span className="saving-indicator">Saving...</span>
        )}
      </div>
      
      <textarea
        className="notes-textarea"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        rows={6}
      />
      
      <div className="notes-footer">
        <div className="character-count">
          <span className={remainingChars < 100 ? 'warning' : ''}>
            {remainingChars} characters remaining
          </span>
          <div className="character-bar">
            <div 
              className="character-fill"
              style={{ 
                width: `${percentUsed}%`,
                backgroundColor: percentUsed > 90 ? 'var(--color-warning)' : 'var(--color-primary)'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};