"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Settings,
  Database,
  Shield,
  Bell,
  User,
  Palette,
  Globe,
  Code2,
  ChevronRight
} from 'lucide-react';
import './settings.css';

// Dynamic imports to avoid SSR issues
const ModelProviderSettingsImport = dynamic(
  () => import('@/components/settings/ModelProviderSettings').then(mod => mod.ModelProviderSettings),
  {
    ssr: false,
    loading: () => <div className="settings-loading">Loading provider settings...</div>
  }
);

const ThemeToggle = dynamic(
  () => import('@/components/ui/ThemeToggle').then(mod => mod.ThemeToggle),
  {
    ssr: false,
    loading: () => <div className="settings-loading">Loading theme settings...</div>
  }
);

type SettingsSection =
  | 'general'
  | 'model-providers'
  | 'data-storage'
  | 'security'
  | 'notifications'
  | 'account'
  | 'appearance';

interface NavigationItem {
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
  description: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'general',
    label: 'General',
    icon: Settings,
    description: 'Basic application settings and preferences'
  },
  {
    id: 'model-providers',
    label: 'Model Providers',
    icon: Globe,
    description: 'Configure AI model providers and API keys'
  },
  {
    id: 'data-storage',
    label: 'Data & Storage',
    icon: Database,
    description: 'Local storage, caching, and data management'
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    description: 'Security settings and privacy controls'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Alert preferences and notification settings'
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Palette,
    description: 'Theme, layout, and display preferences'
  },
  {
    id: 'account',
    label: 'Account',
    icon: User,
    description: 'Profile information and account management'
  }
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'general':
        return <GeneralSettings />;
      case 'model-providers':
        return <ModelProviderSettings />;
      case 'data-storage':
        return <DataStorageSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'account':
        return <AccountSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  const activeItem = navigationItems.find(item => item.id === activeSection);

  return (
    <div className="settings-container">
      {/* Sidebar Navigation */}
      <aside className="settings-sidebar">
        <div className="settings-sidebar-header">
          <h2 className="settings-sidebar-title">Settings</h2>
        </div>
        <nav className="settings-nav">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`settings-nav-item ${activeSection === item.id ? 'active' : ''}`}
              >
                <Icon className="settings-nav-icon" size={18} />
                <span className="settings-nav-label">{item.label}</span>
                <ChevronRight className="settings-nav-arrow" size={16} />
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="settings-main">
        <header className="settings-header">
          <div className="settings-header-content">
            <h1 className="settings-title">{activeItem?.label}</h1>
            <p className="settings-description">{activeItem?.description}</p>
          </div>
        </header>

        <div className="settings-content">
          {renderSectionContent()}
        </div>
      </main>
    </div>
  );
}

// Section Components (to be expanded with actual functionality)
const GeneralSettings = () => (
  <div className="settings-section">
    <div className="settings-group">
      <h3 className="settings-group-title">Application Settings</h3>
      <div className="settings-item">
        <div className="settings-item-header">
          <label className="settings-label">Default Analysis Mode</label>
          <select className="settings-select">
            <option>STRIDE</option>
            <option>STPA-Sec</option>
            <option>Custom</option>
          </select>
        </div>
        <p className="settings-hint">Choose the default template for new analysis sessions</p>
      </div>

      <div className="settings-item">
        <div className="settings-item-header">
          <label className="settings-label">Auto-save Sessions</label>
          <input type="checkbox" className="settings-checkbox" defaultChecked />
        </div>
        <p className="settings-hint">Automatically save analysis sessions to local storage</p>
      </div>
    </div>
  </div>
);

