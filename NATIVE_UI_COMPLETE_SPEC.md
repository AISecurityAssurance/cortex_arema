# Complete Native UI Implementation Specification
## Self-Contained Guide for Cloudscape-Inspired Design System

### IMPORTANT: READ THIS FIRST
This specification is designed to be executed by an AI assistant with minimal human intervention. Every component, style, and migration step is documented with complete implementation code. Follow this specification exactly as written, in the order presented.

---

## PROJECT CONTEXT

### Current State
- **Framework**: Next.js 15.4.2 with App Router
- **React Version**: 19.1.0
- **TypeScript**: 5.7.3
- **Current UI**: Partial Cloudscape migration with custom components
- **Problem**: Cloudscape components don't respect theme switching properly
- **Solution**: Replace with native React components that look identical

### Goal
Create a native component library that exactly replicates the current security analysis page appearance without any Cloudscape dependencies.

### Success Criteria
1. Components must look IDENTICAL to current Cloudscape-styled components
2. Theme switching must work instantly and perfectly
3. Bundle size must be < 100KB for all UI components
4. No Cloudscape imports should remain
5. All existing functionality must be preserved

---

## PHASE 1: FOUNDATION SETUP (EXECUTE FIRST)

### Step 1.1: Create Design Token System

Create file: `src/styles/design-tokens.css`
```css
/* Design Tokens - Single Source of Truth for All UI Values */

:root {
  /* ============================================
     SPACING SYSTEM
     Based on 4px grid for consistency
     ============================================ */
  --space-xxxs: 0.125rem;  /* 2px - Micro spacing */
  --space-xxs: 0.25rem;    /* 4px - Tightest spacing */
  --space-xs: 0.5rem;      /* 8px - Extra small */
  --space-s: 0.75rem;      /* 12px - Small */
  --space-m: 1rem;         /* 16px - Medium (base) */
  --space-l: 1.5rem;       /* 24px - Large */
  --space-xl: 2rem;        /* 32px - Extra large */
  --space-xxl: 3rem;       /* 48px - Huge */
  --space-xxxl: 4rem;      /* 64px - Massive */

  /* ============================================
     TYPOGRAPHY SYSTEM
     ============================================ */
  --font-family-base: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-family-mono: "Monaco", "Menlo", "Ubuntu Mono", "Consolas", monospace;
  
  /* Font Sizes */
  --font-size-xxs: 0.625rem;   /* 10px - Micro text */
  --font-size-xs: 0.75rem;     /* 12px - Caption text */
  --font-size-sm: 0.875rem;    /* 14px - Body small */
  --font-size-md: 1rem;        /* 16px - Body default */
  --font-size-lg: 1.125rem;    /* 18px - Body large */
  --font-size-xl: 1.5rem;      /* 24px - Heading */
  --font-size-xxl: 2rem;       /* 32px - Display */
  
  /* Font Weights */
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* Line Heights */
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
  
  /* ============================================
     LAYOUT SYSTEM
     ============================================ */
  --border-radius-xs: 2px;
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;
  --border-radius-full: 9999px;
  
  /* Borders */
  --border-width-thin: 1px;
  --border-width-medium: 2px;
  --border-width-thick: 4px;
  
  /* Z-Index Scale */
  --z-index-dropdown: 1000;
  --z-index-sticky: 1020;
  --z-index-fixed: 1030;
  --z-index-modal-backdrop: 1040;
  --z-index-modal: 1050;
  --z-index-popover: 1060;
  --z-index-tooltip: 1070;
  --z-index-toast: 1080;
  
  /* ============================================
     ANIMATION SYSTEM
     ============================================ */
  --transition-fast: 150ms;
  --transition-normal: 250ms;
  --transition-slow: 350ms;
  --easing-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-accelerate: cubic-bezier(0.4, 0, 1, 1);
  --easing-decelerate: cubic-bezier(0, 0, 0.2, 1);
  
  /* ============================================
     BREAKPOINTS (for reference in JS)
     ============================================ */
  --breakpoint-xs: 0;
  --breakpoint-sm: 576px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 992px;
  --breakpoint-xl: 1200px;
  --breakpoint-xxl: 1400px;
}

/* ============================================
   LIGHT THEME COLORS
   Matches Cloudscape light theme exactly
   ============================================ */
[data-theme="light"] {
  /* Background Hierarchy */
  --color-background-primary: #ffffff;
  --color-background-secondary: #fafafa;
  --color-background-tertiary: #f2f3f3;
  
  /* Surface Colors (Cards, Panels) */
  --color-surface: #ffffff;
  --color-surface-raised: #ffffff;
  --color-surface-overlay: #ffffff;
  --color-surface-header: #ffffff;
  
  /* Border Colors */
  --color-border-default: #d5dbdb;
  --color-border-subtle: #eaeded;
  --color-border-strong: #879596;
  --color-border-divider: #e9ebed;
  
  /* Text Colors */
  --color-text-primary: #16191f;
  --color-text-secondary: #414d5c;
  --color-text-tertiary: #545b64;
  --color-text-disabled: #95a2b3;
  --color-text-placeholder: #687078;
  --color-text-inverse: #ffffff;
  
  /* Interactive Colors */
  --color-primary: #0073bb;
  --color-primary-hover: #004d7a;
  --color-primary-active: #00366d;
  --color-primary-disabled: rgba(0, 115, 187, 0.3);
  
  /* Status Colors */
  --color-success: #037f0c;
  --color-success-bg: #f2fcf3;
  --color-success-border: #6ba644;
  
  --color-warning: #cc6f0c;
  --color-warning-bg: #fff7e6;
  --color-warning-border: #f89256;
  
  --color-error: #d91515;
  --color-error-bg: #fff5f5;
  --color-error-border: #ee7c7c;
  
  --color-info: #0073bb;
  --color-info-bg: #f2f8fd;
  --color-info-border: #539fe5;
  
  /* Severity Colors (for badges) */
  --color-severity-critical: #d91515;
  --color-severity-critical-bg: #fff5f5;
  --color-severity-high: #ee7c7c;
  --color-severity-high-bg: #fff7f7;
  --color-severity-medium: #f89256;
  --color-severity-medium-bg: #fff9f3;
  --color-severity-low: #879596;
  --color-severity-low-bg: #f5f6f6;
  
  /* Shadow System */
  --shadow-xs: 0 1px 1px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 2px 4px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 8px 24px rgba(0, 0, 0, 0.12);
  --shadow-xxl: 0 12px 48px rgba(0, 0, 0, 0.15);
  --shadow-raised: 0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.08);
  
  /* Focus Ring */
  --focus-ring-color: #0073bb;
  --focus-ring-offset: 2px;
  --focus-ring-width: 2px;
}

/* ============================================
   DARK THEME COLORS
   Matches Cloudscape dark theme exactly
   ============================================ */
[data-theme="dark"] {
  /* Background Hierarchy */
  --color-background-primary: #0f1b2a;
  --color-background-secondary: #161e2d;
  --color-background-tertiary: #1a2332;
  
  /* Surface Colors */
  --color-surface: #1a2332;
  --color-surface-raised: #232f3e;
  --color-surface-overlay: #2a3341;
  --color-surface-header: #161e2d;
  
  /* Border Colors */
  --color-border-default: #414d5c;
  --color-border-subtle: #2a3341;
  --color-border-strong: #545b64;
  --color-border-divider: #313847;
  
  /* Text Colors */
  --color-text-primary: #d1d5db;
  --color-text-secondary: #95a2b3;
  --color-text-tertiary: #7d8998;
  --color-text-disabled: #545b64;
  --color-text-placeholder: #687078;
  --color-text-inverse: #16191f;
  
  /* Interactive Colors */
  --color-primary: #539fe5;
  --color-primary-hover: #6bb2f0;
  --color-primary-active: #89c4f4;
  --color-primary-disabled: rgba(83, 159, 229, 0.3);
  
  /* Status Colors */
  --color-success: #6ba644;
  --color-success-bg: #1a2d1a;
  --color-success-border: #6ba644;
  
  --color-warning: #f89256;
  --color-warning-bg: #2d2113;
  --color-warning-border: #f89256;
  
  --color-error: #ee7c7c;
  --color-error-bg: #2d1a1a;
  --color-error-border: #ee7c7c;
  
  --color-info: #539fe5;
  --color-info-bg: #1a2332;
  --color-info-border: #539fe5;
  
  /* Severity Colors */
  --color-severity-critical: #ee7c7c;
  --color-severity-critical-bg: #2d1a1a;
  --color-severity-high: #f89256;
  --color-severity-high-bg: #2d2113;
  --color-severity-medium: #f2c94c;
  --color-severity-medium-bg: #2d2613;
  --color-severity-low: #7d8998;
  --color-severity-low-bg: #1f2733;
  
  /* Shadow System (stronger in dark mode) */
  --shadow-xs: 0 1px 1px rgba(0, 0, 0, 0.2);
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.25);
  --shadow-md: 0 2px 4px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.35);
  --shadow-xl: 0 8px 24px rgba(0, 0, 0, 0.4);
  --shadow-xxl: 0 12px 48px rgba(0, 0, 0, 0.45);
  --shadow-raised: 0 2px 4px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.3);
  
  /* Focus Ring */
  --focus-ring-color: #539fe5;
  --focus-ring-offset: 2px;
  --focus-ring-width: 2px;
}
```

