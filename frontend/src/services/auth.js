import { authAPI } from './api';

export const login = async (email, password) => {
  try {
    const response = await authAPI.login(email, password);
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'ログインに失敗しました',
    };
  }
};

export const register = async (name, email, password) => {
  try {
    await authAPI.register({ name, email, password });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || '登録に失敗しました',
    };
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export const getCurrentUser = async () => {
  try {
    const response = await authAPI.getCurrentUser();
    return response.data;
  } catch (error) {
    return null;
  }
};
