"use server";

import { updateTag } from "next/cache";
import {
  deleteRepo,
  GitHubError,
  getRepoSizeKb,
  getViewer,
  setArchived,
} from "@/lib/github";
import { getGitHubToken } from "@/lib/session";
import { recordCleanup, STATS_TAG, statsEnabled } from "@/lib/stats";

export type RepoActionResult = {
  fullName: string;
  ok: boolean;
  error?: string;
};

const FULL_NAME = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

/** Runs `op` per repo; returns per-repo results and the sum of op's numbers. */
async function runForEach(
  fullNames: string[],
  op: (fullName: string) => Promise<number>,
): Promise<{ results: RepoActionResult[]; okCount: number; sum: number }> {
  const results: RepoActionResult[] = [];
  let okCount = 0;
  let sum = 0;
  // Sequential on purpose: GitHub's secondary rate limits punish bursts of writes.
  for (const fullName of fullNames) {
    if (!FULL_NAME.test(fullName)) {
      results.push({ fullName, ok: false, error: "Ungültiger Name" });
      continue;
    }
    try {
      sum += await op(fullName);
      okCount++;
      results.push({ fullName, ok: true });
    } catch (e) {
      results.push({ fullName, ok: false, error: describe(e) });
    }
  }
  return { results, okCount, sum };
}

async function requireToken(): Promise<string> {
  const token = await getGitHubToken();
  if (!token) throw new Error("Nicht angemeldet.");
  return token;
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

/** Adds to the anonymous totals; stats problems never fail the action. */
async function record(
  token: string,
  counts: { deleted?: number; archived?: number; freedKb?: number },
) {
  if (!statsEnabled()) return;
  try {
    const { id } = await getViewer(token);
    if (await recordCleanup({ githubUserId: id, ...counts })) {
      updateTag(STATS_TAG);
    }
  } catch (e) {
    console.error("[stats] could not record cleanup", e);
  }
}

export async function deleteRepos(fullNames: string[]) {
  const token = await requireToken();
  const { results, okCount, sum } = await runForEach(
    fullNames,
    async (name) => {
      // Size is read server-side before deleting – never trusted from the client.
      const sizeKb = statsEnabled() ? await getRepoSizeKb(token, name) : 0;
      await deleteRepo(token, name);
      return sizeKb;
    },
  );
  await record(token, { deleted: okCount, freedKb: sum });
  return results;
}

export async function archiveRepos(fullNames: string[], archived: boolean) {
  const token = await requireToken();
  const { results, okCount } = await runForEach(fullNames, async (name) => {
    await setArchived(token, name, archived);
    return 0;
  });
  if (archived) await record(token, { archived: okCount });
  return results;
}
