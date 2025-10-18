import React, { useState } from 'react';
import styled from 'styled-components';
import { Droppable } from 'react-beautiful-dnd';
import { FiPlus, FiX } from 'react-icons/fi';
import { colors } from '../styles/GlobalStyles';
import TaskCard from './TaskCard';
import { taskAPI } from '../services/api';

const ColumnContainer = styled.div`
  background-color: ${colors.background};
  border-radius: 8px;
  padding: 12px;
  min-width: 300px;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 120px);
`;

const ColumnHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 0 4px;
`;

const ColumnTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Title = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${colors.text.primary};
`;

const TaskCount = styled.span`
  font-size: 12px;
  color: ${colors.text.light};
  background-color: ${colors.white};
  padding: 2px 8px;
  border-radius: 12px;
`;

const AddTaskButton = styled.button`
  background: none;
  border: none;
  color: ${colors.text.secondary};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: ${colors.hover};
  }
`;

const TaskList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 4px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${colors.border};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${colors.text.light};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  color: ${colors.text.light};
  font-size: 13px;
  padding: 24px 12px;
`;

const AddTaskForm = styled.div`
  background-color: ${colors.white};
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
`;

const TaskInput = styled.textarea`
  width: 100%;
  border: none;
  outline: none;
  font-size: 14px;
  resize: none;
  min-height: 60px;
  font-family: inherit;

  &::placeholder {
    color: ${colors.text.light};
  }
`;

const FormButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const SaveButton = styled.button`
  padding: 6px 12px;
  background-color: ${colors.primary};
  color: ${colors.white};
  border: none;
  border-radius: 4px;
  font-size: 13px;
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

const CancelButton = styled.button`
  padding: 6px 12px;
  background: none;
  border: none;
  color: ${colors.text.secondary};
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background-color: ${colors.hover};
  }
`;

const TaskColumn = ({ column, tasks, onRefresh, projectId }) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    setLoading(true);
    try {
      await taskAPI.createTask({
        title: newTaskTitle,
        status: column.id,
        priority: 'medium',
        project_id: projectId ? parseInt(projectId) : null
      });
      
      setNewTaskTitle('');
      setIsAddingTask(false);
      onRefresh();
    } catch (error) {
      console.error('タスクの作成に失敗しました:', error);
      alert('タスクの作成に失敗しました');
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleAddTask();
    } else if (e.key === 'Escape') {
      setIsAddingTask(false);
      setNewTaskTitle('');
    }
  };

  return (
    <ColumnContainer>
      <ColumnHeader>
        <ColumnTitle>
          <Title>{column.title}</Title>
          <TaskCount>{tasks.length}</TaskCount>
        </ColumnTitle>
        <AddTaskButton onClick={() => setIsAddingTask(true)}>
          <FiPlus size={16} />
        </AddTaskButton>
      </ColumnHeader>

      {isAddingTask && (
        <AddTaskForm>
          <TaskInput
            placeholder="タスク名を入力..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <FormButtons>
            <SaveButton onClick={handleAddTask} disabled={loading}>
              {loading ? '作成中...' : '追加'}
            </SaveButton>
            <CancelButton onClick={() => {
              setIsAddingTask(false);
              setNewTaskTitle('');
            }}>
              <FiX size={16} />
            </CancelButton>
          </FormButtons>
        </AddTaskForm>
      )}

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <TaskList
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.length === 0 ? (
              <EmptyState>タスクがありません</EmptyState>
            ) : (
              tasks.map((task, index) => (
                task && <TaskCard key={task.id} task={task} index={index} onUpdate={onRefresh} />
              ))
            )}
            {provided.placeholder}
          </TaskList>
        )}
      </Droppable>
    </ColumnContainer>
  );
};

export default TaskColumn;