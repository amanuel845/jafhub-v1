/*
 * Optional project metadata for deployments/tooling.
 *
 * Vercel reads vercel.json for routing and function configuration.
 * This file is intentionally kept as a small CommonJS module so it can
 * also be required by local tooling if desired.
 */
module.exports = {
  apiBasePath: "/api",
  githubApiBaseUrl: "https://api.github.com",
  frontend: "public/index.html"
};
