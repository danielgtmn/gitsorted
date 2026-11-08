# Contributing to gitsorted

Thanks for helping out! Bug reports, ideas and pull requests are all welcome.

## Before you start

- For anything bigger than a small fix, please open an issue first so we can
  agree on the approach.
- Be kind – this project follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## Setup

See [Development](README.md#development) in the README. You need your own
GitHub OAuth App for local sign-in (callback
`http://localhost:3000/api/auth/callback/github`).

> ⚠️ gitsorted can **delete repositories**. When testing bulk actions, use
> throwaway repos – never test against repos you care about.

## Workflow

1. Fork and create a branch from `main` (`feat/…`, `fix/…`, `docs/…`).
2. Make your change. Add or update tests in `src/**/*.test.ts` for logic changes.
3. Make sure everything passes:
   ```bash
   pnpm lint && pnpm typecheck && pnpm test && pnpm build
   ```
4. Open a pull request. The **PR title must be a Conventional Commit**
   (e.g. `feat: detect repos without commits`) – it becomes the squash-commit
   message on `main`.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org):
`feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`,
`style`, `revert` – optional scope, e.g. `fix(auth): …`.
The `commit-msg` hook checks this locally.

## Code style

- Formatting and linting: [Biome](https://biomejs.dev) (runs on commit).
- UI text is German and describes what the user gets – no library or
  implementation names in user-facing strings.
- Keep GitHub tokens server-side: GitHub API calls belong in `src/lib/github.ts`
  and server actions, never in client components.
