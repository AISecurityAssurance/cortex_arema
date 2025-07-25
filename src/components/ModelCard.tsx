import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

type Props = {
  id: "A" | "B";
  label: string;
  model: string;
  models: string[];
  response: string;
  explanation?: string;
  blindMode: boolean;
  selected: string | null;
  loading: boolean;
  onModelChange: (model: string) => void;
  onVote: () => void;
};

export function ModelCard({
  id,
  label,
  model,
  models,
  response,
  explanation,
  blindMode,
  selected,
  loading,
  onModelChange,
  onVote,
}: Props) {
  const isSelected = selected === id;

  return (
    <Card
      className={cn(
        "border transition-shadow hover:shadow-lg",
        isSelected && "border-blue-600 shadow-xl"
      )}
    >
      <CardContent className="p-6 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Select Model {label}</label>
          <select
            className="w-full border rounded-md p-2 text-sm"
            disabled={blindMode || loading}
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
          >
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="text-sm font-semibold text-muted-foreground">
          {blindMode ? "Model ?" : model}
        </div>

        <div
          className={cn(
            "rounded-md min-h-[6rem] p-4 text-sm whitespace-pre-wrap leading-relaxed",
            loading ? "bg-gray-100 dark:bg-zinc-800 animate-pulse" : "bg-muted/20 dark:bg-zinc-900"
          )}
        >
          <ReactMarkdown>{response}</ReactMarkdown>
        </div>

        {explanation && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            {explanation}
          </div>
        )}

        <Button
          className="w-full"
          variant={isSelected ? "default" : "outline"}
          onClick={onVote}
          disabled={loading}
        >
          {isSelected ? "Selected ✓" : "Vote for this response"}
        </Button>
      </CardContent>
    </Card>
  );
}