### Step 1.2: Create Base Component Styles

Create file: `src/styles/components-base.css`
```css
/* Base Component Styles - Foundation for all components */

/* ============================================
   RESET & NORMALIZATION
   ============================================ */
*,
*::before,
*::after {
  box-sizing: border-box;
}

/* ============================================
   BASE COMPONENT CLASS
   All components extend from this
   ============================================ */
.component {
  font-family: var(--font-family-base);
  font-size: var(--font-size-md);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  transition: all var(--transition-normal) var(--easing-standard);
}

/* ============================================
   CARD COMPONENT
   Container for content sections
   ============================================ */
.card {
  background: var(--color-surface);
  border-radius: var(--border-radius-md);
  position: relative;
  transition: all var(--transition-normal) var(--easing-standard);
}

/* Card Variants */
.card--flat {
  box-shadow: none;
  border: none;
}

.card--outlined {
  box-shadow: var(--shadow-xs);
  border: var(--border-width-thin) solid var(--color-border-default);
}

.card--raised {
  box-shadow: var(--shadow-raised);
  border: none;
}

/* Card Padding Options */
.card--padding-none { padding: 0; }
.card--padding-xs { padding: var(--space-xs); }
.card--padding-sm { padding: var(--space-s); }
.card--padding-md { padding: var(--space-m); }
.card--padding-lg { padding: var(--space-l); }
.card--padding-xl { padding: var(--space-xl); }

/* Card Header */
.card__header {
  padding: var(--space-m);
  border-bottom: var(--border-width-thin) solid var(--color-border-divider);
  background: var(--color-surface-header);
}

.card__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0;
}

.card__subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--space-xxs);
}

/* Card Body */
.card__body {
  padding: var(--space-m);
}

/* Card Footer */
.card__footer {
  padding: var(--space-m);
  border-top: var(--border-width-thin) solid var(--color-border-divider);
  background: var(--color-background-secondary);
}

/* ============================================
   BUTTON COMPONENT
   ============================================ */
.btn {
  /* Base styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-m);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  border-radius: var(--border-radius-sm);
  border: var(--border-width-thin) solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast) var(--easing-standard);
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
  position: relative;
  outline: none;
}

/* Button Sizes */
.btn--size-sm {
  padding: var(--space-xxs) var(--space-s);
  font-size: var(--font-size-xs);
}

.btn--size-md {
  padding: var(--space-xs) var(--space-m);
  font-size: var(--font-size-sm);
}

.btn--size-lg {
  padding: var(--space-s) var(--space-l);
  font-size: var(--font-size-md);
}

/* Button Variants */
.btn--primary {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
}

.btn--primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.btn--primary:active:not(:disabled) {
  background: var(--color-primary-active);
  border-color: var(--color-primary-active);
}

.btn--secondary {
  background: var(--color-surface);
  color: var(--color-text-primary);
  border-color: var(--color-border-default);
}

.btn--secondary:hover:not(:disabled) {
  background: var(--color-background-secondary);
  border-color: var(--color-border-strong);
}

.btn--ghost {
  background: transparent;
  color: var(--color-primary);
  border-color: transparent;
}

.btn--ghost:hover:not(:disabled) {
  background: var(--color-background-secondary);
}

.btn--danger {
  background: var(--color-error);
  color: var(--color-text-inverse);
  border-color: var(--color-error);
}

.btn--danger:hover:not(:disabled) {
  background: var(--color-error-border);
  border-color: var(--color-error-border);
}

/* Button States */
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--loading {
  color: transparent;
  pointer-events: none;
}

.btn--loading::after {
  content: "";
  position: absolute;
  width: 16px;
  height: 16px;
  top: 50%;
  left: 50%;
  margin-left: -8px;
  margin-top: -8px;
  border: 2px solid currentColor;
  border-radius: 50%;
  border-top-color: transparent;
  animation: btn-spin 0.6s linear infinite;
}

@keyframes btn-spin {
  to { transform: rotate(360deg); }
}

/* Focus States */
.btn:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}

/* Full Width */
.btn--full-width {
  width: 100%;
}

/* Icon Button */
.btn--icon-only {
  padding: var(--space-xs);
  width: 32px;
  height: 32px;
}

/* ============================================
   INPUT COMPONENT
   ============================================ */
.input {
  width: 100%;
  padding: var(--space-xs) var(--space-s);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background: var(--color-surface);
  border: var(--border-width-thin) solid var(--color-border-default);
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-fast) var(--easing-standard);
  outline: none;
}

.input::placeholder {
  color: var(--color-text-placeholder);
}

.input:hover:not(:disabled) {
  border-color: var(--color-border-strong);
}

.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.input:disabled {
  background: var(--color-background-secondary);
  color: var(--color-text-disabled);
  cursor: not-allowed;
}

/* Input Sizes */
.input--size-sm {
  padding: var(--space-xxs) var(--space-xs);
  font-size: var(--font-size-xs);
}

.input--size-lg {
  padding: var(--space-s) var(--space-m);
  font-size: var(--font-size-md);
}

/* Input States */
.input--error {
  border-color: var(--color-error);
}

.input--error:focus {
  border-color: var(--color-error);
  box-shadow: 0 0 0 1px var(--color-error);
}

/* Input Group */
.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.input-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.input-helper {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.input-error {
  font-size: var(--font-size-xs);
  color: var(--color-error);
}

/* ============================================
   SELECT COMPONENT
   ============================================ */
.select {
  width: 100%;
  padding: var(--space-xs) var(--space-s);
  padding-right: var(--space-xl);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background: var(--color-surface);
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23414d5c' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right var(--space-s) center;
  background-size: 12px;
  border: var(--border-width-thin) solid var(--color-border-default);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  appearance: none;
  transition: all var(--transition-fast) var(--easing-standard);
  outline: none;
}

.select:hover:not(:disabled) {
  border-color: var(--color-border-strong);
}

.select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.select:disabled {
  background: var(--color-background-secondary);
  color: var(--color-text-disabled);
  cursor: not-allowed;
}

/* ============================================
   BADGE COMPONENT
   ============================================ */
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-xxxs) var(--space-xs);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  border-radius: var(--border-radius-sm);
  white-space: nowrap;
}

/* Badge Severity Variants */
.badge--critical {
  background: var(--color-severity-critical-bg);
  color: var(--color-severity-critical);
  border: var(--border-width-thin) solid var(--color-severity-critical);
}

.badge--high {
  background: var(--color-severity-high-bg);
  color: var(--color-severity-high);
  border: var(--border-width-thin) solid var(--color-severity-high);
}

.badge--medium {
  background: var(--color-severity-medium-bg);
  color: var(--color-severity-medium);
  border: var(--border-width-thin) solid var(--color-severity-medium);
}

.badge--low {
  background: var(--color-severity-low-bg);
  color: var(--color-severity-low);
  border: var(--border-width-thin) solid var(--color-severity-low);
}

.badge--info {
  background: var(--color-info-bg);
  color: var(--color-info);
  border: var(--border-width-thin) solid var(--color-info);
}

/* Badge Sizes */
.badge--size-sm {
  padding: 0 var(--space-xxs);
  font-size: var(--font-size-xxs);
}

.badge--size-lg {
  padding: var(--space-xxs) var(--space-s);
  font-size: var(--font-size-sm);
}

/* ============================================
   SPINNER COMPONENT
   ============================================ */
.spinner {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
}

.spinner__circle {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-border-default);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spinner-rotate 0.8s linear infinite;
}

/* Spinner Sizes */
.spinner--size-sm .spinner__circle {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

.spinner--size-lg .spinner__circle {
  width: 32px;
  height: 32px;
  border-width: 4px;
}

.spinner__label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

@keyframes spinner-rotate {
  to { transform: rotate(360deg); }
}

/* ============================================
   TOAST COMPONENT
   ============================================ */
.toast {
  position: fixed;
  top: var(--space-m);
  right: var(--space-m);
  z-index: var(--z-index-toast);
  min-width: 300px;
  max-width: 500px;
  padding: var(--space-m);
  background: var(--color-surface);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: flex-start;
  gap: var(--space-s);
  animation: toast-slide-in var(--transition-normal) var(--easing-decelerate);
}

@keyframes toast-slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast--success {
  border-left: 4px solid var(--color-success);
}

.toast--error {
  border-left: 4px solid var(--color-error);
}

.toast--warning {
  border-left: 4px solid var(--color-warning);
}

.toast--info {
  border-left: 4px solid var(--color-info);
}

.toast__icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.toast__content {
  flex: 1;
}

.toast__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-xxs);
}

.toast__message {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.toast__close {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: color var(--transition-fast) var(--easing-standard);
}

.toast__close:hover {
  color: var(--color-text-primary);
}

/* ============================================
   MODAL COMPONENT
   ============================================ */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-index-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-m);
}

.modal__backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: var(--z-index-modal-backdrop);
}

.modal__content {
  position: relative;
  z-index: var(--z-index-modal);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  background: var(--color-surface);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-xxl);
  display: flex;
  flex-direction: column;
  animation: modal-scale-in var(--transition-normal) var(--easing-decelerate);
}

@keyframes modal-scale-in {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Modal Sizes */
.modal__content--size-sm { max-width: 400px; }
.modal__content--size-md { max-width: 600px; }
.modal__content--size-lg { max-width: 800px; }
.modal__content--size-xl { max-width: 1000px; }

.modal__header {
  padding: var(--space-l);
  border-bottom: var(--border-width-thin) solid var(--color-border-divider);
}

.modal__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0;
}

.modal__body {
  flex: 1;
  padding: var(--space-l);
  overflow-y: auto;
}

.modal__footer {
  padding: var(--space-l);
  border-top: var(--border-width-thin) solid var(--color-border-divider);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-s);
}
```

