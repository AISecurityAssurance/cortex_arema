'use client';

import React from 'react';
import { Check, X } from 'lucide-react';

interface Requirement {
  id: string;
  label: string;
  met: boolean;
}

interface PasswordRequirementsProps {
  requirements: Requirement[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
  showStrength?: boolean;
}

export function PasswordRequirements({
  requirements,
  strength,
  showStrength = true
}: PasswordRequirementsProps) {
  const strengthColors = {
    weak: '#ef4444',    // red
    fair: '#f97316',    // orange
    good: '#eab308',    // yellow
    strong: '#22c55e',  // green
  };

  const strengthLabels = {
    weak: 'Weak',
    fair: 'Fair',
    good: 'Good',
    strong: 'Strong',
  };

  return (
    <div className="password-requirements">
      {showStrength && (
        <div className="password-strength">
          <div className="password-strength-label">
            <span>Password strength:</span>
            <span style={{ color: strengthColors[strength], fontWeight: 500 }}>
              {strengthLabels[strength]}
            </span>
          </div>
          <div className="password-strength-bar">
            <div
              className="password-strength-bar-fill"
              style={{
                width: strength === 'weak' ? '25%' :
                       strength === 'fair' ? '50%' :
                       strength === 'good' ? '75%' : '100%',
                backgroundColor: strengthColors[strength],
              }}
            />
          </div>
        </div>
      )}

      <ul className="requirements-list">
        {requirements.map((req) => (
          <li key={req.id} className={`requirement-item ${req.met ? 'met' : 'unmet'}`}>
            {req.met ? (
              <Check className="requirement-icon" size={14} />
            ) : (
              <X className="requirement-icon" size={14} />
            )}
            <span className="requirement-label">{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}