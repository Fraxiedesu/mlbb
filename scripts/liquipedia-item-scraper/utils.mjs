export function decodeHtmlEntities(value) {
  if (!value) {
    return "";
  }

  const namedEntities = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " "
  };

  return value
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, num) => String.fromCharCode(Number.parseInt(num, 16)))
    .replace(/&([a-zA-Z]+);/g, (match, entity) => namedEntities[entity] ?? match)
    .replace(/\s+/g, " ")
    .trim();
}

export function stripTags(value) {
  return decodeHtmlEntities(value.replace(/<[^>]*>/g, " "));
}

export function slugFromUrl(url) {
  const withoutQuery = url.split("?")[0];
  return withoutQuery.split("/").filter(Boolean).pop() || "";
}

export function titleFromUrl(url) {
  const slug = slugFromUrl(url);
  return decodeURIComponent(slug).replace(/_/g, " ");
}

export function normalizeUrl(href, baseUrl) {
  if (!href) {
    return null;
  }

  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }

  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

export function uniqueBy(items, keyFn) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
}

export async function mapLimit(items, limit, worker) {
  const result = new Array(items.length);
  let index = 0;

  async function next() {
    while (index < items.length) {
      const currentIndex = index++;
      result[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => next());
  await Promise.all(workers);
  return result;
}

export function parseArgv(argv) {
  const parsed = {
    mode: "parsed",
    out: null,
    portalOut: null,
    portal: "https://liquipedia.net/mobilelegends/Portal:Equipment",
    baseUrl: "https://liquipedia.net/mobilelegends",
    limit: 0,
    concurrency: 6,
    pretty: true
  };

  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const [flag, inlineValue] = token.split("=", 2);
    const consumeNext = () => {
      if (inlineValue !== undefined) {
        return inlineValue;
      }

      index += 1;
      return argv[index];
    };

    switch (flag) {
      case "--mode":
        parsed.mode = consumeNext() || parsed.mode;
        break;
      case "--out":
        parsed.out = consumeNext() || parsed.out;
        break;
      case "--portal-out":
        parsed.portalOut = consumeNext() || parsed.portalOut;
        break;
      case "--portal":
        parsed.portal = consumeNext() || parsed.portal;
        break;
      case "--base-url":
        parsed.baseUrl = consumeNext() || parsed.baseUrl;
        break;
      case "--limit":
        parsed.limit = Number(consumeNext() || parsed.limit);
        break;
      case "--concurrency":
        parsed.concurrency = Number(consumeNext() || parsed.concurrency);
        break;
      case "--compact":
        parsed.pretty = false;
        break;
      default:
        break;
    }
  }

  return parsed;
}
