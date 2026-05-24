import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RichEditor from '../components/RichEditor';
import { fetchPost, updatePost } from '../api/posts';
import type { PostStatus } from '../types';
import styles from './EditorPage.module.css';

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<PostStatus>('draft');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    fetchPost(id)
      .then((post) => {
        setTitle(post.title);
        setContent(post.content);
        setStatus(post.status);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSave = async (newStatus: PostStatus) => {
    if (!id) return;
    setIsSaving(true);
    try {
      const updated = await updatePost(id, { title, content, status: newStatus });
      setStatus(updated.status);
      alert(newStatus === 'published' ? '발행 완료!' : '임시저장 완료!');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <p className={styles.loading}>불러오는 중...</p>;

  if (!id) {
    navigate('/posts');
    return null;
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.statusBadge}>
          <span className={styles.label}>상태</span>
          <span className={`${styles.badge} ${styles[status]}`}>
            {status === 'published' ? '발행됨' : '임시저장'}
          </span>
        </div>
        <div className={styles.actions}>
          <button className={styles.draftBtn} onClick={() => handleSave('draft')} disabled={isSaving}>
            임시저장
          </button>
          <button
            className={styles.publishBtn}
            onClick={() => handleSave('published')}
            disabled={isSaving}
          >
            {isSaving ? '저장 중...' : '발행하기'}
          </button>
        </div>
      </div>

      <input
        className={styles.titleInput}
        type="text"
        placeholder="포스트 제목을 입력하세요"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <RichEditor content={content} onChange={setContent} />
    </div>
  );
}