### Step 1.3: Create Utility Classes

Create file: `src/styles/utilities.css`
```css
/* Utility Classes - Functional CSS helpers */

/* ============================================
   SPACING UTILITIES
   ============================================ */
/* Margin */
.m-0 { margin: 0; }
.m-xxxs { margin: var(--space-xxxs); }
.m-xxs { margin: var(--space-xxs); }
.m-xs { margin: var(--space-xs); }
.m-s { margin: var(--space-s); }
.m-m { margin: var(--space-m); }
.m-l { margin: var(--space-l); }
.m-xl { margin: var(--space-xl); }
.m-xxl { margin: var(--space-xxl); }
.m-auto { margin: auto; }

/* Margin Top */
.mt-0 { margin-top: 0; }
.mt-xxxs { margin-top: var(--space-xxxs); }
.mt-xxs { margin-top: var(--space-xxs); }
.mt-xs { margin-top: var(--space-xs); }
.mt-s { margin-top: var(--space-s); }
.mt-m { margin-top: var(--space-m); }
.mt-l { margin-top: var(--space-l); }
.mt-xl { margin-top: var(--space-xl); }
.mt-xxl { margin-top: var(--space-xxl); }

/* Margin Bottom */
.mb-0 { margin-bottom: 0; }
.mb-xxxs { margin-bottom: var(--space-xxxs); }
.mb-xxs { margin-bottom: var(--space-xxs); }
.mb-xs { margin-bottom: var(--space-xs); }
.mb-s { margin-bottom: var(--space-s); }
.mb-m { margin-bottom: var(--space-m); }
.mb-l { margin-bottom: var(--space-l); }
.mb-xl { margin-bottom: var(--space-xl); }
.mb-xxl { margin-bottom: var(--space-xxl); }

/* Padding */
.p-0 { padding: 0; }
.p-xxxs { padding: var(--space-xxxs); }
.p-xxs { padding: var(--space-xxs); }
.p-xs { padding: var(--space-xs); }
.p-s { padding: var(--space-s); }
.p-m { padding: var(--space-m); }
.p-l { padding: var(--space-l); }
.p-xl { padding: var(--space-xl); }
.p-xxl { padding: var(--space-xxl); }

/* ============================================
   LAYOUT UTILITIES
   ============================================ */
/* Display */
.d-none { display: none; }
.d-block { display: block; }
.d-inline { display: inline; }
.d-inline-block { display: inline-block; }
.d-flex { display: flex; }
.d-inline-flex { display: inline-flex; }
.d-grid { display: grid; }

/* Flexbox */
.flex-row { flex-direction: row; }
.flex-column { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.flex-nowrap { flex-wrap: nowrap; }
.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }
.align-start { align-items: flex-start; }
.align-center { align-items: center; }
.align-end { align-items: flex-end; }
.align-stretch { align-items: stretch; }
.flex-1 { flex: 1; }
.flex-grow { flex-grow: 1; }
.flex-shrink-0 { flex-shrink: 0; }

/* Gap */
.gap-xxxs { gap: var(--space-xxxs); }
.gap-xxs { gap: var(--space-xxs); }
.gap-xs { gap: var(--space-xs); }
.gap-s { gap: var(--space-s); }
.gap-m { gap: var(--space-m); }
.gap-l { gap: var(--space-l); }
.gap-xl { gap: var(--space-xl); }

/* Position */
.position-relative { position: relative; }
.position-absolute { position: absolute; }
.position-fixed { position: fixed; }
.position-sticky { position: sticky; }

/* Width */
.w-100 { width: 100%; }
.w-auto { width: auto; }
.max-w-100 { max-width: 100%; }

/* Height */
.h-100 { height: 100%; }
.h-auto { height: auto; }
.min-h-100 { min-height: 100%; }

/* ============================================
   TEXT UTILITIES
   ============================================ */
/* Font Size */
.text-xxs { font-size: var(--font-size-xxs); }
.text-xs { font-size: var(--font-size-xs); }
.text-sm { font-size: var(--font-size-sm); }
.text-md { font-size: var(--font-size-md); }
.text-lg { font-size: var(--font-size-lg); }
.text-xl { font-size: var(--font-size-xl); }
.text-xxl { font-size: var(--font-size-xxl); }

/* Font Weight */
.font-light { font-weight: var(--font-weight-light); }
.font-normal { font-weight: var(--font-weight-normal); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.font-bold { font-weight: var(--font-weight-bold); }

/* Text Alignment */
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-justify { text-align: justify; }

/* Text Color */
.text-primary { color: var(--color-text-primary); }
.text-secondary { color: var(--color-text-secondary); }
.text-tertiary { color: var(--color-text-tertiary); }
.text-disabled { color: var(--color-text-disabled); }
.text-success { color: var(--color-success); }
.text-warning { color: var(--color-warning); }
.text-error { color: var(--color-error); }
.text-info { color: var(--color-info); }

/* Text Transform */
.text-uppercase { text-transform: uppercase; }
.text-lowercase { text-transform: lowercase; }
.text-capitalize { text-transform: capitalize; }

/* Text Decoration */
.text-underline { text-decoration: underline; }
.text-no-underline { text-decoration: none; }

/* Whitespace */
.text-nowrap { white-space: nowrap; }
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ============================================
   BORDER UTILITIES
   ============================================ */
.border { border: var(--border-width-thin) solid var(--color-border-default); }
.border-0 { border: none; }
.border-top { border-top: var(--border-width-thin) solid var(--color-border-default); }
.border-bottom { border-bottom: var(--border-width-thin) solid var(--color-border-default); }
.border-left { border-left: var(--border-width-thin) solid var(--color-border-default); }
.border-right { border-right: var(--border-width-thin) solid var(--color-border-default); }

/* Border Radius */
.rounded-0 { border-radius: 0; }
.rounded-xs { border-radius: var(--border-radius-xs); }
.rounded-sm { border-radius: var(--border-radius-sm); }
.rounded-md { border-radius: var(--border-radius-md); }
.rounded-lg { border-radius: var(--border-radius-lg); }
.rounded-xl { border-radius: var(--border-radius-xl); }
.rounded-full { border-radius: var(--border-radius-full); }

/* ============================================
   BACKGROUND UTILITIES
   ============================================ */
.bg-primary { background: var(--color-background-primary); }
.bg-secondary { background: var(--color-background-secondary); }
.bg-tertiary { background: var(--color-background-tertiary); }
.bg-surface { background: var(--color-surface); }
.bg-surface-raised { background: var(--color-surface-raised); }
.bg-transparent { background: transparent; }

/* ============================================
   SHADOW UTILITIES
   ============================================ */
.shadow-none { box-shadow: none; }
.shadow-xs { box-shadow: var(--shadow-xs); }
.shadow-sm { box-shadow: var(--shadow-sm); }
.shadow-md { box-shadow: var(--shadow-md); }
.shadow-lg { box-shadow: var(--shadow-lg); }
.shadow-xl { box-shadow: var(--shadow-xl); }
.shadow-xxl { box-shadow: var(--shadow-xxl); }
.shadow-raised { box-shadow: var(--shadow-raised); }

/* ============================================
   VISIBILITY UTILITIES
   ============================================ */
.visible { visibility: visible; }
.invisible { visibility: hidden; }
.opacity-0 { opacity: 0; }
.opacity-25 { opacity: 0.25; }
.opacity-50 { opacity: 0.5; }
.opacity-75 { opacity: 0.75; }
.opacity-100 { opacity: 1; }

/* ============================================
   CURSOR UTILITIES
   ============================================ */
.cursor-pointer { cursor: pointer; }
.cursor-not-allowed { cursor: not-allowed; }
.cursor-default { cursor: default; }
.cursor-move { cursor: move; }

/* ============================================
   RESPONSIVE UTILITIES
   ============================================ */
@media (max-width: 576px) {
  .d-sm-none { display: none; }
  .d-sm-block { display: block; }
  .d-sm-flex { display: flex; }
}

@media (max-width: 768px) {
  .d-md-none { display: none; }
  .d-md-block { display: block; }
  .d-md-flex { display: flex; }
}

@media (max-width: 992px) {
  .d-lg-none { display: none; }
  .d-lg-block { display: block; }
  .d-lg-flex { display: flex; }
}

@media (max-width: 1200px) {
  .d-xl-none { display: none; }
  .d-xl-block { display: block; }
  .d-xl-flex { display: flex; }
}
```

