"use client";

import { usePromptStore } from "@/stores/promptStore";
import { useMemo } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from "@/components/ui/select";

type Props = {
  onTemplateInsert: (template: string) => void;
};

export function PromptTemplateSelector({ onTemplateInsert }: Props) {
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

  return (
    <Select
      onValueChange={(id) => {
        const selected = templates.find((t) => t.id === id);
        if (selected) onTemplateInsert(selected.template);
      }}
    >
      <SelectTrigger className="w-[260px]">
        <SelectValue placeholder="Insert from template..." />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(groupedTemplates).map(([type, items]) => (
          <SelectGroup key={type}>
            <SelectLabel>{type.toUpperCase()}</SelectLabel>
            {items.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
