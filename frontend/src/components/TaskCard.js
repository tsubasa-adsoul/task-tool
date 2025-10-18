import React, { useState } from 'react';
import styled from 'styled-components';
import { Draggable } from 'react-beautiful-dnd';
import { FiCalendar, FiMessageSquare, FiPaperclip } from 'react-icons/fi';
import { colors } from '../styles/GlobalStyles';
import TaskDetailModal from './TaskDetailModal';

const CardContainer = styled.div`
  background-color: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
`;

const TaskTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${colors.text.primary};
  margin-bottom: 8px;
  line-height: 1.4;
`;

const TaskMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: ${colors.text.secondary};
`;

const DueDate = styled(MetaItem)`
  ${props => props.overdue && `
    color: ${colors.primary};
    font-weight: 600;
  `}
`;

const Priority = styled.span`
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
  
  ${props => {
    switch(props.level) {
      case 'high':
        return `
          background-color: #fee;
          color: ${colors.primary};
        `;
      case 'medium':
        return `
          background-color: #fff4e5;
          color: ${colors.status.inProgress};
        `;
      default:
        return `
          background-color: ${colors.background};
          color: ${colors.text.secondary};
        `;
    }
  }}
`;

const TaskCard = ({ task, index, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);

  const handleCardClick = (e) => {
    // ドラッグ中はモーダルを開かない
    if (e.defaultPrevented) return;
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleUpdate = () => {
    if (onUpdate) {
      onUpdate();
    }
  };

  const handleDelete = () => {
    if (onUpdate) {
      onUpdate();
    }
  };

  return (
    <>
      <Draggable draggableId={String(task.id)} index={index}>
        {(provided, snapshot) => (
          <CardContainer
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={handleCardClick}
          >
            <TaskTitle>{task.title}</TaskTitle>
            <TaskMeta>
              {task.due_date && (
                <DueDate overdue={task.is_overdue}>
                  <FiCalendar size={12} />
                  <span>{task.due_date}</span>
                </DueDate>
              )}
              {task.priority && (
                <Priority level={task.priority}>
                  {task.priority}
                </Priority>
              )}
              {task.comments > 0 && (
                <MetaItem>
                  <FiMessageSquare size={12} />
                  <span>{task.comments}</span>
                </MetaItem>
              )}
              {task.attachments > 0 && (
                <MetaItem>
                  <FiPaperclip size={12} />
                  <span>{task.attachments}</span>
                </MetaItem>
              )}
            </TaskMeta>
          </CardContainer>
        )}
      </Draggable>

      {showModal && (
        <TaskDetailModal
          task={task}
          onClose={handleModalClose}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </>
  );
};

export default TaskCard;
