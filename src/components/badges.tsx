import type { Repo } from "@/lib/repo";

function Badge({
  children,
  tone = "zinc",
}: {
  children: React.ReactNode;
  tone?: "zinc" | "amber" | "sky" | "violet";
}) {
  const tones = {
    zinc: "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400",
    amber:
      "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400",
    sky: "border-sky-300 text-sky-700 dark:border-sky-800 dark:text-sky-400",
    violet:
      "border-violet-300 text-violet-700 dark:border-violet-800 dark:text-violet-400",
  };
  return (
    <span
      className={`rounded-full border px-1.5 py-px text-[11px] leading-4 ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function RepoBadges({ repo }: { repo: Repo }) {
  return (
    <>
      <Badge>{repo.private ? "Privat" : "Öffentlich"}</Badge>
      {repo.fork && <Badge tone="sky">Fork</Badge>}
      {repo.archived && <Badge tone="amber">Archiviert</Badge>}
      {repo.isTemplate && <Badge>Vorlage</Badge>}
      {repo.isOrg && <Badge tone="violet">{repo.owner}</Badge>}
    </>
  );
}
