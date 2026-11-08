import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: () => {}, cacheTag: () => {} }));

const { accountHash, getStats, recordCleanup, statsEnabled } = await import(
  "./stats"
);

describe("stats without MONGODB_URL", () => {
  beforeEach(() => {
    delete process.env.MONGODB_URL;
  });

  it("is disabled and never touches a database", async () => {
    expect(statsEnabled()).toBe(false);
    expect(await getStats()).toBeNull();
    expect(await recordCleanup({ githubUserId: 1, deleted: 3 })).toBe(false);
  });
});

describe("accountHash", () => {
  it("is stable, keyed and does not contain the id", () => {
    process.env.BETTER_AUTH_SECRET = "secret-a";
    const a = accountHash(12345);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).toBe(accountHash("12345"));
    expect(a).not.toContain("12345");
    process.env.BETTER_AUTH_SECRET = "secret-b";
    expect(accountHash(12345)).not.toBe(a);
  });
});
