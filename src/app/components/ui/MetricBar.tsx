import { formatPercent } from "@/app/utils/collections";

interface MetricBarProps {
  label: string;
  value: number;
}

export function MetricBar(props: MetricBarProps) {
  return (
    <div class="space-y-1">
      <div class="flex items-center justify-between text-xs text-slate-300/80">
        <span>{props.label}</span>
        <span>{formatPercent(props.value)}</span>
      </div>
      <div class="metric-bar">
        <span style={{ width: `${props.value}%` }} />
      </div>
    </div>
  );
}
