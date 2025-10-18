import axios from 'axios';

const API_BASE_URL = 'https://asana-backend-7vdy.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// レスポンスインターセプター(エラーハンドリング)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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


export default api;
