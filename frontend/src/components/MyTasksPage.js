import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiFilter, FiChevronDown } from 'react-icons/fi';
import { colors } from '../styles/GlobalStyles';
import { taskAPI, authAPI } from '../services/api';
import TaskDetailModal from './TaskDetailModal';
import AddTaskModal from './AddTaskModal';
import Avatar from './Avatar';

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

const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
`;

const AddTaskButton = styled.button`
  padding: 8px 16px;
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
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-left: auto;
`;

const Select = styled.select`
  padding: 8px 12px;
  background-color: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  color: ${colors.text.primary};

  &:focus {
    outline: none;
    border-color: ${colors.primary};
  }
`;

const Section = styled.div`
  margin-bottom: 32px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 2px solid ${colors.border};
  margin-bottom: 8px;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.text.primary};
`;

const TaskCount = styled.span`
  font-size: 14px;
  color: ${colors.text.light};
`;

const TaskList = styled.div`
  background-color: ${colors.white};
  border-radius: 8px;
  border: 1px solid ${colors.border};
  min-height: 60px;
`;

const TaskRow = styled.div`
  display: grid;
  grid-template-columns: 32px 40px 1fr 150px 120px 120px 120px;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid ${colors.border};
  cursor: pointer;
  transition: background-color 0.2s;
  background-color: ${colors.white};
  transform: ${props => props.transform};
  transition: ${props => props.transition};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: ${colors.hover};
  }
