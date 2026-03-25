import { fetchText } from "./http.mjs";
import { decodeHtmlEntities, slugFromUrl, stripTags } from "./utils.mjs";

function findFirst(value, patterns) {
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return "";
}

function extractInfobox(html) {
  const infoboxMatch = html.match(/<div class="fo-nttax-infobox-container"[\s\S]*?<\/div>\s*<div class="fo-nttax-infobox-topcontent">/i);
  return infoboxMatch ? infoboxMatch[0] : "";
}

function extractSectionHeadings(html) {
  const headings = [...html.matchAll(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi)].map((match) => stripTags(match[1]));
  return [...new Set(headings)].filter(Boolean);
}

function parseInfoboxFields(infoboxHtml) {
  const fields = {};
  const rowMatches = [...infoboxHtml.matchAll(
    /<div class="infobox-cell-2 infobox-description">([^<:]+):<\/div><div[^>]*>([\s\S]*?)<\/div>/gi
  )];

  for (const match of rowMatches) {
    const key = stripTags(match[1]);
    const value = stripTags(match[2]);
    if (key) {
      fields[key] = value;
    }
  }

  return fields;
}

export async function loadHeroPage(url) {
  const { text: html, url: finalUrl, status } = await fetchText(url);
  const title = decodeHtmlEntities(findFirst(html, [/<meta property="og:title" content="([^"]+)"/i, /<title>([^<]+)<\/title>/i]));
  const subtitle = decodeHtmlEntities(findFirst(html, [/<div class="infobox-header wiki-backgroundcolor-light infobox-header-2">([^<]+)<\/div>/i]));
  const description = decodeHtmlEntities(findFirst(html, [/<meta property="og:description" content="([^"]+)"/i, /<meta name="twitter:description" content="([^"]+)"/i]));
  const infoboxHtml = extractInfobox(html);
  const infobox = parseInfoboxFields(infoboxHtml);
  const isHeroPage = Boolean(infobox.Role || infobox.Lane || infobox.Specialty || infobox["Base Statistics"]);
  const slug = slugFromUrl(finalUrl);
  const name = decodeHtmlEntities((subtitle || title || slug).replace(/\s*-\s*Liquipedia Mobile Legends: Bang Bang Wiki\s*$/i, ""));
  const role = infobox.Role ? infobox.Role.split(/,\s*|\s*\/\s*/).filter(Boolean) : [];
  const lane = infobox.Lane ? infobox.Lane.split(/,\s*|\s*\/\s*/).filter(Boolean) : [];
  const specialty = infobox.Specialty ? infobox.Specialty.split(/,\s*|\s*\/\s*/).filter(Boolean) : [];

  return {
    id: slug,
    name,
    url: finalUrl,
    title,
    subtitle,
    description,
    status,
    isHeroPage,
    source: "hero-page",
    raw: {
      htmlLength: html.length,
      sectionHeadings: extractSectionHeadings(html).slice(0, 40)
    },
    infobox,
    scaffold: {
      id: slug,
      name,
      role,
      lane,
      specialty,
      releaseDate: infobox["Release Date"] || "",
      price: infobox.Price || "",
      region: infobox.Region || "",
      city: infobox.City || "",
      voiceActors: infobox["Voice Actor(s)"] || "",
      baseStats: {
        hp: infobox.HP || "",
        hpRegen: infobox["HP Regen"] || "",
        mana: infobox.Mana || "",
        manaRegen: infobox["Mana Regen"] || "",
        physicalAttack: infobox["Physical Attack"] || "",
        physicalDefense: infobox["Physical Defense"] || "",
        magicPower: infobox["Magic Power"] || "",
        magicDefense: infobox["Magic Defense"] || "",
        attackSpeed: infobox["Attack Speed"] || "",
        attackSpeedRatio: infobox["Attack Speed Ratio"] || "",
        movementSpeed: infobox["Movement Speed"] || ""
      },
      kitSummary: {
        passive: "",
        skills: []
      },
      strengths: [],
      weaknesses: [],
      utilityTags: [],
      normalizedTags: [],
      synergyProfile: {
        allyTags: [],
        allyRoles: [],
        teamStyles: []
      },
      counterProfile: {
        goodAgainstTags: [],
        weakAgainstTags: [],
        threatResponses: []
      },
      fitStyles: [],
      ratings: {
        mobility: 0,
        durability: 0,
        crowdControl: 0,
        teamfight: 0,
        pickoff: 0,
        siege: 0,
        sustain: 0,
        poke: 0,
        burst: 0,
        dps: 0,
        aoe: 0,
        early: 0,
        late: 0,
        objective: 0,
        difficulty: 0
      },
      scalingNotes: []
    }
  };
}
