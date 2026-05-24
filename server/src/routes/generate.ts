import { Router, Request, Response } from 'express';
import axios from 'axios';
import OpenAI from 'openai';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function githubApi(token: string) {
  return axios.create({
    baseURL: 'https://api.github.com',
    headers: { Authorization: `Bearer ${token}` },
  });
}

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { owner, repo, shas } = req.body as {
    owner: string;
    repo: string;
    shas: string[];
  };

  if (!owner || !repo || !Array.isArray(shas) || shas.length === 0) {
    res.status(400).json({ error: 'owner, repo, shas are required' });
    return;
  }

  const api = githubApi(req.session.accessToken!);

  const commitDetails = await Promise.all(
    shas.map(async (sha) => {
      const { data } = await api.get(`/repos/${owner}/${repo}/commits/${sha}`);
      const message = data.commit.message;
      const diff = (data.files ?? [])
        .map((f: any) => `--- ${f.filename}\n${f.patch ?? ''}`)
        .join('\n\n');
      return `### 커밋: ${message}\n\n${diff}`;
    })
  );

  const diffText = commitDetails.join('\n\n---\n\n');

  const systemPrompt = `당신은 개발자의 GitHub 커밋을 분석해 기술 블로그 포스트를 작성하는 전문 작가입니다.
주어진 커밋 메시지와 코드 변경 내용을 바탕으로, 독자가 구현 내용을 이해할 수 있는 한국어 블로그 포스트를 작성하세요.
마크다운 형식으로 작성하고, 구현 배경, 핵심 변경 사항, 코드 설명, 마무리 순서로 구성하세요.`;

  const userPrompt = `다음 커밋들을 분석해 블로그 초안을 작성해주세요:\n\n${diffText}`;

  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    stream: true,
  });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  for await (const chunk of completion) {
    const text = chunk.choices[0]?.delta?.content ?? '';
    if (text) {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
  }
  res.write('data: [DONE]\n\n');
  res.end();
});

export default router;
