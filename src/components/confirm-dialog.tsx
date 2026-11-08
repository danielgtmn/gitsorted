"use client";

import { useEffect, useRef, useState } from "react";
import type { Repo } from "@/lib/repo";

const COPY = {
  delete: {
    title: "Repos endgültig löschen?",
    body: "Gelöschte Repos lassen sich nicht über diese App zurückholen. Code, Issues, Pull Requests und Wiki sind danach weg.",
    action: "Endgültig löschen",
  },
  archive: {
    title: "Repos archivieren?",
    body: "Archivierte Repos werden schreibgeschützt, bleiben aber erhalten und lassen sich jederzeit wiederherstellen.",
    action: "Archivieren",
  },
  unarchive: {
    title: "Archivierung aufheben?",
    body: "Die Repos werden wieder beschreibbar.",
    action: "Wiederherstellen",
  },
} as const;

const CONFIRM_WORD = "löschen";

export function ConfirmDialog({
  kind,
  repos,
  running,
  onCancel,
  onConfirm,
}: {
  kind: keyof typeof COPY;
  repos: Repo[];
  running: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [typed, setTyped] = useState("");
  const copy = COPY[kind];
  const needsWord = kind === "delete";
  const canConfirm =
    !running && (!needsWord || typed.trim().toLowerCase() === CONFIRM_WORD);

  useEffect(() => {
    ref.current?.showModal();
    inputRef.current?.focus();
  }, []);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (!running) onCancel();
      }}
      className="m-auto w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/40 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
    >
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          if (canConfirm) onConfirm();
        }}
        className="flex flex-col gap-4 p-6"
      >
        <h2 className="text-lg font-semibold">{copy.title}</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{copy.body}</p>
        <ul className="max-h-48 overflow-auto rounded-lg border border-zinc-200 p-2 font-mono text-xs dark:border-zinc-800">
          {repos.map((r) => (
            <li key={r.id} className="py-0.5">
              {r.fullName}
            </li>
          ))}
        </ul>
        {needsWord && (
          <label className="flex flex-col gap-1.5 text-sm">
            <span>
              Tippe <strong>{CONFIRM_WORD}</strong>, um {repos.length} Repo(s)
              zu löschen:
            </span>
            <input
              ref={inputRef}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 outline-none focus:border-zinc-400 dark:border-zinc-800"
            />
          </label>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={running}
            onClick={onCancel}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={!canConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
              kind === "delete"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-zinc-900 hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
            }`}
          >
            {running ? "Läuft…" : copy.action}
          </button>
        </div>
      </form>
    </dialog>
  );
}
