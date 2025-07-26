"use client";

import { ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePromptStore } from "@/stores/promptStore";

interface PromptFormProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onImageChange: (file: File | null) => void;
  onSubmit: () => void;
  loading: boolean;
  error?: string;
  imagePreview?: string | null;
  onClearImage: () => void;
}

export function PromptForm({
  prompt,
  onPromptChange,
  onImageChange,
  onSubmit,
  loading,
  error,
  imagePreview,
  onClearImage,
}: PromptFormProps) {
  const allTemplates = usePromptStore((s) => s.templates);
  const templates = allTemplates.filter((t) => t.template);

  const handleTemplateSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selected = templates.find((t) => t.id === selectedId);
    if (selected) {
      onPromptChange(prompt + "\n\n" + selected.template);
    }
  };

  return (
    <div className="space-y-4">
      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="flex gap-4">
        <Textarea
          placeholder="Enter your prompt here..."
          className="flex-1 min-h-[120px]"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
        />
        <select
          onChange={handleTemplateSelect}
          defaultValue=""
          className="h-fit p-2 border rounded-md text-sm bg-background"
        >
          <option value="" disabled>
            Insert Template
          </option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => onImageChange(e.target.files?.[0] || null)}
        className="block w-full text-sm"
      />
      {imagePreview && (
        <div className="relative max-w-sm">
          <img src={imagePreview} alt="Selected" className="rounded border" />
          <button
            type="button"
            onClick={onClearImage}
            className="absolute top-1 right-1 bg-white/80 hover:bg-white text-black px-2 py-1 text-xs rounded"
          >
            Remove
          </button>
        </div>
      )}

      <Button onClick={onSubmit} disabled={loading}>
        {loading ? "Generating..." : "Generate"}
      </Button>
    </div>
  );
}
