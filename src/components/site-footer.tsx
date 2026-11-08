import Link from "next/link";
import { connection } from "next/server";
import { getLegalInfo } from "@/lib/legal";

export async function SiteFooter() {
  await connection();
  const legal = getLegalInfo();
  return (
    <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-6 text-xs text-zinc-500 sm:px-6">
      <a
        href="https://github.com/danielgtmn/gitsorted"
        className="hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        Quellcode
      </a>
      {legal && (
        <>
          <Link
            href="/impressum"
            className="hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Impressum
          </Link>
          <Link
            href="/datenschutz"
            className="hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Datenschutz
          </Link>
        </>
      )}
    </footer>
  );
}
