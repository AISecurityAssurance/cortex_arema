'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { validatePassword } from '@/lib/auth/passwordValidation';
import { PasswordRequirements } from '@/components/auth/PasswordRequirements';
import '@/components/auth/PasswordRequirements.css';
import '../login/page.css';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<ReturnType<typeof validatePassword> | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signup } = useAuth();

  useEffect(() => {
    if (password) {
      setPasswordValidation(validatePassword(password));
    } else {
      setPasswordValidation(null);
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!passwordValidation?.isValid) {
      setError('Please meet all password requirements');
      return;
    }

    setIsLoading(true);

    try {
      await signup(email, password, name);
    } catch (error) {
      console.error('Signup error:', error);
      setError('Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="auth-form-section">
          <div className="auth-form-container">
            <div className="auth-header">
              <Link href="/" className="auth-logo">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="currentColor"
                >
                  <path d="M16 4L8 8V16C8 20.8 10.46 25.16 14.12 27.56L16 28L17.88 27.56C21.54 25.16 24 20.8 24 16V8L16 4Z" />
                </svg>
                <span>Cortex Arena</span>
              </Link>
              <h1>Create an account</h1>
              <p>Start securing your systems with AI-powered analysis</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && (
                <div className="auth-error">
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    placeholder="Create a strong password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {(passwordFocused || password) && passwordValidation && (
                  <PasswordRequirements
                    requirements={passwordValidation.requirements}
                    strength={passwordValidation.strength}
                    showStrength={password.length > 0}
                  />
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm password</label>
                <div className="password-input-wrapper">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="auth-terms">
                <label className="auth-checkbox">
                  <input type="checkbox" required />
                  <span>
                    I agree to the{' '}
                    <Link href="/terms" className="auth-link">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="auth-link">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>

              <div className="auth-divider">
                <span>or continue with</span>
              </div>

              <div className="social-auth-buttons">
                <button type="button" className="social-auth-btn">
                  <svg width="20" height="20" viewBox="0 0 20 20">
                    <path
                      d="M18.9 10.2c0-.6 0-1.2-.1-1.7H10v3.2h5c-.2 1.2-.9 2.1-1.8 2.7v2.3h2.9c1.7-1.6 2.8-3.9 2.8-6.5z"
                      fill="#4285F4"
                    />
                    <path
                      d="M10 19c2.4 0 4.5-.8 6-2.2l-2.9-2.3c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H1.9v2.4C3.4 17.1 6.5 19 10 19z"
                      fill="#34A853"
                    />
                    <path
                      d="M4.9 11.6c-.4-1.2-.4-2.4 0-3.6V5.6H1.9C.7 7.9.2 10.5 1.9 13l3-2.4z"
                      fill="#FBBC04"
                    />
                    <path
                      d="M10 4c1.3 0 2.5.5 3.4 1.3l2.6-2.6C14.5 1.2 12.4.2 10 .2 6.5.2 3.4 2.1 1.9 5l3 2.4C5.6 5.6 7.6 4 10 4z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </button>
                <button type="button" className="social-auth-btn">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 0C4.5 0 0 4.5 0 10c0 4.4 2.9 8.2 6.8 9.5.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1 .8-.2 1.6-.3 2.5-.3s1.7.1 2.5.3c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9v2.7c0 .3.2.6.7.5C17.1 18.2 20 14.4 20 10c0-5.5-4.5-10-10-10z"/>
                  </svg>
                  GitHub
                </button>
              </div>
            </form>

            <div className="auth-footer">
              <p>
                Already have an account?{' '}
                <Link href="/auth/login" className="auth-link">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="auth-visual-section">
          <div className="auth-visual-content">
            <h2>Enterprise-Grade Security Analysis</h2>
            <p>
              Join thousands of security professionals using Cortex Arena to identify
              vulnerabilities and strengthen their systems.
            </p>
            <div className="auth-features">
              <div className="auth-feature">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2L4 5v5c0 3.55 1.84 6.74 4.62 8.47L10 19l1.38-.53C14.16 16.74 16 13.55 16 10V5l-6-3z"/>
                </svg>
                <span>STRIDE & STPA-SEC frameworks</span>
              </div>
              <div className="auth-feature">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M12 2L2 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-8-5z"/>
                </svg>
                <span>Attack tree visualization</span>
              </div>
              <div className="auth-feature">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Multi-model consensus analysis</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}