import { scoringWeights } from "@/app/config/scoring";
import type { CounterTag, HeroData, HeroRecommendation, HeroTag, Lane, ScoreBreakdown } from "@/app/types/data";
import { average, countMatches, sortByScore, unique } from "@/app/utils/collections";

const STANDARD_LANES: Lane[] = ["Roam", "EXP", "Jungle", "Gold", "Mid"];

const ENEMY_TAG_TO_RESPONSES: Partial<Record<HeroTag, CounterTag[]>> = {
  Engage: ["Anti-Dive", "CC Lock"],
  Mobility: ["Mobility Punish", "CC Lock"],
  Frontline: ["Anti-Tank"],
  Sustain: ["Sustain Punish"],
  Burst: ["Burst Guard"],
  Poke: ["Range Punish", "Engage Start"],
  Siege: ["Siege Break", "Engage Start"],
  Ambush: ["Anti-Dive", "Burst Guard"],
  Pickoff: ["Burst Guard", "CC Lock"],
  "Backline Carry": ["Backline Access", "Range Punish"],
  Snowball: ["Snowball Punish"],
  AoE: ["Objective Denial"]
};

function collectTags(heroes: HeroData[]) {
  return unique(heroes.flatMap((hero) => hero.normalizedTags));
}

function collectRoles(heroes: HeroData[]) {
  return unique(heroes.flatMap((hero) => hero.role));
}

function collectStyles(heroes: HeroData[]) {
  return unique(heroes.flatMap((hero) => hero.fitStyles));
}

function detectTeamNeeds(allies: HeroData[], assignedLanes: Lane[] = []) {
  const tags = collectTags(allies);
  const physicalCount = allies.filter((hero) => hero.damageProfile.primary === "Physical").length;
  const magicCount = allies.filter((hero) => hero.damageProfile.primary === "Magic").length;
  const missingAssignedLanes = STANDARD_LANES.filter((lane) => !assignedLanes.includes(lane));

  return {
    needsFrontline: !tags.includes("Frontline"),
    needsEngage: !tags.includes("Engage"),
    needsPeel: !tags.includes("Peel"),
    needsBacklineCarry: !tags.includes("Backline Carry"),
    needsMagicDamage: allies.length > 0 && magicCount === 0,
    needsPhysicalDamage: allies.length > 0 && physicalCount === 0,
    needsObjectiveControl: average(allies.map((hero) => hero.ratings.objective)) < 3,
    missingAssignedLanes
  };
}

function createBreakdown(total = 0, reasons: string[] = []): ScoreBreakdown {
  return { total, reasons };
}

export function buildBanRecommendations(availableHeroes: HeroData[]) {
  return sortByScore(
    availableHeroes.map((hero) => {
      const score =
        hero.ratings.teamfight * 6 +
        hero.ratings.pickoff * 5 +
        hero.ratings.burst * 4 +
        hero.ratings.dps * 4 +
        hero.ratings.mobility * 3 +
        hero.fitStyles.length;

      const reasons = [
        hero.ratings.teamfight >= 4 ? "High teamfight ceiling" : "Flexible threat profile",
        hero.ratings.pickoff >= 4 ? "Strong solo-pick pressure" : "Hard to draft around cleanly"
      ];

      return {
        hero,
        overall: score,
        counter: createBreakdown(score, reasons),
        synergy: createBreakdown(0, []),
        fitBonus: createBreakdown(0, [])
      };
    })
  );
}

