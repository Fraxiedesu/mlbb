import { fetchText } from "./http.mjs";
import { normalizeHeroUrl, stripTags, uniqueBy } from "./utils.mjs";

const HERO_PATH_RE = /^\/mobilelegends\/(?!Main_Page|Portal:|Special:|Category:|File:|Template:|Help:|Liquipedia:|index\.php|Talk:)[^/?#]+$/i;

export async function loadPortalHeroes(portalUrl, baseUrl) {
  const { text: html, url } = await fetchText(portalUrl);
  const anchors = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*title="([^"]+)"[^>]*>([\s\S]*?<img\b[^>]*src="[^"]*ML_icon_[^"]*"[\s\S]*?)<\/a>/gi)];

  const heroes = anchors
    .map((match) => {
      const href = match[1];
      const normalizedUrl = normalizeHeroUrl(href, baseUrl);
      if (!normalizedUrl) {
        return null;
      }

      const path = new URL(normalizedUrl).pathname;
      if (!HERO_PATH_RE.test(path)) {
        return null;
      }

      const name = stripTags(match[2]) || stripTags(match[3]);
      const slug = path.split("/").filter(Boolean).pop() || "";

      return {
        name,
        slug,
        url: normalizedUrl,
        source: "portal"
      };
    })
    .filter(Boolean);

  return {
    portalUrl: url,
    heroes: uniqueBy(heroes, (item) => item.slug)
  };
}
