import api from './client';
import type { Post, PostStatus } from '../types';

export async function fetchPosts(): Promise<Post[]> {
  const { data } = await api.get('/api/posts');
  return data;
}

export async function fetchPost(id: string): Promise<Post> {
  const { data } = await api.get(`/api/posts/${id}`);
  return data;
}

export async function createPost(payload: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<Post> {
  const { data } = await api.post('/api/posts', payload);
  return data;
}

export async function updatePost(
  id: string,
  payload: { title?: string; content?: string; status?: PostStatus }
): Promise<Post> {
  const { data } = await api.put(`/api/posts/${id}`, payload);
  return data;
}

export async function deletePost(id: string): Promise<void> {
  await api.delete(`/api/posts/${id}`);
}
