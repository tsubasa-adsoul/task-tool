import io from 'socket.io-client';

// 本番環境のURLを使用
const SOCKET_URL = 'https://asana-backend-7vdy.onrender.com';

const socket = io(SOCKET_URL, {
  transports: ['websocket'],
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
```

このコードは以下の変更点を含んでいます：

1. 接続URLを`https://asana-backend-7vdy.onrender.com`に設定
2. トランスポートを明示的に`['websocket']`に指定
3. 再接続設定を追加して安定性を向上
4. エラーハンドリングを追加
5. イベントリスナーの管理を改善（メモリリーク防止のためのクリーンアップ関数など）

この実装によって、バックエンドからのイベント通知を適切に受信し、リアルタイム更新が可能になります。

この変更を適用した後、Render.comのバックエンドサービス設定で「Start Command」を以下のように変更してください：
```
uvicorn app.main:socket_app --host 0.0.0.0 --port 8000
