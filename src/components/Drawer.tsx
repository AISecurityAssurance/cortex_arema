"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import Link from "next/link";

export function AppDrawer() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          aria-label="Open menu"
          className="rounded-md p-2 border bg-card hover:bg-muted transition"
        >
          <Menu size={20} />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content
          className="fixed top-0 left-0 h-full w-72 bg-background border-r z-50 p-6 shadow-lg"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Dialog.Close asChild>
              <button
                aria-label="Close menu"
                className="rounded-md p-2 hover:bg-muted transition"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <nav className="space-y-4">
            <Link
              href="/"
              className="block text-sm font-medium hover:underline"
            >
              Home
            </Link>
            <Link
              href="/prompt-templates"
              className="block text-sm font-medium hover:underline"
            >
              Prompt Templates
            </Link>
          </nav>

          <div className="mt-8">
            <ThemeToggle />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
