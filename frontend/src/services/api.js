// api.js の修正版

import axios from 'axios';
// react-toastifyのインポートを削除

const API_BASE_URL = 'https://asana-backend-7vdy.onrender.com/api';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10秒タイムアウト
});

// 接続ステータスの管理
let isReconnecting = false;

// リクエストインターセプター(トークンを自動で付与)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// リトライ機能
const retryDelay = (retryNumber = 0) => {
  const delays = [1000, 2000, 3000]; // 再試行間隔（ミリ秒）
  return delays[retryNumber] || delays[delays.length - 1];
};

// 再接続メッセージを表示する関数
const showReconnectingMessage = () => {
  if (!isReconnecting) {
    isReconnecting = true;
    console.log('サーバーに接続しています...');
  }
};

// 接続回復メッセージを表示する関数
const showConnectedMessage = () => {
  if (isReconnecting) {
    console.log('接続が回復しました');
    isReconnecting = false;
  }
};

// 拡張したレスポンスインターセプター(エラーハンドリング)
api.interceptors.response.use(
  (response) => {
    // 接続が回復した場合
    if (isReconnecting) {
      showConnectedMessage();
    }
    return response;
  },
  async (error) => {
    // 認証エラーの処理
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // サーバー接続エラーまたは500エラーの処理
    const isNetworkError = !error.response || error.response.status >= 500;
    if (isNetworkError) {
      showReconnectingMessage();
      
      // リトライロジック
      const config = error.config;
      
      // リトライ回数の管理
      if (!config || !config.retry) {
        config.retry = 0;
      }
      
      // 最大3回までリトライ
      if (config.retry < 3) {
        config.retry += 1;
        
        // 遅延後にリクエストを再試行
        return new Promise((resolve) => {
          setTimeout(() => {
            console.log(`リトライ #${config.retry}...`);
            resolve(api(config));
          }, retryDelay(config.retry - 1));
        });
      }
      
      // リトライ回数上限に達したらエラーを表示
      console.error('サーバーに接続できません。後でもう一度お試しください。');
    }
    
    return Promise.reject(error);
  }
);

// 接続チェック機能
export const checkConnection = async () => {
  try {
    await api.get('/health');
    if (isReconnecting) {
      showConnectedMessage();
    }
    return true;
  } catch (error) {
    showReconnectingMessage();
    return false;
  }
};

// 定期的な接続監視を開始
export const startConnectionMonitor = () => {
  const checkInterval = 30000; // 30秒ごとにチェック
  const intervalId = setInterval(checkConnection, checkInterval);
  
  // クリーンアップ用に停止関数を返す
  return () => clearInterval(intervalId);
};

// 認証API
export const authAPI = {
  register: (userData) => api.post('/register', userData),
  login: async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const response = await axios.post(`${API_BASE_URL}/token`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response;
  },
  getCurrentUser: () => api.get('/users/me'),
  getAllUsers: () => api.get('/users'),
};

// プロジェクトAPI
export const projectAPI = {
  getProjects: () => api.get('/projects'),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (projectData) => api.post('/projects', projectData),
  updateProject: (id, projectData) => api.put(`/projects/${id}`, projectData),
  getProjectTasks: (id) => api.get(`/projects/${id}/tasks`),
  deleteProject: (id) => api.delete(`/projects/${id}`),
};

// タスクAPI
export const taskAPI = {
  getTasks: (myTasks = false) => api.get('/tasks', { params: { my_tasks: myTasks } }),
  searchTasks: (query) => api.get('/tasks/search', { params: { q: query } }),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (taskData) => api.post('/tasks', taskData),
  updateTask: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
};

// コメントAPI
export const commentAPI = {
  getComments: (taskId) => api.get(`/tasks/${taskId}/comments`),
  createComment: (taskId, content) => api.post(`/tasks/${taskId}/comments`, { content }),
  deleteComment: (taskId, commentId) => api.delete(`/tasks/${taskId}/comments/${commentId}`),
};

// 通知API
export const notificationAPI = {
  getNotifications: (unreadOnly = false) => api.get('/notifications', { params: { unread_only: unreadOnly } }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// デバッグAPI
export const debugAPI = {
  checkDatabaseStatus: () => api.get('/debug'),
};

// toast関連の初期化関数を削除

export default api;
