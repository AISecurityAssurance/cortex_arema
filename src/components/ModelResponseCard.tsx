// components/ModelResponseCard.tsx
"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ModelResponseCardProps {
  label: string;
  model: string;
  modelOptions: string[];
  onModelChange: (model: string) => void;
  response: string;
  loading: boolean;
  disabled: boolean;
}

export default function ModelResponseCard({
  label,
  model,
  modelOptions,
  onModelChange,
  response,
  loading,
  disabled,
}: ModelResponseCardProps) {
  return (
    <Card className="w-full border shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-4 space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">{label}</label>
          <select
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={disabled}
            className="w-full border rounded-md p-2 text-sm"
          >
            {modelOptions.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>

        <div
          className={cn(
            "prose dark:prose-invert max-w-none rounded-md min-h-[6rem] p-4 text-sm leading-relaxed",
            loading
              ? "bg-gray-100 dark:bg-zinc-800 animate-pulse"
              : "bg-muted/20 dark:bg-zinc-900"
          )}
        >
          <ReactMarkdown>{loading ? "Generating..." : response}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}
