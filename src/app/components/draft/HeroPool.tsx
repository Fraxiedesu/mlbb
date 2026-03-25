import { For, createMemo, createSignal } from "solid-js";
import { EntityIcon } from "@/app/components/ui/EntityIcon";
import type { HeroData, Lane } from "@/app/types/data";
import { getHeroIconUrl } from "@/app/utils/media";

interface HeroPoolProps {
  heroes: HeroData[];
  activeTeam: "A" | "B";
  phase: "ban" | "pick" | "postDraft";
  missingLanes?: Lane[];
  onSelect: (heroId: string, lane?: Lane) => void;
}

export function HeroPool(props: HeroPoolProps) {
  const [query, setQuery] = createSignal("");
  const [lane, setLane] = createSignal<"All" | Lane>("All");

  const laneOptions = createMemo<Array<"All" | Lane>>(() => {
    const lanes = new Set<Lane>();

    for (const hero of props.heroes) {
      for (const heroLane of hero.lanes) {
        lanes.add(heroLane);
      }
    }

    const options = Array.from(lanes).sort();
    return ["All", ...options];
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
          <p class="text-sm text-slate-300/80">Dense draft grid for faster scanning. Banned and already-picked heroes are excluded automatically.</p>
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
                  {option === "All" ? (props.phase === "pick" ? "Auto Lane" : "All Lanes") : option}
                </option>
              )}
            </For>
          </select>
        </div>
      </div>

      {props.phase === "pick" && props.missingLanes?.length ? (
        <p class="text-sm text-slate-300/80">Missing lanes: {props.missingLanes.join(" / ")}. Auto lane will try to fill one of them first.</p>
      ) : null}

      <div class="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        <For each={filtered()}>
          {(hero) => (
            <button
              type="button"
              onClick={() => props.onSelect(hero.id, props.phase === "pick" && lane() !== "All" ? (lane() as Lane) : undefined)}
              disabled={props.phase === "postDraft"}
              class="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/10 px-3 py-2 text-left transition hover:border-tide-300/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <EntityIcon src={getHeroIconUrl(hero)} alt={`${hero.name} icon`} label={hero.name} shape="circle" sizeClass="h-10 w-10" />
              <span class="min-w-0 truncate font-medium text-dawn-100">{hero.name}</span>
            </button>
          )}
        </For>
      </div>
    </div>
  );
}
