"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import "./Drawer.css";

export function AppDrawer() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="drawer-trigger" aria-label="Open menu">
          <Menu size={20} />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay" />
        <Dialog.Content
          className="drawer-content"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="drawer-header">
            <h2 className="drawer-title">Menu</h2>
            <Dialog.Close asChild>
              <button
                aria-label="Close menu"
                className="drawer-close"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <nav className="drawer-nav">
            <Link href="/" className="drawer-link">
              Home
            </Link>
            <Link href="/PromptTemplates" className="drawer-link">
              Prompt Templates
            </Link>
          </nav>

          <div className="drawer-section">
            <Link href="/settings" className="drawer-link">
              Settings
            </Link>
          </div>

          <div className="drawer-section">
            <div className="drawer-theme-toggle">
              <span className="drawer-theme-label">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
