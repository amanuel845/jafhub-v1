const GITHUB_API = "https://api.github.com";
const API_VERSION = "2022-11-28";

const HOP_BY_HOP = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade"
]);

const ALLOWED_METHODS = new Set([
  "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"
]);

function githubPathFromRequest(req) {
  // Vercel's catch-all function receives /api/foo/bar as req.url.
  const raw = new URL(req.url, "http://localhost");
  let pathname = raw.pathname.replace(/^\/api\/?/, "");

  // Never allow an absolute URL or protocol-like path to become a destination.
  pathname = pathname
    .split("/")
    .filter(Boolean)
    .map(segment => encodeURIComponent(decodeURIComponent(segment)))
    .join("/");

  return "/" + pathname + raw.search;
}

async function readBody(req) {
  if (["GET", "HEAD", "DELETE"].includes(req.method)) return undefined;

  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "string") return req.body;
    return JSON.stringify(req.body);
  }

  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => {
      data += chunk;
      if (data.length > 1024 * 1024) {
        reject(new Error("Request body exceeds 1 MB"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(data || undefined));
    req.on("error", reject);
  });
}

function copySafeHeaders(req) {
  const headers = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": API_VERSION,
    "User-Agent": "github-api-playground/2.0"
  };

  // The token is deliberately taken only from the Vercel environment.
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const contentType = req.headers["content-type"];
  if (contentType) headers["Content-Type"] = contentType;

  // Allow a small, explicit set of useful GitHub request headers.
  for (const name of [
    "accept",
    "if-none-match",
    "if-match",
    "x-github-api-version"
  ]) {
    const value = req.headers[name];
    if (value) {
      const target = name === "x-github-api-version"
        ? "X-GitHub-Api-Version"
        : name.split("-").map(x => x[0].toUpperCase() + x.slice(1)).join("-");
      headers[target] = Array.isArray(value) ? value[0] : String(value);
    }
  }

  return headers;
}

module.exports = async function handler(req, res) {
  const method = (req.method || "GET").toUpperCase();

  if (!ALLOWED_METHODS.has(method)) {
    res.setHeader("Allow", [...ALLOWED_METHODS].join(", "));
    return res.status(405).json({
      message: "Method not allowed",
      allowed: [...ALLOWED_METHODS]
    });
  }

  let githubPath;
  try {
    githubPath = githubPathFromRequest(req);
  } catch {
    return res.status(400).json({ message: "Invalid API path" });
  }

  const url = GITHUB_API + githubPath;

  try {
    const body = await readBody(req);
    const response = await fetch(url, {
      method,
      headers: copySafeHeaders(req),
      body
    });

    const contentType = response.headers.get("content-type");
    const cacheControl = response.headers.get("cache-control");
    const etag = response.headers.get("etag");

    res.statusCode = response.status;
    if (contentType) res.setHeader("Content-Type", contentType);
    if (cacheControl) res.setHeader("Cache-Control", cacheControl);
    if (etag) res.setHeader("ETag", etag);
    res.setHeader("X-Playground-Proxy", "github-api");

    const text = await response.text();
    return res.end(text);
  } catch (error) {
    console.error(error);
    return res.status(502).json({
      message: "Unable to reach GitHub API",
      error: error.message
    });
  }
};
