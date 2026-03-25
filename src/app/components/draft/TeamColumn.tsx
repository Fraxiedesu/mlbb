import { For } from "solid-js";
import { EntityIcon } from "@/app/components/ui/EntityIcon";
import { Pill } from "@/app/components/ui/Pill";
import type { HeroData, TeamSide } from "@/app/types/data";
import type { DraftPickView } from "@/app/types/draft";
import { getHeroIconUrl } from "@/app/utils/media";

interface TeamColumnProps {
  team: TeamSide;
  bans: HeroData[];
  picks: Array<(DraftPickView & { hero: HeroData }) | null>;
  banSlots: number;
}

export function TeamColumn(props: TeamColumnProps) {
  const tone = () => (props.team === "A" ? "teamA" : "teamB");

  return (
    <div class="space-y-4 rounded-3xl border border-white/10 bg-black/10 p-4">
      <div class="flex items-center justify-between">
        <h3 class="font-display text-lg font-semibold">Team {props.team}</h3>
        <Pill label={`${props.picks.length} picks / ${props.bans.length} bans`} tone={tone()} />
      </div>

      <div>
        <p class="mb-2 text-xs uppercase tracking-[0.25em] text-slate-400">Bans</p>
        <div class="flex flex-wrap gap-2">
          <For each={props.bans.length ? props.bans : Array.from({ length: props.banSlots }, () => null)}>
            {(hero) => (
              <span class="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300/80">
                {hero ? <EntityIcon src={getHeroIconUrl(hero)} alt={`${hero.name} icon`} label={hero.name} shape="circle" sizeClass="h-8 w-8" /> : null}
                {hero?.name ?? "Open"}
              </span>
            )}
          </For>
        </div>
      </div>

      <div>
        <p class="mb-2 text-xs uppercase tracking-[0.25em] text-slate-400">Picks</p>
        <div class="space-y-2">
          <For each={props.picks.length ? props.picks : Array.from({ length: 5 }, () => null)}>
            {(pick) => (
              <div class="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                {pick ? (
                  <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <EntityIcon src={getHeroIconUrl(pick.hero)} alt={`${pick.hero.name} icon`} label={pick.hero.name} shape="circle" sizeClass="h-10 w-10" />
                      <div class="flex min-w-0 flex-col">
                        <span>{pick.hero.name}</span>
                        <span class="text-xs text-slate-400">{pick.lane}</span>
                      </div>
                    </div>
                    <span class="text-xs text-slate-400">{pick.hero.role.join(" / ")}</span>
                  </div>
                ) : (
                  <span class="text-slate-500">Waiting</span>
                )}
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
