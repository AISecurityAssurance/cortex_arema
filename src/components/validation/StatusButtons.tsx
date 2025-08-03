"use client";

import React from 'react';
import { FindingValidation } from '@/types';
import './StatusButtons.css';

interface StatusButtonsProps {
  status: FindingValidation['status'];
  onChange: (status: FindingValidation['status']) => void;
}

export const StatusButtons: React.FC<StatusButtonsProps> = ({
  status,
  onChange
}) => {
  const statuses: Array<{
    value: FindingValidation['status'];
    label: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      value: 'confirmed',
      label: 'Confirmed',
      color: 'success',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2ZM8 14L4 10L5.41 8.59L8 11.17L14.59 4.58L16 6L8 14Z"/>
        </svg>
      )
    },
    {
      value: 'false-positive',
      label: 'False Positive',
      color: 'error',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2ZM14 13L13 14L10 11L7 14L6 13L9 10L6 7L7 6L10 9L13 6L14 7L11 10L14 13Z"/>
        </svg>
      )
    },
    {
      value: 'needs-review',
      label: 'Needs Review',
      color: 'warning',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2ZM10 16C9.45 16 9 15.55 9 15C9 14.45 9.45 14 10 14C10.55 14 11 14.45 11 15C11 15.55 10.55 16 10 16ZM11 12H9V6H11V12Z"/>
        </svg>
      )
    }
  ];

  return (
    <div className="status-buttons">
      {statuses.map((item) => (
        <button
          key={item.value}
          className={`status-button status-${item.color} ${status === item.value ? 'active' : ''}`}
          onClick={() => onChange(item.value)}
        >
          <span className="status-icon">{item.icon}</span>
          <span className="status-label">{item.label}</span>
        </button>
      ))}
    </div>
  );
};