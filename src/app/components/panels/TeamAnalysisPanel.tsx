import { For } from "solid-js";
import type { TeamAnalysis } from "@/app/types/data";
import { MetricBar } from "@/app/components/ui/MetricBar";
import { Pill } from "@/app/components/ui/Pill";
import { SectionCard } from "@/app/components/ui/SectionCard";

interface TeamAnalysisPanelProps {
  teamA: TeamAnalysis;
  teamB: TeamAnalysis;
}

function AnalysisColumn(props: { label: string; tone: "teamA" | "teamB"; analysis: TeamAnalysis }) {
  return (
    <div class="space-y-4 rounded-3xl border border-white/10 bg-black/10 p-4">
      <div class="flex items-center justify-between">
        <p class="font-display text-lg font-semibold">{props.label}</p>
        <Pill label="Comp Scan" tone={props.tone} />
      </div>
      <div class="grid gap-3">
        <For each={props.analysis.metrics.slice(0, 8)}>{(metric) => <MetricBar label={metric.label} value={metric.value} />}</For>
      </div>
      <div class="space-y-2 text-sm text-slate-300/85">
        <p><span class="text-dawn-100">Playstyle:</span> {props.analysis.playstyle}</p>
        <p><span class="text-dawn-100">Win condition:</span> {props.analysis.winCondition}</p>
        <p><span class="text-tide-300">Strengths:</span> {props.analysis.strengths.join(" • ") || "Balanced profile."}</p>
        <p><span class="text-rose-200">Weaknesses:</span> {props.analysis.weaknesses.join(" • ") || "No major red flags yet."}</p>
      </div>
    </div>
  );
}

export function TeamAnalysisPanel(props: TeamAnalysisPanelProps) {
  return (
    <SectionCard title="Team Composition Scan" subtitle="Metrics are explicit heuristics derived from tags, ratings, and damage balance.">
      <div class="grid gap-4 xl:grid-cols-2">
        <AnalysisColumn label="Team A" tone="teamA" analysis={props.teamA} />
        <AnalysisColumn label="Team B" tone="teamB" analysis={props.teamB} />
      </div>
    </SectionCard>
  );
}
