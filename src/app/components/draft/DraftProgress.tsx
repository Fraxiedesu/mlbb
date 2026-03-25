import type { DraftAction } from "@/app/types/draft";
import { Pill } from "@/app/components/ui/Pill";

interface DraftProgressProps {
  action: DraftAction | null;
  step: number;
  total: number;
}

export function DraftProgress(props: DraftProgressProps) {
  const label = () => {
    if (!props.action) {
      return "Draft complete";
    }

    return `${props.action.team === "A" ? "Team A" : "Team B"} ${props.action.phase === "ban" ? "ban" : "pick"}`;
  };

  return (
    <div class="flex flex-wrap items-center gap-3">
      <Pill label={label()} tone={props.action?.team === "A" ? "teamA" : props.action?.team === "B" ? "teamB" : "neutral"} />
      <span class="text-sm text-slate-300/75">Step {Math.min(props.step + 1, props.total)} of {props.total}</span>
    </div>
  );
}
