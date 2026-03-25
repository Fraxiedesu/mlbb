import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const INPUT_PATH = resolve("scripts/liquipedia-item-scraper/out/items.parsed.json");
const OUTPUT_PATH = resolve("dataset/samples/items.seed.json");
const RAW_OUTPUT_PATH = resolve("dataset/production/items.liquipedia.raw.json");
const SOURCE_OUTPUT_PATH = resolve("dataset/sources/liquipedia.item-pages.json");
const MAIN_SOURCES_PATH = resolve("dataset/sources/liquipedia.sources.json");
const VERIFIED_ON = new Date().toISOString().slice(0, 10);
const EXPECTED_COUNTS = { Attack: 34, Magic: 31, Defense: 26, Movement: 11, Jungling: 3, Roaming: 4 };

function normalizeId(value) {
  return String(value || "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const match = String(value).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeCategory(value) {
  const category = String(value || "").trim();
  if (/roam/i.test(category)) return "Roaming";
  if (/jung/i.test(category)) return "Jungling";
  if (/move/i.test(category)) return "Movement";
  if (/def/i.test(category)) return "Defense";
  if (/mag/i.test(category)) return "Magic";
  return "Attack";
}

function parseStats(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string" || !value.trim()) {
    return {};
  }

  return Object.fromEntries(
    value
      .split(/\s{2,}|,\s*/)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => {
        const numeric = parseNumber(chunk);
        const label = chunk.replace(/^[+\-]?\d+(?:\.\d+)?%?\s*/, "").trim() || chunk;
        return [label, numeric ?? chunk];
      })
  );
}

function buildSourceUrl(slugOrName) {
  const normalized = String(slugOrName || "").trim().replace(/\s+/g, "_");
  return `https://liquipedia.net/mobilelegends/${normalized}`;
}

function transformItem(rawItem) {
  const category = normalizeCategory(rawItem.category || rawItem.portalCategory || (rawItem.portalCategories || [])[0]);
  const sourceUrl = buildSourceUrl(rawItem.id || rawItem.name);

  return {
    id: normalizeId(rawItem.id || rawItem.name),
    name: String(rawItem.name || rawItem.id).trim(),
    category,
    cost: rawItem.cost ?? null,
    sourceRefs: [
      {
        label: "Liquipedia equipment page",
        url: sourceUrl,
        verifiedOn: VERIFIED_ON
      }
    ],
    statsGranted: parseStats(rawItem.statsGranted),
    passiveEffects: (rawItem.passiveEffects || []).map((effect) => ({
      name: effect.name || "Passive",
      description: effect.description || "",
      tags: effect.tags || []
    })),
    activeEffects: rawItem.activeEffects || [],
    goodAgainstTags: rawItem.goodAgainstTags || [],
    typicalBuilders: rawItem.typicalBuilders || { roles: [], heroTags: [] },
    situationalUsageTags: rawItem.situationalUsageTags || []
  };
}

async function main() {
  const source = JSON.parse(await readFile(INPUT_PATH, "utf8"));

  if (!source.totalItems) {
    throw new Error("Item scrape artifact is empty. Liquipedia rate limiting blocked the equipment crawl. Clear the CAPTCHA block, rerun the item scraper, then rerun this build step.");
  }

  const items = source.items.map(transformItem);
  const counts = items.reduce((accumulator, item) => {
    accumulator[item.category] = (accumulator[item.category] || 0) + 1;
    return accumulator;
  }, {});

  for (const [category, expected] of Object.entries(EXPECTED_COUNTS)) {
    if ((counts[category] || 0) !== expected) {
      throw new Error(`Expected ${expected} ${category} items, received ${counts[category] || 0}.`);
    }
  }

  const itemPages = items.map((item) => item.sourceRefs[0].url);

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await mkdir(dirname(RAW_OUTPUT_PATH), { recursive: true });
  await mkdir(dirname(SOURCE_OUTPUT_PATH), { recursive: true });

  await writeFile(OUTPUT_PATH, `${JSON.stringify(items, null, 2)}\n`);
  await writeFile(RAW_OUTPUT_PATH, `${JSON.stringify(source, null, 2)}\n`);
  await writeFile(
    SOURCE_OUTPUT_PATH,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        verifiedOn: VERIFIED_ON,
        totalItems: items.length,
        categoryCounts: counts,
        itemPages
      },
      null,
      2
    )}\n`
  );

  try {
    const mainSources = JSON.parse(await readFile(MAIN_SOURCES_PATH, "utf8"));
    mainSources.itemPages = itemPages;
    mainSources.verifiedOn = VERIFIED_ON;
    mainSources.notes = unique([
      ...(mainSources.notes || []),
      "Item catalog refreshed from the Liquipedia equipment scrape artifact."
    ]);
    await writeFile(MAIN_SOURCES_PATH, `${JSON.stringify(mainSources, null, 2)}\n`);
  } catch {
    // Dedicated manifest is enough if the aggregate source file is absent.
  }

  process.stdout.write(`Wrote ${items.length} items to ${OUTPUT_PATH}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
