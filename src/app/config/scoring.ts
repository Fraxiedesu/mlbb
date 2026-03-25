export const scoringWeights = {
  counter: {
    enemyTagMatch: 9,
    threatResponse: 8,
    rangeAdvantage: 4,
    mobilityAdvantage: 4,
    burstSurvival: 5,
    winConditionDisruption: 6,
    itemFlexibility: 3
  },
  synergy: {
    allyTagMatch: 8,
    allyRoleMatch: 5,
    teamStyleFit: 7,
    engageFollowUp: 7,
    peelSupport: 6,
    damageBalance: 6,
    gapCoverage: 8,
    objectiveControl: 4
  },
  composition: {
    engage: 1.15,
    disengage: 1,
    frontline: 1.2,
    backlineSafety: 1,
    crowdControl: 1.1,
    burst: 1,
    sustainedDamage: 1,
    poke: 0.95,
    objectiveControl: 1,
    teamfight: 1.15,
    pickoff: 1,
    scaling: 0.95,
    lanePressure: 0.95,
    mobility: 0.85
  },
  items: {
    threatCoverage: 10,
    roleFit: 7,
    tagFit: 5,
    damageTypeFit: 5,
    situationalNeed: 8
  }
} as const;
