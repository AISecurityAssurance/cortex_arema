"use client";

import React from "react";

interface JsonViewerProps {
  data: any;
  className?: string;
}

export function JsonViewer({ data, className = "" }: JsonViewerProps) {
  // Helper function to determine the color for different JSON value types
  const getValueColor = (value: any): string => {
    if (value === null || value === undefined) return "#94a3b8"; // slate-400
    if (typeof value === "string") return "#10b981"; // emerald-500
    if (typeof value === "number") return "#3b82f6"; // blue-500
    if (typeof value === "boolean") return "#f59e0b"; // amber-500
    return "#e2e8f0"; // slate-200
  };

  // Helper function to render JSON with syntax highlighting
  const renderJson = (obj: any, indent: number = 0): React.ReactNode => {
    const spaces = "  ".repeat(indent);
    const nextIndent = indent + 1;
    const nextSpaces = "  ".repeat(nextIndent);

    if (obj === null) {
      return <span style={{ color: getValueColor(null) }}>null</span>;
    }

    if (obj === undefined) {
      return <span style={{ color: getValueColor(undefined) }}>undefined</span>;
    }

    if (typeof obj === "string") {
      // Escape special characters and wrap in quotes
      const escaped = obj
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
      return <span style={{ color: getValueColor(obj) }}>"{escaped}"</span>;
    }

    if (typeof obj === "number" || typeof obj === "boolean") {
      return <span style={{ color: getValueColor(obj) }}>{String(obj)}</span>;
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return <span>[]</span>;
      }

      return (
        <>
          <span>[</span>
          {obj.map((item, index) => (
            <React.Fragment key={index}>
              {"\n"}
              <span>{nextSpaces}</span>
              {renderJson(item, nextIndent)}
              {index < obj.length - 1 && <span>,</span>}
            </React.Fragment>
          ))}
          {"\n"}
          <span>{spaces}</span>
          <span>]</span>
        </>
      );
    }

    if (typeof obj === "object") {
      const entries = Object.entries(obj);
      if (entries.length === 0) {
        return <span>{"{}"}</span>;
      }

      return (
        <>
          <span>{"{"}</span>
          {entries.map(([key, value], index) => (
            <React.Fragment key={key}>
              {"\n"}
              <span>{nextSpaces}</span>
              <span style={{ color: "#00bfff" }}>"{key}"</span>
              <span>: </span>
              {renderJson(value, nextIndent)}
              {index < entries.length - 1 && <span>,</span>}
            </React.Fragment>
          ))}
          {"\n"}
          <span>{spaces}</span>
          <span>{"}"}</span>
        </>
      );
    }

    return <span>{String(obj)}</span>;
  };

  // Parse the data if it's a string
  let parsedData = data;
  let parseError = null;

  if (typeof data === "string") {
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      // If it's not valid JSON, we'll display it as a string in a JSON structure
      parsedData = {
        type: "raw_text",
        content: data,
        lines: data.split("\n").length,
        characters: data.length,
      };
      parseError = null; // We're handling non-JSON gracefully
    }
  }

  return (
    <div
      className={className}
      style={{
        fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
        fontSize: "13px",
        lineHeight: "1.5",
        color: "#e2e8f0",
        background: "rgba(0, 0, 0, 0.3)",
        borderRadius: "0.5rem",
        maxHeight: "600px",
        border: "1px solid rgba(0, 191, 255, 0.1)",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header with copy button */}
      <div
        style={{
          background: "rgba(0, 0, 0, 0.5)",
          padding: "0.75rem 1.5rem",
          borderBottom: "1px solid rgba(0, 191, 255, 0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            color: "#00bfff",
            fontSize: "11px",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Raw Response
        </span>
        <button
          onClick={() => {
            const textToCopy = typeof data === "string" ? data : JSON.stringify(parsedData, null, 2);
            navigator.clipboard.writeText(textToCopy);

            // Show a brief "Copied!" feedback
            const button = document.getElementById("json-copy-btn");
            if (button) {
              const originalText = button.textContent;
              button.textContent = "Copied!";
              setTimeout(() => {
                button.textContent = originalText || "Copy";
              }, 2000);
            }
          }}
          id="json-copy-btn"
          style={{
            background: "rgba(0, 191, 255, 0.1)",
            border: "1px solid rgba(0, 191, 255, 0.2)",
            color: "#00bfff",
            padding: "0.25rem 0.75rem",
            borderRadius: "0.25rem",
            fontSize: "11px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0, 191, 255, 0.2)";
            e.currentTarget.style.borderColor = "#00bfff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0, 191, 255, 0.1)";
            e.currentTarget.style.borderColor = "rgba(0, 191, 255, 0.2)";
          }}
        >
          Copy
        </button>
      </div>

      {/* JSON Content */}
      <div
        style={{
          padding: "1.5rem",
          overflowX: "auto",
          overflowY: "auto",
          flex: 1,
        }}
      >
        <pre
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          <code>{renderJson(parsedData)}</code>
        </pre>
      </div>

      {parseError && (
        <div
          style={{
            margin: "1rem 1.5rem",
            padding: "0.75rem",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "0.25rem",
            color: "#ef4444",
            fontSize: "12px",
          }}
        >
          <strong>Parse Error:</strong> {parseError}
        </div>
      )}
    </div>
  );
}