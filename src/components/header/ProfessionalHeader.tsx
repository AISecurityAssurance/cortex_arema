"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, ChevronDown, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import "./ProfessionalHeader.css";

interface ProfessionalHeaderProps {
  onSettingsClick?: () => void;
  onHistoryClick?: () => void;
  onExportClick?: () => void;
  analysisProgress?: {
    current: number;
    total: number;
  };
  validationCount?: number;
  sessionId?: string;
}

export const ProfessionalHeader: React.FC<ProfessionalHeaderProps> = ({
  analysisProgress,
  validationCount,
}) => {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="professional-header">
      <div className="header-container">
        <div className="header-left">
          <Link href="/" className="header-logo">
            <svg
              className="logo-icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 2L2 7V12C2 16.5 4.23 20.68 7.62 23.38L12 24L16.38 23.38C19.77 20.68 22 16.5 22 12V7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 7V12L15 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="logo-text">Cortex Arena</span>
          </Link>

          {isAuthenticated && (
            <nav className="header-nav">
              <Link
                href="/analysis"
                className={`nav-link ${
                  pathname.startsWith("/analysis") ? "active" : ""
                }`}
              >
                Analysis
              </Link>
              <Link
                href="/sessions"
                className={`nav-link ${
                  pathname.startsWith("/sessions") ? "active" : ""
                }`}
              >
                Sessions
              </Link>
              <Link
                href="/templates"
                className={`nav-link ${
                  pathname.startsWith("/templates") ? "active" : ""
                }`}
              >
                Templates
              </Link>
              <Link
                href="/attack-tree"
                className={`nav-link ${
                  pathname.startsWith("/attack-tree") ? "active" : ""
                }`}
              >
                Attack Tree
              </Link>
              <Link
                href="/pipeline-editor"
                className={`nav-link ${
                  pathname.startsWith("/pipeline-editor") ? "active" : ""
                }`}
              >
                Pipeline Editor
              </Link>
            </nav>
          )}
        </div>

        <div className="header-center">
          {analysisProgress && (
            <div className="analysis-progress">
              <span className="progress-label">Analysis Progress</span>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${
                      (analysisProgress.current / analysisProgress.total) * 100
                    }%`,
                  }}
                />
              </div>
              <span className="progress-text">
                {analysisProgress.current} / {analysisProgress.total}
              </span>
            </div>
          )}
        </div>

        <div className="header-right">
          {validationCount !== undefined && (
            <div className="validation-status">
              <span className="status-label">Validations</span>
              <span className="status-count">{validationCount}</span>
            </div>
          )}
          {isAuthenticated && user ? (
            <div className="user-menu" ref={dropdownRef}>
              <button
                className="user-avatar-btn"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-label="User menu"
              >
                <div className="user-avatar">
                  {user.initials}
                </div>
                <ChevronDown size={16} className={`chevron-icon ${isDropdownOpen ? 'open' : ''}`} />
              </button>
              {isDropdownOpen && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                  <div className="dropdown-divider" />
                  <Link
                    href="/settings"
                    className="dropdown-item"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </Link>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                  >
                    <LogOut size={16} />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link href="/auth/login" className="auth-btn login-btn">
                Login
              </Link>
              <Link href="/auth/signup" className="auth-btn signup-btn">
                Start Free
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
