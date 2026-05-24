import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  const posts = await prisma.post.findMany({ orderBy: { updatedAt: 'desc' } });
  res.json(posts);
});

router.get('/:id', requireAuth, async (req, res) => {
  const id = req.params['id'] as string;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    res.status(404).json({ error: 'Post not found' });
    return;
  }
  res.json(post);
});

router.post('/', requireAuth, async (req, res) => {
  const { title, content, status, repoName, branchName } = req.body;
  const post = await prisma.post.create({
    data: { title, content, status: status ?? 'draft', repoName, branchName },
  });
  res.status(201).json(post);
});

router.put('/:id', requireAuth, async (req, res) => {
  const id = req.params['id'] as string;
  const { title, content, status } = req.body;
  const post = await prisma.post.update({
    where: { id },
    data: { title, content, status },
  });
  res.json(post);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const id = req.params['id'] as string;
  await prisma.post.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
