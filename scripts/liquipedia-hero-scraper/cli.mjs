import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { loadHeroPage } from "./hero-page.mjs";
import { loadPortalHeroes } from "./portal.mjs";
import { mapLimit, parseArgv } from "./utils.mjs";

function summarizeManifest(portal, heroes) {
  return {
    generatedAt: new Date().toISOString(),
    portal: portal.portalUrl,
    totalHeroes: heroes.length,
    heroes
  };
}

function buildParsedOutput(portal, heroes) {
  return {
    generatedAt: new Date().toISOString(),
    portal: portal.portalUrl,
    totalHeroes: heroes.length,
    heroes
  };
}

async function main() {
  const args = parseArgv(process.argv);
  const portal = await loadPortalHeroes(args.portal, args.baseUrl);
  const pages = await mapLimit(portal.heroes, args.concurrency, async (hero) => loadHeroPage(hero.url));
  const heroPages = pages.filter((page) => page.isHeroPage);
  const outputHeroes = args.limit > 0 ? heroPages.slice(0, args.limit) : heroPages;
  const output = args.mode === "raw"
    ? summarizeManifest(portal, outputHeroes.map((page) => ({
      id: page.id,
      name: page.name,
      url: page.url,
      title: page.title,
      subtitle: page.subtitle,
      source: page.source,
      status: page.status,
      raw: page.raw
    })))
    : buildParsedOutput(portal, outputHeroes.map((page) => page.scaffold));

  const json = args.pretty ? JSON.stringify(output, null, 2) : JSON.stringify(output);

  if (args.out) {
    const outputPath = resolve(args.out);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, json, "utf8");
    process.stdout.write(`Wrote ${output.totalHeroes} heroes to ${outputPath}\n`);
  } else {
    process.stdout.write(`${json}\n`);
  }

  process.stdout.write(`Portal links discovered: ${portal.heroes.length}\n`);
  process.stdout.write(`Hero pages parsed: ${heroPages.length}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
