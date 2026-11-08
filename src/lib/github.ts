import "server-only";
import type { Repo } from "./repo";

const API = "https://api.github.com";

type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string; type: string };
  description: string | null;
  html_url: string;
  private: boolean;
  fork: boolean;
  archived: boolean;
  is_template?: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  size: number;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
};

export class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function gh(token: string, path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {}
    throw new GitHubError(message, res.status);
  }
  return res;
}

export async function getViewerLogin(token: string): Promise<string> {
  const res = await gh(token, "/user");
  const user = (await res.json()) as { login: string };
  return user.login;
}

/** All repos the user owns or administers via an organisation. */
export async function listRepos(token: string): Promise<Repo[]> {
  const login = await getViewerLogin(token);
  const repos: Repo[] = [];
  for (let page = 1; page <= 50; page++) {
    const res = await gh(
      token,
      `/user/repos?affiliation=owner,organization_member&per_page=100&page=${page}&sort=pushed`,
    );
    const batch = (await res.json()) as GitHubRepo[];
    for (const r of batch) repos.push(toRepo(r, login));
    if (batch.length < 100) break;
  }
  return repos;
}

function toRepo(r: GitHubRepo, login: string): Repo {
  return {
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    owner: r.owner.login,
    description: r.description,
    url: r.html_url,
    private: r.private,
    fork: r.fork,
    archived: r.archived,
    isTemplate: r.is_template ?? false,
    language: r.language,
    stars: r.stargazers_count,
    forks: r.forks_count,
    sizeKb: r.size,
    defaultBranch: r.default_branch,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    pushedAt: r.pushed_at,
    isOrg: r.owner.login.toLowerCase() !== login.toLowerCase(),
  };
}

export async function deleteRepo(token: string, fullName: string) {
  await gh(token, `/repos/${fullName}`, { method: "DELETE" });
}

export async function setArchived(
  token: string,
  fullName: string,
  archived: boolean,
) {
  await gh(token, `/repos/${fullName}`, {
    method: "PATCH",
    body: JSON.stringify({ archived }),
    headers: { "Content-Type": "application/json" },
  });
}
