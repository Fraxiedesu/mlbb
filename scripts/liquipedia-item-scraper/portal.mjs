import { fetchLiquipediaPage } from "./http.mjs";
import { normalizeUrl, stripTags, titleFromUrl, uniqueBy } from "./utils.mjs";

const ITEM_PATH_RE = /^\/mobilelegends\/(?!Main_Page|Portal:|Special:|Category:|File:|Template:|Help:|Liquipedia:|index\.php|Talk:)[^?#]+$/i;
const PORTAL_CATEGORY_ORDER = ["Attack", "Magic", "Defense", "Movement", "Jungling", "Roaming"];
const PORTAL_CATEGORY_RE = />(Attack|Magic|Defense|Movement|Jungling|Roaming)\s*\((\d+)\)</gi;

export async function loadPortalItems(portalUrl, baseUrl) {
  const pageTitle = titleFromUrl(portalUrl) || "Portal:Equipment";
  const { text: html, url, fetchSource } = await fetchLiquipediaPage(pageTitle, { baseUrl });
  const itemsBySlug = new Map();
  const categoryCounts = {};
  let placementCount = 0;
  const headings = [...html.matchAll(PORTAL_CATEGORY_RE)].map((match) => ({
    category: match[1],
    count: Number(match[2]),
    index: match.index || 0,
    end: (match.index || 0) + match[0].length
  }));

  for (const heading of headings) {
    categoryCounts[heading.category] = heading.count;
  }

  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const nextHeading = headings[index + 1];
    const sectionHtml = html.slice(heading.end, nextHeading ? nextHeading.index : html.length);
    const anchors = [...sectionHtml.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];

    for (const anchor of anchors) {
      const normalizedUrl = normalizeUrl(anchor[1], baseUrl);
      if (!normalizedUrl) {
        continue;
      }

      const path = new URL(normalizedUrl).pathname;
      if (!ITEM_PATH_RE.test(path)) {
        continue;
      }

      const slug = path.split("/").filter(Boolean).pop() || "";
      const name = stripTags(anchor[2]);
      if (!slug || !name) {
        continue;
      }

      const existing = itemsBySlug.get(slug);
      if (existing) {
        if (!existing.portalCategories.includes(heading.category)) {
          existing.portalCategories.push(heading.category);
          placementCount += 1;
        }
        continue;
      }

      itemsBySlug.set(slug, {
        name,
        slug,
        category: heading.category,
        portalCategories: [heading.category],
        url: normalizedUrl,
        source: "portal"
      });
      placementCount += 1;
    }
  }

  const uniqueItems = uniqueBy([...itemsBySlug.values()], (item) => item.slug);
  const categoryCountsOrdered = Object.fromEntries(
    PORTAL_CATEGORY_ORDER.map((category) => [category, categoryCounts[category] || 0])
  );

  return {
    portalUrl,
    resolvedUrl: url,
    fetchSource,
    pageTitle,
    items: uniqueItems,
    placementCount,
    categoryCounts: categoryCountsOrdered
  };
}
