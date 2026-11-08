import { formatSize } from "@/lib/format";
import { getStats } from "@/lib/stats";

const numberFmt = new Intl.NumberFormat("de-DE");

/** Anonymous totals for the landing page; renders nothing until there is data. */
export async function PublicStats() {
  const stats = await getStats();
  if (!stats || stats.reposDeleted + stats.reposArchived === 0) return null;

  const items = [
    { value: numberFmt.format(stats.reposDeleted), label: "Repos gelöscht" },
    {
      value: stats.freedKb ? formatSize(stats.freedKb) : "0 KB",
      label: "Speicher freigegeben",
    },
    { value: numberFmt.format(stats.reposArchived), label: "Repos archiviert" },
    { value: numberFmt.format(stats.accounts), label: "Accounts aufgeräumt" },
  ];

  return (
    <section aria-label="Bisher mit gitsorted aufgeräumt">
      <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
        Bisher mit gitsorted aufgeräumt
      </h2>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col-reverse rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
          >
            <dt className="text-xs text-zinc-500">{item.label}</dt>
            <dd className="text-2xl font-semibold tabular-nums">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
