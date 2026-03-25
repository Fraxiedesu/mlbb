import { For } from "solid-js";
import type { HeroData, TeamSide } from "@/app/types/data";
import { Pill } from "@/app/components/ui/Pill";

interface TeamColumnProps {
  team: TeamSide;
  bans: HeroData[];
  picks: HeroData[];
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
            {(hero) => <span class="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300/80">{hero?.name ?? "Open"}</span>}
          </For>
        </div>
      </div>

      <div>
        <p class="mb-2 text-xs uppercase tracking-[0.25em] text-slate-400">Picks</p>
        <div class="space-y-2">
          <For each={props.picks.length ? props.picks : Array.from({ length: 5 }, () => null)}>
            {(hero) => (
              <div class="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                {hero ? (
                  <div class="flex items-center justify-between gap-3">
                    <span>{hero.name}</span>
                    <span class="text-xs text-slate-400">{hero.role.join(" / ")}</span>
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
