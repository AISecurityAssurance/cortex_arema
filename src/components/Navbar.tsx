"use client";

import { AppDrawer } from "@/components/Drawer";
import Link from "next/link";
import "./Navbar.css";

export function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-content">
        <div className="navbar-left">
          <AppDrawer />
          <Link href="/" className="navbar-title">
            Cortex Arena
          </Link>
        </div>
        <div className="navbar-actions">
          {/* Actions can go here */}
        </div>
      </div>
    </header>
  );
}
