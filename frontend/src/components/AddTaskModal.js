import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiX, FiCalendar, FiUser, FiAlignLeft, FiFolder, FiClock } from 'react-icons/fi';
import { colors } from '../styles/GlobalStyles';
import { taskAPI, authAPI, projectAPI } from '../services/api';

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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid ${colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: ${colors.text.primary};
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

const TimeInputGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 100px;
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

const Select = styled.select`
  width: 100%;
  padding: 12px;
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

const HelperText = styled.div`
  font-size: 12px;
  color: ${colors.text.light};
  margin-top: 4px;
`;

const ModalFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid ${colors.border};
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const Button = styled.button`
  padding: 10px 20px;
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

const AddTaskModal = ({ onClose, onTaskCreated, projectId = null }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [assigneeId, setAssigneeId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchProjects();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await authAPI.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('ユーザーの取得に失敗しました:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getProjects();
      setProjects(response.data);
    } catch (error) {
      console.error('プロジェクトの取得に失敗しました:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('タスク名を入力してください');
      return;
    }

    if (!selectedProjectId) {
      alert('プロジェクトを選択してください');
      return;
    }

    setLoading(true);
    try {
      await taskAPI.createTask({
        title,
        description,
        due_date: dueDate || null,
        start_time: startTime || null,
        end_time: endTime || null,
        priority,
        status,
        assignee_id: assigneeId ? parseInt(assigneeId) : null,
        project_id: parseInt(selectedProjectId)
      });
      
      onTaskCreated();
      onClose();
    } catch (error) {
      console.error('タスクの作成に失敗しました:', error);
      alert('タスクの作成に失敗しました');
    }
    setLoading(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <ModalTitle>新規タスクを作成</ModalTitle>
            <CloseButton type="button" onClick={onClose}>
              <FiX size={24} />
            </CloseButton>
          </ModalHeader>

          <ModalBody>
            <FormGroup>
              <Label>タスク名 *</Label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="タスク名を入力..."
                autoFocus
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>
                <FiAlignLeft size={16} />
                説明
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="タスクの詳細を入力..."
              />
            </FormGroup>

            <FormGroup>
              <Label>
                <FiFolder size={16} />
                プロジェクト *
              </Label>
              <Select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                required
                disabled={projectId !== null}
              >
                <option value="">プロジェクトを選択...</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>
                <FiUser size={16} />
                担当者
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
            </FormGroup>

            <FormGroup>
              <Label>
                <FiCalendar size={16} />
                期限
              </Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label>
                <FiClock size={16} />
                時刻 (任意)
              </Label>
              <TimeInputGroup>
                <div>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="開始時刻"
                  />
                  <HelperText>開始時刻</HelperText>
                </div>
                <div>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="終了時刻"
                  />
                  <HelperText>終了時刻</HelperText>
                </div>
              </TimeInputGroup>
              <HelperText>※時刻を設定しない場合は終日タスクになります</HelperText>
            </FormGroup>

            <FormGroup>
              <Label>優先度</Label>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </Select>
            </FormGroup>

            <FormGroup>
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
            </FormGroup>
          </ModalBody>

          <ModalFooter>
            <CancelButton type="button" onClick={onClose}>
              キャンセル
            </CancelButton>
            <SaveButton type="submit" disabled={loading}>
              {loading ? '作成中...' : 'タスクを作成'}
            </SaveButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default AddTaskModal;
