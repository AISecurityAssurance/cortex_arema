export interface PasswordRequirement {
  id: string;
  label: string;
  validator: (password: string) => boolean;
}

export const passwordRequirements: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'At least 8 characters',
    validator: (password: string) => password.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'Contains uppercase letter',
    validator: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    label: 'Contains lowercase letter',
    validator: (password: string) => /[a-z]/.test(password),
  },
  {
    id: 'number',
    label: 'Contains number',
    validator: (password: string) => /\d/.test(password),
  },
  {
    id: 'special',
    label: 'Contains special character (!@#$%^&*)',
    validator: (password: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  },
];

export function validatePassword(password: string): {
  isValid: boolean;
  requirements: Array<{ id: string; label: string; met: boolean }>;
  strength: 'weak' | 'fair' | 'good' | 'strong';
} {
  const requirements = passwordRequirements.map(req => ({
    id: req.id,
    label: req.label,
    met: req.validator(password),
  }));

  const metCount = requirements.filter(r => r.met).length;
  const isValid = requirements.every(r => r.met);

  let strength: 'weak' | 'fair' | 'good' | 'strong';
  if (metCount <= 2) {
    strength = 'weak';
  } else if (metCount === 3) {
    strength = 'fair';
  } else if (metCount === 4) {
    strength = 'good';
  } else {
    strength = 'strong';
  }

  return { isValid, requirements, strength };
}