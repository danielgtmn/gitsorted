import { Suspense } from "react";
import { SignInButton, SignOutButton } from "@/components/auth-buttons";
import { PublicStats } from "@/components/public-stats";
import { RepoManager } from "@/components/repo-manager";
import { GitHubError, listRepos } from "@/lib/github";
import { getCurrentUser, getGitHubToken } from "@/lib/session";
import { statsEnabled } from "@/lib/stats";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6">
      <Suspense fallback={<Loading />}>
        <App />
      </Suspense>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
      Lade deine Repositories…
    </div>
  );
}

async function App() {
  const user = await getCurrentUser();
  if (!user) return <Landing />;

  const token = await getGitHubToken();
  let content: React.ReactNode;
  if (!token) {
    content = (
      <Problem text="Dein GitHub-Zugang ist abgelaufen. Bitte melde dich neu an." />
    );
  } else {
    try {
      const repos = await listRepos(token);
      content = <RepoManager repos={repos} />;
    } catch (e) {
      const status = e instanceof GitHubError ? e.status : 0;
      content = (
        <Problem
          text={
            status === 401
              ? "GitHub hat die Anmeldung abgelehnt. Bitte melde dich neu an."
              : "Deine Repositories konnten nicht geladen werden. Versuch es gleich noch einmal."
          }
        />
      );
    }
  }

  return (
    <>
      <header className="mb-8 flex items-center justify-between gap-4">
        <Logo />
        <div className="flex items-center gap-3">
          {user.image && (
            // biome-ignore lint/performance/noImgElement: tiny external avatar
            <img
              src={user.image}
              alt=""
              className="size-8 rounded-full border border-zinc-200 dark:border-zinc-800"
            />
          )}
          <span className="hidden text-sm text-zinc-600 sm:inline dark:text-zinc-400">
            {user.name}
          </span>
          <SignOutButton />
        </div>
      </header>
      {content}
    </>
  );
}

function Problem({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
      {text}
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="grid size-8 place-items-center rounded-lg bg-zinc-900 text-sm text-white dark:bg-white dark:text-zinc-900">
        gs
      </span>
      gitsorted
    </div>
  );
}

function Landing() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mb-16">
        <Logo />
      </header>
      <main className="flex max-w-2xl flex-col gap-6">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Räum deine GitHub-Repos auf.
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Sieh auf einen Blick, wann du was angelegt und zuletzt angefasst hast,
          finde doppelte und vergessene Repos und lösch oder archivier sie in
          einem Rutsch.
        </p>
        <div>
          <SignInButton />
        </div>
        <Suspense fallback={null}>
          <PublicStats />
        </Suspense>
        <ul className="mt-6 grid gap-3 text-sm text-zinc-600 sm:grid-cols-3 dark:text-zinc-400">
          <li className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <strong className="block text-zinc-900 dark:text-zinc-100">
              Überblick
            </strong>
            Erstellt, zuletzt gepusht, Größe, Sterne – sortier- und filterbar.
          </li>
          <li className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <strong className="block text-zinc-900 dark:text-zinc-100">
              Duplikate
            </strong>
            Erkennt Kopien wie „projekt-old“ oder „projekt-v2“.
          </li>
          <li className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <strong className="block text-zinc-900 dark:text-zinc-100">
              Aufräumen
            </strong>
            Mehrere Repos auf einmal löschen oder archivieren.
          </li>
        </ul>
        <p className="text-xs text-zinc-500">
          {statsEnabled()
            ? "Deine Anmeldung liegt nur verschlüsselt in deinem Browser. Wir speichern weder Repo-Namen noch Inhalte – nur anonyme Gesamtzahlen."
            : "Wir speichern nichts auf einem Server. Deine Anmeldung liegt nur verschlüsselt in deinem Browser."}
        </p>
      </main>
    </div>
  );
}
