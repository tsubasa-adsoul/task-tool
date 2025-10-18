import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiUser, FiMail, FiLock, FiCamera, FiSave, FiTrash2 } from 'react-icons/fi';
import { colors } from '../styles/GlobalStyles';
import { authAPI } from '../services/api';
import axios from 'axios';

const PageContainer = styled.div`
  margin-left: 240px;
  margin-top: 48px;
  padding: 24px;
  min-height: calc(100vh - 48px);
  background-color: ${colors.background};
`;

const PageHeader = styled.div`
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: ${colors.text.primary};
`;

const ContentContainer = styled.div`
  max-width: 800px;
`;

const Section = styled.div`
  background-color: ${colors.white};
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${colors.text.primary};
  margin-bottom: 20px;
`;

const AvatarSection = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
`;

const AvatarContainer = styled.div`
  position: relative;
`;

const Avatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: ${colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: 700;
  color: ${colors.white};
  background-image: ${props => props.src ? `url(${props.src})` : 'none'};
  background-size: cover;
  background-position: center;
`;

const AvatarUploadButton = styled.label`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${colors.white};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  &:hover {
    opacity: 0.9;
  }

  input {
    display: none;
  }
`;

const AvatarInfo = styled.div`
  flex: 1;
`;

const AvatarTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.text.primary};
  margin-bottom: 8px;
`;

const AvatarDescription = styled.div`
  font-size: 14px;
  color: ${colors.text.secondary};
  margin-bottom: 12px;
`;

const RemoveAvatarButton = styled.button`
  padding: 8px 16px;
  background-color: transparent;
  border: 1px solid ${colors.border};
  border-radius: 6px;
  color: ${colors.text.primary};
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background-color: ${colors.hover};
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: ${colors.text.primary};
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid ${colors.border};
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${colors.primary};
  }
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background-color: ${colors.primary};
  color: ${colors.white};
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DeleteAccountButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background-color: #f44336;
  color: ${colors.white};
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 24px;

  &:hover {
    opacity: 0.9;
  }
`;

const Message = styled.div`
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  background-color: ${props => props.type === 'success' ? '#d4edda' : '#f8d7da'};
  color: ${props => props.type === 'success' ? '#155724' : '#721c24'};
  font-size: 14px;
`;

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data);
      setName(response.data.name);
      setEmail(response.data.email);
    } catch (error) {
      console.error('プロフィールの取得に失敗しました:', error);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      await axios.post('https://asana-backend-7vdy.onrender.com/api/profile/avatar', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage({ type: 'success', text: 'プロフィール画像をアップロードしました' });
      fetchProfile();
    } catch (error) {
      console.error('画像のアップロードに失敗しました:', error);
      setMessage({ type: 'error', text: '画像のアップロードに失敗しました' });
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('プロフィール画像を削除しますか?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete('https://asana-backend-7vdy.onrender.com/api/profile/avatar', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setMessage({ type: 'success', text: 'プロフィール画像を削除しました' });
      fetchProfile();
    } catch (error) {
      console.error('画像の削除に失敗しました:', error);
      setMessage({ type: 'error', text: '画像の削除に失敗しました' });
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      setMessage({ type: 'error', text: 'パスワードが一致しません' });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const updateData = {
        name,
        email
      };

      if (password) {
        updateData.password = password;
      }

      await axios.put('https://asana-backend-7vdy.onrender.com/api/profile', updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setMessage({ type: 'success', text: 'プロフィールを更新しました' });
      setPassword('');
      setConfirmPassword('');
      fetchProfile();
    } catch (error) {
      console.error('プロフィールの更新に失敗しました:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'プロフィールの更新に失敗しました' });
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('アカウントを本当に削除しますか？この操作は取り消せません。')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://asana-backend-7vdy.onrender.com/api/users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // ログアウト処理
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (error) {
      console.error('アカウント削除に失敗しました:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'アカウント削除に失敗しました' });
    }
  };

  if (!user) {
    return (
      <PageContainer>
        <PageHeader>
          <PageTitle>読み込み中...</PageTitle>
        </PageHeader>
      </PageContainer>
    );
  }

  const avatarUrl = user.avatar ? `https://asana-backend-7vdy.onrender.com/api/avatars/${user.avatar}` : null;
  const initials = user.name.charAt(0).toUpperCase();

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>プロフィール設定</PageTitle>
      </PageHeader>

      <ContentContainer>
        {message && (
          <Message type={message.type}>{message.text}</Message>
        )}

        <Section>
          <SectionTitle>プロフィール画像</SectionTitle>
          <AvatarSection>
            <AvatarContainer>
              <Avatar src={avatarUrl}>
                {!avatarUrl && initials}
              </Avatar>
              <AvatarUploadButton>
                <FiCamera size={20} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
              </AvatarUploadButton>
            </AvatarContainer>
            <AvatarInfo>
              <AvatarTitle>プロフィール画像を変更</AvatarTitle>
              <AvatarDescription>
                JPG、PNG、GIF形式の画像をアップロードできます。最大5MBまで。
              </AvatarDescription>
              {user.avatar && (
                <RemoveAvatarButton onClick={handleRemoveAvatar}>
                  画像を削除
                </RemoveAvatarButton>
              )}
            </AvatarInfo>
          </AvatarSection>
        </Section>

        <Section>
          <SectionTitle>基本情報</SectionTitle>
          <form onSubmit={handleUpdateProfile}>
            <FormGroup>
              <Label>
                <FiUser size={16} />
                名前
              </Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>
                <FiMail size={16} />
                メールアドレス
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>
                <FiLock size={16} />
                新しいパスワード
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="変更する場合のみ入力"
              />
            </FormGroup>

            <FormGroup>
              <Label>
                <FiLock size={16} />
                パスワード(確認)
              </Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="変更する場合のみ入力"
              />
            </FormGroup>

            <SaveButton type="submit" disabled={loading}>
              <FiSave size={18} />
              {loading ? '保存中...' : '変更を保存'}
            </SaveButton>

            <DeleteAccountButton onClick={handleDeleteAccount}>
              <FiTrash2 size={18} />
              アカウントを削除
            </DeleteAccountButton>
          </form>
        </Section>
      </ContentContainer>
    </PageContainer>
  );
};

export default ProfilePage;
