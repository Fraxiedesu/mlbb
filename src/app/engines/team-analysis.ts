import { TEAM_METRIC_LABELS } from "@/app/config/taxonomies";
import type { HeroData, TeamAnalysis, TeamMetricValue } from "@/app/types/data";
import { average, clamp, unique } from "@/app/utils/collections";

function hasTag(heroes: HeroData[], tag: string) {
  return heroes.some((hero) => hero.normalizedTags.includes(tag as never));
}

function normalize(value: number) {
  return clamp(value * 20, 0, 100);
}

function inferMetricValues(team: HeroData[], enemy: HeroData[]): TeamMetricValue[] {
  const damageTypes = unique(team.map((hero) => hero.damageProfile.primary));
  const frontlineCount = team.filter((hero) => hero.normalizedTags.includes("Frontline")).length;
  const peelCount = team.filter((hero) => hero.normalizedTags.includes("Peel")).length;
  const engageCount = team.filter((hero) => hero.normalizedTags.includes("Engage")).length;
  const enemyPickoff = average(enemy.map((hero) => hero.ratings.pickoff));

  const metrics: Record<string, number> = {
    engage: normalize(average(team.map((hero) => hero.ratings.crowdControl * 0.45 + hero.ratings.mobility * 0.2 + (hero.normalizedTags.includes("Engage") ? 1.5 : 0)))),
    disengage: normalize(average(team.map((hero) => (hero.normalizedTags.includes("Disengage") ? 2 : 0) + (hero.normalizedTags.includes("Peel") ? 1.5 : 0) + hero.ratings.mobility * 0.2))),
    frontline: normalize(average(team.map((hero) => hero.ratings.durability)) + frontlineCount * 0.35),
    backlineSafety: normalize((frontlineCount + peelCount) * 0.7 + average(team.map((hero) => hero.ratings.durability * 0.15)) - enemyPickoff * 0.15),
    crowdControl: normalize(average(team.map((hero) => hero.ratings.crowdControl)) + team.filter((hero) => hero.normalizedTags.includes("CC Heavy")).length * 0.25),
    burst: normalize(average(team.map((hero) => hero.ratings.burst))),
    sustainedDamage: normalize(average(team.map((hero) => hero.ratings.dps))),
    poke: normalize(average(team.map((hero) => hero.ratings.poke))),
    objectiveControl: normalize(average(team.map((hero) => hero.ratings.objective))),
    teamfight: normalize(average(team.map((hero) => hero.ratings.teamfight)) + team.filter((hero) => hero.normalizedTags.includes("AoE")).length * 0.2),
    pickoff: normalize(average(team.map((hero) => hero.ratings.pickoff)) + team.filter((hero) => hero.normalizedTags.includes("Pickoff") || hero.normalizedTags.includes("Ambush")).length * 0.2),
    scaling: normalize(average(team.map((hero) => hero.ratings.late))),
    lanePressure: normalize(average(team.map((hero) => hero.ratings.early * 0.7 + hero.ratings.poke * 0.3))),
    damageDiversity: damageTypes.includes("Physical") && damageTypes.includes("Magic") ? 85 : damageTypes.includes("Mixed") ? 75 : 45,
    mobility: normalize(average(team.map((hero) => hero.ratings.mobility)))
  };

  return TEAM_METRIC_LABELS.map(({ id, label }) => ({ id, label, value: Math.round(metrics[id]) }));
}

function inferPlaystyle(team: HeroData[], metrics: TeamMetricValue[]) {
  const metric = (id: string) => metrics.find((entry) => entry.id === id)?.value ?? 0;

  if (metric("poke") >= 75 && metric("objectiveControl") >= 65) {
    return "Play for wave control, chip enemies before committing, and force objectives on low-health targets.";
  }

  if (metric("pickoff") >= 75 && hasTag(team, "Ambush")) {
    return "Play for vision denial, isolate targets, and collapse before full 5v5s start.";
  }

  if (metric("teamfight") >= 75 && metric("engage") >= 70) {
    return "Look for grouped engages and decisive front-to-back teamfights around major objectives.";
  }

  if (metric("scaling") >= 75 && hasTag(team, "Backline Carry")) {
    return "Trade space early, protect the carry's item curve, and fight on your timing later.";
  }

  return "Use a balanced setup: hold vision, contest waves, and commit when your primary engage or pick tools are ready.";
}

function inferWinCondition(team: HeroData[], metrics: TeamMetricValue[]) {
  const metric = (id: string) => metrics.find((entry) => entry.id === id)?.value ?? 0;

  if (metric("teamfight") >= metric("pickoff") && hasTag(team, "Backline Carry")) {
    return "Protect your damage dealer long enough for front-to-back fights to break open.";
  }

  if (metric("pickoff") > 70) {
    return "Catch side-lane or exposed targets first, then convert the numbers advantage into towers or lord.";
  }

  if (metric("poke") > 70) {
    return "Chip the enemy down before objectives, then zone them off with range advantage.";
  }

  return "Maintain balanced map control and win through cleaner objective execution.";
}

function metricText(metric: TeamMetricValue) {
  if (metric.value >= 75) {
    return `High ${metric.label.toLowerCase()}`;
  }

  if (metric.value <= 45) {
    return `Low ${metric.label.toLowerCase()}`;
  }

  return null;
}

export function analyzeTeamComposition(team: HeroData[], enemy: HeroData[]): TeamAnalysis {
  const metrics = inferMetricValues(team, enemy);
  const sorted = [...metrics].sort((left, right) => right.value - left.value);
  const strengths = sorted.map(metricText).filter(Boolean).slice(0, 3) as string[];
  const weaknesses = [...sorted].reverse().map(metricText).filter(Boolean).slice(0, 3) as string[];

  return {
    metrics,
    strengths,
    weaknesses,
    playstyle: inferPlaystyle(team, metrics),
    winCondition: inferWinCondition(team, metrics)
  };
}

