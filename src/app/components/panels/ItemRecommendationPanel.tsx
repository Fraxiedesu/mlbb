import { For, Show } from "solid-js";
import type { ItemRecommendation } from "@/app/types/data";
import { Pill } from "@/app/components/ui/Pill";
import { SectionCard } from "@/app/components/ui/SectionCard";

interface ItemRecommendationPanelProps {
  title: string;
  recommendations: ItemRecommendation[];
  tone: "teamA" | "teamB";
}

export function ItemRecommendationPanel(props: ItemRecommendationPanelProps) {
  return (
    <SectionCard title={props.title} subtitle="Core means the draft strongly supports the recommendation; situational means matchup-dependent value.">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <For each={props.recommendations}>
          {(entry) => (
            <div class="rounded-3xl border border-white/10 bg-black/10 p-4">
              <div class="mb-3 flex items-center justify-between gap-3">
                <p class="font-display text-lg font-semibold text-dawn-100">{entry.heroName}</p>
                <Pill label="Counter Build" tone={props.tone} />
              </div>
              <Show when={entry.recommendations.length} fallback={<p class="text-sm text-slate-400">No strong item match from the current starter pool.</p>}>
                <div class="space-y-3">
                  <For each={entry.recommendations}>
                    {(recommendation) => (
                      <div class="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div class="mb-2 flex items-center justify-between gap-3">
                          <p class="font-medium text-slate-100">{recommendation.item.name}</p>
                          <Pill label={recommendation.tier} tone={recommendation.tier === "Core" ? props.tone : "neutral"} />
                        </div>
                        <p class="text-sm text-slate-300/85">{recommendation.reasons.join(" • ")}</p>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>
    </SectionCard>
  );
}