---

## PHASE 2: COMPONENT IMPLEMENTATION

### Step 2.1: Create Button Component

Create file: `src/components/ui/NativeButton.tsx`
```tsx
"use client";

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface NativeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  iconOnly?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const NativeButton = forwardRef<HTMLButtonElement, NativeButtonProps>(
  (
    {
      children,
      className,
      variant = 'secondary',
      size = 'md',
      loading = false,
      fullWidth = false,
      iconOnly = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const classes = clsx(
      'btn',
      `btn--${variant}`,
      `btn--size-${size}`,
      {
        'btn--loading': loading,
        'btn--full-width': fullWidth,
        'btn--icon-only': iconOnly,
      },
      className
    );

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {leftIcon && <span className="btn__icon btn__icon--left">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="btn__icon btn__icon--right">{rightIcon}</span>}
      </button>
    );
  }
);

NativeButton.displayName = 'NativeButton';
```

### Step 2.2: Create Card Component

Create file: `src/components/ui/NativeCard.tsx`
```tsx
"use client";

import React from 'react';
import { clsx } from 'clsx';

export interface NativeCardProps {
  children: React.ReactNode;
  variant?: 'flat' | 'outlined' | 'raised';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function NativeCard({
  children,
  variant = 'outlined',
  padding = 'md',
  className,
  header,
  footer,
  title,
  subtitle,
}: NativeCardProps) {
  const classes = clsx(
    'card',
    `card--${variant}`,
    padding !== 'none' && `card--padding-${padding}`,
    className
  );

  return (
    <div className={classes}>
      {(header || title) && (
        <div className="card__header">
          {header || (
            <>
              {title && <h3 className="card__title">{title}</h3>}
              {subtitle && <p className="card__subtitle">{subtitle}</p>}
            </>
          )}
        </div>
      )}
      
      <div className="card__body">
        {children}
      </div>
      
      {footer && (
        <div className="card__footer">
          {footer}
        </div>
      )}
    </div>
  );
}
```

