// WebSocket機能は一時的に無効化
const socket = {
  on: () => {},
  emit: () => {},
  off: () => {},
  connect: () => {},
  disconnect: () => {}
};

export default socket;
