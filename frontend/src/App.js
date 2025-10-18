import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GlobalStyles } from './styles/GlobalStyles';
import { isAuthenticated } from './services/auth';
import socket from './services/socket';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HomePage from './components/HomePage';
import MyTasksPage from './components/MyTasksPage';
import ProjectListView from './components/ProjectListView';
import SearchResultsPage from './components/SearchResultsPage';
import CalendarView from './components/CalendarView';
import ProfilePage from './components/ProfilePage';


// 認証が必要なルートを保護するコンポーネント
const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

// メインレイアウト(ヘッダー+サイドバー付き)
const MainLayout = ({ children }) => {
  return (
    <>
      <Header />
      <Sidebar />
      {children}
    </>
  );
};

function App() {
  useEffect(() => {
    // WebSocket接続が確立されているか確認
    if (isAuthenticated()) {
      // タスク更新イベントをリスン
      socket.on('task_update', (data) => {
        console.log('Task update received:', data);
        // カスタムイベントを発火して、各コンポーネントに通知
        window.dispatchEvent(new CustomEvent('task_update', { detail: data }));
      });

      // プロジェクト更新イベントをリスン
      socket.on('project_update', (data) => {
        console.log('Project update received:', data);
        window.dispatchEvent(new CustomEvent('project_update', { detail: data }));
      });

      // コメント更新イベントをリスン
      socket.on('comment_update', (data) => {
        console.log('Comment update received:', data);
        window.dispatchEvent(new CustomEvent('comment_update', { detail: data }));
      });
    }

    // クリーンアップ
    return () => {
      socket.off('task_update');
      socket.off('project_update');
      socket.off('comment_update');
    };
  }, []);

  return (
    <Router>
      <GlobalStyles />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout>
                <HomePage />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/my-tasks"
          element={
            <PrivateRoute>
              <MainLayout>
                <MyTasksPage />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/project/:projectId"
          element={
            <PrivateRoute>
              <MainLayout>
                <ProjectListView />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/search"
          element={
            <PrivateRoute>
              <MainLayout>
                <SearchResultsPage />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <PrivateRoute>
              <MainLayout>
                <CalendarView />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <MainLayout>
                <ProfilePage />
              </MainLayout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