### Step 2.3: Create Input Component

Create file: `src/components/ui/NativeInput.tsx`
```tsx
"use client";

import React, { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface NativeInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
  inputSize?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const NativeInput = forwardRef<HTMLInputElement, NativeInputProps>(
  (
    {
      className,
      label,
      helper,
      error,
      inputSize = 'md',
      fullWidth = true,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    const inputClasses = clsx(
      'input',
      `input--size-${inputSize}`,
      {
        'input--error': !!error,
        'w-100': fullWidth,
      },
      className
    );

    if (label || helper || error) {
      return (
        <div className="input-group">
          {label && (
            <label htmlFor={inputId} className="input-label">
              {label}
            </label>
          )}
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            {...props}
          />
          {helper && !error && (
            <span className="input-helper">{helper}</span>
          )}
          {error && (
            <span className="input-error">{error}</span>
          )}
        </div>
      );
    }

    return (
      <input
        ref={ref}
        id={inputId}
        className={inputClasses}
        {...props}
      />
    );
  }
);

NativeInput.displayName = 'NativeInput';
```

### Step 2.4: Create Select Component

Create file: `src/components/ui/NativeSelect.tsx`
```tsx
"use client";

import React, { SelectHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface NativeSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  helper?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  selectSize?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  (
    {
      className,
      label,
      helper,
      error,
      options,
      placeholder,
      selectSize = 'md',
      fullWidth = true,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    
    const selectClasses = clsx(
      'select',
      `select--size-${selectSize}`,
      {
        'select--error': !!error,
        'w-100': fullWidth,
      },
      className
    );

    const renderSelect = () => (
      <select
        ref={ref}
        id={selectId}
        className={selectClasses}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    );

    if (label || helper || error) {
      return (
        <div className="input-group">
          {label && (
            <label htmlFor={selectId} className="input-label">
              {label}
            </label>
          )}
          {renderSelect()}
          {helper && !error && (
            <span className="input-helper">{helper}</span>
          )}
          {error && (
            <span className="input-error">{error}</span>
          )}
        </div>
      );
    }

    return renderSelect();
  }
);

NativeSelect.displayName = 'NativeSelect';
```

### Step 2.5: Create Badge Component

Create file: `src/components/ui/NativeBadge.tsx`
```tsx
"use client";

import React from 'react';
import { clsx } from 'clsx';

export interface NativeBadgeProps {
  children: React.ReactNode;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function NativeBadge({
  children,
  severity = 'info',
  size = 'md',
  className,
}: NativeBadgeProps) {
  const classes = clsx(
    'badge',
    `badge--${severity}`,
    `badge--size-${size}`,
    className
  );

  return (
    <span className={classes}>
      {children}
    </span>
  );
}
```

### Step 2.6: Create Toast Component

Create file: `src/components/ui/NativeToast.tsx`
```tsx
"use client";

import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';

export interface Toast {
  id: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

export interface NativeToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export function NativeToast({ toast, onClose }: NativeToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose(toast.id), 300);
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const classes = clsx(
    'toast',
    toast.type && `toast--${toast.type}`,
    {
      'toast--hiding': !visible,
    }
  );

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={classes}>
      <span className="toast__icon">{getIcon()}</span>
      <div className="toast__content">
        {toast.title && <div className="toast__title">{toast.title}</div>}
        <div className="toast__message">{toast.message}</div>
      </div>
      <button
        className="toast__close"
        onClick={() => onClose(toast.id)}
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}

// Toast Container Component
export function NativeToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <NativeToast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}
```

### Step 2.7: Create Modal Component

Create file: `src/components/ui/NativeModal.tsx`
```tsx
"use client";

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';

export interface NativeModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}

export function NativeModal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  footer,
  closeOnBackdrop = true,
  closeOnEscape = true,
}: NativeModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && closeOnEscape) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, onClose, closeOnEscape]);

  useEffect(() => {
    if (open) {
      // Focus trap
      const modal = modalRef.current;
      if (modal) {
        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        firstElement?.focus();

        const handleTab = (e: KeyboardEvent) => {
          if (e.key === 'Tab') {
            if (e.shiftKey) {
              if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement?.focus();
              }
            } else {
              if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement?.focus();
              }
            }
          }
        };

        modal.addEventListener('keydown', handleTab);
        return () => modal.removeEventListener('keydown', handleTab);
      }
    }
  }, [open]);

  if (!open) return null;

  const modalContent = (
    <div className="modal" ref={modalRef}>
      <div
        className="modal__backdrop"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div className={clsx('modal__content', `modal__content--size-${size}`)}>
        {title && (
          <div className="modal__header">
            <h2 className="modal__title">{title}</h2>
          </div>
        )}
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
```

### Step 2.8: Create Spinner Component

Create file: `src/components/ui/NativeSpinner.tsx`
```tsx
"use client";

import React from 'react';
import { clsx } from 'clsx';

export interface NativeSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function NativeSpinner({
  size = 'md',
  label,
  className,
}: NativeSpinnerProps) {
  const classes = clsx(
    'spinner',
    `spinner--size-${size}`,
    className
  );

  return (
    <div className={classes}>
      <div className="spinner__circle" />
      {label && <span className="spinner__label">{label}</span>}
    </div>
  );
}
```

### Step 2.9: Create TopNavigation Component

Create file: `src/components/layout/NativeTopNavigation.tsx`
```tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext'; // Use existing theme context
import { clsx } from 'clsx';

interface NavItem {
  label: string;
  path: string;
}

interface UserMenuItem {
  id: string;
  label: string;
  onClick?: () => void;
}

interface NativeTopNavigationProps {
  className?: string;
}

const CortexLogo = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none"
    className="nav-logo"
  >
    <path 
      d="M12 2L2 7V12C2 16.5 4.23 20.68 7.62 23.38L12 24L16.38 23.38C19.77 20.68 22 16.5 22 12V7L12 2Z" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M12 7V12L15 15" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

export function NativeTopNavigation({ className }: NativeTopNavigationProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationCount] = useState(3);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const navItems: NavItem[] = [
    { label: 'Analysis', path: '/analysis' },
    { label: 'Sessions', path: '/sessions' },
    { label: 'Templates', path: '/templates' },
    { label: 'Pipeline Editor', path: '/pipeline-editor' },
  ];

  const userMenuItems: UserMenuItem[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'security', label: 'Security' },
    { id: 'signout', label: 'Sign out' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className={clsx('native-nav', className)}>
      <div className="native-nav__container">
        {/* Logo and Brand */}
        <div className="native-nav__brand">
          <a href="/" className="native-nav__brand-link">
            <CortexLogo />
            <span className="native-nav__brand-text">Cortex Arena</span>
          </a>
        </div>

        {/* Navigation Items */}
        <div className="native-nav__items">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="native-nav__link"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Utilities Section */}
        <div className="native-nav__utilities">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="native-nav__utility-btn"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {/* Notifications */}
          <button
            aria-label="Notifications"
            className="native-nav__utility-btn native-nav__notification-btn"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
              <path d="M10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            {notificationCount > 0 && (
              <span className="native-nav__badge">{notificationCount}</span>
            )}
          </button>

          {/* Settings */}
          <button
            aria-label="Settings"
            className="native-nav__utility-btn"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>

          {/* User Menu */}
          <div className="native-nav__user-menu" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="native-nav__user-menu-btn"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span className="native-nav__user-menu-text">User</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="native-nav__dropdown-arrow">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            
            {userMenuOpen && (
              <div className="native-nav__dropdown">
                <div className="native-nav__dropdown-header">
                  <div className="native-nav__dropdown-user">user@example.com</div>
                </div>
                {userMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.onClick?.();
                      setUserMenuOpen(false);
                    }}
                    className="native-nav__dropdown-item"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
```

