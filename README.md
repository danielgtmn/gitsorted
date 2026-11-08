# gitsorted

Räum deine GitHub-Repos auf: Mit GitHub anmelden, alle eigenen und Organisations-Repos
sehen (erstellt, zuletzt aktiv, Größe, Sterne), sortieren, filtern, mögliche Duplikate
und Aufräum-Kandidaten finden und Repos gesammelt archivieren oder löschen.

## Setup

1. GitHub OAuth App anlegen: <https://github.com/settings/developers> → *New OAuth App*
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
2. `cp .env.example .env.local` und Werte eintragen (`BETTER_AUTH_SECRET` via `openssl rand -base64 32`).
3. `pnpm install` (installiert auch die Git-Hooks) und `pnpm dev`.

## Deployment

`Dockerfile` baut einen eigenständigen Next.js-Server (Port 3000), z. B. für Coolify.
Laufzeit-Variablen: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (z. B. `https://gitsorted.eu`),
`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`. Die GitHub OAuth App braucht die Callback-URL
`https://gitsorted.eu/api/auth/callback/github`.

## Architektur

- **Auth:** [Better Auth](https://better-auth.com) ohne Datenbank. Session und GitHub-Token
  liegen verschlüsselt in Cookies; der Server speichert nichts. Scopes: `repo`, `delete_repo`.
- **Daten:** `src/lib/github.ts` (REST-API, serverseitig), Löschen/Archivieren als Server Actions in `src/app/actions.ts`.
- **Duplikat-Erkennung:** `src/lib/cleanup.ts` – normalisierte Namen (`-old`, `-v2`, `copy`, Ziffern, Zufallskennungen, Zeitstempel …
  entfernt) plus Tippfehler-Abstand ≤ 1, gleiche Beschreibungen; Kandidaten: leer, fast leer (≤ 10 KB ohne Code), einmal hochgeladen und nie weiterbearbeitet, unveränderte Forks,
  > 2 Jahre inaktiv.

## Commits

[Conventional Commits](https://www.conventionalcommits.org) werden per lefthook + commitlint erzwungen
(`feat: …`, `fix: …`, `chore: …`). Hooks: `commit-msg` (commitlint), `pre-commit` (Biome auf
gestagten Dateien), `pre-push` (Typecheck + Tests).

```bash
pnpm dev        # Entwicklungsserver
pnpm lint       # Biome
pnpm typecheck  # Routen-Typen + tsc
pnpm test       # Vitest
```
