"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SessionStorage } from "@/lib/storage/sessionStorage";
import { useAuth } from "@/contexts/AuthContext";
import "./page.css";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleQuickStart = () => {
    if (isAuthenticated) {
      const session = SessionStorage.createSession("Quick Start Session");
      router.push(`/analysis?session=${session.id}`);
    } else {
      router.push('/auth/signup');
    }
  };

  const handlePipelineEditor = () => {
    if (isAuthenticated) {
      router.push('/pipeline-editor');
    } else {
      router.push('/auth/login?redirect=/pipeline-editor');
    }
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Cortex Arena</h1>
          <p className="hero-subtitle">
            Professional AI-powered security analysis sandbox platform for
            comprehensive threat modeling and vulnerability assessment
          </p>

          <div className="hero-actions">
            <button className="hero-btn primary" onClick={handleQuickStart}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 2L4 5V10C4 13.55 5.84 16.74 8.62 18.47L10 19L11.38 18.47C14.16 16.74 16 13.55 16 10V5L10 2Z" />
              </svg>
              Start Security Analysis
            </button>
            <button onClick={handlePipelineEditor} className="hero-btn secondary">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M4 4C4 2.9 4.9 2 6 2H8L10 4H14C15.1 4 16 4.9 16 6V8H14V6H9.17L7.17 4H6V12H10V14H6C4.9 14 4 13.1 4 12V4Z" />
                <path d="M12 10V12H10V14H12V16H14V14H16V12H14V10H12Z" />
                <circle cx="6" cy="8" r="1.5" />
                <circle cx="14" cy="8" r="1.5" />
                <path d="M6 8L14 8" stroke="currentColor" strokeWidth="0.5" />
              </svg>
              Visual Pipeline Editor
            </button>
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2 className="section-title">Core Features</h2>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="currentColor"
              >
                <path d="M16 4L8 8V16C8 20.8 10.46 25.16 14.12 27.56L16 28L17.88 27.56C21.54 25.16 24 20.8 24 16V8L16 4Z" />
              </svg>
            </div>
            <h3>Multi-Model Analysis</h3>
            <p>
              Compare security findings from multiple AI models including Claude
              Opus and Sonnet for comprehensive coverage
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="currentColor"
              >
                <path d="M28 8H24V6C24 4.9 23.1 4 22 4H10C8.9 4 8 4.9 8 6V8H4C2.9 8 2 8.9 2 10V26C2 27.1 2.9 28 4 28H28C29.1 28 30 27.1 30 26V10C30 8.9 29.1 8 28 8ZM10 6H22V8H10V6ZM28 26H4V10H28V26Z" />
                <path d="M16 14C16.55 14 17 14.45 17 15V19C17 19.55 16.55 20 16 20C15.45 20 15 19.55 15 19V15C15 14.45 15.45 14 16 14Z" />
              </svg>
            </div>
            <h3>Professional Validation</h3>
            <p>
              Structured validation workflow with multi-dimensional quality
              assessment and false positive tracking
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="currentColor"
              >
                <path d="M6 4V28H26V8.83L21.17 4H6ZM8 6H20V10H24V26H8V6ZM22 6.83L23.17 8H22V6.83Z" />
                <path d="M10 14H22V16H10V14ZM10 18H22V20H10V18ZM10 22H18V24H10V22Z" />
              </svg>
            </div>
            <h3>Comprehensive Reports</h3>
            <p>
              Generate detailed markdown reports with executive summaries,
              findings analysis, and actionable recommendations
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="currentColor"
              >
                <path d="M8 4C6.9 4 6 4.9 6 6V26C6 27.1 6.9 28 8 28H24C25.1 28 26 27.1 26 26V6C26 4.9 25.1 4 24 4H8ZM8 6H24V26H8V6Z" />
                <path d="M11 10H21V12H11V10ZM11 14H21V16H11V14ZM11 18H17V20H11V18Z" />
              </svg>
            </div>
            <h3>Template Library</h3>
            <p>
              Pre-built templates for STRIDE, STPA-SEC, and custom security
              analysis frameworks
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="currentColor"
              >
                <path d="M16 4C9.37 4 4 9.37 4 16C4 22.63 9.37 28 16 28C22.63 28 28 22.63 28 16C28 9.37 22.63 4 16 4ZM16 26C10.49 26 6 21.51 6 16C6 10.49 10.49 6 16 6C21.51 6 26 10.49 26 16C26 21.51 21.51 26 16 26Z" />
                <path d="M20.29 11.71L14 18L11.71 15.71L10.29 17.13L14 20.84L21.71 13.13L20.29 11.71Z" />
              </svg>
            </div>
            <h3>Session Management</h3>
            <p>
              Save, resume, and track multiple security analysis sessions with
              progress indicators
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="currentColor"
              >
                <path d="M26 16L22 12V15H18V17H22V20L26 16Z" />
                <path d="M16 4C9.37 4 4 9.37 4 16C4 22.63 9.37 28 16 28C19.13 28 22 27.04 24.36 25.36L22.94 23.94C21 25.26 18.61 26 16 26C10.49 26 6 21.51 6 16C6 10.49 10.49 6 16 6C21.51 6 26 10.49 26 16H28C28 9.37 22.63 4 16 4Z" />
              </svg>
            </div>
            <h3>Architecture Integration</h3>
            <p>
              Upload and analyze system architecture diagrams with threat
              annotations and visual mapping
            </p>
          </div>
        </div>
      </div>

      <div className="workflow-section">
        <h2 className="section-title">Security Analysis Workflow</h2>

        <div className="workflow-steps">
          <div className="workflow-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Choose Analysis Framework</h4>
              <p>Select from STRIDE, STPA-SEC, or custom templates</p>
            </div>
          </div>

          <div className="workflow-connector"></div>

          <div className="workflow-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Describe Your System</h4>
              <p>Provide system details and upload architecture diagrams</p>
            </div>
          </div>

          <div className="workflow-connector"></div>

          <div className="workflow-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>AI Analysis</h4>
              <p>Multiple models analyze your system for vulnerabilities</p>
            </div>
          </div>

          <div className="workflow-connector"></div>

          <div className="workflow-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Validate Findings</h4>
              <p>Review and validate each finding with quality scores</p>
            </div>
          </div>

          <div className="workflow-connector"></div>

          <div className="workflow-step">
            <div className="step-number">5</div>
            <div className="step-content">
              <h4>Generate Report</h4>
              <p>Export comprehensive security assessment report</p>
            </div>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <h2>Ready to enhance your security posture?</h2>
        <p>Start analyzing your systems with AI-powered security assessment</p>
        <button className="cta-btn" onClick={handleQuickStart}>
          Get Started Now
        </button>
      </div>
    </div>
  );
}
