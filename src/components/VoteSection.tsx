"use client";
import { Button } from "@/components/ui/button";

interface VoteSectionProps {
  selected: "A" | "B" | "tie" | null;
  onVote: (choice: "A" | "B" | "tie") => void;
  disabled: boolean;
}

export const VoteSection: React.FC<VoteSectionProps> = ({
  selected,
  onVote,
  disabled,
}) => (
  <div className="flex gap-4 justify-center mt-6">
    {["A", "B", "tie"].map((choice) => (
      <Button
        key={choice}
        variant={selected === choice ? "default" : "outline"}
        onClick={() => onVote(choice as "A" | "B" | "tie")}
        disabled={disabled}
      >
        {selected === choice
          ? `Selected ${choice.toUpperCase()} ✓`
          : `Model ${choice.toUpperCase()}`}
      </Button>
    ))}
  </div>
);
