import { For, createMemo, createSignal } from "solid-js";
import { Pill } from "@/app/components/ui/Pill";
import type { HeroData, Lane } from "@/app/types/data";

interface HeroPoolProps {
  heroes: HeroData[];
  activeTeam: "A" | "B";
  phase: "ban" | "pick" | "postDraft";
  onSelect: (heroId: string) => void;
}

export function HeroPool(props: HeroPoolProps) {
  const [query, setQuery] = createSignal("");
  const [lane, setLane] = createSignal<"All" | Lane>("All");

  const laneOptions = createMemo<(Lane | "All")[]>(() => {
    const lanes = new Set<Lane>();

    for (const hero of props.heroes) {
      for (const heroLane of hero.lanes) {
        lanes.add(heroLane);
      }
    }

    return ["All", ...Array.from(lanes).sort()];
  });

  const filtered = createMemo(() => {
    const search = query().trim().toLowerCase();
    const selectedLane = lane();

    return props.heroes.filter((hero) => {
      if (selectedLane !== "All" && !hero.lanes.includes(selectedLane)) {
        return false;
      }

      if (!search) {
        return true;
      }

      const haystack = [hero.name, hero.role.join(" "), hero.lanes.join(" "), hero.normalizedTags.join(" ")]
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  });

  return (
    <div class="space-y-4">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p class="font-display text-lg font-semibold">Hero Pool</p>
          <p class="text-sm text-slate-300/80">Select one hero at a time. Banned and already-picked heroes are excluded automatically.</p>
        </div>
        <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px] xl:w-[34rem]">
          <input
            value={query()}
            onInput={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search hero, role, lane, or tag"
            class="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100 outline-none ring-0 transition placeholder:text-slate-500 focus:border-tide-300/40"
          />
          <select
            value={lane()}
            onChange={(event) => setLane(event.currentTarget.value as "All" | Lane)}
            class="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100 outline-none ring-0 transition focus:border-tide-300/40"
          >
            <For each={laneOptions()}>
              {(option) => (
                <option value={option} class="bg-slate-950">
                  {option === "All" ? "All Lanes" : option}
                </option>
              )}
            </For>
          </select>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <For each={filtered()}>
          {(hero) => (
            <button
              type="button"
              onClick={() => props.onSelect(hero.id)}
              disabled={props.phase === "postDraft"}
              class="rounded-3xl border border-white/10 bg-black/10 p-4 text-left transition hover:border-tide-300/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div class="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p class="font-display text-lg font-semibold text-dawn-100">{hero.name}</p>
                  <p class="text-sm text-slate-400">{hero.role.join(" / ")} • {hero.lanes.join(" / ")}</p>
                </div>
                <Pill label={`Team ${props.activeTeam} ${props.phase}`} tone={props.activeTeam === "A" ? "teamA" : "teamB"} />
              </div>
              <div class="mb-3 flex flex-wrap gap-2">
                <For each={hero.normalizedTags.slice(0, 4)}>{(tag) => <Pill label={tag} />}</For>
              </div>
              <p class="text-sm text-slate-300/85">{hero.strengths[0]}</p>
            </button>
          )}
        </For>
      </div>
    </div>
  );
}
