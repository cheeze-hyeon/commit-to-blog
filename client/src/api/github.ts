import api from './client';
import type { Repo, Branch, Commit } from '../types';

export async function fetchRepos(): Promise<Repo[]> {
  const { data } = await api.get('/api/repos');
  return data;
}

export async function fetchBranches(owner: string, repo: string): Promise<Branch[]> {
  const { data } = await api.get(`/api/repos/${owner}/${repo}/branches`);
  return data;
}

export async function fetchCommits(owner: string, repo: string, branch: string): Promise<Commit[]> {
  const { data } = await api.get(`/api/repos/${owner}/${repo}/commits`, {
    params: { sha: branch },
  });
  return data;
}
