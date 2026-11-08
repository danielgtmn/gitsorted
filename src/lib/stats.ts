import "server-only";
import { createHmac } from "node:crypto";
import { type Db, MongoClient } from "mongodb";
import { cacheLife, cacheTag } from "next/cache";

/**
 * Anonymous, aggregate usage stats shown on the landing page.
 *
 * Stored in MongoDB (`MONGODB_URL`). Only totals are kept – no repo names,
 * tokens or user data. Distinct accounts are counted via an HMAC of the
 * GitHub user id, keyed with BETTER_AUTH_SECRET, so the id cannot be
 * recovered. Without MONGODB_URL, stats are disabled and recording is a no-op.
 */

export const STATS_TAG = "stats";
const TOTALS_ID = "global";

export type Stats = {
  reposDeleted: number;
  reposArchived: number;
  freedKb: number;
  accounts: number;
};

type TotalsDoc = {
  _id: string;
  reposDeleted: number;
  reposArchived: number;
  freedKb: number;
};

const globalForMongo = globalThis as unknown as {
  gitsortedMongo?: Promise<MongoClient>;
};

export function statsEnabled(): boolean {
  return Boolean(process.env.MONGODB_URL);
}

async function db(): Promise<Db> {
  const url = process.env.MONGODB_URL;
  if (!url) throw new Error("MONGODB_URL is not set");
  globalForMongo.gitsortedMongo ??= new MongoClient(url, {
    serverSelectionTimeoutMS: 3000,
  })
    .connect()
    .catch((e) => {
      globalForMongo.gitsortedMongo = undefined;
      throw e;
    });
  return (await globalForMongo.gitsortedMongo).db();
}

export function accountHash(githubUserId: number | string): string {
  const key = process.env.BETTER_AUTH_SECRET ?? "";
  return createHmac("sha256", key)
    .update(`gitsorted-stats:${githubUserId}`)
    .digest("hex");
}

/** Cached for a few minutes; refreshed right after a cleanup via STATS_TAG. */
export async function getStats(): Promise<Stats | null> {
  "use cache";
  cacheTag(STATS_TAG);
  cacheLife("minutes");
  if (!statsEnabled()) return null;
  try {
    const d = await db();
    const [totals, accounts] = await Promise.all([
      d.collection<TotalsDoc>("totals").findOne({ _id: TOTALS_ID }),
      d.collection("accounts").estimatedDocumentCount(),
    ]);
    return {
      reposDeleted: totals?.reposDeleted ?? 0,
      reposArchived: totals?.reposArchived ?? 0,
      freedKb: totals?.freedKb ?? 0,
      accounts,
    };
  } catch (e) {
    console.error("[stats] read failed", e);
    return null;
  }
}

/** Adds a finished cleanup to the totals. Never throws. */
export async function recordCleanup(input: {
  githubUserId: number;
  deleted?: number;
  archived?: number;
  freedKb?: number;
}): Promise<boolean> {
  const deleted = input.deleted ?? 0;
  const archived = input.archived ?? 0;
  if (!statsEnabled() || deleted + archived === 0) return false;
  try {
    const d = await db();
    await Promise.all([
      d.collection<TotalsDoc>("totals").updateOne(
        { _id: TOTALS_ID },
        {
          $inc: {
            reposDeleted: deleted,
            reposArchived: archived,
            freedKb: input.freedKb ?? 0,
          },
        },
        { upsert: true },
      ),
      d
        .collection<{ _id: string; firstSeen: Date }>("accounts")
        .updateOne(
          { _id: accountHash(input.githubUserId) },
          { $setOnInsert: { firstSeen: new Date() } },
          { upsert: true },
        ),
    ]);
    return true;
  } catch (e) {
    console.error("[stats] write failed", e);
    return false;
  }
}
