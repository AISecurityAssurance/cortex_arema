"use client";

import React from 'react';
import './RatingScale.css';

interface RatingScaleProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  scale?: 1 | 2 | 3 | 4 | 5;
  descriptions?: string[];
}

export const RatingScale: React.FC<RatingScaleProps> = ({
  label,
  value,
  onChange,
  scale = 5,
  descriptions
}) => {
  const defaultDescriptions = [
    'Very Poor',
    'Poor',
    'Fair',
    'Good',
    'Excellent'
  ];

  const getDescription = (index: number) => {
    if (descriptions && descriptions[index]) {
      return descriptions[index];
    }
    return defaultDescriptions[index] || '';
  };

  return (
    <div className="rating-scale">
      <div className="rating-header">
        <label className="rating-label">{label}</label>
        <span className="rating-value">{value}/{scale}</span>
      </div>
      
      <div className="rating-buttons">
        {Array.from({ length: scale }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            className={`rating-button ${value >= num ? 'active' : ''}`}
            onClick={() => onChange(num)}
            title={getDescription(num - 1)}
          >
            <span className="rating-number">{num}</span>
            <div className="rating-fill" />
          </button>
        ))}
      </div>
      
      <div className="rating-description">
        {getDescription(value - 1)}
      </div>
    </div>
  );
};