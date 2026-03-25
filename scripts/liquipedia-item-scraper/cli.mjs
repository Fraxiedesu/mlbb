import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, extname, resolve } from "node:path";
import { loadItemPage } from "./item-page.mjs";
import { loadPortalItems } from "./portal.mjs";
import { mapLimit, parseArgv } from "./utils.mjs";

function summarizeManifest(portal, items) {
  return {
    generatedAt: new Date().toISOString(),
    portal: portal.portalUrl,
    resolvedUrl: portal.resolvedUrl,
    fetchSource: portal.fetchSource,
    totalItems: items.length,
    placementCount: portal.placementCount,
    categoryCounts: portal.categoryCounts,
    items
  };
}

function buildParsedOutput(portal, items) {
  return {
    generatedAt: new Date().toISOString(),
    portal: portal.portalUrl,
    resolvedUrl: portal.resolvedUrl,
    fetchSource: portal.fetchSource,
    totalItems: items.length,
    placementCount: portal.placementCount,
    categoryCounts: portal.categoryCounts,
    items
  };
}

function resolvePortalManifestPath(args) {
  if (args.portalOut) {
    return resolve(args.portalOut);
  }

  if (!args.out) {
    return null;
  }

  const outputPath = resolve(args.out);
  const extension = extname(outputPath);
  const base = basename(outputPath, extension || undefined);
  return resolve(dirname(outputPath), `${base}.portal.json`);
}

async function main() {
  const args = parseArgv(process.argv);
  const portal = await loadPortalItems(args.portal, args.baseUrl);
  const portalManifestPath = resolvePortalManifestPath(args);

  if (portalManifestPath) {
    await mkdir(dirname(portalManifestPath), { recursive: true });
    await writeFile(portalManifestPath, JSON.stringify(portal, null, 2), "utf8");
    process.stdout.write(`Wrote portal manifest to ${portalManifestPath}\n`);
  }

  const limitedItems = args.limit > 0 ? portal.items.slice(0, args.limit) : portal.items;
  const pages = await mapLimit(limitedItems, args.concurrency, async (item) => {
    try {
      return await loadItemPage(item.url, {
        category: item.category,
        portalCategory: item.category,
        portalCategories: item.portalCategories || [item.category]
      });
    } catch (error) {
      return {
        id: item.slug,
        name: item.name,
        url: item.url,
        title: item.name,
        category: item.category,
        source: "item-page",
        status: 0,
        raw: {
          error: error instanceof Error ? error.message : String(error)
        },
        scaffold: null
      };
    }
  });
  const successfulPages = pages.filter((page) => page?.scaffold);
  const failedPages = pages.filter((page) => !page?.scaffold).map((page) => ({
    id: page.id,
    name: page.name,
    url: page.url,
    category: page.category,
    error: page.raw?.error || "Unknown item fetch failure"
  }));
  const output =
    args.mode === "raw"
      ? summarizeManifest(
          portal,
          pages.map((page) => ({
            id: page.id,
            name: page.name,
            url: page.url,
            title: page.title,
            category: page.category,
            source: page.source,
            status: page.status,
            raw: page.raw
          }))
        )
      : {
          ...buildParsedOutput(portal, successfulPages.map((page) => page.scaffold)),
          failedItems: failedPages
        };

  const json = args.pretty ? JSON.stringify(output, null, 2) : JSON.stringify(output);

  if (args.out) {
    const outputPath = resolve(args.out);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, json, "utf8");
    process.stdout.write(`Wrote ${output.totalItems} items to ${outputPath}\n`);
  } else {
    process.stdout.write(`${json}\n`);
  }

  process.stdout.write(`Portal items discovered: ${portal.items.length} via ${portal.fetchSource || "unknown"}\n`);
  process.stdout.write(`Portal placements discovered: ${portal.placementCount}\n`);
  process.stdout.write(`Item pages parsed: ${successfulPages.length}\n`);
  process.stdout.write(`Item pages failed: ${failedPages.length}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
