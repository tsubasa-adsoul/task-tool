import React from 'react';
import styled from 'styled-components';
import { colors } from '../styles/GlobalStyles';

const AvatarContainer = styled.div`
  width: ${props => props.size || 32}px;
  height: ${props => props.size || 32}px;
  border-radius: 50%;
  background-color: ${colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => (props.size || 32) / 2}px;
  font-weight: 600;
  color: ${colors.white};
  background-image: ${props => props.src ? `url(${props.src})` : 'none'};
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
`;

const Avatar = ({ user, size }) => {
  if (!user) return null;

  const avatarUrl = user.avatar 
    ? `https://asana-backend-7vdy.onrender.com/api/avatars/${user.avatar}` 
    : null;
  const initials = user.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <AvatarContainer src={avatarUrl} size={size}>
      {!avatarUrl && initials}
    </AvatarContainer>
  );
};

export default Avatar;
