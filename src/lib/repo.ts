/** Trimmed-down GitHub repository, safe to pass to the client. */
export type Repo = {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  description: string | null;
  url: string;
  private: boolean;
  fork: boolean;
  archived: boolean;
  isTemplate: boolean;
  language: string | null;
  stars: number;
  forks: number;
  sizeKb: number;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string | null;
  /** Owner login differs from the signed-in user (organisation repo). */
  isOrg: boolean;
};
