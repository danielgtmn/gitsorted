"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  archiveRepos,
  deleteRepos,
  type RepoActionResult,
} from "@/app/actions";
import { isEmptyish, lastActivity } from "@/lib/cleanup";
import type { Repo } from "@/lib/repo";
import { ActivityChart } from "./activity-chart";
import { CleanupView } from "./cleanup-view";
import { ConfirmDialog } from "./confirm-dialog";
import { RepoTable, type SortDir, type SortKey } from "./repo-table";

export type Filter =
  | "all"
  | "private"
  | "public"
  | "fork"
  | "archived"
  | "active"
  | "org"
  | "empty";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "active", label: "Nicht archiviert" },
  { key: "private", label: "Privat" },
  { key: "public", label: "Öffentlich" },
  { key: "fork", label: "Forks" },
  { key: "archived", label: "Archiviert" },
  { key: "org", label: "Organisationen" },
  { key: "empty", label: "Leer & fast leer" },
];

type Pending = { kind: "delete" | "archive" | "unarchive"; repos: Repo[] };

export function RepoManager({ repos: initial }: { repos: Repo[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"all" | "cleanup">("all");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [year, setYear] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("pushedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [archivedOverride, setArchivedOverride] = useState<
    Map<string, boolean>
  >(new Map());
  const [pending, setPending] = useState<Pending | null>(null);
  const [results, setResults] = useState<RepoActionResult[] | null>(null);
  const [isRunning, startTransition] = useTransition();

  // Apply optimistic changes on top of the server data.
  const repos = useMemo(
    () =>
      initial
        .filter((r) => !removed.has(r.fullName))
        .map((r) =>
          archivedOverride.has(r.fullName)
            ? { ...r, archived: archivedOverride.get(r.fullName) as boolean }
            : r,
        ),
    [initial, removed, archivedOverride],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = repos.filter((r) => {
      if (
        q &&
        !`${r.fullName} ${r.description ?? ""}`.toLowerCase().includes(q)
      )
        return false;
      if (year !== null && new Date(lastActivity(r)).getFullYear() !== year)
        return false;
      switch (filter) {
        case "private":
          return r.private;
        case "public":
          return !r.private;
        case "fork":
          return r.fork;
        case "archived":
          return r.archived;
        case "active":
          return !r.archived;
        case "org":
          return r.isOrg;
        case "empty":
          return isEmptyish(r);
        default:
          return true;
      }
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return list.sort((a, b) => dir * compare(a, b, sortKey));
  }, [repos, query, filter, year, sortKey, sortDir]);

  const selectedRepos = repos.filter((r) => selected.has(r.id));

  function toggle(ids: number[], on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  function run() {
    if (!pending) return;
    const { kind, repos: targets } = pending;
    const names = targets.map((r) => r.fullName);
    startTransition(async () => {
      let res: RepoActionResult[];
      try {
        res =
          kind === "delete"
            ? await deleteRepos(names)
            : await archiveRepos(names, kind === "archive");
      } catch {
        res = names.map((fullName) => ({
          fullName,
          ok: false,
          error: "Aktion fehlgeschlagen – bist du noch angemeldet?",
        }));
      }
      const ok = res.filter((r) => r.ok).map((r) => r.fullName);
      if (kind === "delete") {
        setRemoved((prev) => new Set([...prev, ...ok]));
      } else {
        setArchivedOverride((prev) => {
          const next = new Map(prev);
          for (const n of ok) next.set(n, kind === "archive");
          return next;
        });
      }
      const okIds = targets
        .filter((t) => ok.includes(t.fullName))
        .map((t) => t.id);
      toggle(okIds, false);
      setResults(res);
      setPending(null);
      router.refresh();
    });
  }

  const archivedCount = repos.filter((r) => r.archived).length;
  const forkCount = repos.filter((r) => r.fork).length;

  return (
    <div className="flex flex-col gap-6 pb-24">
      <section className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-1 sm:gap-2">
          <Stat label="Repos" value={repos.length} />
          <Stat label="Forks" value={forkCount} />
          <Stat label="Archiviert" value={archivedCount} />
        </div>
        <ActivityChart
          repos={repos}
          selectedYear={year}
          onSelectYear={(y) => {
            setYear(y);
            setTab("all");
          }}
        />
      </section>

      <nav className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        <TabButton active={tab === "all"} onClick={() => setTab("all")}>
          Alle Repos
        </TabButton>
        <TabButton active={tab === "cleanup"} onClick={() => setTab("cleanup")}>
          Duplikate &amp; Aufräumen
        </TabButton>
      </nav>

      {results && (
        <ResultBanner results={results} onClose={() => setResults(null)} />
      )}

      {tab === "all" ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name oder Beschreibung suchen…"
              className="w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-400 sm:max-w-xs dark:border-zinc-800 dark:focus:border-zinc-600"
            />
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    filter === f.key
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {f.label}
                </button>
              ))}
              {year !== null && (
                <button
                  type="button"
                  onClick={() => setYear(null)}
                  className="rounded-full bg-sky-100 px-3 py-1 text-xs text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                >
                  Zuletzt aktiv {year} ✕
                </button>
              )}
            </div>
          </div>
          <RepoTable
            repos={visible}
            selected={selected}
            onToggle={toggle}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={(key) => {
              if (key === sortKey)
                setSortDir(sortDir === "asc" ? "desc" : "asc");
              else {
                setSortKey(key);
                setSortDir(key === "name" ? "asc" : "desc");
              }
            }}
          />
        </>
      ) : (
        <CleanupView repos={repos} selected={selected} onToggle={toggle} />
      )}

      {selectedRepos.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-10 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white/95 px-4 py-2.5 text-sm shadow-lg backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
            <span className="font-medium">
              {selectedRepos.length} ausgewählt
            </span>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Auswahl aufheben
            </button>
            <span className="h-5 w-px bg-zinc-200 dark:bg-zinc-800" />
            {selectedRepos.some((r) => !r.archived) && (
              <button
                type="button"
                onClick={() =>
                  setPending({
                    kind: "archive",
                    repos: selectedRepos.filter((r) => !r.archived),
                  })
                }
                className="rounded-lg border border-zinc-200 px-3 py-1.5 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                Archivieren
              </button>
            )}
            {selectedRepos.some((r) => r.archived) && (
              <button
                type="button"
                onClick={() =>
                  setPending({
                    kind: "unarchive",
                    repos: selectedRepos.filter((r) => r.archived),
                  })
                }
                className="rounded-lg border border-zinc-200 px-3 py-1.5 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                Wiederherstellen
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                setPending({ kind: "delete", repos: selectedRepos })
              }
              className="rounded-lg bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700"
            >
              Löschen
            </button>
          </div>
        </div>
      )}

      {pending && (
        <ConfirmDialog
          kind={pending.kind}
          repos={pending.repos}
          running={isRunning}
          onCancel={() => setPending(null)}
          onConfirm={run}
        />
      )}
    </div>
  );
}

function compare(a: Repo, b: Repo, key: SortKey): number {
  switch (key) {
    case "name":
      return a.fullName.localeCompare(b.fullName, "de", {
        sensitivity: "base",
      });
    case "createdAt":
      return Date.parse(a.createdAt) - Date.parse(b.createdAt);
    case "pushedAt":
      return lastActivity(a) - lastActivity(b);
    case "sizeKb":
      return a.sizeKb - b.sizeKb;
    case "stars":
      return a.stars - b.stars;
  }
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 px-4 py-3 sm:min-w-36 dark:border-zinc-800">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm transition ${
        active
          ? "border-zinc-900 font-medium dark:border-white"
          : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      }`}
    >
      {children}
    </button>
  );
}

function ResultBanner({
  results,
  onClose,
}: {
  results: RepoActionResult[];
  onClose: () => void;
}) {
  const failed = results.filter((r) => !r.ok);
  const okCount = results.length - failed.length;
  return (
    <output
      className={`flex items-start justify-between gap-4 rounded-xl border p-4 text-sm ${
        failed.length
          ? "border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          : "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
      }`}
    >
      <div>
        {okCount > 0 && <p>{okCount} Repo(s) erledigt.</p>}
        {failed.length > 0 && (
          <ul className="mt-1 list-disc pl-5">
            {failed.map((f) => (
              <li key={f.fullName}>
                <span className="font-mono">{f.fullName}</span>: {f.error}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="button" onClick={onClose} aria-label="Schließen">
        ✕
      </button>
    </output>
  );
}
