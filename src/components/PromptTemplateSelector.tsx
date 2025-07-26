"use client";

import { usePromptStore } from "@/stores/promptStore";
import { useMemo } from "react";
import "./PromptTemplateSelector.css";

type Props = {
  onTemplateInsert: (template: string) => void;
  className?: string;
};

export function PromptTemplateSelector({ onTemplateInsert, className = "" }: Props) {
  const { templates } = usePromptStore();

  const groupedTemplates = useMemo(() => {
    const groups: Record<string, typeof templates> = {};
    templates
      .filter((t) => t.template.trim())
      .forEach((t) => {
        if (!groups[t.analysisType]) groups[t.analysisType] = [];
        groups[t.analysisType].push(t);
      });
    return groups;
  }, [templates]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (selectedId) {
      const selected = templates.find((t) => t.id === selectedId);
      if (selected) {
        onTemplateInsert(selected.template);
      }
      // Reset the select to show placeholder
      e.target.value = "";
    }
  };

  return (
    <select
      className={`prompt-template-select ${className}`}
      onChange={handleChange}
      defaultValue=""
    >
      <option value="" disabled>
        Insert from template...
      </option>
      {Object.entries(groupedTemplates).map(([type, items]) => (
        <optgroup key={type} label={type.toUpperCase()}>
          {items.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
