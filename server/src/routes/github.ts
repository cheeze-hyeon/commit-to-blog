import { Router, Request, Response } from 'express';
import axios from 'axios';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

function githubApi(token: string) {
  return axios.create({
    baseURL: 'https://api.github.com',
    headers: { Authorization: `Bearer ${token}` },
  });
}

router.get('/repos', requireAuth, async (req: Request, res: Response) => {
  const api = githubApi(req.session.accessToken!);
  const { data } = await api.get('/user/repos', {
    params: { per_page: 100, sort: 'updated', type: 'all' },
  });
  const repos = data.map((r: any) => ({
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    description: r.description,
  }));
  res.json(repos);
});

router.get(
  '/repos/:owner/:repo/branches',
  requireAuth,
  async (req: Request, res: Response) => {
    const { owner, repo } = req.params;
    const api = githubApi(req.session.accessToken!);
    const { data } = await api.get(`/repos/${owner}/${repo}/branches`, {
      params: { per_page: 100 },
    });
    res.json(data.map((b: any) => ({ name: b.name })));
  }
);

router.get(
  '/repos/:owner/:repo/commits',
  requireAuth,
  async (req: Request, res: Response) => {
    const { owner, repo } = req.params;
    const sha = req.query.sha as string | undefined;
    const api = githubApi(req.session.accessToken!);
    const { data } = await api.get(`/repos/${owner}/${repo}/commits`, {
      params: { sha, per_page: 30 },
    });
    const commits = data.map((c: any) => ({
      sha: c.sha,
      message: c.commit.message.split('\n')[0],
      author: c.commit.author.name,
      date: c.commit.author.date,
    }));
    res.json(commits);
  }
);

router.get(
  '/repos/:owner/:repo/commits/:sha',
  requireAuth,
  async (req: Request, res: Response) => {
    const { owner, repo, sha } = req.params;
    const api = githubApi(req.session.accessToken!);
    const { data } = await api.get(`/repos/${owner}/${repo}/commits/${sha}`);
    const files = data.files?.map((f: any) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch ?? '',
    }));
    res.json({
      sha: data.sha,
      message: data.commit.message,
      author: data.commit.author.name,
      date: data.commit.author.date,
      files,
    });
  }
);

export default router;
