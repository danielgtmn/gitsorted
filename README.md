# gitsorted

[![CI](https://github.com/danielgtmn/gitsorted/actions/workflows/ci.yml/badge.svg)](https://github.com/danielgtmn/gitsorted/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Clean up your GitHub account.** Sign in with GitHub, see all your personal and
organisation repositories with when they were created and last touched, find
duplicates and forgotten repos, and archive or delete them in bulk.

👉 Live at **[gitsorted.eu](https://gitsorted.eu)** (UI in German).

## Features

- **Overview** – every repo you own or administer: created, last activity, size,
  stars, visibility, fork/archived/template badges. Sort, search and filter;
  a "last active per year" chart doubles as a filter.
- **Duplicate detection** – groups repos whose names only differ by copy markers
  (`-old`, `-v2`, `copy`, `backup`…), generated IDs (`app-03912df4c6de`),
  timestamps, a single typo, or that share the same description.
- **Cleanup candidates** – empty repos, nearly empty repos (README only),
  repos uploaded once and never touched again, untouched forks, and repos
  inactive for more than two years.
- **Public stats** – the landing page shows anonymous totals: repos deleted,
  storage freed, repos archived and accounts cleaned up (optional, needs MongoDB).
- **Bulk actions** – archive, unarchive or delete many repos at once. Deleting
  requires typing a confirmation word; failures are reported per repo.

## Privacy

gitsorted runs in one of two modes:

|                    | Without database (default) | With stats                        |
| ------------------ | -------------------------- | --------------------------------- |
| Enabled by         | no `MONGODB_URL`           | `MONGODB_URL` set                 |
| Stored server-side | **nothing**                | anonymous totals only (see below) |
| Landing page       | no stats                   | "cleaned up so far" totals        |

Everything else – sign-in, overview, duplicate detection, bulk actions – works
identically in both modes.

gitsorted has **no user database**. Your session and GitHub access token live
only in encrypted, HTTP-only cookies in your browser
([Better Auth](https://better-auth.com) stateless mode). Repository data is
fetched from the GitHub API on demand and never stored.

The only thing persisted (if `MONGODB_URL` is set) are **anonymous totals** for
the landing page: number of repos deleted and archived, and the summed size of
deleted repos. To count distinct accounts, an HMAC-SHA256 of the GitHub user id
(keyed with `BETTER_AUTH_SECRET`) is stored – no ids, names, repo names or
tokens. See [`src/lib/stats.ts`](src/lib/stats.ts).

The app requests the `repo` and `delete_repo` scopes – needed to list private
repositories, archive and delete them. You can revoke access any time under
[GitHub → Settings → Applications](https://github.com/settings/applications).

## Self-hosting

1. Create a GitHub OAuth App at <https://github.com/settings/developers>:
   - Homepage URL: your URL, e.g. `https://gitsorted.example.com`
   - Callback URL: `https://gitsorted.example.com/api/auth/callback/github`
   - Leave **"Expire user access tokens" unchecked** (rotating refresh tokens
     cannot be written back to the cookie during page renders).
2. Set the environment variables (see [`.env.example`](.env.example)):

   | Variable               | Description                                           |
   | ---------------------- | ----------------------------------------------------- |
   | `BETTER_AUTH_SECRET`   | random, ≥ 32 chars – `openssl rand -base64 32`        |
   | `BETTER_AUTH_URL`      | public base URL, e.g. `https://gitsorted.example.com` |
   | `GITHUB_CLIENT_ID`     | from the OAuth App                                    |
   | `GITHUB_CLIENT_SECRET` | from the OAuth App                                    |

3. Run the Docker image:

   ```bash
   docker build -t gitsorted .
   docker run -p 3000:3000 --env-file .env gitsorted
   ```

   The image is a standalone Next.js server on port 3000 and works as-is on
   Coolify, Dokku, Fly.io & co. Secrets are only needed at runtime.

## Development

Requires Node.js 24 and pnpm (`corepack enable`).

```bash
cp .env.example .env.local   # fill in values; callback http://localhost:3000/api/auth/callback/github
pnpm install                 # also installs git hooks
pnpm dev                     # http://localhost:3000
```

| Command          |                           |
| ---------------- | ------------------------- |
| `pnpm lint`      | Biome lint + format check |
| `pnpm typecheck` | route types + `tsc`       |
| `pnpm test`      | Vitest                    |
| `pnpm build`     | production build          |

### Project layout

```
src/app/            Next.js App Router – page, server actions, auth route
src/components/     UI (repo table, cleanup view, dialogs, chart)
src/lib/auth.ts     Better Auth config (stateless, GitHub provider)
src/lib/github.ts   GitHub REST client (server-only)
src/lib/cleanup.ts  duplicate & cleanup-candidate detection (+ tests)
src/lib/stats.ts    anonymous totals in MongoDB (optional)
```

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md).
Commits follow [Conventional Commits](https://www.conventionalcommits.org),
enforced by lefthook + commitlint locally and in CI.

Found a security issue? See [SECURITY.md](SECURITY.md) – please don't open a
public issue.

## License

[MIT](LICENSE) © Daniel Gietmann
