import { For, Show } from "solid-js";
import { EntityIcon } from "@/app/components/ui/EntityIcon";
import { Pill } from "@/app/components/ui/Pill";
import { SectionCard } from "@/app/components/ui/SectionCard";
import type { HeroRecommendation } from "@/app/types/data";
import { getHeroIconUrl } from "@/app/utils/media";

interface SuggestionPanelProps {
  mode: "ban" | "pick";
  recommendations: HeroRecommendation[];
}

export function SuggestionPanel(props: SuggestionPanelProps) {
  return (
    <SectionCard
      title={props.mode === "ban" ? "Priority Bans" : "Next Pick Recommendations"}
      subtitle={props.mode === "ban" ? "Threat-first ordering based on the current pool." : "Scores blend counter value, synergy, and missing team needs."}
    >
      <div class="space-y-3">
        <For each={props.recommendations}>
          {(entry, index) => (
            <div class="rounded-3xl border border-white/10 bg-black/10 p-4">
              <div class="mb-3 flex items-start justify-between gap-3">
                <div class="flex items-start gap-3">
                  <EntityIcon src={getHeroIconUrl(entry.hero)} alt={`${entry.hero.name} icon`} label={entry.hero.name} shape="circle" />
                  <div>
                    <p class="font-display text-lg font-semibold text-dawn-100">#{index() + 1} {entry.hero.name}</p>
                    <p class="text-sm text-slate-400">{entry.hero.role.join(" / ")} • {entry.hero.lanes.join(" / ")}</p>
                  </div>
                </div>
                <Pill label={`${Math.round(entry.overall)} score`} tone="alert" />
              </div>
              <div class="mb-3 flex flex-wrap gap-2">
                <For each={entry.hero.normalizedTags.slice(0, 5)}>{(tag) => <Pill label={tag} />}</For>
              </div>
              <Show when={props.mode === "pick"} fallback={<p class="text-sm text-slate-300/80">{entry.counter.reasons[0] ?? "Broad draft threat with high conversion value."}</p>}>
                <div class="space-y-2 text-sm text-slate-300/85">
                  <p><span class="text-tide-300">Counter:</span> {entry.counter.reasons.join(" • ") || "Stable all-around answer."}</p>
                  <p><span class="text-ember-300">Synergy:</span> {entry.synergy.reasons.join(" • ") || "Flexible fit into the current team."}</p>
                  <p><span class="text-dawn-100">Draft fit:</span> {entry.fitBonus.reasons.join(" • ") || "No major draft-gap bonus required."}</p>
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>
    </SectionCard>
  );
}
