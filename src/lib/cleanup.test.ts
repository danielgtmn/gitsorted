import { describe, expect, it } from "vitest";
import {
  findCandidates,
  findDuplicates,
  levenshtein,
  nameKey,
} from "./cleanup";
import type { Repo } from "./repo";

let nextId = 1;
function repo(name: string, extra: Partial<Repo> = {}): Repo {
  return {
    id: nextId++,
    name,
    fullName: `me/${name}`,
    owner: "me",
    description: null,
    url: `https://github.com/me/${name}`,
    private: false,
    fork: false,
    archived: false,
    isTemplate: false,
    language: null,
    stars: 0,
    forks: 0,
    sizeKb: 100,
    defaultBranch: "main",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
    pushedAt: "2026-10-01T00:00:00Z",
    isOrg: false,
    ...extra,
  };
}

describe("nameKey", () => {
  it("strips separators and copy markers", () => {
    expect(nameKey("My-Portfolio_v2")).toBe("portfolio");
    expect(nameKey("portfolio-old")).toBe("portfolio");
    expect(nameKey("portfolio copy 2")).toBe("portfolio");
    expect(nameKey("api")).toBe("api");
  });

  it("strips generated IDs and timestamps", () => {
    expect(nameKey("app-03912df4c6de")).toBe("app");
    expect(nameKey("app-1d6b447d4cec")).toBe("app");
    expect(nameKey("MoreToDiscover-2026-04-27_12-43-23")).toBe(
      "moretodiscover",
    );
    expect(nameKey("deadbeef")).toBe("deadbeef");
  });
});

describe("levenshtein", () => {
  it("counts edits", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("abc", "abc")).toBe(0);
  });
});

describe("findDuplicates", () => {
  it("groups similar names and leaves unrelated repos alone", () => {
    const repos = [
      repo("portfolio"),
      repo("portfolio-old"),
      repo("Portfolio_v2"),
      repo("dotfiles"),
      repo("weather-app"),
      repo("wheather-app"),
    ];
    const groups = findDuplicates(repos);
    const names = groups.map((g) => g.repos.map((r) => r.name).sort());
    expect(names).toContainEqual([
      "Portfolio_v2",
      "portfolio",
      "portfolio-old",
    ]);
    expect(names).toContainEqual(["weather-app", "wheather-app"]);
    expect(names.flat()).not.toContain("dotfiles");
  });

  it("groups repos that only differ by a generated suffix", () => {
    const groups = findDuplicates([
      repo("app-03912df4c6de"),
      repo("app-1d6b447d4cec"),
      repo("app-edecd33f627f"),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].repos).toHaveLength(3);
  });

  it("groups identical descriptions", () => {
    const d = "A tiny tool to sort my GitHub repositories";
    const groups = findDuplicates([
      repo("alpha", { description: d }),
      repo("beta", { description: d }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].reason).toBe("description");
  });
});

describe("findCandidates", () => {
  const now = Date.parse("2026-11-08T00:00:00Z");

  it("flags empty, untouched forks and stale repos", () => {
    const result = findCandidates(
      [
        repo("empty", { sizeKb: 0 }),
        repo("fork", {
          fork: true,
          createdAt: "2026-01-01T00:00:00Z",
          pushedAt: "2026-01-01T00:00:10Z",
        }),
        repo("ancient", { pushedAt: "2020-01-01T00:00:00Z" }),
        repo("ancient-archived", {
          pushedAt: "2020-01-01T00:00:00Z",
          archived: true,
        }),
        repo("active"),
        repo("readme-only", { sizeKb: 2, language: null }),
        repo("small-code", { sizeKb: 2, language: "Go" }),
        repo("one-shot", {
          language: "TypeScript",
          createdAt: "2026-01-01T00:00:00Z",
          pushedAt: "2026-01-01T00:03:00Z",
        }),
        repo("one-shot-recent", {
          language: "TypeScript",
          createdAt: "2026-10-01T00:00:00Z",
          pushedAt: "2026-10-01T00:03:00Z",
        }),
      ],
      now,
    );
    const byName = Object.fromEntries(
      result.map((c) => [c.repo.name, c.reasons]),
    );
    expect(byName.empty).toEqual(["empty"]);
    expect(byName.fork).toEqual(["untouchedFork"]);
    expect(byName.ancient).toEqual(["stale"]);
    expect(byName["ancient-archived"]).toBeUndefined();
    expect(byName.active).toBeUndefined();
    expect(byName["readme-only"]).toEqual(["nearlyEmpty"]);
    expect(byName["small-code"]).toBeUndefined();
    expect(byName["one-shot"]).toEqual(["oneShot"]);
    expect(byName["one-shot-recent"]).toBeUndefined();
  });
});