Create file: `src/components/layout/NativeTopNavigation.css`
```css
/* Native Top Navigation Styles */

.native-nav {
  position: sticky;
  top: 0;
  z-index: var(--z-index-sticky);
  width: 100%;
  height: 48px;
  background: var(--color-surface-header);
  border-bottom: var(--border-width-thin) solid var(--color-border-divider);
  transition: all var(--transition-normal) var(--easing-standard);
}

.native-nav__container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 var(--space-l);
  max-width: 100%;
}

/* Brand Section */
.native-nav__brand {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.native-nav__brand-link {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  text-decoration: none;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-md);
  padding: var(--space-xs) var(--space-s);
  border-radius: var(--border-radius-sm);
  transition: background-color var(--transition-fast) var(--easing-standard);
}

.native-nav__brand-link:hover {
  background-color: var(--color-background-secondary);
}

.nav-logo {
  stroke: currentColor;
  flex-shrink: 0;
}

.native-nav__brand-text {
  white-space: nowrap;
}

/* Navigation Items */
.native-nav__items {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  flex: 1;
  margin-left: var(--space-xl);
}

.native-nav__link {
  background: transparent;
  border: none;
  padding: 0;
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-primary);
  cursor: pointer;
  position: relative;
  transition: color var(--transition-fast) var(--easing-standard);
  white-space: nowrap;
}

.native-nav__link:hover {
  color: var(--color-primary);
}

.native-nav__link:hover::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: currentColor;
  opacity: 0.2;
}

/* Utilities Section */
.native-nav__utilities {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  flex-shrink: 0;
}

.native-nav__utility-btn {
  background: transparent;
  border: none;
  padding: var(--space-xs);
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  transition: background-color var(--transition-fast) var(--easing-standard);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  position: relative;
}

.native-nav__utility-btn:hover {
  background-color: var(--color-background-secondary);
}

/* Notification Badge */
.native-nav__notification-btn {
  position: relative;
}

.native-nav__badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: var(--color-error);
  color: var(--color-text-inverse);
  font-size: var(--font-size-xxs);
  font-weight: var(--font-weight-bold);
  padding: 1px 4px;
  border-radius: var(--border-radius-full);
  min-width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* User Menu */
.native-nav__user-menu {
  position: relative;
}

.native-nav__user-menu-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  background: transparent;
  border: none;
  padding: var(--space-xs) var(--space-s);
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  transition: background-color var(--transition-fast) var(--easing-standard);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.native-nav__user-menu-btn:hover {
  background-color: var(--color-background-secondary);
}

.native-nav__user-menu-text {
  font-weight: var(--font-weight-normal);
}

.native-nav__dropdown-arrow {
  transition: transform var(--transition-fast) var(--easing-standard);
}

/* Dropdown */
.native-nav__dropdown {
  position: absolute;
  top: calc(100% + var(--space-xs));
  right: 0;
  min-width: 200px;
  background: var(--color-surface);
  border: var(--border-width-thin) solid var(--color-border-default);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-index-dropdown);
  animation: dropdown-fade-in var(--transition-fast) var(--easing-decelerate);
}

@keyframes dropdown-fade-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.native-nav__dropdown-header {
  padding: var(--space-s) var(--space-m);
  border-bottom: var(--border-width-thin) solid var(--color-border-divider);
}

.native-nav__dropdown-user {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.native-nav__dropdown-item {
  display: block;
  width: 100%;
  padding: var(--space-xs) var(--space-m);
  background: transparent;
  border: none;
  text-align: left;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: background-color var(--transition-fast) var(--easing-standard);
}

.native-nav__dropdown-item:hover {
  background-color: var(--color-background-secondary);
}

.native-nav__dropdown-item:last-child {
  border-top: var(--border-width-thin) solid var(--color-border-divider);
}

/* Responsive */
@media (max-width: 768px) {
  .native-nav__items {
    display: none;
  }
  
  .native-nav__container {
    padding: 0 var(--space-s);
  }
  
  .native-nav__brand-text {
    display: none;
  }
}

@media (max-width: 480px) {
  .native-nav__user-menu-text {
    display: none;
  }
}
```

### Step 2.10: Create SplitView Component

Create file: `src/components/layout/NativeSplitView.tsx`
```tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';

export interface NativeSplitViewProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultSize?: number; // Percentage
  minSize?: number; // Percentage
  maxSize?: number; // Percentage
  resizable?: boolean;
  className?: string;
  onResize?: (size: number) => void;
}

export function NativeSplitView({
  left,
  right,
  defaultSize = 50,
  minSize = 20,
  maxSize = 80,
  resizable = true,
  className,
  onResize,
}: NativeSplitViewProps) {
  const [size, setSize] = useState(defaultSize);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!resizable) return;
    e.preventDefault();
    setIsResizing(true);
  }, [resizable]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const newSize = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      if (newSize >= minSize && newSize <= maxSize) {
        setSize(newSize);
        onResize?.(newSize);
      }
    },
    [isResizing, minSize, maxSize, onResize]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className={clsx('split-view', className, {
        'split-view--resizing': isResizing,
      })}
    >
      <div
        className="split-view__panel split-view__panel--left"
        style={{ width: `${size}%` }}
      >
        {left}
      </div>
      
      {resizable && (
        <div
          className="split-view__divider"
          onMouseDown={handleMouseDown}
        >
          <div className="split-view__divider-handle">
            <span className="split-view__divider-dots">⋮</span>
          </div>
        </div>
      )}
      
      <div
        className="split-view__panel split-view__panel--right"
        style={{ width: `${100 - size}%` }}
      >
        {right}
      </div>
    </div>
  );
}
```

Create file: `src/components/layout/NativeSplitView.css`
```css
/* Split View Component Styles */

.split-view {
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.split-view__panel {
  height: 100%;
  overflow: auto;
  position: relative;
}

.split-view__panel--left {
  border-right: var(--border-width-thin) solid var(--color-border-divider);
}

.split-view__divider {
  position: relative;
  width: 4px;
  height: 100%;
  background: var(--color-border-divider);
  cursor: col-resize;
  user-select: none;
  transition: background-color var(--transition-fast) var(--easing-standard);
  flex-shrink: 0;
}

.split-view__divider:hover {
  background: var(--color-primary);
}

.split-view__divider-handle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.split-view__divider-dots {
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
  line-height: 1;
  user-select: none;
}

.split-view--resizing .split-view__divider {
  background: var(--color-primary);
}

.split-view--resizing {
  user-select: none;
}

/* Responsive */
@media (max-width: 768px) {
  .split-view {
    flex-direction: column;
  }

  .split-view__panel {
    width: 100% !important;
    height: 50%;
  }

  .split-view__panel--left {
    border-right: none;
    border-bottom: var(--border-width-thin) solid var(--color-border-divider);
  }

  .split-view__divider {
    display: none;
  }
}
```

