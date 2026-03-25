import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";
import heroesData from "../../../dataset/samples/heroes.seed.json";
import itemsData from "../../../dataset/samples/items.seed.json";
import { createDraftSequence, createInitialDraftState } from "@/app/config/draft";
import { buildItemRecommendations } from "@/app/engines/item-recommendations";
import { buildBanRecommendations, buildHeroRecommendations } from "@/app/engines/recommendations";
import { analyzeTeamComposition } from "@/app/engines/team-analysis";
import type { DraftAction, DraftPickView, DraftState } from "@/app/types/draft";
import type { HeroData, ItemData, Lane, RankTier, TeamSide } from "@/app/types/data";

const heroPool = heroesData as unknown as HeroData[];
const itemPool = itemsData as unknown as ItemData[];
const STANDARD_LANES: Lane[] = ["Roam", "EXP", "Jungle", "Gold", "Mid"];

function getOtherTeam(team: TeamSide): TeamSide {
  return team === "A" ? "B" : "A";
}

export function createDraftStore() {
  const [state, setState] = createStore<DraftState>(createInitialDraftState("Epic"));

  const sequence = createMemo(() => createDraftSequence(state.rank));
  const currentAction = createMemo<DraftAction | null>(() => sequence()[state.currentStep] ?? null);
  const stage = createMemo(() => currentAction()?.phase ?? "postDraft");

  const allBans = createMemo(() => [...state.teams.A.bans, ...state.teams.B.bans]);
  const allPicks = createMemo(() => [...state.teams.A.picks, ...state.teams.B.picks].map((pick) => pick.heroId));
  const unavailable = createMemo(() => new Set([...allBans(), ...allPicks()]));

  const resolveHero = (heroId: string) => heroPool.find((hero) => hero.id === heroId) ?? null;
  const teamPickEntries = (team: TeamSide): Array<DraftPickView & { hero: HeroData }> =>
    state.teams[team].picks
      .map((pick) => {
        const hero = resolveHero(pick.heroId);
        return hero ? { ...pick, hero } : null;
      })
      .filter((pick): pick is DraftPickView & { hero: HeroData } => Boolean(pick));
  const teamHeroes = (team: TeamSide) => teamPickEntries(team).map((pick) => pick.hero);
  const teamBans = (team: TeamSide) => heroPool.filter((hero) => state.teams[team].bans.includes(hero.id));
  const teamAssignedLanes = (team: TeamSide) => teamPickEntries(team).map((pick) => pick.lane);

  const availableHeroes = createMemo(() => heroPool.filter((hero) => !unavailable().has(hero.id)));

  const activeTeam = createMemo<TeamSide>(() => currentAction()?.team ?? "A");
  const activeAllies = createMemo(() => teamHeroes(activeTeam()));
  const activeEnemies = createMemo(() => teamHeroes(getOtherTeam(activeTeam())));
  const activeMissingLanes = createMemo(() => STANDARD_LANES.filter((lane) => !teamAssignedLanes(activeTeam()).includes(lane)));

  const pickRecommendations = createMemo(() =>
    buildHeroRecommendations(availableHeroes(), activeAllies(), activeEnemies(), {
      allyAssignedLanes: teamAssignedLanes(activeTeam())
    }).slice(0, 6)
  );
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

  function getPreferredLane(heroId: string, team: TeamSide, requestedLane?: Lane) {
    const hero = resolveHero(heroId);
    if (!hero) {
      return STANDARD_LANES[0];
    }

    if (requestedLane && hero.lanes.includes(requestedLane)) {
      return requestedLane;
    }

    const missingLanes = STANDARD_LANES.filter((lane) => !teamAssignedLanes(team).includes(lane));
    const missingLaneMatch = hero.lanes.find((lane) => missingLanes.includes(lane));
    return missingLaneMatch ?? hero.lanes[0] ?? STANDARD_LANES[0];
  }

  function commitHero(heroId: string, lane?: Lane) {
    const action = currentAction();
    if (!action || unavailable().has(heroId)) {
      return;
    }

    if (action.phase === "ban") {
      setState("teams", action.team, "bans", (existing) => [...existing, heroId]);
      setState("history", (existing) => [...existing, { action, heroId }]);
      setState("currentStep", (step) => step + 1);
      return;
    }

    const assignedLane = getPreferredLane(heroId, action.team, lane);
    setState("teams", action.team, "picks", (existing) => [...existing, { heroId, lane: assignedLane }]);
    setState("history", (existing) => [...existing, { action, heroId, lane: assignedLane }]);
    setState("currentStep", (step) => step + 1);
  }

  function undoLast() {
    const last = state.history[state.history.length - 1];
    if (!last) {
      return;
    }

    if (last.action.phase === "ban") {
      setState("teams", last.action.team, "bans", (existing) => existing.filter((heroId) => heroId !== last.heroId));
    } else {
      setState(
        "teams",
        last.action.team,
        "picks",
        (existing) => existing.filter((pick) => !(pick.heroId === last.heroId && pick.lane === last.lane))
      );
    }
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
    teamPickEntries,
    teamAssignedLanes,
    activeMissingLanes,
    teamBans,
    commitHero,
    undoLast,
    resetDraft,
    setRank,
    isComplete
  };
}

