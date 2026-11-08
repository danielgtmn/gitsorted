"use client";

import { useMemo } from "react";
import {
  type CandidateReason,
  findCandidates,
  findDuplicates,
  NEARLY_EMPTY_MAX_KB,
  ONE_SHOT_MIN_AGE_DAYS,
  STALE_AFTER_DAYS,
} from "@/lib/cleanup";
import type { Repo } from "@/lib/repo";
import { RepoTable } from "./repo-table";

const REASONS: Record<CandidateReason, { title: string; hint: string }> = {
  empty: {
    title: "Leer",
    hint: "Ohne jeden Inhalt – nie etwas hochgeladen.",
  },
  nearlyEmpty: {
    title: "Fast leer",
    hint: `Höchstens ${NEARLY_EMPTY_MAX_KB} KB und kein Code erkannt – meist nur eine README oder Lizenz.`,
  },
  oneShot: {
    title: "Einmal hochgeladen, nie weiterbearbeitet",
    hint: `Direkt beim Anlegen befüllt und seit über ${Math.round(ONE_SHOT_MIN_AGE_DAYS / 30)} Monaten nicht mehr angefasst.`,
  },
  untouchedFork: {
    title: "Forks ohne eigene Änderungen",
    hint: "Kopien fremder Repos, in denen du nie etwas geändert hast.",
  },
  stale: {
    title: `Seit über ${Math.round(STALE_AFTER_DAYS / 365)} Jahren nicht angefasst`,
    hint: "Nicht archiviert, aber lange ohne Aktivität.",
  },
};

const ORDER: CandidateReason[] = [
  "empty",
  "nearlyEmpty",
  "oneShot",
  "untouchedFork",
  "stale",
];

export function CleanupView({
  repos,
  selected,
  onToggle,
}: {
  repos: Repo[];
  selected: Set<number>;
  onToggle: (ids: number[], on: boolean) => void;
}) {
  const duplicates = useMemo(() => findDuplicates(repos), [repos]);
  const lists = useMemo(() => {
    const candidates = findCandidates(repos);
    return Object.fromEntries(
      ORDER.map((reason) => [
        reason,
        candidates.filter((c) => c.reasons.includes(reason)).map((c) => c.repo),
      ]),
    ) as Record<CandidateReason, Repo[]>;
  }, [repos]);

  const overview = [
    ...ORDER.slice(0, 2).map((r) => ({
      id: r,
      title: REASONS[r].title,
      count: lists[r].length,
    })),
    { id: "duplicates", title: "Mögliche Duplikate", count: duplicates.length },
    ...ORDER.slice(2).map((r) => ({
      id: r,
      title: REASONS[r].title,
      count: lists[r].length,
    })),
  ];

  const candidateSection = (reason: CandidateReason) => (
    <Section
      key={reason}
      id={reason}
      title={REASONS[reason].title}
      hint={REASONS[reason].hint}
      count={lists[reason].length}
      repos={lists[reason]}
      selected={selected}
      onToggle={onToggle}
    >
      {lists[reason].length === 0 ? (
        <Empty>Nichts gefunden.</Empty>
      ) : (
        <RepoTable
          repos={lists[reason]}
          selected={selected}
          onToggle={onToggle}
        />
      )}
    </Section>
  );

  return (
    <div className="flex flex-col gap-10">
      <nav
        aria-label="Kategorien"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
      >
        {overview.map((o) => (
          <a
            key={o.id}
            href={`#${o.id}`}
            className={`rounded-xl border px-3 py-2.5 transition hover:border-zinc-400 dark:hover:border-zinc-600 ${
              o.count
                ? "border-zinc-200 dark:border-zinc-800"
                : "border-dashed border-zinc-200 text-zinc-400 dark:border-zinc-800"
            }`}
          >
            <div className="text-xl font-semibold tabular-nums">{o.count}</div>
            <div className="text-xs leading-snug text-zinc-500">{o.title}</div>
          </a>
        ))}
      </nav>

      {ORDER.slice(0, 2).map(candidateSection)}

      <Section
        id="duplicates"
        title="Mögliche Duplikate"
        hint="Fast gleicher Name (auch mit Endungen wie „-old“, „-v2“ oder angehängten Zufallskennungen) oder gleiche Beschreibung. Das zuletzt aktive steht jeweils oben."
        count={duplicates.length}
      >
        {duplicates.length === 0 ? (
          <Empty>Keine Duplikate gefunden.</Empty>
        ) : (
          <div className="flex flex-col gap-4">
            {duplicates.map((g) => (
              <div key={g.id}>
                <p className="mb-1.5 text-xs text-zinc-500">
                  {g.reason === "name"
                    ? "Ähnlicher Name"
                    : "Gleiche Beschreibung"}{" "}
                  · {g.repos.length} Repos
                </p>
                <RepoTable
                  repos={g.repos}
                  selected={selected}
                  onToggle={onToggle}
                />
              </div>
            ))}
          </div>
        )}
      </Section>

      {ORDER.slice(2).map(candidateSection)}
    </div>
  );
}

function Section({
  id,
  title,
  hint,
  count,
  repos,
  selected,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  count: number;
  repos?: Repo[];
  selected?: Set<number>;
  onToggle?: (ids: number[], on: boolean) => void;
  children: React.ReactNode;
}) {
  const allSelected =
    repos && selected && repos.length > 0
      ? repos.every((r) => selected.has(r.id))
      : false;
  return (
    <section id={id} className="scroll-mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          {title}
          <span className="rounded-full bg-zinc-100 px-2 text-xs font-normal tabular-nums text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            {count}
          </span>
        </h2>
        {repos && onToggle && repos.length > 0 && (
          <button
            type="button"
            onClick={() =>
              onToggle(
                repos.map((r) => r.id),
                !allSelected,
              )
            }
            className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            {allSelected
              ? "Auswahl aufheben"
              : `Alle ${repos.length} auswählen`}
          </button>
        )}
      </div>
      {hint && <p className="mt-0.5 text-sm text-zinc-500">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-zinc-500">{children}</p>;
}
