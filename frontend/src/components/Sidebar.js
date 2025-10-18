import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiHome, FiInbox, FiCalendar, FiUsers, FiPlus, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors } from '../styles/GlobalStyles';
import { projectAPI } from '../services/api';

const SidebarContainer = styled.aside`
  width: 240px;
  background-color: ${colors.white};
  border-right: 1px solid ${colors.border};
  padding: 16px 0;
  position: fixed;
  top: 48px;
  left: 0;
  bottom: 0;
  overflow-y: auto;
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${colors.text.light};
  text-transform: uppercase;
  padding: 0 16px;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CollapseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: ${colors.text.light};
  display: flex;
  align-items: center;
  
  &:hover {
    color: ${colors.text.primary};
  }
`;

const MenuItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  cursor: pointer;
  color: ${colors.text.primary};
  font-size: 14px;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${colors.hover};
  }

  ${props => props.active && `
    background-color: ${colors.hover};
    font-weight: 600;
  `}
`;

const ProjectItem = styled(MenuItem)`
  padding-left: 16px;
  gap: 8px;
`;

const ProjectIcon = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background-color: ${props => {
    const colorMap = {
      aqua: '#00D4FF',
      blue: '#4353FF',
      green: '#7BC86C',
      orange: '#FFA726',
      pink: '#F06292',
      purple: '#9C27B0',
      red: '#EF5350',
      yellow: '#FFEB3B',
    };
    return colorMap[props.color] || colorMap.aqua;
  }};
  flex-shrink: 0;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  width: calc(100% - 32px);
  margin: 0 16px;
  background: none;
  border: 1px dashed ${colors.border};
  border-radius: 6px;
  color: ${colors.text.secondary};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${colors.hover};
    border-color: ${colors.text.secondary};
  }
`;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getProjects();
      setProjects(response.data);
      setLoading(false);
    } catch (error) {
      console.error('プロジェクトの取得に失敗しました:', error);
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    const title = prompt('プロジェクト名を入力してください');
    if (!title) return;

    try {
      await projectAPI.createProject({
        title,
        description: '',
        color: 'aqua'
      });
      fetchProjects();
    } catch (error) {
      console.error('プロジェクトの作成に失敗しました:', error);
      alert('プロジェクトの作成に失敗しました');
    }
  };

  return (
    <SidebarContainer>
      <Section>
        <MenuItem active={location.pathname === '/'} onClick={() => navigate('/')}>
          <FiHome size={18} />
          <span>ホーム</span>
        </MenuItem>
        <MenuItem active={location.pathname === '/my-tasks'} onClick={() => navigate('/my-tasks')}>
          <FiInbox size={18} />
          <span>マイタスク</span>
        </MenuItem>
        <MenuItem active={location.pathname === '/calendar'} onClick={() => navigate('/calendar')}>
          <FiCalendar size={18} />
          <span>カレンダー</span>
        </MenuItem>
        <MenuItem onClick={() => alert('チーム機能は今後実装予定です')}>
          <FiUsers size={18} />
          <span>チーム</span>
        </MenuItem>
      </Section>

      <Section>
        <SectionTitle>
          <span>プロジェクト</span>
          <CollapseButton onClick={() => setProjectsExpanded(!projectsExpanded)}>
            {projectsExpanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
          </CollapseButton>
        </SectionTitle>
        {projectsExpanded && (
          <>
            {loading ? (
              <ProjectItem>読み込み中...</ProjectItem>
            ) : (
              projects.map(project => (
                <ProjectItem
                  key={project.id}
                  active={location.pathname === `/project/${project.id}`}
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <ProjectIcon color={project.color} />
                  <span>{project.title}</span>
                </ProjectItem>
              ))
            )}
            <AddButton onClick={handleCreateProject}>
              <FiPlus size={16} />
              <span>プロジェクトを追加</span>
            </AddButton>
          </>
        )}
      </Section>
    </SidebarContainer>
  );
};

export default Sidebar;
