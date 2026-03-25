import { scoringWeights } from "@/app/config/scoring";
import type { HeroData, ItemData, ItemRecommendation } from "@/app/types/data";
import { average, countMatches, sortByScore, unique } from "@/app/utils/collections";

function collectEnemyTags(enemies: HeroData[]) {
  return unique(enemies.flatMap((hero) => hero.normalizedTags));
}

function deriveThreatProfile(enemies: HeroData[]) {
  const tags = collectEnemyTags(enemies);
  const magicThreat = enemies.filter((hero) => hero.damageProfile.primary === "Magic").length;
  const physicalThreat = enemies.filter((hero) => hero.damageProfile.primary === "Physical").length;

  return {
    tags,
    heavyBurst: average(enemies.map((hero) => hero.ratings.burst)) >= 3.5,
    heavySustain: tags.includes("Sustain"),
    heavyFrontline: enemies.filter((hero) => hero.normalizedTags.includes("Frontline")).length >= 2,
    heavyDive: ["Engage", "Ambush", "Mobility"].some((tag) => tags.includes(tag as never)),
    magicThreat,
    physicalThreat
  };
}

function scoreItemForHero(hero: HeroData, item: ItemData, enemies: HeroData[]) {
  const reasons: string[] = [];
  const threat = deriveThreatProfile(enemies);
  let score = 0;

  const directMatches = countMatches(item.goodAgainstTags, threat.tags);
  if (directMatches > 0) {
    score += directMatches * scoringWeights.items.threatCoverage;
    reasons.push(`Answers ${directMatches} enemy draft tag(s)`);
  }

  if (item.typicalBuilders.roles.some((role) => hero.role.includes(role))) {
    score += scoringWeights.items.roleFit;
    reasons.push("Fits this hero's normal build path");
  }

  if (countMatches(item.typicalBuilders.heroTags, hero.normalizedTags) > 0) {
    score += scoringWeights.items.tagFit;
  }

  if (hero.damageProfile.primary === "Magic" && item.category === "Magic") {
    score += scoringWeights.items.damageTypeFit;
  }

  if (hero.damageProfile.primary === "Physical" && item.category === "Attack") {
    score += scoringWeights.items.damageTypeFit;
  }

  if (hero.role.some((role) => ["Tank", "Fighter", "Support"].includes(role)) && item.category === "Defense") {
    score += scoringWeights.items.damageTypeFit;
  }

  if (threat.heavySustain && item.situationalUsageTags.includes("Anti-Heal")) {
    score += scoringWeights.items.situationalNeed;
    reasons.push("Enemy sustain makes anti-heal valuable");
  }

  if (threat.heavyFrontline && item.situationalUsageTags.includes("Anti-Tank")) {
    score += scoringWeights.items.situationalNeed;
    reasons.push("Enemy frontline makes anti-tank value high");
  }

  if (threat.heavyBurst && item.situationalUsageTags.includes("Anti-Burst")) {
    score += scoringWeights.items.situationalNeed;
    reasons.push("Enemy burst increases defensive urgency");
  }

  if (threat.heavyDive && item.situationalUsageTags.includes("Anti-Dive")) {
    score += scoringWeights.items.situationalNeed;
    reasons.push("Enemy dive pressure rewards anti-dive tech");
  }

  if (threat.magicThreat > threat.physicalThreat && item.situationalUsageTags.includes("Magic Defense")) {
    score += scoringWeights.items.situationalNeed;
  }

  if (threat.physicalThreat >= threat.magicThreat && item.situationalUsageTags.includes("Physical Defense")) {
    score += scoringWeights.items.situationalNeed;
  }

  return { score, reasons: reasons.slice(0, 3) };
}

export function buildItemRecommendations(team: HeroData[], enemies: HeroData[], items: ItemData[]): ItemRecommendation[] {
  return team.map((hero) => {
    const recommendations = sortByScore(
      items.map((item) => {
        const { score, reasons } = scoreItemForHero(hero, item, enemies);
        const tier: "Core" | "Situational" = score >= 22 ? "Core" : "Situational";

        return {
          item,
          score,
          tier,
          reasons
        };
      })
    ).filter((entry) => entry.score >= 10).slice(0, 3);

    return {
      heroId: hero.id,
      heroName: hero.name,
      recommendations
    };
  });
}
