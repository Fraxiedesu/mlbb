import { fetchLiquipediaPage } from "./http.mjs";
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

function extractFirstParagraph(html) {
  const match = html.match(/<p>([\s\S]*?)<\/p>/i);
  return match ? stripTags(match[1]) : "";
}

function parseInfoboxFields(infoboxHtml) {
  const fields = {};
  const rowMatches = [...infoboxHtml.matchAll(
    /<div class="infobox-cell-2 infobox-description">([\s\S]*?)<\/div><div[^>]*>([\s\S]*?)<\/div>/gi
  )];

  for (const match of rowMatches) {
    const key = stripTags(match[1]).replace(/:\s*$/, "");
    const value = stripTags(match[2]);
    if (key) {
      fields[key] = value;
    }
  }

  return fields;
}

function parseCost(value) {
  if (!value) {
    return null;
  }

  const match = value.replace(/[^\d]/g, "");
  return match ? Number(match) : null;
}

function detectActiveEffects(html) {
  const matches = [...html.matchAll(/<div[^>]*class="[^"]*(?:active|ability)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)];
  return matches.map((match) => stripTags(match[1])).filter(Boolean);
}

export async function loadItemPage(url, { category = "", portalCategory = "", portalCategories = [] } = {}) {
  const slug = slugFromUrl(url);
  const pageTitle = decodeHtmlEntities(decodeURIComponent(slug).replace(/_/g, " "));
  const { text: html, url: finalUrl, status, fetchSource } = await fetchLiquipediaPage(pageTitle, { baseUrl: "https://liquipedia.net/mobilelegends" });
  const title = decodeHtmlEntities(
    findFirst(html, [
      /<div class="infobox-header[^"]*">(?:<span[^>]*>[\s\S]*?<\/span>)?([^<]+)<\/div>/i,
      /<meta property="og:title" content="([^"]+)"/i,
      /<title>([^<]+)<\/title>/i
    ])
  );
  const description = decodeHtmlEntities(
    findFirst(html, [
      /<meta property="og:description" content="([^"]+)"/i,
      /<meta name="twitter:description" content="([^"]+)"/i
    ]) || extractFirstParagraph(html)
  );
  const infoboxHtml = extractInfobox(html);
  const infobox = parseInfoboxFields(infoboxHtml);
  const name = decodeHtmlEntities(title || slug);
  const headings = [...html.matchAll(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi)].map((match) => stripTags(match[1])).filter(Boolean);
  const inferredCategory = category || portalCategory || infobox.Category || infobox.Type || "";
  const activeEffects = detectActiveEffects(html);

  return {
    id: slug,
    name,
    url: finalUrl,
    title,
    description,
    status,
    fetchSource,
    source: "item-page",
    category: inferredCategory,
    raw: {
      htmlLength: html.length,
      sectionHeadings: headings.slice(0, 40),
      infoboxType: "Item"
    },
    infobox,
    scaffold: {
      id: slug,
      name,
      category: inferredCategory,
      cost: parseCost(infobox.Cost || infobox.Price || ""),
      sourceRefs: [
        {
          label: "Liquipedia item page",
          url: finalUrl,
          verifiedOn: new Date().toISOString().slice(0, 10)
        }
      ],
      statsGranted: infobox.Attributes || infobox.Stats || {},
      passiveEffects: infobox.Ability
        ? [
            {
              name: infobox.Ability,
              description: infobox.Ability,
              tags: []
            }
          ]
        : [],
      activeEffects,
      goodAgainstTags: [],
      typicalBuilders: {
        roles: [],
        heroTags: []
      },
      situationalUsageTags: [],
      description,
      portalCategory: portalCategory || "",
      portalCategories
    }
  };
}
