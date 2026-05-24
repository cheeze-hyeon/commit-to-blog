import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard';
import { fetchPosts, deletePost } from '../api/posts';
import type { Post } from '../types';
import styles from './PostsPage.module.css';

export default function PostsPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts()
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('이 포스트를 삭제할까요?')) return;
    await deletePost(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div>
      <div className={styles.header}>
        <h2 className={styles.heading}>내 포스트</h2>
        <button className={styles.createBtn} onClick={() => navigate('/create')}>
          + 새 글 작성
        </button>
      </div>

      {loading ? (
        <p className={styles.loading}>불러오는 중...</p>
      ) : posts.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📝</span>
          <span>아직 작성된 포스트가 없어요</span>
        </div>
      ) : (
        <div className={styles.grid}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