---

## PHASE 3: MIGRATION IMPLEMENTATION

### Step 3.1: Create Migration Script

Create file: `scripts/migrate-to-native.js`
```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const CLOUDSCAPE_IMPORTS = [
  '@cloudscape-design/components',
  '@cloudscape-design/global-styles',
  '@cloudscape-design/design-tokens',
];

const COMPONENT_MAPPING = {
  // Cloudscape component -> Native component
  'Button': 'NativeButton',
  'Badge': 'NativeBadge',
  'Card': 'NativeCard',
  'Input': 'NativeInput',
  'Select': 'NativeSelect',
  'Spinner': 'NativeSpinner',
  'Modal': 'NativeModal',
  'TopNavigation': 'NativeTopNavigation',
  'SplitPanel': 'NativeSplitView',
};

// Helper functions
function findFiles(dir, pattern) {
  const results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      results.push(...findFiles(filePath, pattern));
    } else if (pattern.test(file)) {
      results.push(filePath);
    }
  }
  
  return results;
}

function replaceCloudscapeImports(content) {
  let modified = content;
  
  // Replace Cloudscape imports
  CLOUDSCAPE_IMPORTS.forEach(pkg => {
    const importRegex = new RegExp(`import\\s+{([^}]+)}\\s+from\\s+['"]${pkg}['"];?`, 'g');
    modified = modified.replace(importRegex, (match, imports) => {
      const components = imports.split(',').map(c => c.trim());
      const nativeImports = components
        .map(comp => {
          const mapped = COMPONENT_MAPPING[comp];
          return mapped ? mapped : null;
        })
        .filter(Boolean);
      
      if (nativeImports.length > 0) {
        return `import { ${nativeImports.join(', ')} } from '@/components/ui';`;
      }
      return '';
    });
  });
  
  // Replace component usage
  Object.entries(COMPONENT_MAPPING).forEach(([cloudscape, native]) => {
    const usageRegex = new RegExp(`<${cloudscape}([\\s>])`, 'g');
    modified = modified.replace(usageRegex, `<${native}$1`);
    
    const closingRegex = new RegExp(`</${cloudscape}>`, 'g');
    modified = modified.replace(closingRegex, `</${native}>`);
  });
  
  return modified;
}

function migrateFile(filePath) {
  console.log(`Migrating: ${filePath}`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  const modified = replaceCloudscapeImports(content);
  
  if (content !== modified) {
    // Create backup
    const backupPath = `${filePath}.backup`;
    fs.writeFileSync(backupPath, content);
    
    // Write modified content
    fs.writeFileSync(filePath, modified);
    
    console.log(`  ✓ Migrated (backup: ${backupPath})`);
    return true;
  }
  
  console.log('  - No changes needed');
  return false;
}

// Main migration function
function migrate() {
  console.log('Starting migration to native components...\n');
  
  const srcDir = path.join(process.cwd(), 'src');
  const files = findFiles(srcDir, /\.(tsx?|jsx?)$/);
  
  let migratedCount = 0;
  
  files.forEach(file => {
    if (migrateFile(file)) {
      migratedCount++;
    }
  });
  
  console.log(`\nMigration complete! Modified ${migratedCount} files.`);
  console.log('Next steps:');
  console.log('1. Review the changes');
  console.log('2. Test the application');
  console.log('3. Remove Cloudscape dependencies: npm uninstall @cloudscape-design/components @cloudscape-design/global-styles @cloudscape-design/design-tokens');
  console.log('4. Delete backup files when satisfied');
}

// Run migration
migrate();
```

### Step 3.2: Create Component Export Index

Create file: `src/components/ui/index.ts`
```typescript
// Native UI Components - Single export point

// Core Components
export { NativeButton } from './NativeButton';
export type { NativeButtonProps } from './NativeButton';

export { NativeCard } from './NativeCard';
export type { NativeCardProps } from './NativeCard';

export { NativeInput } from './NativeInput';
export type { NativeInputProps } from './NativeInput';

export { NativeSelect } from './NativeSelect';
export type { NativeSelectProps, SelectOption } from './NativeSelect';

export { NativeBadge } from './NativeBadge';
export type { NativeBadgeProps } from './NativeBadge';

export { NativeSpinner } from './NativeSpinner';
export type { NativeSpinnerProps } from './NativeSpinner';

// Feedback Components
export { NativeToast, NativeToastContainer } from './NativeToast';
export type { NativeToastProps, Toast } from './NativeToast';

export { NativeModal } from './NativeModal';
export type { NativeModalProps } from './NativeModal';

// Utility function for className composition
export { clsx } from 'clsx';
```

### Step 3.3: Update Global Styles Import

Update file: `src/app/globals.css`
```css
/* Import design tokens and component styles */
@import '../styles/design-tokens.css';
@import '../styles/components-base.css';
@import '../styles/utilities.css';

/* Import component-specific styles */
@import '../components/layout/NativeTopNavigation.css';
@import '../components/layout/NativeSplitView.css';

/* Global reset and base styles */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-family: var(--font-family-base);
  font-size: 16px;
  line-height: var(--line-height-normal);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  min-height: 100vh;
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  transition: background-color var(--transition-normal) var(--easing-standard),
              color var(--transition-normal) var(--easing-standard);
}

/* App container */
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app__header {
  flex-shrink: 0;
}

.app__main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.app__content {
  flex: 1;
  padding: var(--space-l);
}

/* Container utilities */
.container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--space-l);
}

.container--sm { max-width: 640px; }
.container--md { max-width: 768px; }
.container--lg { max-width: 1024px; }
.container--xl { max-width: 1280px; }
.container--full { max-width: 100%; }

/* Grid system */
.grid {
  display: grid;
  gap: var(--space-m);
}

.grid--cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid--cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid--cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid--cols-4 { grid-template-columns: repeat(4, 1fr); }
.grid--cols-6 { grid-template-columns: repeat(6, 1fr); }
.grid--cols-12 { grid-template-columns: repeat(12, 1fr); }

@media (max-width: 768px) {
  .grid--cols-2,
  .grid--cols-3,
  .grid--cols-4,
  .grid--cols-6,
  .grid--cols-12 {
    grid-template-columns: 1fr;
  }
}

/* Responsive utilities */
.hide-sm { display: none; }
@media (min-width: 576px) { .hide-sm { display: initial; } }

.hide-md { display: none; }
@media (min-width: 768px) { .hide-md { display: initial; } }

.hide-lg { display: none; }
@media (min-width: 992px) { .hide-lg { display: initial; } }

.hide-xl { display: none; }
@media (min-width: 1200px) { .hide-xl { display: initial; } }

/* Accessibility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Focus styles */
:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}

/* Selection */
::selection {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-background-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--color-border-strong);
  border-radius: var(--border-radius-sm);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-secondary);
}

