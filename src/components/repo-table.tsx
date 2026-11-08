"use client";

import { formatDate, formatRelative, formatSize } from "@/lib/format";
import type { Repo } from "@/lib/repo";
import { RepoBadges } from "./badges";

export type SortKey = "name" | "createdAt" | "pushedAt" | "sizeKb" | "stars";
export type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: "name", label: "Repository" },
  { key: "createdAt", label: "Erstellt", className: "hidden md:table-cell" },
  { key: "pushedAt", label: "Zuletzt aktiv" },
  {
    key: "sizeKb",
    label: "Größe",
    className: "hidden sm:table-cell text-right",
  },
  {
    key: "stars",
    label: "Sterne",
    className: "hidden sm:table-cell text-right",
  },
];

export function RepoTable({
  repos,
  selected,
  onToggle,
  sortKey,
  sortDir,
  onSort,
}: {
  repos: Repo[];
  selected: Set<number>;
  onToggle: (ids: number[], on: boolean) => void;
  sortKey?: SortKey;
  sortDir?: SortDir;
  onSort?: (key: SortKey) => void;
}) {
  const allSelected =
    repos.length > 0 && repos.every((r) => selected.has(r.id));

  if (repos.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
        Keine Repos gefunden.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 text-left text-xs text-zinc-500 dark:bg-zinc-900/50">
          <tr>
            <th className="w-10 px-3 py-2">
              <input
                type="checkbox"
                aria-label="Alle auswählen"
                checked={allSelected}
                onChange={(e) =>
                  onToggle(
                    repos.map((r) => r.id),
                    e.target.checked,
                  )
                }
              />
            </th>
            {COLUMNS.map((c) => (
              <th
                key={c.key}
                className={`px-3 py-2 font-medium ${c.className ?? ""}`}
              >
                {onSort ? (
                  <button
                    type="button"
                    onClick={() => onSort(c.key)}
                    className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    {c.label}
                    {sortKey === c.key && (
                      <span>{sortDir === "asc" ? "↑" : "↓"}</span>
                    )}
                  </button>
                ) : (
                  c.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {repos.map((r) => (
            <RepoRow
              key={r.id}
              repo={r}
              checked={selected.has(r.id)}
              onToggle={(on) => onToggle([r.id], on)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RepoRow({
  repo,
  checked,
  onToggle,
}: {
  repo: Repo;
  checked: boolean;
  onToggle: (on: boolean) => void;
}) {
  return (
    <tr
      className={`align-top transition ${
        checked
          ? "bg-sky-50/60 dark:bg-sky-950/20"
          : "hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
      } ${repo.archived ? "text-zinc-500" : ""}`}
    >
      <td className="px-3 py-3">
        <input
          type="checkbox"
          aria-label={`${repo.fullName} auswählen`}
          checked={checked}
          onChange={(e) => onToggle(e.target.checked)}
        />
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <a
            href={repo.url}
            target="_blank"
            rel="noreferrer"
            className="font-medium hover:underline"
          >
            {repo.isOrg ? repo.fullName : repo.name}
          </a>
          <RepoBadges repo={repo} />
        </div>
        {repo.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
            {repo.description}
          </p>
        )}
        {repo.language && (
          <p className="mt-0.5 text-xs text-zinc-400">{repo.language}</p>
        )}
      </td>
      <td className="hidden whitespace-nowrap px-3 py-3 tabular-nums md:table-cell">
        {formatDate(repo.createdAt)}
      </td>
      <td
        className="whitespace-nowrap px-3 py-3"
        title={formatDate(repo.pushedAt)}
      >
        {formatRelative(repo.pushedAt)}
      </td>
      <td className="hidden whitespace-nowrap px-3 py-3 text-right tabular-nums sm:table-cell">
        {formatSize(repo.sizeKb)}
      </td>
      <td className="hidden px-3 py-3 text-right tabular-nums sm:table-cell">
        {repo.stars}
      </td>
    </tr>
  );
}
