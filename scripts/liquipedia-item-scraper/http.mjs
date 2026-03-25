export const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  Pragma: "no-cache"
};

const CHALLENGE_RE = /Rate Limited - Liquipedia|Verify you are human|turnstile/i;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isChallengePage(text) {
  return CHALLENGE_RE.test(text);
}

export async function fetchText(url, { timeoutMs = 30000, headers = {} } = {}) {
  try {
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const run = promisify(execFile);
    const curlBinary = process.platform === "win32" ? "curl.exe" : "curl";
    const headerArgs = Object.entries({ ...DEFAULT_HEADERS, ...headers }).flatMap(([key, value]) => ["-H", `${key}: ${value}`]);
    const command = ["-L", "--compressed", "--silent", "--show-error", "--max-time", String(Math.ceil(timeoutMs / 1000)), ...headerArgs, url];
    const { stdout } = await run(curlBinary, command, { maxBuffer: 25 * 1024 * 1024 });

    return {
      url,
      status: 200,
      text: stdout
    };
  } catch {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: { ...DEFAULT_HEADERS, ...headers },
        signal: controller.signal
      });
      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`);
      }

      return {
        url: response.url || url,
        status: response.status,
        text
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export async function fetchLiquipediaPage(pageTitle, { timeoutMs = 30000, headers = {}, baseUrl = "https://liquipedia.net/mobilelegends" } = {}) {
  const apiUrl = new URL("/mobilelegends/api.php", baseUrl);
  apiUrl.searchParams.set("action", "parse");
  apiUrl.searchParams.set("page", pageTitle);
  apiUrl.searchParams.set("prop", "text");
  apiUrl.searchParams.set("format", "json");

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { text } = await fetchText(apiUrl.toString(), { timeoutMs, headers });
    if (!isChallengePage(text)) {
      try {
        const parsed = JSON.parse(text);
        const html = parsed?.parse?.text?.["*"] || "";
        if (html) {
          return {
            url: `${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(pageTitle).replace(/%20/g, "_")}`,
            fetchUrl: apiUrl.toString(),
            pageUrl: `${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(pageTitle).replace(/%20/g, "_")}`,
            status: 200,
            fetchSource: "api",
            text: html
          };
        }
      } catch {
        // fall through to retry or direct fetch
      }
    }

    if (attempt < 2) {
      await sleep(1500 * (attempt + 1));
    }
  }

  const fallbackUrl = `${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(pageTitle).replace(/%20/g, "_")}`;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const direct = await fetchText(fallbackUrl, { timeoutMs, headers });
    if (!isChallengePage(direct.text)) {
      return {
        ...direct,
        fetchUrl: fallbackUrl,
        fetchSource: "html"
      };
    }

    if (attempt < 1) {
      await sleep(2000 * (attempt + 1));
    }
  }

  const direct = await fetchText(fallbackUrl, { timeoutMs, headers });
  return {
    ...direct,
    fetchUrl: fallbackUrl,
    fetchSource: "html"
  };
}
