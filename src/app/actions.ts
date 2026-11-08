"use server";

import { deleteRepo, GitHubError, setArchived } from "@/lib/github";
import { getGitHubToken } from "@/lib/session";

export type RepoActionResult = {
  fullName: string;
  ok: boolean;
  error?: string;
};

const FULL_NAME = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

async function runForEach(
  fullNames: string[],
  op: (token: string, fullName: string) => Promise<void>,
): Promise<RepoActionResult[]> {
  const token = await getGitHubToken();
  if (!token) throw new Error("Nicht angemeldet.");
  const results: RepoActionResult[] = [];
  // Sequential on purpose: GitHub's secondary rate limits punish bursts of writes.
  for (const fullName of fullNames) {
    if (!FULL_NAME.test(fullName)) {
      results.push({ fullName, ok: false, error: "Ungültiger Name" });
      continue;
    }
    try {
      await op(token, fullName);
      results.push({ fullName, ok: true });
    } catch (e) {
      results.push({ fullName, ok: false, error: describe(e) });
    }
  }
  return results;
}

function describe(e: unknown): string {
  if (e instanceof GitHubError) {
    if (e.status === 403)
      return "Keine Berechtigung – du brauchst Admin-Rechte für dieses Repo.";
    if (e.status === 404) return "Repo nicht gefunden oder kein Zugriff.";
    return e.message;
  }
  return "Unbekannter Fehler";
}

export async function deleteRepos(fullNames: string[]) {
  return runForEach(fullNames, deleteRepo);
}

export async function archiveRepos(fullNames: string[], archived: boolean) {
  return runForEach(fullNames, (token, name) =>
    setArchived(token, name, archived),
  );
}
