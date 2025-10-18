import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { colors } from '../styles/GlobalStyles';
import { taskAPI, authAPI } from '../services/api';
import TaskDetailModal from './TaskDetailModal';

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
  margin-bottom: 8px;
`;

const SearchQuery = styled.p`
  font-size: 14px;
  color: ${colors.text.secondary};
`;

const ResultCount = styled.p`
  font-size: 14px;
  color: ${colors.text.secondary};
  margin-top: 8px;
`;

const TaskList = styled.div`
  background-color: ${colors.white};
  border-radius: 8px;
  border: 1px solid ${colors.border};
`;

const TaskHeader = styled.div`
  display: grid;
  grid-template-columns: 40px 1fr 150px 150px 120px 120px;
  padding: 12px 16px;
  background-color: ${colors.background};
  border-bottom: 1px solid ${colors.border};
  font-size: 12px;
  font-weight: 600;
  color: ${colors.text.secondary};
  text-transform: uppercase;
`;

const TaskRow = styled.div`
  display: grid;
  grid-template-columns: 40px 1fr 150px 150px 120px 120px;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid ${colors.border};
  cursor: pointer;
  transition: background-color 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: ${colors.hover};
  }
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const TaskTitle = styled.div`
  font-size: 14px;
  color: ${colors.text.primary};
  font-weight: 500;
`;

const TaskMeta = styled.div`
  font-size: 13px;
  color: ${colors.text.secondary};
`;

const ProjectBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  background-color: ${colors.background};
  border-radius: 4px;
  font-size: 12px;
  color: ${colors.text.secondary};
`;

const EmptyState = styled.div`
  padding: 48px;
  text-align: center;
  color: ${colors.text.light};
  font-size: 14px;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 48px;
  font-size: 16px;
  color: ${colors.text.secondary};
`;

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    if (query) {
      searchTasks();
    } else {
      setLoading(false);
    }
  }, [query]);

  const searchTasks = async () => {
    try {
      const [tasksRes, usersRes] = await Promise.all([
        taskAPI.searchTasks(query),
        authAPI.getAllUsers()
      ]);
      setTasks(tasksRes.data);
      setUsers(usersRes.data);
      setLoading(false);
    } catch (error) {
      console.error('検索に失敗しました:', error);
      setLoading(false);
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  const handleModalClose = () => {
    setSelectedTask(null);
  };

  const handleUpdate = () => {
    searchTasks();
  };

  const handleComplete = async (taskId, currentStatus, e) => {
    e.stopPropagation();
    try {
      const newStatus = currentStatus === 'done' ? 'todo' : 'done';
      await taskAPI.updateTask(taskId, { status: newStatus });
      searchTasks();
    } catch (error) {
      console.error('タスクの更新に失敗しました:', error);
    }
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : '未割り当て';
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingMessage>検索中...</LoadingMessage>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>検索結果</PageTitle>
        <SearchQuery>「{query}」の検索結果</SearchQuery>
        <ResultCount>{tasks.length}件のタスクが見つかりました</ResultCount>
      </PageHeader>

      {tasks.length === 0 ? (
        <TaskList>
          <EmptyState>検索結果が見つかりませんでした</EmptyState>
        </TaskList>
      ) : (
        <TaskList>
          <TaskHeader>
            <div></div>
            <div>タスク名</div>
            <div>プロジェクト</div>
            <div>担当者</div>
            <div>期日</div>
            <div>ステータス</div>
          </TaskHeader>
          {tasks.map(task => (
            <TaskRow key={task.id} onClick={() => handleTaskClick(task)}>
              <Checkbox
                checked={task.status === 'done'}
                onChange={(e) => handleComplete(task.id, task.status, e)}
                onClick={(e) => e.stopPropagation()}
              />
              <TaskTitle style={task.status === 'done' ? { textDecoration: 'line-through', opacity: 0.6 } : {}}>
                {task.title}
              </TaskTitle>
              <TaskMeta>
                {task.project_id ? <ProjectBadge>プロジェクト</ProjectBadge> : '-'}
              </TaskMeta>
              <TaskMeta>{getUserName(task.assignee_id)}</TaskMeta>
              <TaskMeta>{task.due_date || '期限なし'}</TaskMeta>
              <TaskMeta>
                {task.status === 'todo' ? '未着手' : 
                 task.status === 'inProgress' ? '進行中' : 
                 task.status === 'review' ? 'レビュー' : '完了'}
              </TaskMeta>
            </TaskRow>
          ))}
        </TaskList>
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={handleModalClose}
          onUpdate={handleUpdate}
          onDelete={handleUpdate}
        />
      )}
    </PageContainer>
  );
};

export default SearchResultsPage;
