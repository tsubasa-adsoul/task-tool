import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiBell, FiUser, FiLogOut } from 'react-icons/fi';
import { colors } from '../styles/GlobalStyles';
import { getCurrentUser, logout } from '../services/auth';
import { notificationAPI } from '../services/api';
import NotificationModal from './NotificationModal';

const HeaderContainer = styled.header`
  height: 48px;
  background-color: ${colors.white};
  border-bottom: 1px solid ${colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Logo = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: ${colors.primary};
  cursor: pointer;
`;

const SearchBar = styled.form`
  display: flex;
  align-items: center;
  background-color: ${colors.background};
  border-radius: 6px;
  padding: 6px 12px;
  width: 300px;
  gap: 8px;

  &:hover {
    background-color: ${colors.hover};
  }

  &:focus-within {
    background-color: ${colors.white};
    box-shadow: 0 0 0 2px ${colors.primary};
  }
`;

const SearchInput = styled.input`
  border: none;
  background: transparent;
  outline: none;
  width: 100%;
  font-size: 14px;
  color: ${colors.text.primary};

  &::placeholder {
    color: ${colors.text.light};
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${colors.text.primary};
`;

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${colors.text.secondary};
  font-size: 20px;
  padding: 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &:hover {
    background-color: ${colors.hover};
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: 2px;
  right: 2px;
  background-color: ${colors.primary};
  color: ${colors.white};
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getCurrentUser();
      setUser(userData);
    };
    fetchUser();
    fetchUnreadCount();

    // 30秒ごとに未読件数を更新
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('未読件数の取得に失敗しました:', error);
    }
  };

  const handleLogout = () => {
    if (window.confirm('ログアウトしますか?')) {
      logout();
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleNotificationClick = () => {
    setShowNotificationModal(true);
  };

  const handleNotificationModalClose = () => {
    setShowNotificationModal(false);
    fetchUnreadCount();
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <>
      <HeaderContainer>
        <LeftSection>
          <Logo onClick={handleLogoClick}>ADSOUL TASK</Logo>
          <SearchBar onSubmit={handleSearch}>
            <FiSearch color={colors.text.light} />
            <SearchInput 
              placeholder="検索..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchBar>
        </LeftSection>
        <RightSection>
          {user && <UserInfo>{user.name}</UserInfo>}
          <IconButton onClick={handleNotificationClick}>
            <FiBell />
            {unreadCount > 0 && (
              <NotificationBadge>{unreadCount > 99 ? '99+' : unreadCount}</NotificationBadge>
            )}
          </IconButton>
          <IconButton onClick={handleProfileClick} title="プロフィール">
            <FiUser />
          </IconButton>
          <IconButton onClick={handleLogout} title="ログアウト">
            <FiLogOut />
          </IconButton>
        </RightSection>
      </HeaderContainer>

      {showNotificationModal && (
        <NotificationModal onClose={handleNotificationModalClose} />
      )}
    </>
  );
};

export default Header;
