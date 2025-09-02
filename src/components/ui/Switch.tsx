import React from 'react';
import './Switch.css';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  id
}) => {
  const handleClick = () => {
    if (!disabled) {
      onCheckedChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === ' ' || e.key === 'Enter') && !disabled) {
      e.preventDefault();
      onCheckedChange(!checked);
    }
  };

  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={`switch ${checked ? 'switch-checked' : ''} ${disabled ? 'switch-disabled' : ''}`}
    >
      <span className="switch-thumb" />
    </button>
  );
};