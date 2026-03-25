import type { DraftAction, DraftState } from "@/app/types/draft";
import type { RankTier } from "@/app/types/data";

export const BAN_COUNTS: Record<RankTier, number> = {
  Epic: 3,
  Legend: 4,
  Mythic: 5
};

export const TEAM_SEQUENCE = ["A", "B"] as const;
export const PICK_SEQUENCE = ["A", "B", "B", "A", "A", "B", "B", "A", "A", "B"] as const;

export function createDraftSequence(rank: RankTier): DraftAction[] {
  const actions: DraftAction[] = [];
  const banCount = BAN_COUNTS[rank];

  for (let index = 0; index < banCount * 2; index += 1) {
    actions.push({
      phase: "ban",
      team: TEAM_SEQUENCE[index % 2],
      order: index + 1
    });
  }

  PICK_SEQUENCE.forEach((team, index) => {
    actions.push({
      phase: "pick",
      team,
      order: banCount * 2 + index + 1
    });
  });

  return actions;
}

export function createInitialDraftState(rank: RankTier = "Epic"): DraftState {
  return {
    rank,
    teams: {
      A: { bans: [], picks: [] },
      B: { bans: [], picks: [] }
    },
    currentStep: 0,
    history: []
  };
}
