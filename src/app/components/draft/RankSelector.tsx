import type { RankTier } from "@/app/types/data";

interface RankSelectorProps {
  rank: RankTier;
  onChange: (rank: RankTier) => void;
}

const ranks: RankTier[] = ["Epic", "Legend", "Mythic"];

export function RankSelector(props: RankSelectorProps) {
  return (
    <div class="flex flex-wrap gap-2">
      {ranks.map((rank) => (
        <button
          type="button"
          class={`rounded-full border px-4 py-2 text-sm font-medium transition ${props.rank === rank ? "border-tide-300/40 bg-tide-400/15 text-tide-200" : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10"}`}
          onClick={() => props.onChange(rank)}
        >
          {rank}
        </button>
      ))}
    </div>
  );
}
