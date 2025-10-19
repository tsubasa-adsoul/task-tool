import io from 'socket.io-client';

// 本番環境のURLを使用
const SOCKET_URL = 'https://asana-backend-7vdy.onrender.com';
const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10
});

socket.on('connect', () => {
  console.log('WebSocket接続確立');
});

socket.on('disconnect', () => {
  console.log('WebSocket接続切断');
});

socket.on('connect_error', (error) => {
  console.error('接続エラー:', error);
});

// タスク更新のイベントリスナー
const taskListeners = [];
const projectListeners = [];
const commentListeners = [];

// タスク更新のリスナーを追加
export const addTaskListener = (callback) => {
  const listener = (data) => {
    callback(data);
  };
  
  socket.on('task_update', listener);
  taskListeners.push(listener);
  
  return () => {
    socket.off('task_update', listener);
    const index = taskListeners.indexOf(listener);
    if (index !== -1) {
      taskListeners.splice(index, 1);
    }
  };
};

// プロジェクト更新のリスナーを追加
export const addProjectListener = (callback) => {
  const listener = (data) => {
    callback(data);
  };
  
  socket.on('project_update', listener);
  projectListeners.push(listener);
  
  return () => {
    socket.off('project_update', listener);
    const index = projectListeners.indexOf(listener);
    if (index !== -1) {
      projectListeners.splice(index, 1);
    }
  };
};

// コメント更新のリスナーを追加
export const addCommentListener = (callback) => {
  const listener = (data) => {
    callback(data);
  };
  
  socket.on('comment_update', listener);
  commentListeners.push(listener);
  
  return () => {
    socket.off('comment_update', listener);
    const index = commentListeners.indexOf(listener);
    if (index !== -1) {
      commentListeners.splice(index, 1);
    }
  };
};

// すべてのリスナーをクリーンアップ
export const cleanup = () => {
  taskListeners.forEach(listener => {
    socket.off('task_update', listener);
  });
  projectListeners.forEach(listener => {
    socket.off('project_update', listener);
  });
  commentListeners.forEach(listener => {
    socket.off('comment_update', listener);
  });
  
  taskListeners.length = 0;
  projectListeners.length = 0;
  commentListeners.length = 0;
};

export default socket;
