import React from 'react';
import { Toggle } from '@cloudscape-design/components';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  id,
  label = ''
}) => {
  return (
    <Toggle
      checked={checked}
      onChange={({ detail }) => onCheckedChange(detail.checked)}
      disabled={disabled}
      controlId={id}
    >
      {label}
    </Toggle>
  );
};