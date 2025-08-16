"use client";

import React from "react";
import styles from "./KeyboardShortcutsPopup.module.css";

interface KeyboardShortcut {
  category: string;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

const shortcuts: KeyboardShortcut[] = [
  {
    category: "Navigation",
    shortcuts: [
      { keys: ["Alt", "Drag"], description: "Pan canvas" },
      { keys: ["Middle Mouse", "Drag"], description: "Pan canvas" },
      { keys: ["Scroll"], description: "Zoom in/out" },
      { keys: ["Shift", "Drag"], description: "Box select nodes" }
    ]
  },
  {
    category: "Selection",
    shortcuts: [
      { keys: ["Click"], description: "Select node" },
      { keys: ["Ctrl/Cmd", "Click"], description: "Add to selection" },
      { keys: ["Ctrl/Cmd", "A"], description: "Select all nodes" },
      { keys: ["Esc"], description: "Clear selection" }
    ]
  },
  {
    category: "Editing",
    shortcuts: [
      { keys: ["Delete"], description: "Delete selected" },
      { keys: ["Backspace"], description: "Delete selected" },
      { keys: ["Ctrl/Cmd", "D"], description: "Duplicate selected" },
      { keys: ["Ctrl/Cmd", "Z"], description: "Undo" },
      { keys: ["Ctrl/Cmd", "Y"], description: "Redo" },
      { keys: ["Ctrl/Cmd", "Shift", "Z"], description: "Redo" }
    ]
  },
  {
    category: "Connections",
    shortcuts: [
      { keys: ["Drag from output"], description: "Create connection" },
      { keys: ["Click connection"], description: "Select connection" },
      { keys: ["Delete"], description: "Delete selected connection" }
    ]
  },
  {
    category: "Help",
    shortcuts: [
      { keys: ["Hold", "?"], description: "Show this help" },
      { keys: ["Hold", "H"], description: "Show this help" }
    ]
  }
];

export function KeyboardShortcutsPopup() {
  return (
    <div className={styles.popup}>
      <div className={styles.header}>
        <h3 className={styles.title}>Keyboard Shortcuts</h3>
        <span className={styles.hint}>Release to close</span>
      </div>
      
      <div className={styles.content}>
        {shortcuts.map((category) => (
          <div key={category.category} className={styles.category}>
            <h4 className={styles.categoryTitle}>{category.category}</h4>
            <div className={styles.shortcuts}>
              {category.shortcuts.map((shortcut, index) => (
                <div key={index} className={styles.shortcut}>
                  <div className={styles.keys}>
                    {shortcut.keys.map((key, i) => (
                      <React.Fragment key={i}>
                        <kbd className={styles.key}>{key}</kbd>
                        {i < shortcut.keys.length - 1 && (
                          <span className={styles.plus}>+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <span className={styles.description}>{shortcut.description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}