import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { DragDropContext } from 'react-beautiful-dnd';
import { colors } from '../styles/GlobalStyles';
import TaskColumn from './TaskColumn';
import { taskAPI, projectAPI } from '../services/api';

const BoardContainer = styled.div`
  margin-left: 240px;
  margin-top: 48px;
  padding: 24px;
  height: calc(100vh - 48px);
  overflow-x: auto;
  background-color: ${colors.background};
`;

const BoardHeader = styled.div`
  margin-bottom: 24px;
`;

const ProjectTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: ${colors.text.primary};
  margin-bottom: 8px;
`;

const ProjectDescription = styled.p`
  font-size: 14px;
  color: ${colors.text.secondary};
`;

const ColumnsContainer = styled.div`
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 16px;

  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${colors.border};
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${colors.text.light};
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 48px;
  font-size: 16px;
  color: ${colors.text.secondary};
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 48px;
  font-size: 16px;
  color: ${colors.primary};
`;

const TaskBoard = () => {
  const [columns, setColumns] = useState({
    'todo': {
      id: 'todo',
      title: 'To Do',
      taskIds: []
    },
    'inProgress': {
      id: 'inProgress',
      title: 'In Progress',
      taskIds: []
    },
    'review': {
      id: 'review',
      title: 'Review',
      taskIds: []
    },
    'done': {
      id: 'done',
      title: 'Done',
      taskIds: []
    }
  });

  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [project, setProject] = useState(null);

  useEffect(() => {
    fetchData();

    const handleTaskUpdate = (event) => {
      const { type, data } = event.detail;
      console.log('タスク更新イベント受信:', type, data);

      if (type === 'task_created') {
        // 新規タスクを追加
        setTasks(prevTasks => ({
          ...prevTasks,
          [data.id]: data
        }));
        setColumns(prevColumns => {
          const status = data.status || 'todo';
          return {
            ...prevColumns,
            [status]: {
              ...prevColumns[status],
              taskIds: [...prevColumns[status].taskIds, data.id]
            }
          };
        });
      } else if (type === 'task_updated') {
        // 既存タスクを更新
        setTasks(prevTasks => {
          const oldTask = prevTasks[data.id];
          const newTasks = {
            ...prevTasks,
            [data.id]: data
          };

          // ステータスが変わった場合、カラムも更新
          if (oldTask && oldTask.status !== data.status) {
            setColumns(prevColumns => {
              const oldStatus = oldTask.status;
              const newStatus = data.status;
              
              return {
                ...prevColumns,
                [oldStatus]: {
                  ...prevColumns[oldStatus],
                  taskIds: prevColumns[oldStatus].taskIds.filter(id => id !== data.id)
                },
                [newStatus]: {
                  ...prevColumns[newStatus],
                  taskIds: [...prevColumns[newStatus].taskIds, data.id]
                }
              };
            });
          }

          return newTasks;
        });
      } else if (type === 'task_deleted') {
        // タスクを削除
        setTasks(prevTasks => {
          const { [data.id]: removed, ...remaining } = prevTasks;
          return remaining;
        });
        setColumns(prevColumns => {
          const newColumns = { ...prevColumns };
          Object.keys(newColumns).forEach(columnId => {
            newColumns[columnId] = {
              ...newColumns[columnId],
              taskIds: newColumns[columnId].taskIds.filter(id => id !== data.id)
            };
          });
          return newColumns;
        });
      }
    };

    window.addEventListener('task_update', handleTaskUpdate);

    return () => {
      window.removeEventListener('task_update', handleTaskUpdate);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const projectsResponse = await projectAPI.getProjects();
      let currentProject = projectsResponse.data[0];
      
      if (!currentProject) {
        const newProjectResponse = await projectAPI.createProject({
          title: 'マイプロジェクト',
          description: '最初のプロジェクト',
          color: 'aqua'
        });
        currentProject = newProjectResponse.data;
      }
      
      setProject(currentProject);

      const tasksResponse = await taskAPI.getTasks();
      const fetchedTasks = tasksResponse.data;

      const newColumns = {
        'todo': { id: 'todo', title: 'To Do', taskIds: [] },
        'inProgress': { id: 'inProgress', title: 'In Progress', taskIds: [] },
        'review': { id: 'review', title: 'Review', taskIds: [] },
        'done': { id: 'done', title: 'Done', taskIds: [] }
      };

      const newTasks = {};

      fetchedTasks.forEach(task => {
        newTasks[task.id] = task;
        const status = task.status || 'todo';
        if (newColumns[status]) {
          newColumns[status].taskIds.push(task.id);
        }
      });

      setTasks(newTasks);
      setColumns(newColumns);
      setLoading(false);
    } catch (err) {
      console.error('データの取得に失敗しました:', err);
      setError('データの取得に失敗しました');
      setLoading(false);
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const startColumn = columns[source.droppableId];
    const finishColumn = columns[destination.droppableId];

    if (startColumn === finishColumn) {
      const newTaskIds = Array.from(startColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...startColumn,
        taskIds: newTaskIds
      };

      setColumns({
        ...columns,
        [newColumn.id]: newColumn
      });
    } else {
      const startTaskIds = Array.from(startColumn.taskIds);
      startTaskIds.splice(source.index, 1);
      const newStartColumn = {
        ...startColumn,
        taskIds: startTaskIds
      };

      const finishTaskIds = Array.from(finishColumn.taskIds);
      finishTaskIds.splice(destination.index, 0, draggableId);
      const newFinishColumn = {
        ...finishColumn,
        taskIds: finishTaskIds
      };

      setColumns({
        ...columns,
        [newStartColumn.id]: newStartColumn,
        [newFinishColumn.id]: newFinishColumn
      });

      try {
        await taskAPI.updateTask(parseInt(draggableId), {
          status: destination.droppableId
        });
      } catch (err) {
        console.error('タスクの更新に失敗しました:', err);
        fetchData();
      }
    }
  };

  if (loading) {
    return (
      <BoardContainer>
        <LoadingMessage>読み込み中...</LoadingMessage>
      </BoardContainer>
    );
  }

  if (error) {
    return (
      <BoardContainer>
        <ErrorMessage>{error}</ErrorMessage>
      </BoardContainer>
    );
  }

  return (
    <BoardContainer>
      <BoardHeader>
        <ProjectTitle>{project?.title || 'マイプロジェクト'}</ProjectTitle>
        <ProjectDescription>
          {project?.description || 'プロジェクトの説明'}
        </ProjectDescription>
      </BoardHeader>

      <DragDropContext onDragEnd={onDragEnd}>
        <ColumnsContainer>
          {Object.values(columns).map(column => {
            const columnTasks = column.taskIds.map(taskId => tasks[taskId]);
            return (
              <TaskColumn
                key={column.id}
                column={column}
                tasks={columnTasks}
                onRefresh={fetchData}
              />
            );
          })}
        </ColumnsContainer>
      </DragDropContext>
    </BoardContainer>
  );
};

export default TaskBoard;
3. ProjectListView.js の修正
useEffect内のイベントハンドラーを以下のように修正してください：

CopyuseEffect(() => {
  fetchData();

  const handleTaskUpdate = (event) => {
    const { type, data } = event.detail;
    console.log('タスク更新イベント受信:', type, data);

    if (type === 'task_created') {
      setTasks(prevTasks => [...prevTasks, data]);
    } else if (type === 'task_updated') {
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === data.id ? { ...task, ...data } : task
        )
      );
    } else if (type === 'task_deleted') {
      setTasks(prevTasks =>
        prevTasks.filter(task => task.id !== data.id)
      );
    }
  };

  const handleProjectUpdate = (event) => {
    const { type, data } = event.detail;
    console.log('プロジェクト更新イベント受信:', type, data);

    if (type === 'project_updated' && data.id === parseInt(projectId)) {
      setProject(data);
    } else if (type === 'project_deleted' && data.id === parseInt(projectId)) {
      navigate('/');
    }
  };

  window.addEventListener('task_update', handleTaskUpdate);
  window.addEventListener('project_update', handleProjectUpdate);

  return () => {
    window.removeEventListener('task_update', handleTaskUpdate);
    window.removeEventListener('project_update', handleProjectUpdate);
  };
}, [projectId, navigate]);
