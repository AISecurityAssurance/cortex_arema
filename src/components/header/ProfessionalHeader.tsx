"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
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
          </nav>
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
          <Link
            href="/settings"
            className="settings-icon-link"
            title="Settings"
            aria-label="Settings"
          >
            <Settings size={20} />
          </Link>
        </div>
      </div>
    </header>
  );
};
