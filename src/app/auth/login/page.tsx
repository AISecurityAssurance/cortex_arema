'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import './page.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (error) {
      console.error('Login error:', error);
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
              <h1>Welcome back</h1>
              <p>Sign in to continue your security analysis</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  <span>Password</span>
                  <Link href="/auth/forgot" className="forgot-link">
                    Forgot password?
                  </Link>
                </label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
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
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
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
                Don't have an account?{' '}
                <Link href="/auth/signup" className="auth-link">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="auth-visual-section">
          <div className="auth-visual-content">
            <h2>AI-Powered Security Analysis</h2>
            <p>
              Compare threat assessments from multiple AI models, validate findings,
              and generate comprehensive security reports.
            </p>
            <div className="auth-features">
              <div className="auth-feature">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2L4 5v5c0 3.55 1.84 6.74 4.62 8.47L10 19l1.38-.53C14.16 16.74 16 13.55 16 10V5l-6-3z"/>
                </svg>
                <span>Multi-model threat analysis</span>
              </div>
              <div className="auth-feature">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Professional validation workflow</span>
              </div>
              <div className="auth-feature">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 3h14v2H3V3zm0 4h14v2H3V7zm0 4h10v2H3v-2zm0 4h8v2H3v-2z"/>
                </svg>
                <span>Comprehensive security reports</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}