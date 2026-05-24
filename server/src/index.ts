// dotenv must load before any other module that reads process.env at import time
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import express from 'express';
import session from 'express-session';
import cors from 'cors';
import authRouter from './routes/auth';
import githubRouter from './routes/github';
import generateRouter from './routes/generate';
import postsRouter from './routes/posts';

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use('/auth', authRouter);
app.use('/api', githubRouter);
app.use('/api/generate', generateRouter);
app.use('/api/posts', postsRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
