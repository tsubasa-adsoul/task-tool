import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiX, FiBell, FiCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { colors } from '../styles/GlobalStyles';
import { notificationAPI } from '../services/api';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: ${colors.white};
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid ${colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background-color: ${colors.white};
  z-index: 1;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: ${colors.text.primary};
`;

const MarkAllButton = styled.button`
  padding: 6px 12px;
  background-color: ${colors.background};
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: ${colors.text.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background-color: ${colors.hover};
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: ${colors.text.secondary};
  border-radius: 4px;
  
  &:hover {
    background-color: ${colors.hover};
  }
`;

const NotificationList = styled.div`
  padding: 8px 0;
`;

const NotificationItem = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid ${colors.border};
  cursor: pointer;
  background-color: ${props => props.isRead ? colors.white : '#f0f7ff'};
  transition: background-color 0.2s;

  &:hover {
    background-color: ${colors.hover};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const NotificationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const NotificationType = styled.div`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  background-color: ${props => {
    if (props.type === 'due_soon') return '#fff3cd';
    if (props.type === 'assigned') return '#d1ecf1';
    return '#d4edda';
  }};
  color: ${props => {
    if (props.type === 'due_soon') return '#856404';
    if (props.type === 'assigned') return '#0c5460';
    return '#155724';
  }};
`;

const NotificationTime = styled.div`
  font-size: 12px;
  color: ${colors.text.light};
`;

const NotificationMessage = styled.div`
  font-size: 14px;
  color: ${colors.text.primary};
  line-height: 1.5;
`;

const EmptyState = styled.div`
  padding: 48px 24px;
  text-align: center;
  color: ${colors.text.light};
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.3;
`;

const EmptyText = styled.div`
  font-size: 14px;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 48px;
  font-size: 14px;
  color: ${colors.text.secondary};
`;

const NotificationModal = ({ onClose }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications();
      setNotifications(response.data);
      setLoading(false);
    } catch (error) {
      console.error('通知の取得に失敗しました:', error);
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.is_read) {
        await notificationAPI.markAsRead(notification.id);
      }
      
      if (notification.task_id) {
        // タスク詳細に遷移する処理は後で実装
        onClose();
      }
    } catch (error) {
      console.error('通知の既読処理に失敗しました:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error('一括既読処理に失敗しました:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'Z');
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    return date.toLocaleDateString('ja-JP');
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'due_soon':
        return '期限';
      case 'assigned':
        return '割り当て';
      case 'comment':
        return 'コメント';
      default:
        return '通知';
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent>
        <ModalHeader>
          <HeaderLeft>
            <ModalTitle>通知</ModalTitle>
            {unreadCount > 0 && (
              <MarkAllButton onClick={handleMarkAllAsRead}>
                <FiCheck size={14} />
                すべて既読
              </MarkAllButton>
            )}
          </HeaderLeft>
          <CloseButton onClick={onClose}>
            <FiX size={24} />
          </CloseButton>
        </ModalHeader>

        {loading ? (
          <LoadingMessage>読み込み中...</LoadingMessage>
        ) : notifications.length === 0 ? (
          <EmptyState>
            <EmptyIcon>
              <FiBell />
            </EmptyIcon>
            <EmptyText>通知はありません</EmptyText>
          </EmptyState>
        ) : (
          <NotificationList>
            {notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                isRead={notification.is_read}
                onClick={() => handleNotificationClick(notification)}
              >
                <NotificationHeader>
                  <NotificationType type={notification.type}>
                    {getTypeLabel(notification.type)}
                  </NotificationType>
                  <NotificationTime>
                    {formatDate(notification.created_at)}
                  </NotificationTime>
                </NotificationHeader>
                <NotificationMessage>{notification.message}</NotificationMessage>
              </NotificationItem>
            ))}
          </NotificationList>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default NotificationModal;
