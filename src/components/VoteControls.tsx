import { Button } from "@/components/ui/button";

type Props = {
  selected: "A" | "B" | "tie" | null;
  disabled: boolean;
  onVote: (id: "A" | "B" | "tie") => void;
};

export function VoteControls({ selected, onVote, disabled }: Props) {
  return (
    <div className="text-center">
      <Button
        variant={selected === "tie" ? "default" : "outline"}
        onClick={() => onVote("tie")}
        disabled={disabled}
      >
        {selected === "tie" ? "Selected Tie ✓" : "Vote Tie"}
      </Button>
    </div>
  );
}