/* Print styles */
@media print {
  body {
    background: white;
    color: black;
  }
  
  .no-print {
    display: none !important;
  }
}
```

---

## PHASE 4: MIGRATION EXECUTION STEPS

### Execution Order (CRITICAL - Follow Exactly)

#### 1. Install Required Dependencies
```bash
npm install clsx
```

#### 2. Create Directory Structure
```bash
mkdir -p src/components/ui
mkdir -p src/styles
mkdir -p scripts
```

#### 3. Create Files in This Order:
1. First create all CSS files (design-tokens.css, components-base.css, utilities.css)
2. Then create all component files (NativeButton.tsx, NativeCard.tsx, etc.)
3. Create the component index file (src/components/ui/index.ts)
4. Update globals.css
5. Create migration script

#### 4. Test Components Individually
Before migrating, test each component in isolation:

Create file: `src/app/test-components/page.tsx`
```tsx
"use client";

import { useState } from 'react';
import {
  NativeButton,
  NativeCard,
  NativeInput,
  NativeSelect,
  NativeBadge,
  NativeSpinner,
  NativeModal,
  NativeToast,
} from '@/components/ui';

export default function TestComponents() {
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');

  return (
    <div className="container p-l">
      <h1 className="text-xxl font-bold mb-l">Component Test Page</h1>
      
      <div className="grid grid--cols-2 gap-l">
        {/* Buttons */}
        <NativeCard title="Buttons">
          <div className="d-flex gap-s flex-wrap">
            <NativeButton variant="primary">Primary</NativeButton>
            <NativeButton variant="secondary">Secondary</NativeButton>
            <NativeButton variant="ghost">Ghost</NativeButton>
            <NativeButton variant="danger">Danger</NativeButton>
            <NativeButton loading>Loading</NativeButton>
            <NativeButton disabled>Disabled</NativeButton>
          </div>
        </NativeCard>

        {/* Inputs */}
        <NativeCard title="Inputs">
          <div className="d-flex flex-column gap-m">
            <NativeInput
              label="Text Input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter text..."
            />
            <NativeSelect
              label="Select Input"
              value={selectValue}
              onChange={(e) => setSelectValue(e.target.value)}
              options={[
                { value: 'opt1', label: 'Option 1' },
                { value: 'opt2', label: 'Option 2' },
                { value: 'opt3', label: 'Option 3' },
              ]}
              placeholder="Choose an option"
            />
          </div>
        </NativeCard>

        {/* Badges */}
        <NativeCard title="Badges">
          <div className="d-flex gap-s flex-wrap">
            <NativeBadge severity="critical">Critical</NativeBadge>
            <NativeBadge severity="high">High</NativeBadge>
            <NativeBadge severity="medium">Medium</NativeBadge>
            <NativeBadge severity="low">Low</NativeBadge>
            <NativeBadge severity="info">Info</NativeBadge>
          </div>
        </NativeCard>

        {/* Spinner */}
        <NativeCard title="Loading States">
          <div className="d-flex gap-m align-center">
            <NativeSpinner size="sm" />
            <NativeSpinner size="md" label="Loading..." />
            <NativeSpinner size="lg" />
          </div>
        </NativeCard>
      </div>

      {/* Modal Test */}
      <div className="mt-l">
        <NativeButton variant="primary" onClick={() => setModalOpen(true)}>
          Open Modal
        </NativeButton>
      </div>

      <NativeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Test Modal"
        footer={
          <>
            <NativeButton variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </NativeButton>
            <NativeButton variant="primary" onClick={() => setModalOpen(false)}>
              Confirm
            </NativeButton>
          </>
        }
      >
        <p>This is a test modal content.</p>
      </NativeModal>
    </div>
  );
}
```

#### 5. Replace CloudscapeLayout with Native Version

Update file: `src/components/layout/CloudscapeLayout.tsx`
```tsx
"use client";

import React from "react";
import { NativeTopNavigation } from "./NativeTopNavigation";

interface CloudscapeLayoutProps {
  children: React.ReactNode;
}

export function CloudscapeLayout({ children }: CloudscapeLayoutProps) {
  return (
    <div className="app">
      <header className="app__header">
        <NativeTopNavigation />
      </header>
      <main className="app__main">
        <div className="app__content">
          {children}
        </div>
      </main>
    </div>
  );
}
```

#### 6. Run Migration Script
```bash
node scripts/migrate-to-native.js
```

#### 7. Update Package.json Scripts
Add to package.json:
```json
{
  "scripts": {
    "migrate": "node scripts/migrate-to-native.js",
    "test:components": "next dev -p 3001"
  }
}
```

#### 8. Test Migration
1. Start dev server: `npm run dev`
2. Open test page: http://localhost:3000/test-components
3. Verify theme switching works
4. Check all components render correctly
5. Test responsive behavior

#### 9. Remove Cloudscape Dependencies
Once everything works:
```bash
npm uninstall @cloudscape-design/components @cloudscape-design/global-styles @cloudscape-design/design-tokens
```

#### 10. Clean Up
- Remove backup files created by migration script
- Delete old Cloudscape-specific files
- Remove test-components page if no longer needed

---

## VALIDATION CHECKLIST

### Component Functionality
- [ ] Buttons: All variants work, loading state shows spinner
- [ ] Inputs: Focus states, error states, labels work
- [ ] Select: Dropdown opens, options selectable
- [ ] Cards: All padding variants, header/footer render
- [ ] Badges: All severity colors correct
- [ ] Modal: Opens/closes, backdrop click, escape key
- [ ] Toast: Auto-dismisses, stacks properly
- [ ] Spinner: All sizes, label shows
- [ ] TopNavigation: Theme toggle works instantly
- [ ] SplitView: Resizing works, saves position

### Theme Switching
- [ ] Navigation bar changes color immediately
- [ ] All components respect theme
- [ ] No flash of unstyled content
- [ ] Theme persists on refresh
- [ ] Focus rings visible in both themes

### Responsive Design
- [ ] Mobile menu works
- [ ] Components stack on small screens
- [ ] Text remains readable
- [ ] Touch targets adequate size
- [ ] No horizontal scroll

### Performance
- [ ] Bundle size < 100KB for components
- [ ] No console errors
- [ ] Smooth animations
- [ ] Fast theme switching
- [ ] No memory leaks

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Color contrast passes WCAG

---

## TROUBLESHOOTING GUIDE

### Common Issues and Solutions

#### Issue: Theme not switching
**Solution**: Check that ThemeContext is providing both `theme` and `toggleTheme`. Ensure CSS variables are defined for both themes.

#### Issue: Components not styled
**Solution**: Verify globals.css imports all style files in correct order. Check that className props are passed correctly.

#### Issue: TypeScript errors
**Solution**: Ensure all interfaces are exported from component files. Check that clsx is installed.

#### Issue: Modal/Toast not appearing
**Solution**: These use React portals. Ensure they're rendered after page mount. Check z-index values.

#### Issue: Build errors after migration
**Solution**: Clear .next folder and node_modules, reinstall dependencies, rebuild.

---

## FINAL NOTES

This specification provides a complete, production-ready native component system that:

1. **Looks identical** to Cloudscape components
2. **Performs better** with smaller bundle size
3. **Gives full control** over theming and behavior
4. **Is maintainable** with clear, simple code
5. **Is extensible** for future components

The migration can be done incrementally - start with one page, verify it works, then expand. The old CustomTopNavigation component you built can be replaced with NativeTopNavigation which has cleaner implementation.

Total implementation time: ~4-6 hours for experienced developer, ~8-12 hours including testing and debugging.