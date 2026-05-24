import { Router, Request, Response } from 'express';
import axios from 'axios';

declare module 'express-session' {
  interface SessionData {
    accessToken: string;
    user: { login: string; name: string; avatarUrl: string };
  }
}

const router = Router();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';

router.get('/github', (_req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    scope: 'repo read:user',
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get('/github/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) {
    res.status(400).json({ error: 'No code provided' });
    return;
  }

  const tokenRes = await axios.post(
    'https://github.com/login/oauth/access_token',
    { client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code },
    { headers: { Accept: 'application/json' } }
  );

  const accessToken = tokenRes.data.access_token;
  if (!accessToken) {
    res.redirect(`${CLIENT_URL}/?error=auth_failed`);
    return;
  }

  const userRes = await axios.get('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  req.session.accessToken = accessToken;
  req.session.user = {
    login: userRes.data.login,
    name: userRes.data.name ?? userRes.data.login,
    avatarUrl: userRes.data.avatar_url,
  };

  res.redirect(`${CLIENT_URL}/posts`);
});

router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get('/me', (req: Request, res: Response) => {
  if (!req.session.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json(req.session.user);
});

export default router;