export function buildHeroRecommendations(
  availableHeroes: HeroData[],
  allies: HeroData[],
  enemies: HeroData[],
  options: { allyAssignedLanes?: Lane[] } = {}
): HeroRecommendation[] {
  const allyTags = collectTags(allies);
  const allyRoles = collectRoles(allies);
  const allyStyles = collectStyles(allies);
  const enemyTags = collectTags(enemies);
  const enemyResponses = unique(enemyTags.flatMap((tag) => ENEMY_TAG_TO_RESPONSES[tag] ?? []));
  const needs = detectTeamNeeds(allies, options.allyAssignedLanes ?? []);
  const enemyBurst = average(enemies.map((hero) => hero.ratings.burst));
  const enemyMobility = average(enemies.map((hero) => hero.ratings.mobility));

  return sortByScore(
    availableHeroes.map((hero) => {
      const counterReasons: string[] = [];
      const synergyReasons: string[] = [];
      const fitReasons: string[] = [];

      let counterScore = 0;
      let synergyScore = 0;
      let fitScore = 0;

      const directCounterMatches = countMatches(hero.counterProfile.goodAgainstTags, enemyTags);
      if (directCounterMatches > 0) {
        counterScore += directCounterMatches * scoringWeights.counter.enemyTagMatch;
        counterReasons.push(`Punishes ${directCounterMatches} enemy threat tag(s)`);
      }

      const threatResponseMatches = countMatches(hero.counterProfile.threatResponses, enemyResponses);
      if (threatResponseMatches > 0) {
        counterScore += threatResponseMatches * scoringWeights.counter.threatResponse;
        counterReasons.push("Has tools that answer the enemy win condition");
      }

      if (hero.damageProfile.range === "Ranged" && enemyTags.includes("Frontline")) {
        counterScore += scoringWeights.counter.rangeAdvantage;
        counterReasons.push("Ranged pattern helps into short-range frontliners");
      }

      if (hero.ratings.mobility > enemyMobility + 1) {
        counterScore += scoringWeights.counter.mobilityAdvantage;
        counterReasons.push("Outpaces the enemy's average mobility");
      }

      if (enemyBurst >= 3.5 && (hero.ratings.durability >= 4 || hero.normalizedTags.includes("Anti-Dive") || hero.normalizedTags.includes("Disengage"))) {
        counterScore += scoringWeights.counter.burstSurvival;
        counterReasons.push("Safer into the enemy's burst profile");
      }

      if (hero.role.some((role) => ["Tank", "Fighter", "Support"].includes(role))) {
        counterScore += scoringWeights.counter.itemFlexibility;
      }

      const allyTagMatches = countMatches(hero.synergyProfile.allyTags, allyTags);
      if (allyTagMatches > 0) {
        synergyScore += allyTagMatches * scoringWeights.synergy.allyTagMatch;
        synergyReasons.push(`Matches ${allyTagMatches} allied draft tag(s)`);
      }

      const allyRoleMatches = countMatches(hero.synergyProfile.allyRoles, allyRoles);
      if (allyRoleMatches > 0) {
        synergyScore += allyRoleMatches * scoringWeights.synergy.allyRoleMatch;
      }

      const styleMatches = countMatches(hero.fitStyles, allyStyles);
      if (styleMatches > 0) {
        synergyScore += styleMatches * scoringWeights.synergy.teamStyleFit;
        synergyReasons.push("Fits the current team style");
      }

      if (allyTags.includes("Engage") && (hero.normalizedTags.includes("Burst") || hero.normalizedTags.includes("AoE") || hero.normalizedTags.includes("Pickoff"))) {
        synergyScore += scoringWeights.synergy.engageFollowUp;
        synergyReasons.push("Follows allied engage well");
      }

      if (allyTags.includes("Backline Carry") && (hero.normalizedTags.includes("Peel") || hero.normalizedTags.includes("Frontline") || hero.normalizedTags.includes("Anti-Dive"))) {
        synergyScore += scoringWeights.synergy.peelSupport;
        synergyReasons.push("Improves carry protection");
      }

      if (needs.needsFrontline && hero.normalizedTags.includes("Frontline")) {
        fitScore += scoringWeights.synergy.gapCoverage;
        fitReasons.push("Adds missing frontline");
      }

      if (needs.needsEngage && hero.normalizedTags.includes("Engage")) {
        fitScore += scoringWeights.synergy.gapCoverage;
        fitReasons.push("Adds missing engage");
      }

      if (needs.needsPeel && hero.normalizedTags.includes("Peel")) {
        fitScore += scoringWeights.synergy.gapCoverage;
        fitReasons.push("Adds missing peel");
      }

      if (needs.needsBacklineCarry && hero.normalizedTags.includes("Backline Carry")) {
        fitScore += scoringWeights.synergy.gapCoverage;
        fitReasons.push("Adds a carry threat");
      }

      if (needs.needsMagicDamage && hero.damageProfile.primary === "Magic") {
        fitScore += scoringWeights.synergy.damageBalance;
        fitReasons.push("Balances the team's damage type");
      }

      if (needs.needsPhysicalDamage && hero.damageProfile.primary === "Physical") {
        fitScore += scoringWeights.synergy.damageBalance;
        fitReasons.push("Balances the team's damage type");
      }

      if (needs.needsObjectiveControl && hero.ratings.objective >= 4) {
        fitScore += scoringWeights.synergy.objectiveControl;
        fitReasons.push("Helps secure neutral objectives");
      }

      const matchingMissingLanes = hero.lanes.filter((lane) => needs.missingAssignedLanes.includes(lane));
      if (matchingMissingLanes.length > 0) {
        fitScore += scoringWeights.synergy.gapCoverage + matchingMissingLanes.length * 2;
        fitReasons.push(`Covers missing lane ${matchingMissingLanes.join(" / ")}`);
      }

      const overall = enemies.length > 0
        ? counterScore * 0.6 + synergyScore * 0.25 + fitScore * 0.15
        : counterScore * 0.35 + synergyScore * 0.45 + fitScore * 0.2;

      return {
        hero,
        overall,
        counter: createBreakdown(counterScore, counterReasons.slice(0, 3)),
        synergy: createBreakdown(synergyScore, synergyReasons.slice(0, 3)),
        fitBonus: createBreakdown(fitScore, fitReasons.slice(0, 3))
      };
    })
  );
}

