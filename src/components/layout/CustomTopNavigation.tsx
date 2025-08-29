"use client";

import React from "react";
import { 
  ButtonDropdown,
  Icon,
  Badge
} from "@cloudscape-design/components";
import { useRouter } from "next/navigation";
import { useCloudscapeTheme } from "@/contexts/CloudscapeThemeContext";
import "./CustomTopNavigation.css";

interface CustomTopNavigationProps {
  // Optional props for customization
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

export function CustomTopNavigation(props: CustomTopNavigationProps) {
  const router = useRouter();
  const { toggleMode, theme } = useCloudscapeTheme();

  const navItems = [
    { label: "Analysis", path: "/analysis" },
    { label: "Sessions", path: "/sessions" },
    { label: "Templates", path: "/templates" },
    { label: "Pipeline Editor", path: "/pipeline-editor" },
  ];

  const userMenuItems = [
    { id: "profile", text: "Profile" },
    { id: "preferences", text: "Preferences" },
    { id: "security", text: "Security" },
    { id: "signout", text: "Sign out" }
  ];

  return (
    <nav className={`custom-top-navigation ${theme}`}>
      <div className="nav-container">
        {/* Logo and Brand */}
        <div className="nav-brand">
          <a href="/" className="brand-link">
            <CortexLogo />
            <span className="brand-text">Cortex Arena</span>
          </a>
        </div>

        {/* Navigation Items */}
        <div className="nav-items">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="nav-link"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Utilities Section */}
        <div className="nav-utilities">
          {/* Theme Toggle */}
          <button
            onClick={toggleMode}
            aria-label="Toggle theme"
            className="utility-button theme-toggle"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          {/* Notifications */}
          <button
            aria-label="Notifications"
            className="utility-button notification-button"
          >
            <Icon name="notification" />
            <Badge color="red" className="notification-badge">3</Badge>
          </button>

          {/* Settings */}
          <button
            aria-label="Settings"
            className="utility-button settings-button"
          >
            <Icon name="settings" />
          </button>

          {/* User Menu */}
          <ButtonDropdown
            items={userMenuItems}
            variant="icon"
            onItemClick={(e) => {
              if (e.detail.id === "signout") {
                // Handle signout
              }
              // Handle other menu items as needed
            }}
            className="user-menu"
          >
            <Icon name="user-profile" />
            <span className="user-menu-text">User</span>
          </ButtonDropdown>
        </div>
      </div>
    </nav>
  );
}