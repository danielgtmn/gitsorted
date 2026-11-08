"use client";

import { useMemo } from "react";
import { lastActivity } from "@/lib/cleanup";
import type { Repo } from "@/lib/repo";

/** Bar chart: how many repos were last active in each year. Click a bar to filter. */
export function ActivityChart({
  repos,
  selectedYear,
  onSelectYear,
}: {
  repos: Repo[];
  selectedYear: number | null;
  onSelectYear: (year: number | null) => void;
}) {
  const bars = useMemo(() => {
    const counts = new Map<number, number>();
    for (const r of repos) {
      const y = new Date(lastActivity(r)).getFullYear();
      counts.set(y, (counts.get(y) ?? 0) + 1);
    }
    if (counts.size === 0) return [];
    const years = [...counts.keys()];
    const out: { year: number; count: number }[] = [];
    for (let y = Math.min(...years); y <= Math.max(...years); y++) {
      out.push({ year: y, count: counts.get(y) ?? 0 });
    }
    return out;
  }, [repos]);

  const max = Math.max(1, ...bars.map((b) => b.count));

  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-medium">Zuletzt aktiv nach Jahr</h2>
        <span className="text-xs text-zinc-500">
          Balken anklicken zum Filtern
        </span>
      </div>
      <div className="flex min-h-28 flex-1 items-end gap-1.5">
        {bars.map((b) => {
          const active = selectedYear === b.year;
          return (
            <button
              key={b.year}
              type="button"
              disabled={b.count === 0}
              onClick={() => onSelectYear(active ? null : b.year)}
              title={`${b.count} Repo(s) zuletzt ${b.year} aktiv`}
              className="group flex h-full flex-1 flex-col items-center justify-end gap-1 disabled:cursor-default"
            >
              <span className="text-[10px] tabular-nums text-zinc-500">
                {b.count || ""}
              </span>
              <span
                className={`w-full rounded-t transition ${
                  active
                    ? "bg-sky-500"
                    : selectedYear !== null
                      ? "bg-zinc-200 group-hover:bg-zinc-300 dark:bg-zinc-800"
                      : "bg-zinc-300 group-hover:bg-zinc-400 dark:bg-zinc-700 dark:group-hover:bg-zinc-600"
                }`}
                style={{
                  height: `${(b.count / max) * 80 + (b.count ? 4 : 0)}%`,
                }}
              />
              <span className="text-[10px] tabular-nums text-zinc-500">
                {String(b.year).slice(2)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
