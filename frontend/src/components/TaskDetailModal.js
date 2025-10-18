import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiX, FiCalendar, FiUser, FiAlignLeft, FiTrash2, FiMessageSquare, FiSend, FiClock } from 'react-icons/fi';
import { colors } from '../styles/GlobalStyles';
import { taskAPI, authAPI, commentAPI } from '../services/api';

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
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid ${colors.border};
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const TaskTitleInput = styled.input`
  font-size: 24px;
  font-weight: 700;
  border: none;
  outline: none;
  width: 100%;
  color: ${colors.text.primary};
  
  &:focus {
    border-bottom: 2px solid ${colors.primary};
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

const ModalBody = styled.div`
  padding: 24px;
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: ${colors.text.primary};
  margin-bottom: 12px;
`;

const DescriptionTextarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 1px solid ${colors.border};
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: ${colors.primary};
  }
  
  &::placeholder {
    color: ${colors.text.light};
  }
`;

const MetadataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
`;

const MetadataItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: ${colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid ${colors.border};
  border-radius: 6px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: ${colors.primary};
  }
`;

const TimeInputGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const HelperText = styled.div`
  font-size: 12px;
  color: ${colors.text.light};
  margin-top: 4px;
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid ${colors.border};
  border-radius: 6px;
  font-size: 14px;
  background-color: ${colors.white};
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${colors.primary};
  }
`;

const CommentsSection = styled.div`
  border-top: 1px solid ${colors.border};
  padding-top: 24px;
`;

const CommentsList = styled.div`
  margin-bottom: 16px;
  max-height: 300px;
  overflow-y: auto;
`;

const CommentItem = styled.div`
  padding: 12px;
  margin-bottom: 12px;
  background-color: ${colors.background};
  border-radius: 6px;
  position: relative;
`;

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const CommentAuthor = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${colors.text.primary};
`;

const CommentTime = styled.div`
  font-size: 12px;
  color: ${colors.text.light};
`;

const CommentContent = styled.div`
  font-size: 14px;
  color: ${colors.text.primary};
  line-height: 1.5;
  white-space: pre-wrap;
`;

const CommentDeleteButton = styled.button`
  background: none;
  border: none;
  color: ${colors.primary};
  cursor: pointer;
  padding: 4px;
  font-size: 12px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const CommentInputContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-end;
`;

const CommentInput = styled.textarea`
  flex: 1;
  padding: 12px;
  border: 1px solid ${colors.border};
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
  
  &:focus {
    outline: none;
    border-color: ${colors.primary};
  }
  
  &::placeholder {
    color: ${colors.text.light};
  }
`;

const SendButton = styled.button`
  padding: 12px 16px;
  background-color: ${colors.primary};
  color: ${colors.white};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyComments = styled.div`
  text-align: center;
  padding: 24px;
  color: ${colors.text.light};
  font-size: 14px;
`;

const ModalFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid ${colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SaveButton = styled(Button)`
  background-color: ${colors.primary};
  color: ${colors.white};
`;

const CancelButton = styled(Button)`
  background-color: ${colors.background};
  color: ${colors.text.primary};
`;

const DeleteButton = styled(Button)`
  background-color: transparent;
  color: ${colors.primary};
  
  &:hover {
    background-color: #fee;
  }
`;

const TaskDetailModal = ({ task, onClose, onUpdate, onDelete }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [dueDate, setDueDate] = useState(task.due_date || '');
  const [startTime, setStartTime] = useState(task.start_time || '');
  const [endTime, setEndTime] = useState(task.end_time || '');
  const [priority, setPriority] = useState(task.priority || 'medium');
  const [status, setStatus] = useState(task.status || 'todo');
  const [assigneeId, setAssigneeId] = useState(task.assignee_id || '');
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

useEffect(() => {
  fetchUsers();
  fetchComments();
  fetchCurrentUser();

  const handleCommentUpdate = (event) => {
    const { type, data } = event.detail;
    console.log('コメント更新イベント受信:', type, data);

    if (data.task_id === task.id) {
      if (type === 'comment_created') {
        setComments(prevComments => [data, ...prevComments]);
      } else if (type === 'comment_deleted') {
        setComments(prevComments =>
          prevComments.filter(comment => comment.id !== data.id)
        );
      }
    }
  };

  window.addEventListener('comment_update', handleCommentUpdate);

  return () => {
    window.removeEventListener('comment_update', handleCommentUpdate);
  };
}, [task.id]);


  const fetchUsers = async () => {
    try {
      const response = await authAPI.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('ユーザーの取得に失敗しました:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await commentAPI.getComments(task.id);
      setComments(response.data);
    } catch (error) {
      console.error('コメントの取得に失敗しました:', error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setCurrentUser(response.data);
    } catch (error) {
      console.error('ユーザー情報の取得に失敗しました:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await taskAPI.updateTask(task.id, {
        title,
        description,
        due_date: dueDate || null,
        start_time: startTime || null,
        end_time: endTime || null,
        priority,
        status,
        assignee_id: assigneeId ? parseInt(assigneeId) : null
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('タスクの更新に失敗しました:', error);
      alert('タスクの更新に失敗しました');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('このタスクを削除しますか?')) return;
    
    setLoading(true);
    try {
      await taskAPI.deleteTask(task.id);
      onDelete();
      onClose();
    } catch (error) {
      console.error('タスクの削除に失敗しました:', error);
      alert('タスクの削除に失敗しました');
    }
    setLoading(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      await commentAPI.createComment(task.id, newComment);
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('コメントの追加に失敗しました:', error);
      alert('コメントの追加に失敗しました');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('このコメントを削除しますか?')) return;
    
    try {
      await commentAPI.deleteComment(task.id, commentId);
      fetchComments();
    } catch (error) {
      console.error('コメントの削除に失敗しました:', error);
      alert('コメントの削除に失敗しました');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString.includes('Z') ? dateString : dateString + 'Z');
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent>
        <ModalHeader>
          <TaskTitleInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タスク名を入力..."
          />
          <CloseButton onClick={onClose}>
            <FiX size={24} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <Section>
            <SectionTitle>
              <FiAlignLeft size={16} />
              説明
            </SectionTitle>
            <DescriptionTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="タスクの詳細を入力..."
            />
          </Section>

          <Section>
            <MetadataGrid>
              <MetadataItem>
                <Label>
                  <FiUser size={12} /> 担当者
                </Label>
                <Select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                >
                  <option value="">未割り当て</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </Select>
              </MetadataItem>

              <MetadataItem>
                <Label>
                  <FiCalendar size={12} /> 期限
                </Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </MetadataItem>

              <MetadataItem style={{ gridColumn: '1 / -1' }}>
                <Label>
                  <FiClock size={12} /> 時刻 (任意)
                </Label>
                <TimeInputGroup>
                  <div>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                    <HelperText>開始時刻</HelperText>
                  </div>
                  <div>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                    <HelperText>終了時刻</HelperText>
                  </div>
                </TimeInputGroup>
              </MetadataItem>

              <MetadataItem>
                <Label>優先度</Label>
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </Select>
              </MetadataItem>

              <MetadataItem>
                <Label>ステータス</Label>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="todo">未着手</option>
                  <option value="inProgress">進行中</option>
                  <option value="review">レビュー</option>
                  <option value="done">完了</option>
                </Select>
              </MetadataItem>
            </MetadataGrid>
          </Section>

          <CommentsSection>
            <SectionTitle>
              <FiMessageSquare size={16} />
              コメント ({comments.length})
            </SectionTitle>

            {comments.length === 0 ? (
              <EmptyComments>まだコメントがありません</EmptyComments>
            ) : (
              <CommentsList>
                {comments.map(comment => (
                  <CommentItem key={comment.id}>
                    <CommentHeader>
                      <div>
                        <CommentAuthor>{comment.user.name}</CommentAuthor>
                        <CommentTime>{formatDate(comment.created_at)}</CommentTime>
                      </div>
                      {currentUser && currentUser.id === comment.user_id && (
                        <CommentDeleteButton onClick={() => handleDeleteComment(comment.id)}>
                          削除
                        </CommentDeleteButton>
                      )}
                    </CommentHeader>
                    <CommentContent>{comment.content}</CommentContent>
                  </CommentItem>
                ))}
              </CommentsList>
            )}

            <CommentInputContainer>
              <CommentInput
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="コメントを入力..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleAddComment();
                  }
                }}
              />
              <SendButton onClick={handleAddComment} disabled={!newComment.trim()}>
                <FiSend size={16} />
                送信
              </SendButton>
            </CommentInputContainer>
          </CommentsSection>
        </ModalBody>

        <ModalFooter>
          <DeleteButton onClick={handleDelete} disabled={loading}>
            <FiTrash2 size={16} style={{ marginRight: '4px' }} />
            削除
          </DeleteButton>
          <ButtonGroup>
            <CancelButton onClick={onClose}>キャンセル</CancelButton>
            <SaveButton onClick={handleSave} disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </SaveButton>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default TaskDetailModal;