`;

const DragHandle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  color: ${colors.text.light};
  
  &:active {
    cursor: grabbing;
  }

  &::before {
    content: '⋮⋮';
    font-size: 16px;
    letter-spacing: -2px;
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

const PriorityBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background-color: ${props => {
    if (props.priority === 'high') return '#fee';
    if (props.priority === 'medium') return '#fef3cd';
    return '#e7f3ff';
  }};
  color: ${props => {
    if (props.priority === 'high') return '#dc3545';
    if (props.priority === 'medium') return '#ffc107';
    return '#0d6efd';
  }};
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

const AssigneeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SortableTaskRow = ({ task, sortBy, users, onTaskClick, onComplete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const assignee = users?.find(u => u.id === task.assignee_id);

  return (
    <TaskRow
      ref={setNodeRef}
      style={style}
      onClick={() => onTaskClick(task)}
    >
      {sortBy === 'manual' ? (
        <DragHandle {...attributes} {...listeners} onClick={(e) => e.stopPropagation()} />
      ) : (
        <div></div>
      )}
      <Checkbox
        checked={task.status === 'done'}
        onChange={(e) => onComplete(task.id, task.status, e)}
        onClick={(e) => e.stopPropagation()}
      />
      <TaskTitle style={task.status === 'done' ? { textDecoration: 'line-through', opacity: 0.6, color: colors.text.light } : {}}>
        {task.title}
      </TaskTitle>
      <TaskMeta style={task.status === 'done' ? { opacity: 0.6 } : {}}>
        <AssigneeContainer>
          {assignee && <Avatar user={assignee} size={24} />}
          {assignee ? assignee.name : '未割り当て'}
        </AssigneeContainer>
      </TaskMeta>
      <TaskMeta style={task.status === 'done' ? { opacity: 0.6 } : {}}>{task.due_date || '期限なし'}</TaskMeta>
      <TaskMeta style={task.status === 'done' ? { opacity: 0.6 } : {}}>
        <PriorityBadge priority={task.priority}>
          {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
        </PriorityBadge>
      </TaskMeta>
      <TaskMeta style={task.status === 'done' ? { opacity: 0.6 } : {}}>
        {task.status === 'todo' ? '未着手' : 
         task.status === 'inProgress' ? '進行中' : 
         task.status === 'review' ? 'レビュー' : '完了'}
      </TaskMeta>
    </TaskRow>
  );
};

const MyTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('manual');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTasks();
    fetchUsers();

    const handleTaskUpdate = (event) => {
      const { type, data } = event.detail;
      console.log('タスク更新イベント受信:', type, data);

      if (type === 'task_created') {
        // 新規タスクを追加
        setTasks(prevTasks => [...prevTasks, data]);
      } else if (type === 'task_updated') {
        // 既存タスクを更新
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === data.id ? { ...task, ...data } : task
          )
        );
      } else if (type === 'task_deleted') {
        // タスクを削除
        setTasks(prevTasks =>
          prevTasks.filter(task => task.id !== data.id)
        );
      }
    };

    window.addEventListener('task_update', handleTaskUpdate);

    return () => {
      window.removeEventListener('task_update', handleTaskUpdate);
    };
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await taskAPI.getTasks(true);
      setTasks(response.data);
      setLoading(false);
    } catch (error) {
      console.error('タスクの取得に失敗しました:', error);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await authAPI.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('ユーザーの取得に失敗しました:', error);
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  const handleModalClose = () => {
    setSelectedTask(null);
  };

  const handleUpdate = () => {
    fetchTasks();
  };

  const handleComplete = async (taskId, currentStatus, e) => {
    e.stopPropagation();
    try {
      const newStatus = currentStatus === 'done' ? 'todo' : 'done';
      await taskAPI.updateTask(taskId, { status: newStatus });
      // WebSocketで更新が通知されるので、ここでは何もしない
    } catch (error) {
      console.error('タスクの更新に失敗しました:', error);
    }
  };

  const handleDragEnd = (event, section) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setTasks((items) => {
        const sectionTasks = getTasksBySection(section);
        const oldIndex = sectionTasks.findIndex(t => t.id === active.id);
        const newIndex = sectionTasks.findIndex(t => t.id === over.id);
        
        const reorderedSection = arrayMove(sectionTasks, oldIndex, newIndex);
        
        const otherTasks = items.filter(t => !sectionTasks.find(st => st.id === t.id));
        return [...otherTasks, ...reorderedSection];
      });
    }
  };

  const filterAndSortTasks = (taskList) => {
    let filtered = [...taskList];

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (sortBy === 'manual') {
      return filtered;
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date) - new Date(b.due_date);
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'title':
          return a.title.localeCompare(b.title);
        case 'created':
          return new Date(b.created_at) - new Date(a.created_at);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getTasksBySection = (section) => {
    let sectionTasks = [];
    switch (section) {
      case 'inProgress':
        sectionTasks = tasks.filter(t => t.status === 'todo' || t.status === 'inProgress' || t.status === 'review');
        break;
      case 'routine':
        sectionTasks = [];
        break;
      case 'done':
        sectionTasks = tasks.filter(t => t.status === 'done');
        break;
      default:
        sectionTasks = [];
    }
    return filterAndSortTasks(sectionTasks);
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingMessage>読み込み中...</LoadingMessage>
      </PageContainer>
    );
  }

  const inProgressTasks = getTasksBySection('inProgress');
  const routineTasks = getTasksBySection('routine');
  const doneTasks = getTasksBySection('done');

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>マイタスク</PageTitle>
      </PageHeader>

      <Toolbar>
        <AddTaskButton onClick={() => setShowAddModal(true)}>
          + タスクを追加
        </AddTaskButton>

        <FilterGroup>
          <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="all">すべての優先度</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </Select>

          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">すべてのステータス</option>
            <option value="todo">未着手</option>
            <option value="inProgress">進行中</option>
            <option value="review">レビュー</option>
            <option value="done">完了</option>
          </Select>

          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="manual">手動並び替え</option>
            <option value="created">作成日順</option>
            <option value="dueDate">期限順</option>
            <option value="priority">優先度順</option>
            <option value="title">タスク名順</option>
          </Select>
        </FilterGroup>
      </Toolbar>

      <Section>
        <SectionHeader>
          <SectionTitle>進行中</SectionTitle>
          <TaskCount>({inProgressTasks.length})</TaskCount>
        </SectionHeader>
        {inProgressTasks.length === 0 ? (
          <TaskList>
            <EmptyState>タスクがありません</EmptyState>
          </TaskList>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => handleDragEnd(event, 'inProgress')}
          >
            <SortableContext
              items={inProgressTasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <TaskList>
                {inProgressTasks.map((task) => (
                  <SortableTaskRow
                    key={task.id}
                    task={task}
                    sortBy={sortBy}
                    users={users}
                    onTaskClick={handleTaskClick}
                    onComplete={handleComplete}
                  />
                ))}
              </TaskList>
            </SortableContext>
          </DndContext>
        )}
      </Section>

      <Section>
        <SectionHeader>
          <SectionTitle>ルーティン</SectionTitle>
          <TaskCount>({routineTasks.length})</TaskCount>
        </SectionHeader>
        <TaskList>
          <EmptyState>ルーティンタスクはまだありません</EmptyState>
        </TaskList>
      </Section>

      <Section>
        <SectionHeader>
          <SectionTitle>完了</SectionTitle>
          <TaskCount>({doneTasks.length})</TaskCount>
        </SectionHeader>
        {doneTasks.length === 0 ? (
          <TaskList>
            <EmptyState>完了したタスクはありません</EmptyState>
          </TaskList>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => handleDragEnd(event, 'done')}
          >
            <SortableContext
              items={doneTasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <TaskList>
                {doneTasks.map((task) => (
                  <SortableTaskRow
                    key={task.id}
                    task={task}
                    sortBy={sortBy}
                    users={users}
                    onTaskClick={handleTaskClick}
                    onComplete={handleComplete}
                  />
                ))}
              </TaskList>
            </SortableContext>
          </DndContext>
        )}
      </Section>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={handleModalClose}
          onUpdate={handleUpdate}
          onDelete={handleUpdate}
        />
      )}

      {showAddModal && (
        <AddTaskModal
          onClose={() => setShowAddModal(false)}
          onTaskCreated={handleUpdate}
        />
      )}
    </PageContainer>
  );
};

export default MyTasksPage;
