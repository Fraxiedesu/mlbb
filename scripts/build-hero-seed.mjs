import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const INPUT_PATH = resolve("scripts/liquipedia-hero-scraper/out/heroes.parsed.json");
const OUTPUT_PATH = resolve("dataset/samples/heroes.seed.json");
const RAW_OUTPUT_PATH = resolve("dataset/production/heroes.liquipedia.raw.json");
const SOURCE_OUTPUT_PATH = resolve("dataset/sources/liquipedia.hero-pages.json");
const MAIN_SOURCES_PATH = resolve("dataset/sources/liquipedia.sources.json");
const VERIFIED_ON = new Date().toISOString().slice(0, 10);

const HERO_ROLES = ["Tank", "Fighter", "Assassin", "Mage", "Marksman", "Support"];
const HERO_TAGS = [
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
const COUNTER_TAGS = [
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
const TEAM_STYLES = [
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

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function clamp(value, min = 1, max = 5) {
  return Math.max(min, Math.min(max, value));
}

function slugToId(slug) {
  return decodeURIComponent(slug)
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function cleanName(value, fallback) {
  return (value || fallback || "")
    .replace(/\s*-\s*Liquipedia Mobile Legends: Bang Bang Wiki\s*$/i, "")
    .trim();
}

function parseNumber(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  const normalized = String(value).replace(/,/g, "");
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function normalizeLane(lane) {
  const normalized = String(lane).trim().toLowerCase();
  if (normalized === "exp lane") return "EXP";
  if (normalized === "gold lane") return "Gold";
  if (normalized === "mid lane") return "Mid";
  if (normalized === "jungle") return "Jungle";
  if (normalized === "roam") return "Roam";
  return null;
}

function normalizeRoles(roleValues) {
  const resolved = [];

  for (const rawRole of roleValues || []) {
    for (const role of HERO_ROLES) {
      if (String(rawRole).includes(role)) {
        resolved.push(role);
      }
    }
  }

  return unique(resolved);
}

function splitSpecialty(value) {
  const tokens = [];
  let remaining = String(value || "").trim();
  const phrases = [
    "Crowd Control",
    "Magic Damage",
    "Mixed Damage"
  ];

  for (const phrase of phrases) {
    if (remaining.includes(phrase)) {
      tokens.push(phrase);
      remaining = remaining.replace(phrase, " ");
    }
  }

  for (const token of remaining.split(/\s+/)) {
    if (token) {
      tokens.push(token);
    }
  }

  return tokens;
}

function normalizeSpecialties(values) {
  return unique((values || []).flatMap((value) => splitSpecialty(value)));
}

function pushMany(set, values) {
  for (const value of values) {
    set.add(value);
  }
}

function deriveDamageProfile(roles, specialties, tags) {
  const specialtySet = new Set(specialties);
  const tagSet = new Set(tags);
  let primary = "Physical";
  let secondary = "None";

  if (roles.includes("Mage") || specialtySet.has("Magic Damage")) {
    primary = "Magic";
  }

  if (roles.includes("Mage") && roles.some((role) => ["Assassin", "Marksman", "Tank", "Fighter"].includes(role))) {
    primary = "Mixed";
    secondary = "Magic";
  }

  if (specialtySet.has("Mixed Damage")) {
    primary = "Mixed";
    secondary = "Magic";
  }

  let range = "Melee";
  if (roles.some((role) => ["Marksman", "Mage", "Support"].includes(role))) {
    range = "Ranged";
  }

  if (roles.includes("Marksman") && roles.includes("Assassin")) {
    range = "Mixed";
  }

  const pattern = unique([
    tagSet.has("Burst") ? "Burst" : "",
    tagSet.has("Sustained DPS") ? "Sustained DPS" : "",
    tagSet.has("Poke") ? "Poke" : "",
    tagSet.has("Pickoff") ? "Pickoff" : "",
    tagSet.has("Engage") ? "Engage" : ""
  ]);

  return { primary, secondary, range, pattern: pattern.length > 0 ? pattern : ["Skirmish"] };
}

function deriveTags(roles, specialties, lanes) {
  const tags = new Set();
  const specialtySet = new Set(specialties);

  if (roles.includes("Tank")) pushMany(tags, ["Frontline", "Engage", "Anti-Dive"]);
  if (roles.includes("Fighter")) pushMany(tags, ["Frontline", "Sustained DPS"]);
  if (roles.includes("Assassin")) pushMany(tags, ["Pickoff", "Ambush", "Mobility"]);
  if (roles.includes("Mage")) pushMany(tags, ["Burst", "Poke"]);
  if (roles.includes("Marksman")) pushMany(tags, ["Backline Carry", "Sustained DPS", "Late Game"]);
  if (roles.includes("Support")) pushMany(tags, ["Peel", "Sustain"]);

  if (specialtySet.has("Burst")) tags.add("Burst");
  if (specialtySet.has("Charge")) pushMany(tags, ["Engage", "Mobility"]);
  if (specialtySet.has("Chase")) pushMany(tags, ["Mobility", "Pickoff"]);
  if (specialtySet.has("Control")) pushMany(tags, ["CC Heavy", "Peel"]);
  if (specialtySet.has("Crowd Control")) pushMany(tags, ["CC Heavy", "AoE"]);
  if (specialtySet.has("Damage")) tags.add("Sustained DPS");
  if (specialtySet.has("Finisher")) pushMany(tags, ["Burst", "Pickoff", "Snowball"]);
  if (specialtySet.has("Guard")) pushMany(tags, ["Peel", "Anti-Dive"]);
  if (specialtySet.has("Initiator")) pushMany(tags, ["Engage", "AoE"]);
  if (specialtySet.has("Poke")) pushMany(tags, ["Poke", "Siege", "Zoning"]);
  if (specialtySet.has("Push")) pushMany(tags, ["Split Push", "Siege"]);
  if (specialtySet.has("Reap")) pushMany(tags, ["Pickoff", "Burst"]);
  if (specialtySet.has("Regen")) pushMany(tags, ["Sustain", "Frontline"]);
  if (specialtySet.has("Support")) pushMany(tags, ["Peel", "Disengage"]);

  if (lanes.includes("Roam")) pushMany(tags, ["Engage", "Peel"]);
  if (lanes.includes("EXP")) pushMany(tags, ["Frontline", "Early Game"]);
  if (lanes.includes("Jungle")) pushMany(tags, ["Snowball", "Mobility"]);
  if (lanes.includes("Gold")) pushMany(tags, ["Backline Carry", "Late Game"]);
  if (lanes.includes("Mid")) pushMany(tags, ["Poke", "AoE"]);

  if (roles.includes("Tank") || specialtySet.has("Crowd Control")) {
    tags.add("AoE");
  }

  if (roles.includes("Assassin") || lanes.includes("Jungle")) {
    tags.add("Early Game");
  }

  return unique([...tags].filter((tag) => HERO_TAGS.includes(tag)));
}

function deriveTeamStyles(tags) {
  const tagSet = new Set(tags);
  const styles = [];

  if (tagSet.has("Frontline") || tagSet.has("Backline Carry")) styles.push("Front-to-Back");
  if (tagSet.has("Backline Carry") || tagSet.has("Peel")) styles.push("Protect Carry");
  if (tagSet.has("Mobility") || tagSet.has("Ambush")) styles.push("Dive");
  if (tagSet.has("Pickoff") || tagSet.has("Burst")) styles.push("Pick");
  if (tagSet.has("Poke") || tagSet.has("Zoning")) styles.push("Poke");
  if (tagSet.has("Split Push") || tagSet.has("Siege")) styles.push("Split Push");
  if (tagSet.has("AoE") || tagSet.has("CC Heavy")) styles.push("AoE Teamfight");
  if (tagSet.has("Snowball") || tagSet.has("Early Game")) styles.push("Snowball");
  if (tagSet.has("Late Game") || tagSet.has("Sustain")) styles.push("Scaling");

  return unique(styles.filter((style) => TEAM_STYLES.includes(style))).slice(0, 4);
}

function deriveSynergy(tags, roles, styles) {
  const tagSet = new Set(tags);
  const allyTags = new Set();
  const allyRoles = new Set();

  if (tagSet.has("Engage")) pushMany(allyTags, ["Burst", "AoE", "Backline Carry"]);
  if (tagSet.has("Backline Carry")) pushMany(allyTags, ["Frontline", "Peel", "Engage"]);
  if (tagSet.has("Poke")) pushMany(allyTags, ["Peel", "Frontline", "Zoning"]);
  if (tagSet.has("Pickoff") || tagSet.has("Ambush")) pushMany(allyTags, ["CC Heavy", "Burst", "Mobility"]);
  if (tagSet.has("Sustain")) pushMany(allyTags, ["Frontline", "Backline Carry"]);
  if (tagSet.has("Frontline")) pushMany(allyTags, ["Backline Carry", "Poke", "Burst"]);

  if (tagSet.has("Engage") || tagSet.has("Frontline")) pushMany(allyRoles, ["Mage", "Marksman", "Support"]);
  if (tagSet.has("Backline Carry")) pushMany(allyRoles, ["Tank", "Support", "Fighter"]);
  if (tagSet.has("Pickoff")) pushMany(allyRoles, ["Support", "Mage", "Tank"]);
  if (tagSet.has("Poke")) pushMany(allyRoles, ["Tank", "Support"]);

  return {
    allyTags: unique([...allyTags].filter((tag) => HERO_TAGS.includes(tag))).slice(0, 6),
    allyRoles: unique([...allyRoles].filter((role) => HERO_ROLES.includes(role))).slice(0, 4),
    teamStyles: styles
  };
}

function deriveCounterProfile(tags) {
  const tagSet = new Set(tags);
  const goodAgainstTags = [];
  const weakAgainstTags = [];
  const threatResponses = [];

  if (tagSet.has("Mobility")) {
    goodAgainstTags.push("Backline Carry", "Poke");
    weakAgainstTags.push("CC Heavy", "Anti-Dive");
    threatResponses.push("Backline Access");
  }

  if (tagSet.has("Frontline")) {
    goodAgainstTags.push("Engage", "Ambush");
    weakAgainstTags.push("Poke", "Sustained DPS");
    threatResponses.push("Anti-Dive");
  }

  if (tagSet.has("Poke")) {
    goodAgainstTags.push("Siege", "Split Push");
    weakAgainstTags.push("Mobility", "Engage");
    threatResponses.push("Range Punish", "Objective Denial");
  }

  if (tagSet.has("Burst")) {
    goodAgainstTags.push("Backline Carry", "Late Game");
    weakAgainstTags.push("Frontline", "Sustain");
    threatResponses.push("Snowball Punish");
  }

  if (tagSet.has("CC Heavy")) {
    goodAgainstTags.push("Mobility", "Ambush");
    weakAgainstTags.push("Poke", "Disengage");
    threatResponses.push("CC Lock", "Mobility Punish");
  }

  if (tagSet.has("Sustained DPS")) {
    goodAgainstTags.push("Frontline", "Sustain");
    threatResponses.push("Anti-Tank");
  }

  if (tagSet.has("Engage")) {
    threatResponses.push("Engage Start");
  }

  return {
    goodAgainstTags: unique(goodAgainstTags).filter((tag) => HERO_TAGS.includes(tag)).slice(0, 5),
    weakAgainstTags: unique(weakAgainstTags).filter((tag) => HERO_TAGS.includes(tag)).slice(0, 5),
    threatResponses: unique(threatResponses).filter((tag) => COUNTER_TAGS.includes(tag)).slice(0, 4)
  };
}

function deriveRatings(roles, tags) {
  const tagSet = new Set(tags);
  let mobility = roles.includes("Assassin") ? 4 : 2;
  let durability = roles.includes("Tank") ? 5 : roles.includes("Fighter") ? 4 : 2;
  let crowdControl = tagSet.has("CC Heavy") ? 4 : 2;
  let teamfight = tagSet.has("AoE") ? 4 : 3;
  let pickoff = tagSet.has("Pickoff") ? 4 : 2;
  let siege = tagSet.has("Siege") ? 4 : 2;
  let sustain = tagSet.has("Sustain") ? 4 : 1;
  let poke = tagSet.has("Poke") ? 4 : 1;
  let burst = tagSet.has("Burst") ? 4 : 2;
  let dps = tagSet.has("Sustained DPS") ? 4 : 2;
  let aoe = tagSet.has("AoE") ? 4 : 2;
  let early = tagSet.has("Early Game") || tagSet.has("Snowball") ? 4 : 2;
  let late = tagSet.has("Late Game") ? 4 : 2;
  let objective = roles.includes("Marksman") || roles.includes("Jungle") ? 4 : 3;
  let difficulty = roles.includes("Assassin") ? 4 : roles.includes("Marksman") ? 3 : 2;

  if (tagSet.has("Mobility")) mobility += 1;
  if (tagSet.has("Frontline")) durability += 1;
  if (tagSet.has("Engage")) teamfight += 1;
  if (tagSet.has("Backline Carry")) late += 1;
  if (tagSet.has("Split Push")) siege += 1;
  if (tagSet.has("Ambush")) pickoff += 1;
  if (roles.includes("Support")) crowdControl += 1;
  if (roles.includes("Mage")) aoe += 1;

  return {
    mobility: clamp(mobility),
    durability: clamp(durability),
    crowdControl: clamp(crowdControl),
    teamfight: clamp(teamfight),
    pickoff: clamp(pickoff),
    siege: clamp(siege),
    sustain: clamp(sustain),
    poke: clamp(poke),
    burst: clamp(burst),
    dps: clamp(dps),
    aoe: clamp(aoe),
    early: clamp(early),
    late: clamp(late),
    objective: clamp(objective),
    difficulty: clamp(difficulty)
  };
}

function deriveStrengths(tags, roles, lanes) {
  const strengths = [];
  const tagSet = new Set(tags);

  if (tagSet.has("Frontline")) strengths.push("Provides reliable frontline presence in skirmishes and 5v5s.");
  if (tagSet.has("Engage")) strengths.push("Can start fights or punish positioning with proactive engage.");
  if (tagSet.has("Pickoff")) strengths.push("Threatens isolated targets and side-lane rotations.");
  if (tagSet.has("Poke")) strengths.push("Pressures objectives and towers with ranged chip damage.");
  if (tagSet.has("Backline Carry")) strengths.push("Scales into a high-value backline damage source.");
  if (tagSet.has("Sustain")) strengths.push("Handles extended fights well through healing or regeneration.");
  if (lanes.includes("Jungle")) strengths.push("Fits tempo-oriented jungle pathing and objective setups.");
  if (roles.includes("Support")) strengths.push("Adds team utility that improves ally survivability or follow-up.");

  return strengths.slice(0, 4);
}

function deriveWeaknesses(tags, roles) {
  const weaknesses = [];
  const tagSet = new Set(tags);

  if (!tagSet.has("Mobility")) weaknesses.push("Can be punished when caught without positioning support.");
  if (!tagSet.has("Frontline") && roles.includes("Marksman")) weaknesses.push("Needs peel or frontline cover to output safely.");
  if (!tagSet.has("Sustain")) weaknesses.push("Loses value in long fights if it cannot reset or disengage.");
  if (!tagSet.has("CC Heavy") && roles.includes("Assassin")) weaknesses.push("Relies more on timing and burst than hard lockdown.");
  if (tagSet.has("Poke") && !tagSet.has("Anti-Dive")) weaknesses.push("Can be vulnerable when hard dive reaches the backline.");
  if (roles.includes("Tank") && !tagSet.has("Poke")) weaknesses.push("Usually contributes more utility than raw damage.");

  return unique(weaknesses).slice(0, 4);
}

function deriveUtilityTags(specialties, tags) {
  const utility = new Set();
  const specialtySet = new Set(specialties);
  const tagSet = new Set(tags);

  if (specialtySet.has("Crowd Control") || tagSet.has("CC Heavy")) utility.add("Crowd Control");
  if (specialtySet.has("Guard") || tagSet.has("Peel")) utility.add("Peel");
  if (specialtySet.has("Regen") || tagSet.has("Sustain")) utility.add("Sustain");
  if (specialtySet.has("Poke")) utility.add("Poke");
  if (tagSet.has("Engage")) utility.add("Engage");
  if (tagSet.has("Mobility")) utility.add("Mobility");

  return [...utility];
}

function buildSourceUrl(slugOrName) {
  const normalized = String(slugOrName || "").trim().replace(/\s+/g, "_");
  return `https://liquipedia.net/mobilelegends/${normalized}`;
}

function transformHero(rawHero) {
  const id = slugToId(rawHero.id || rawHero.name);
  const name = cleanName(rawHero.name, rawHero.id);
  const roles = normalizeRoles(rawHero.role);
  const lanes = unique((rawHero.lane || []).map(normalizeLane).filter(Boolean));
  const specialties = normalizeSpecialties(rawHero.specialty);
  const normalizedTags = deriveTags(roles, specialties, lanes);
  const fitStyles = deriveTeamStyles(normalizedTags);
  const synergyProfile = deriveSynergy(normalizedTags, roles, fitStyles);
  const counterProfile = deriveCounterProfile(normalizedTags);
  const ratings = deriveRatings(roles, normalizedTags);
  const damageProfile = deriveDamageProfile(roles, specialties, normalizedTags);
  const sourceUrl = buildSourceUrl(rawHero.id || name);

  return {
    id,
    name,
    role: roles,
    lanes,
    specialty: specialties,
    sourceRefs: [
      {
        label: "Liquipedia hero page",
        url: sourceUrl,
        verifiedOn: VERIFIED_ON
      }
    ],
    baseStats: {
      hp: parseNumber(rawHero.baseStats?.hp),
      hpRegen: parseNumber(rawHero.baseStats?.hpRegen),
      mana: parseNumber(rawHero.baseStats?.mana),
      manaRegen: parseNumber(rawHero.baseStats?.manaRegen),
      physicalAttack: parseNumber(rawHero.baseStats?.physicalAttack),
      physicalDefense: parseNumber(rawHero.baseStats?.physicalDefense),
      magicDefense: parseNumber(rawHero.baseStats?.magicDefense),
      attackSpeed: parseNumber(rawHero.baseStats?.attackSpeed),
      attackSpeedRatio: parseNumber(rawHero.baseStats?.attackSpeedRatio),
      movementSpeed: parseNumber(rawHero.baseStats?.movementSpeed)
    },
    damageProfile,
    strengths: deriveStrengths(normalizedTags, roles, lanes),
    weaknesses: deriveWeaknesses(normalizedTags, roles),
    utilityTags: deriveUtilityTags(specialties, normalizedTags),
    normalizedTags,
    synergyProfile,
    counterProfile,
    fitStyles,
    ratings,
    kitSummary: {
      passive: rawHero.kitSummary?.passive || "",
      skills: rawHero.kitSummary?.skills || []
    },
    scalingNotes: unique([
      fitStyles.includes("Snowball") ? "Prefers tempo and map pressure before the enemy lineup stabilizes." : "",
      fitStyles.includes("Scaling") ? "Gets better as coordinated item spikes and teamfights arrive." : "",
      normalizedTags.includes("Backline Carry") ? "Needs protected positioning to maximize damage output." : ""
    ]).slice(0, 3)
  };
}

async function main() {
  const source = JSON.parse(await readFile(INPUT_PATH, "utf8"));
  const heroes = source.heroes.map(transformHero);
  const heroPages = source.heroes.map((hero) => buildSourceUrl(hero.id || hero.name));

  if (heroes.length !== 132) {
    throw new Error(`Expected 132 heroes from ${INPUT_PATH}, received ${heroes.length}.`);
  }

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await mkdir(dirname(RAW_OUTPUT_PATH), { recursive: true });
  await mkdir(dirname(SOURCE_OUTPUT_PATH), { recursive: true });

  await writeFile(OUTPUT_PATH, `${JSON.stringify(heroes, null, 2)}\n`);
  await writeFile(RAW_OUTPUT_PATH, `${JSON.stringify(source, null, 2)}\n`);
  await writeFile(
    SOURCE_OUTPUT_PATH,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        verifiedOn: VERIFIED_ON,
        totalHeroes: heroes.length,
        heroPages
      },
      null,
      2
    )}\n`
  );

  try {
    const mainSources = JSON.parse(await readFile(MAIN_SOURCES_PATH, "utf8"));
    mainSources.heroPages = heroPages;
    mainSources.verifiedOn = VERIFIED_ON;
    mainSources.notes = unique([
      ...(mainSources.notes || []),
      "Hero catalog expanded from the Liquipedia scrape artifact to the full 132-hero roster.",
      "Item catalog still requires a fresh equipment scrape after Liquipedia's rate-limit CAPTCHA is cleared."
    ]);
    await writeFile(MAIN_SOURCES_PATH, `${JSON.stringify(mainSources, null, 2)}\n`);
  } catch {
    // Keep the dedicated hero page manifest even if the aggregate manifest is absent.
  }

  process.stdout.write(`Wrote ${heroes.length} heroes to ${OUTPUT_PATH}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
