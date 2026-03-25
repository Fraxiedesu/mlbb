export const DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  Pragma: "no-cache"
};

export async function fetchText(url, { timeoutMs = 30000, headers = {} } = {}) {
  try {
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const run = promisify(execFile);

    if (process.platform === "win32") {
      const command = `curl.exe -L -A "${DEFAULT_HEADERS["User-Agent"]}" --max-time ${Math.ceil(timeoutMs / 1000)} "${url}"`;
      const { stdout } = await run("powershell.exe", [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        command
      ], { maxBuffer: 25 * 1024 * 1024 });

      return {
        url,
        status: 200,
        text: stdout
      };
    }

    const curlBinary = "curl";
    const headerArgs = Object.entries({ ...DEFAULT_HEADERS, ...headers }).flatMap(([key, value]) => ["-H", `${key}: ${value}`]);
    const command = [
      "-L",
      "--compressed",
      "--silent",
      "--show-error",
      "--max-time",
      String(Math.ceil(timeoutMs / 1000)),
      ...headerArgs,
      url
    ];
    const { stdout } = await run(curlBinary, command, { maxBuffer: 25 * 1024 * 1024 });

    return {
      url,
      status: 200,
      text: stdout
    };
  } catch (error) {
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
