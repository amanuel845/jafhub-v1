# GitHub API Playground — Vercel

A browser playground for the GitHub REST API backed by a Vercel serverless proxy.

## Project structure

```text
.
├── api/
│   └── [...path].js       # Catch-all GitHub REST API proxy
├── public/
│   └── index.html         # Frontend playground
├── package.json
├── vercel.json             # Vercel routing/function config
└── vercel.js               # Project metadata/helper config
```

## Deploy with GitHub + Vercel

1. Create a new GitHub repository.
2. Copy these files into the repository.
3. Commit and push.
4. Import the repository into Vercel.
5. In Vercel → Project Settings → Environment Variables, add:

```text
GITHUB_TOKEN=github_pat_...
```

6. Redeploy.

The token is only available to the serverless function. It is not included in `public/index.html`.

## Local development

Install dependencies:

```bash
npm install
```

Install the Vercel CLI if needed:

```bash
npm install -g vercel
```

Then:

```bash
vercel dev
```

Open the local URL printed by Vercel.

## API

The catch-all endpoint means GitHub REST endpoints map directly:

```text
GET    /api/user
GET    /api/user/repos
GET    /api/repos/octocat/Hello-World
GET    /api/search/repositories?q=javascript
POST   /api/repos/OWNER/REPO/issues
PATCH  /api/repos/OWNER/REPO/issues/1
DELETE /api/repos/OWNER/REPO/issues/1
```

The server always forwards to:

```text
https://api.github.com
```

It does not accept an arbitrary upstream URL, so it is not an open proxy.

## GitHub token

Use a fine-grained personal access token with only the permissions your playground needs. For a public-read-only playground, you can also leave `GITHUB_TOKEN` unset and use GitHub's unauthenticated API.

Never commit `.env`, access tokens, or secrets to the repository.
