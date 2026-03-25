export type TeamSide = "A" | "B";
export type RankTier = "Epic" | "Legend" | "Mythic";
export type DraftStage = "ban" | "pick" | "postDraft";
export type HeroRole = "Tank" | "Fighter" | "Assassin" | "Mage" | "Marksman" | "Support";
export type Lane = "Roam" | "EXP" | "Jungle" | "Gold" | "Mid";
export type HeroTag =
  | "Poke"
  | "Burst"
  | "Sustained DPS"
  | "AoE"
  | "Pickoff"
  | "Ambush"
  | "Engage"
  | "Disengage"
  | "Peel"
  | "Frontline"
  | "Backline Carry"
  | "Split Push"
  | "Siege"
  | "Zoning"
  | "Sustain"
  | "Anti-Dive"
  | "Mobility"
  | "CC Heavy"
  | "Snowball"
  | "Late Game"
  | "Early Game";
export type CounterTag =
  | "Anti-Dive"
  | "Anti-Tank"
  | "Burst Guard"
  | "Mobility Punish"
  | "Range Punish"
  | "Siege Break"
  | "Sustain Punish"
  | "Snowball Punish"
  | "Objective Denial"
  | "CC Lock"
  | "Engage Start"
  | "Backline Access";
export type TeamStyle =
  | "Front-to-Back"
  | "Protect Carry"
  | "Dive"
  | "Pick"
  | "Poke"
  | "Split Push"
  | "AoE Teamfight"
  | "Snowball"
  | "Scaling";
export type DamageType = "Physical" | "Magic" | "True" | "Mixed" | "None";
export type RangeType = "Melee" | "Ranged" | "Mixed";
export type ItemCategory = "Attack" | "Defense" | "Magic" | "Movement" | "Jungling" | "Roaming" | "Roam";
export type ItemTag =
  | "Anti-Heal"
  | "Anti-Burst"
  | "Anti-Tank"
  | "Magic Defense"
  | "Physical Defense"
  | "Cooldown"
  | "Sustain"
  | "Penetration"
  | "Crit"
  | "Attack Speed"
  | "Mana"
  | "Durability"
  | "Anti-Dive"
  | "Poke Support"
  | "DPS Boost";

export interface SourceRef {
  label: string;
  url: string;
  verifiedOn: string;
}

export interface HeroBaseStats {
  hp: number;
  hpRegen: number;
  mana: number;
  manaRegen: number;
  physicalAttack: number;
  physicalDefense: number;
  magicDefense: number;
  attackSpeed: number;
  attackSpeedRatio: number;
  movementSpeed: number;
}

export interface HeroRatings {
  mobility: number;
  durability: number;
  crowdControl: number;
  teamfight: number;
  pickoff: number;
  siege: number;
  sustain: number;
  poke: number;
  burst: number;
  dps: number;
  aoe: number;
  early: number;
  late: number;
  objective: number;
  difficulty: number;
}

export interface HeroData {
  id: string;
  name: string;
  role: HeroRole[];
  lanes: Lane[];
  specialty: string[];
  resource?: "Mana" | "Energy" | "None";
  sourceRefs: SourceRef[];
  baseStats: HeroBaseStats;
  damageProfile: {
    primary: DamageType;
    secondary: DamageType;
    pattern: string[];
    range: RangeType;
  };
  strengths: string[];
  weaknesses: string[];
  utilityTags?: string[];
  normalizedTags: HeroTag[];
  synergyProfile: {
    allyTags: HeroTag[];
    allyRoles: HeroRole[];
    teamStyles: TeamStyle[];
  };
  counterProfile: {
    goodAgainstTags: HeroTag[];
    weakAgainstTags: HeroTag[];
    threatResponses: CounterTag[];
  };
  fitStyles: TeamStyle[];
  ratings: HeroRatings;
  kitSummary?: {
    passive?: string;
    skills?: string[];
  };
  scalingNotes?: string[];
}

export interface ItemData {
  id: string;
  name: string;
  category: ItemCategory;
  cost: number | null;
  sourceRefs: SourceRef[];
  statsGranted: Record<string, number | string>;
  passiveEffects: Array<{
    name: string;
    description: string;
    tags: ItemTag[];
  }>;
  activeEffects: string[];
  goodAgainstTags: HeroTag[];
  typicalBuilders: {
    roles: HeroRole[];
    heroTags: HeroTag[];
  };
  situationalUsageTags: ItemTag[];
}

export interface ScoreBreakdown {
  total: number;
  reasons: string[];
}

export interface HeroRecommendation {
  hero: HeroData;
  overall: number;
  counter: ScoreBreakdown;
  synergy: ScoreBreakdown;
  fitBonus: ScoreBreakdown;
}

export interface TeamMetricValue {
  id: string;
  label: string;
  value: number;
}

export interface TeamAnalysis {
  metrics: TeamMetricValue[];
  strengths: string[];
  weaknesses: string[];
  playstyle: string;
  winCondition: string;
}

export interface ItemRecommendation {
  heroId: string;
  heroName: string;
  recommendations: Array<{
    item: ItemData;
    score: number;
    tier: "Core" | "Situational";
    reasons: string[];
  }>;
}