const ModelProviderSettings = () => {
  const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);

  useEffect(() => {
    // Load configured providers from storage
    const savedKeys = sessionStorage.getItem('byom_api_keys');
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys);
        setConfiguredProviders(Object.keys(parsed));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  return (
    <div className="settings-section">
      <div className="settings-group">
        <h3 className="settings-group-title">Model Provider Configuration</h3>
        <p className="settings-hint mb-4">
          Configure AI model providers to enable model comparisons in your analysis sessions.
        </p>

        <div className="provider-import-container">
          {/* Dynamic import to use existing ModelProviderSettings component */}
          <ModelProviderSettingsImport
            configuredProviders={configuredProviders as any}
            onConfigChange={(provider, config) => {
              console.log('Provider configured:', provider, config);
              // Refresh configured list
              const savedKeys = sessionStorage.getItem('byom_api_keys');
              if (savedKeys) {
                try {
                  const parsed = JSON.parse(savedKeys);
                  setConfiguredProviders(Object.keys(parsed));
                } catch {
                  // Ignore
                }
              }
            }}
          />
        </div>
      </div>

      <div className="settings-group">
        <h3 className="settings-group-title">Provider Status</h3>
        <div className="provider-grid">
          <div className="provider-card">
            <div className="provider-header">
              <Code2 size={20} />
              <h4>AWS Bedrock</h4>
            </div>
            <p className="provider-status active">Pre-configured</p>
            <span className="settings-badge success">Ready</span>
          </div>

          <div className="provider-card">
            <div className="provider-header">
              <Code2 size={20} />
              <h4>Azure OpenAI</h4>
            </div>
            <p className="provider-status">
              {configuredProviders.includes('azure') ? 'Configured' : 'Not configured'}
            </p>
            <span className={`settings-badge ${configuredProviders.includes('azure') ? 'success' : 'warning'}`}>
              {configuredProviders.includes('azure') ? 'Ready' : 'Setup Required'}
            </span>
          </div>

          <div className="provider-card">
            <div className="provider-header">
              <Code2 size={20} />
              <h4>Ollama</h4>
            </div>
            <p className="provider-status">
              {configuredProviders.includes('ollama') ? 'Configured' : 'Not configured'}
            </p>
            <span className={`settings-badge ${configuredProviders.includes('ollama') ? 'success' : 'warning'}`}>
              {configuredProviders.includes('ollama') ? 'Ready' : 'Setup Required'}
            </span>
          </div>

          <div className="provider-card">
            <div className="provider-header">
              <Code2 size={20} />
              <h4>OpenAI</h4>
            </div>
            <p className="provider-status">
              {configuredProviders.includes('openai') ? 'Configured' : 'Not configured'}
            </p>
            <span className={`settings-badge ${configuredProviders.includes('openai') ? 'success' : 'warning'}`}>
              {configuredProviders.includes('openai') ? 'Ready' : 'Setup Required'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};


const DataStorageSettings = () => (
  <div className="settings-section">
    <div className="settings-group">
      <h3 className="settings-group-title">Storage Management</h3>
      <div className="storage-stats">
        <div className="storage-stat">
          <span className="storage-label">Sessions Stored</span>
          <span className="storage-value">24</span>
        </div>
        <div className="storage-stat">
          <span className="storage-label">Templates Saved</span>
          <span className="storage-value">7</span>
        </div>
        <div className="storage-stat">
          <span className="storage-label">Cache Size</span>
          <span className="storage-value">12.4 MB</span>
        </div>
      </div>

      <div className="settings-actions">
        <button className="settings-button secondary">Export Data</button>
        <button className="settings-button danger-outline">Clear Cache</button>
      </div>
    </div>
  </div>
);

const SecuritySettings = () => (
  <div className="settings-section">
    <div className="settings-group">
      <h3 className="settings-group-title">Security Preferences</h3>
      <div className="settings-item">
        <div className="settings-item-header">
          <label className="settings-label">Require confirmation for deletions</label>
          <input type="checkbox" className="settings-checkbox" defaultChecked />
        </div>
        <p className="settings-hint">Show confirmation dialog before deleting sessions or templates</p>
      </div>

      <div className="settings-item">
        <div className="settings-item-header">
          <label className="settings-label">Encrypt local storage</label>
          <input type="checkbox" className="settings-checkbox" />
        </div>
        <p className="settings-hint">Use encryption for sensitive data in local storage</p>
      </div>
    </div>
  </div>
);

const NotificationSettings = () => (
  <div className="settings-section">
    <div className="settings-group">
      <h3 className="settings-group-title">Notification Preferences</h3>
      <div className="settings-item">
        <div className="settings-item-header">
          <label className="settings-label">Analysis completion alerts</label>
          <input type="checkbox" className="settings-checkbox" defaultChecked />
        </div>
        <p className="settings-hint">Show notifications when analysis tasks complete</p>
      </div>

      <div className="settings-item">
        <div className="settings-item-header">
          <label className="settings-label">Error notifications</label>
          <input type="checkbox" className="settings-checkbox" defaultChecked />
        </div>
        <p className="settings-hint">Display alerts for API errors and failures</p>
      </div>
    </div>
  </div>
);

const AppearanceSettings = () => (
  <div className="settings-section">
    <div className="settings-group">
      <h3 className="settings-group-title">Theme & Display</h3>
      <div className="settings-item">
        <div className="settings-item-header">
          <label className="settings-label">Dark Mode</label>
          <div className="theme-toggle-wrapper">
            <ThemeToggle />
          </div>
        </div>
        <p className="settings-hint">Toggle between light and dark color themes</p>
      </div>

      <div className="settings-item">
        <div className="settings-item-header">
          <label className="settings-label">Compact Mode</label>
          <input type="checkbox" className="settings-checkbox" />
        </div>
        <p className="settings-hint">Reduce spacing for more content density</p>
      </div>

      <div className="settings-item">
        <div className="settings-item-header">
          <label className="settings-label">High Contrast</label>
          <input type="checkbox" className="settings-checkbox" />
        </div>
        <p className="settings-hint">Increase contrast for better visibility</p>
      </div>

      <div className="settings-item">
        <div className="settings-item-header">
          <label className="settings-label">Animations</label>
          <input type="checkbox" className="settings-checkbox" defaultChecked />
        </div>
        <p className="settings-hint">Enable smooth transitions and animations</p>
      </div>
    </div>

    <div className="settings-group">
      <h3 className="settings-group-title">Layout Preferences</h3>
      <div className="settings-item">
        <div className="settings-item-header">
          <label className="settings-label">Default Panel Width</label>
          <select className="settings-select">
            <option>Narrow (280px)</option>
            <option>Normal (320px)</option>
            <option>Wide (380px)</option>
          </select>
        </div>
        <p className="settings-hint">Default width for side panels in analysis view</p>
      </div>

      <div className="settings-item">
        <div className="settings-item-header">
          <label className="settings-label">Sticky Headers</label>
          <input type="checkbox" className="settings-checkbox" defaultChecked />
        </div>
        <p className="settings-hint">Keep headers visible while scrolling</p>
      </div>
    </div>
  </div>
);

const AccountSettings = () => (
  <div className="settings-section">
    <div className="settings-group">
      <h3 className="settings-group-title">Profile Information</h3>
      <div className="settings-item">
        <label className="settings-label">Display Name</label>
        <input type="text" className="settings-input" placeholder="Enter your name" />
      </div>

      <div className="settings-item">
        <label className="settings-label">Email</label>
        <input type="email" className="settings-input" placeholder="your@email.com" />
      </div>

      <button className="settings-button primary">Save Changes</button>
    </div>

    <div className="settings-group danger-zone">
      <h3 className="settings-group-title">Danger Zone</h3>
      <div className="settings-item">
        <p className="settings-hint">Permanently delete all data and reset the application</p>
        <button className="settings-button danger">Reset Application</button>
      </div>
    </div>
  </div>
);