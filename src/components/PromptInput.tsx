"use client";
import React from "react";

interface PromptInputProps {
  prompt: string;
  onChange: (value: string) => void;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  prompt,
  onChange,
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium">
      Text Prompt <span className="text-red-500">*</span>
    </label>
    <textarea
      className="w-full h-28 p-3 border rounded-md dark:bg-zinc-900 dark:text-white text-sm"
      placeholder="Describe your image or ask a question..."
      value={prompt}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);
