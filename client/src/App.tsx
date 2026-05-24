import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import CreateBlogPage from './pages/CreateBlogPage';
import PostsPage from './pages/PostsPage';
import EditorPage from './pages/EditorPage';
import { fetchMe, type AuthUser } from './api/auth';

function PrivateRoutes({ user }: { user: AuthUser | null | undefined }) {
  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout />;
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  useEffect(() => {
    fetchMe().then(setUser);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/posts" replace /> : <LoginPage />} />
        <Route element={<PrivateRoutes user={user} />}>
          <Route path="/" element={<Navigate to="/posts" replace />} />
          <Route path="/posts" element={<PostsPage />} />
          <Route path="/create" element={<CreateBlogPage />} />
          <Route path="/editor/:id" element={<EditorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
