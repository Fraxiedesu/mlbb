import type { DraftStage, RankTier, TeamSide } from "./data";

export interface DraftAction {
  phase: Exclude<DraftStage, "postDraft">;
  team: TeamSide;
  order: number;
}

export interface TeamDraftState {
  bans: string[];
  picks: string[];
}

export interface DraftState {
  rank: RankTier;
  teams: Record<TeamSide, TeamDraftState>;
  currentStep: number;
  history: Array<{
    action: DraftAction;
    heroId: string;
  }>;
}
