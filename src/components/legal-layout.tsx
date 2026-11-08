import Link from "next/link";

export function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← Zurück zu gitsorted
      </Link>
      <h1 className="mt-6 mb-8 text-3xl font-semibold tracking-tight">
        {title}
      </h1>
      <div className="flex flex-col gap-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 [&_a]:underline [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-zinc-900 dark:[&_h2]:text-zinc-100 [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-2 [&_ul]:mt-2">
        {children}
      </div>
    </div>
  );
}

export function Address({ lines }: { lines: string[] }) {
  return (
    <p>
      {lines.map((line, i) => (
        <span key={line}>
          {line}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </p>
  );
}
