interface PillProps {
  label: string;
  tone?: "neutral" | "teamA" | "teamB" | "alert";
}

const toneMap = {
  neutral: "border-white/10 bg-white/5 text-slate-100/85",
  teamA: "border-tide-300/30 bg-tide-400/10 text-tide-300",
  teamB: "border-ember-300/30 bg-ember-400/10 text-ember-300",
  alert: "border-rose-300/30 bg-rose-400/10 text-rose-200"
} as const;

export function Pill(props: PillProps) {
  return <span class={`chip ${toneMap[props.tone ?? "neutral"]}`}>{props.label}</span>;
}
