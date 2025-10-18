import React, { useState } from 'react';
import styled from 'styled-components';
import { FiX } from 'react-icons/fi';
import { colors } from '../styles/GlobalStyles';
import { projectAPI } from '../services/api';

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
  max-width: 500px;
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
  display: block;
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

const ColorPicker = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ColorOption = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 6px;
  cursor: pointer;
  border: 3px solid ${props => props.selected ? colors.primary : 'transparent'};
  background-color: ${props => props.color};
  transition: all 0.2s;

  &:hover {
    transform: scale(1.1);
  }
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

const COLORS = [
  { name: 'aqua', value: '#00D4FF' },
  { name: 'blue', value: '#4353FF' },
  { name: 'green', value: '#7BC86C' },
  { name: 'orange', value: '#FFA726' },
  { name: 'pink', value: '#F06292' },
  { name: 'purple', value: '#9C27B0' },
  { name: 'red', value: '#EF5350' },
  { name: 'yellow', value: '#FFEB3B' },
];

const EditProjectModal = ({ project, onClose, onProjectUpdated }) => {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description || '');
  const [color, setColor] = useState(project.color || 'aqua');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('プロジェクト名を入力してください');
      return;
    }

    setLoading(true);
    try {
      await projectAPI.updateProject(project.id, {
        title,
        description,
        color
      });
      
      onProjectUpdated();
      onClose();
    } catch (error) {
      console.error('プロジェクトの更新に失敗しました:', error);
      alert('プロジェクトの更新に失敗しました');
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
            <ModalTitle>プロジェクトを編集</ModalTitle>
            <CloseButton type="button" onClick={onClose}>
              <FiX size={24} />
            </CloseButton>
          </ModalHeader>

          <ModalBody>
            <FormGroup>
              <Label>プロジェクト名 *</Label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="プロジェクト名を入力..."
                autoFocus
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>説明</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="プロジェクトの説明を入力..."
              />
            </FormGroup>

            <FormGroup>
              <Label>カラー</Label>
              <ColorPicker>
                {COLORS.map(c => (
                  <ColorOption
                    key={c.name}
                    color={c.value}
                    selected={color === c.name}
                    onClick={() => setColor(c.name)}
                  />
                ))}
              </ColorPicker>
            </FormGroup>
          </ModalBody>

          <ModalFooter>
            <CancelButton type="button" onClick={onClose}>
              キャンセル
            </CancelButton>
            <SaveButton type="submit" disabled={loading}>
              {loading ? '更新中...' : '更新'}
            </SaveButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default EditProjectModal;
