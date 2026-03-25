import type { CounterTag, HeroTag, ItemTag, TeamStyle } from "@/app/types/data";

export const HERO_TAGS: HeroTag[] = [
  "Poke",
  "Burst",
  "Sustained DPS",
  "AoE",
  "Pickoff",
  "Ambush",
  "Engage",
  "Disengage",
  "Peel",
  "Frontline",
  "Backline Carry",
  "Split Push",
  "Siege",
  "Zoning",
  "Sustain",
  "Anti-Dive",
  "Mobility",
  "CC Heavy",
  "Snowball",
  "Late Game",
  "Early Game"
];

export const COUNTER_TAGS: CounterTag[] = [
  "Anti-Dive",
  "Anti-Tank",
  "Burst Guard",
  "Mobility Punish",
  "Range Punish",
  "Siege Break",
  "Sustain Punish",
  "Snowball Punish",
  "Objective Denial",
  "CC Lock",
  "Engage Start",
  "Backline Access"
];

export const ITEM_TAGS: ItemTag[] = [
  "Anti-Heal",
  "Anti-Burst",
  "Anti-Tank",
  "Magic Defense",
  "Physical Defense",
  "Cooldown",
  "Sustain",
  "Penetration",
  "Crit",
  "Attack Speed",
  "Mana",
  "Durability",
  "Anti-Dive",
  "Poke Support",
  "DPS Boost"
];

export const TEAM_STYLES: TeamStyle[] = [
  "Front-to-Back",
  "Protect Carry",
  "Dive",
  "Pick",
  "Poke",
  "Split Push",
  "AoE Teamfight",
  "Snowball",
  "Scaling"
];

export const TEAM_METRIC_LABELS = [
  { id: "engage", label: "Engage Strength" },
  { id: "disengage", label: "Disengage Strength" },
  { id: "frontline", label: "Frontline Durability" },
  { id: "backlineSafety", label: "Backline Safety" },
  { id: "crowdControl", label: "Crowd Control Coverage" },
  { id: "burst", label: "Burst Threat" },
  { id: "sustainedDamage", label: "Sustained Damage" },
  { id: "poke", label: "Poke Potential" },
  { id: "objectiveControl", label: "Objective Control" },
  { id: "teamfight", label: "Teamfight Strength" },
  { id: "pickoff", label: "Pickoff Strength" },
  { id: "scaling", label: "Scaling" },
  { id: "lanePressure", label: "Lane Pressure" },
  { id: "damageDiversity", label: "Damage Diversity" },
  { id: "mobility", label: "Mobility" }
] as const;
