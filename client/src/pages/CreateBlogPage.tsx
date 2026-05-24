import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RepoSelector from '../components/RepoSelector';
import CommitList from '../components/CommitList';
import { fetchRepos, fetchBranches, fetchCommits } from '../api/github';
import { createPost } from '../api/posts';
import type { Repo, Branch, Commit } from '../types';
import styles from './CreateBlogPage.module.css';

export default function CreateBlogPage() {
  const navigate = useNavigate();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedCommits, setSelectedCommits] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRepos().then(setRepos).catch(() => setError('저장소 목록을 불러오지 못했습니다.'));
  }, []);

  const handleRepoSelect = async (repo: Repo) => {
    setSelectedRepo(repo);
    setSelectedBranch('');
    setSelectedCommits([]);
    setBranches([]);
    setCommits([]);
    const [owner] = repo.fullName.split('/');
    const bs = await fetchBranches(owner, repo.name);
    setBranches(bs);
  };

  const handleBranchSelect = async (branch: string) => {
    setSelectedBranch(branch);
    setSelectedCommits([]);
    setCommits([]);
    if (!selectedRepo) return;
    const [owner] = selectedRepo.fullName.split('/');
    const cs = await fetchCommits(owner, selectedRepo.name, branch);
    setCommits(cs);
  };

  const toggleCommit = (sha: string) => {
    setSelectedCommits((prev) =>
      prev.includes(sha) ? prev.filter((s) => s !== sha) : [...prev, sha]
    );
  };

  const handleGenerate = async () => {
    if (!selectedRepo || !selectedBranch || selectedCommits.length === 0) return;
    setIsLoading(true);
    setError('');

    try {
      const [owner] = selectedRepo.fullName.split('/');
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ owner, repo: selectedRepo.name, shas: selectedCommits }),
      });

      if (!res.ok || !res.body) throw new Error('생성 실패');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let draft = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (payload === '[DONE]') break;
          try {
            const { text } = JSON.parse(payload);
            draft += text;
          } catch {
            // skip malformed
          }
        }
      }

      const post = await createPost({
        title: '',
        content: draft,
        status: 'draft',
        repoName: selectedRepo.name,
        branchName: selectedBranch,
      });

      navigate(`/editor/${post.id}`);
    } catch {
      setError('초안 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const canGenerate = selectedRepo && selectedBranch && selectedCommits.length > 0;

  return (
    <div>
      <h2 className={styles.heading}>블로그 글 작성</h2>
      <p className={styles.desc}>저장소와 커밋을 선택하면 AI가 블로그 초안을 생성합니다.</p>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.form}>
        <RepoSelector repos={repos} selected={selectedRepo} onSelect={handleRepoSelect} />

        {selectedRepo && (
          <div className={styles.field}>
            <label className={styles.label}>브랜치 선택</label>
            <select
              className={styles.select}
              value={selectedBranch}
              onChange={(e) => handleBranchSelect(e.target.value)}
            >
              <option value="" disabled>브랜치를 선택하세요</option>
              {branches.map((b) => (
                <option key={b.name} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        {selectedBranch && commits.length > 0 && (
          <CommitList commits={commits} selected={selectedCommits} onToggle={toggleCommit} />
        )}

        {selectedBranch && (
          <button
            className={styles.generateBtn}
            disabled={!canGenerate || isLoading}
            onClick={handleGenerate}
          >
            {isLoading ? '초안 생성 중...' : `AI 초안 생성 (${selectedCommits.length}개 커밋)`}
          </button>
        )}
      </div>
    </div>
  );
}
