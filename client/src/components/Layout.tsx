import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchMe, logout, type AuthUser } from '../api/auth';
import styles from './Layout.module.css';

export default function Layout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    fetchMe().then(setUser);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className={styles.root}>
      <nav className={styles.nav}>
        <span className={styles.logo}>GitBlog</span>
        <div className={styles.links}>
          <NavLink to="/posts" className={({ isActive }) => (isActive ? styles.active : '')}>
            포스트
          </NavLink>
          <NavLink to="/create" className={({ isActive }) => (isActive ? styles.active : '')}>
            글 작성
          </NavLink>
        </div>
        {user ? (
          <div className={styles.userArea}>
            <span className={styles.userName}>{user.name}</span>
            <button className={styles.loginBtn} onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        ) : (
          <button className={styles.loginBtn} onClick={() => navigate('/login')}>
            GitHub 로그인
          </button>
        )}
      </nav>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
