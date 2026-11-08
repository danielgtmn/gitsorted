import type { Repo } from "./repo";

const DAY = 24 * 60 * 60 * 1000;
export const STALE_AFTER_DAYS = 730;
/** Up to this size, a repo without any detected code counts as nearly empty. */
export const NEARLY_EMPTY_MAX_KB = 10;
/** Pushed only once at creation and then left alone for at least this long. */
export const ONE_SHOT_MIN_AGE_DAYS = 90;
const ONE_SHOT_WINDOW_MS = 10 * 60 * 1000;

/** Suffixes/prefixes that usually mark a copy of another repo. */
const NOISE_SUFFIX =
  /(copy|kopie|old|alt|backup|bak|tmp|temp|test|new|neu|final|clone|archive|archived|fork|dup|duplicate|v\d+|\d+)$/;
const NOISE_PREFIX = /^(my|old|new|test|tmp)/;
/** Generated IDs ("app-03912df4c6de") and timestamps ("-2026-04-27_12-43-23"). */
const GENERATED_SUFFIX = [
  /[-_.]?(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{8,}$/,
  /[-_. ]?\d{4}-\d{2}-\d{2}(?:[-_T ]\d{2}[-_:]\d{2}(?:[-_:]\d{2})?)?$/,
];

/**
 * Collapses a repo name to a comparison key: lowercase, separators removed,
 * typical copy markers ("-old", "-v2", "copy", trailing digits…) and
 * generated ID/timestamp suffixes stripped.
 */
export function nameKey(name: string): string {
  let raw = name.toLowerCase();
  for (const re of GENERATED_SUFFIX) {
    const stripped = raw.replace(re, "");
    if (stripped.length >= 2) raw = stripped;
  }
  let key = raw.replace(/[^a-z0-9]/g, "");
  for (let i = 0; i < 4; i++) {
    const next = key.replace(NOISE_SUFFIX, "").replace(NOISE_PREFIX, "");
    if (next === key || next.length < 3) break;
    key = next;
  }
  return key;
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

export type DuplicateReason = "name" | "description";

export type DuplicateGroup = {
  id: string;
  reason: DuplicateReason;
  repos: Repo[];
};

/** Groups repos that look like copies of each other. */
export function findDuplicates(repos: Repo[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];

  // 1. Similar names: same key, or keys within edit distance 1 (len ≥ 6).
  const keys = repos.map((r) => nameKey(r.name));
  const parent = repos.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  for (let i = 0; i < repos.length; i++) {
    for (let j = i + 1; j < repos.length; j++) {
      const a = keys[i];
      const b = keys[j];
      const similar =
        a === b ||
        (Math.min(a.length, b.length) >= 6 &&
          Math.abs(a.length - b.length) <= 1 &&
          levenshtein(a, b) <= 1);
      if (similar) parent[find(j)] = find(i);
    }
  }
  const byRoot = new Map<number, Repo[]>();
  repos.forEach((r, i) => {
    const root = find(i);
    byRoot.set(root, [...(byRoot.get(root) ?? []), r]);
  });
  const inNameGroup = new Set<number>();
  for (const members of byRoot.values()) {
    if (members.length < 2) continue;
    for (const m of members) inNameGroup.add(m.id);
    groups.push({
      id: `name:${members.map((m) => m.id).join(",")}`,
      reason: "name",
      repos: sortByPush(members),
    });
  }

  // 2. Identical, meaningful description (not already grouped by name).
  const byDesc = new Map<string, Repo[]>();
  for (const r of repos) {
    const d = r.description?.trim().toLowerCase();
    if (!d || d.length < 12) continue;
    byDesc.set(d, [...(byDesc.get(d) ?? []), r]);
  }
  for (const members of byDesc.values()) {
    if (members.length < 2) continue;
    if (members.every((m) => inNameGroup.has(m.id))) continue;
    groups.push({
      id: `desc:${members.map((m) => m.id).join(",")}`,
      reason: "description",
      repos: sortByPush(members),
    });
  }

  return groups.sort((a, b) => b.repos.length - a.repos.length);
}

export type CandidateReason =
  | "empty"
  | "nearlyEmpty"
  | "oneShot"
  | "untouchedFork"
  | "stale";

export type Candidate = { repo: Repo; reasons: CandidateReason[] };

/** Single repos that are likely safe to remove or archive. */
export function findCandidates(
  repos: Repo[],
  now: number = Date.now(),
): Candidate[] {
  const out: Candidate[] = [];
  for (const repo of repos) {
    const reasons: CandidateReason[] = [];
    if (repo.sizeKb === 0) reasons.push("empty");
    else if (repo.sizeKb <= NEARLY_EMPTY_MAX_KB && !repo.language) {
      reasons.push("nearlyEmpty");
    } else if (!repo.fork && isOneShot(repo, now)) reasons.push("oneShot");
    if (repo.fork && isUntouchedFork(repo)) reasons.push("untouchedFork");
    if (!repo.archived && now - lastActivity(repo) > STALE_AFTER_DAYS * DAY) {
      reasons.push("stale");
    }
    if (reasons.length) out.push({ repo, reasons });
  }
  return out.sort((a, b) => lastActivity(a.repo) - lastActivity(b.repo));
}

/** A fork whose last push happened (almost) at fork time: never worked on. */
function isUntouchedFork(repo: Repo): boolean {
  if (!repo.pushedAt) return true;
  return Date.parse(repo.pushedAt) - Date.parse(repo.createdAt) < 60 * 1000;
}

/** Uploaded in one go right after creation, then never pushed to again. */
function isOneShot(repo: Repo, now: number): boolean {
  if (!repo.pushedAt) return false;
  const created = Date.parse(repo.createdAt);
  const sinceCreation = Date.parse(repo.pushedAt) - created;
  return (
    sinceCreation >= 0 &&
    sinceCreation < ONE_SHOT_WINDOW_MS &&
    now - created > ONE_SHOT_MIN_AGE_DAYS * DAY
  );
}

/** Empty, or tiny with no detected code (README/licence only). */
export function isEmptyish(repo: Repo): boolean {
  return (
    repo.sizeKb === 0 || (repo.sizeKb <= NEARLY_EMPTY_MAX_KB && !repo.language)
  );
}

export function lastActivity(repo: Repo): number {
  return Date.parse(repo.pushedAt ?? repo.updatedAt);
}

function sortByPush(list: Repo[]): Repo[] {
  return [...list].sort((a, b) => lastActivity(b) - lastActivity(a));
}
