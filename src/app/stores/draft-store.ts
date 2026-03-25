import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";
import heroesData from "../../../dataset/samples/heroes.seed.json";
import itemsData from "../../../dataset/samples/items.seed.json";
import { createDraftSequence, createInitialDraftState } from "@/app/config/draft";
import { buildItemRecommendations } from "@/app/engines/item-recommendations";
import { buildBanRecommendations, buildHeroRecommendations } from "@/app/engines/recommendations";
import { analyzeTeamComposition } from "@/app/engines/team-analysis";
import type { DraftAction, DraftState } from "@/app/types/draft";
import type { HeroData, ItemData, RankTier, TeamSide } from "@/app/types/data";

const heroPool = heroesData as unknown as HeroData[];
const itemPool = itemsData as unknown as ItemData[];

function getOtherTeam(team: TeamSide): TeamSide {
  return team === "A" ? "B" : "A";
}

export function createDraftStore() {
  const [state, setState] = createStore<DraftState>(createInitialDraftState("Epic"));

  const sequence = createMemo(() => createDraftSequence(state.rank));
  const currentAction = createMemo<DraftAction | null>(() => sequence()[state.currentStep] ?? null);
  const stage = createMemo(() => currentAction()?.phase ?? "postDraft");

  const allBans = createMemo(() => [...state.teams.A.bans, ...state.teams.B.bans]);
  const allPicks = createMemo(() => [...state.teams.A.picks, ...state.teams.B.picks]);
  const unavailable = createMemo(() => new Set([...allBans(), ...allPicks()]));

  const teamHeroes = (team: TeamSide) => heroPool.filter((hero) => state.teams[team].picks.includes(hero.id));
  const teamBans = (team: TeamSide) => heroPool.filter((hero) => state.teams[team].bans.includes(hero.id));

  const availableHeroes = createMemo(() => heroPool.filter((hero) => !unavailable().has(hero.id)));

  const activeTeam = createMemo<TeamSide>(() => currentAction()?.team ?? "A");
  const activeAllies = createMemo(() => teamHeroes(activeTeam()));
  const activeEnemies = createMemo(() => teamHeroes(getOtherTeam(activeTeam())));

  const pickRecommendations = createMemo(() => buildHeroRecommendations(availableHeroes(), activeAllies(), activeEnemies()).slice(0, 6));
  const banRecommendations = createMemo(() => buildBanRecommendations(availableHeroes()).slice(0, 6));

  const analyses = createMemo(() => ({
    A: analyzeTeamComposition(teamHeroes("A"), teamHeroes("B")),
    B: analyzeTeamComposition(teamHeroes("B"), teamHeroes("A"))
  }));

  const isComplete = createMemo(() => stage() === "postDraft");
  const itemRecommendations = createMemo(() => {
    if (!isComplete()) {
      return null;
    }

    return {
      A: buildItemRecommendations(teamHeroes("A"), teamHeroes("B"), itemPool),
      B: buildItemRecommendations(teamHeroes("B"), teamHeroes("A"), itemPool)
    };
  });

  function resetDraft(rank: RankTier = state.rank) {
    setState(createInitialDraftState(rank));
  }

  function setRank(rank: RankTier) {
    setState(createInitialDraftState(rank));
  }

  function commitHero(heroId: string) {
    const action = currentAction();
    if (!action || unavailable().has(heroId)) {
      return;
    }

    const bucket = action.phase === "ban" ? "bans" : "picks";

    setState("teams", action.team, bucket, (existing) => [...existing, heroId]);
    setState("history", (existing) => [...existing, { action, heroId }]);
    setState("currentStep", (step) => step + 1);
  }

  function undoLast() {
    const last = state.history[state.history.length - 1];
    if (!last) {
      return;
    }

    const bucket = last.action.phase === "ban" ? "bans" : "picks";

    setState("teams", last.action.team, bucket, (existing) => existing.filter((heroId) => heroId !== last.heroId));
    setState("history", (existing) => existing.slice(0, -1));
    setState("currentStep", (step) => Math.max(0, step - 1));
  }

  return {
    state,
    sequence,
    stage,
    currentAction,
    activeTeam,
    heroes: heroPool,
    items: itemPool,
    availableHeroes,
    pickRecommendations,
    banRecommendations,
    analyses,
    itemRecommendations,
    teamHeroes,
    teamBans,
    commitHero,
    undoLast,
    resetDraft,
    setRank,
    isComplete
  };
}

