import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { colors } from '../styles/GlobalStyles';
import { taskAPI, projectAPI, authAPI } from '../services/api';

const PageContainer = styled.div`
  margin-left: 240px;
  margin-top: 48px;
  padding: 24px;
  min-height: calc(100vh - 48px);
  background-color: ${colors.background};
`;

const PageHeader = styled.div`
  margin-bottom: 32px;
`;

const Greeting = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${colors.text.primary};
  margin-bottom: 8px;
`;

const DateText = styled.p`
  font-size: 14px;
  color: ${colors.text.secondary};
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const Card = styled.div`
  background-color: ${colors.white};
  border-radius: 8px;
  padding: 24px;
  border: 1px solid ${colors.border};
`;

const CardTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${colors.text.primary};
  margin-bottom: 16px;
`;

const StatNumber = styled.div`
  font-size: 36px;
  font-weight: 700;
  color: ${colors.primary};
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: ${colors.text.secondary};
`;

const Section = styled.div`
  margin-bottom: 32px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${colors.text.primary};
`;

const ViewAllButton = styled.button`
  background: none;
  border: none;
  color: ${colors.primary};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const List = styled.div`
  background-color: ${colors.white};
  border-radius: 8px;
  border: 1px solid ${colors.border};
`;

const ListItem = styled.div`
  padding: 16px;
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

const ItemTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${colors.text.primary};
  margin-bottom: 4px;
`;

const ItemMeta = styled.div`
  font-size: 13px;
  color: ${colors.text.secondary};
`;

const ProjectIcon = styled.span`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background-color: ${props => props.color || colors.primary};
  margin-right: 8px;
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

const HomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, tasksRes, projectsRes] = await Promise.all([
        authAPI.getCurrentUser(),
        taskAPI.getTasks(true),  // true を追加
        projectAPI.getProjects()
      ]);

      setUser(userRes.data);
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('データの取得に失敗しました:', error);
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'おはようございます';
    if (hour < 18) return 'こんにちは';
    return 'こんばんは';
  };

  const getTodayDate = () => {
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return today.toLocaleDateString('ja-JP', options);
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingMessage>読み込み中...</LoadingMessage>
      </PageContainer>
    );
  }

  const incompleteTasks = tasks.filter(t => t.status !== 'done');
  const completedTasks = tasks.filter(t => t.status === 'done');
  const recentTasks = tasks.slice(0, 5);

  return (
    <PageContainer>
      <PageHeader>
        <Greeting>{getGreeting()}、{user?.name}さん</Greeting>
        <DateText>{getTodayDate()}</DateText>
      </PageHeader>

      <DashboardGrid>
        <Card>
          <CardTitle>進行中のタスク</CardTitle>
          <StatNumber>{incompleteTasks.length}</StatNumber>
          <StatLabel>件のタスクが進行中です</StatLabel>
        </Card>

        <Card>
          <CardTitle>完了したタスク</CardTitle>
          <StatNumber>{completedTasks.length}</StatNumber>
          <StatLabel>件のタスクが完了しました</StatLabel>
        </Card>

        <Card>
          <CardTitle>プロジェクト数</CardTitle>
          <StatNumber>{projects.length}</StatNumber>
          <StatLabel>個のプロジェクトを管理中</StatLabel>
        </Card>
      </DashboardGrid>

      <Section>
        <SectionHeader>
          <SectionTitle>最近のタスク</SectionTitle>
          <ViewAllButton onClick={() => navigate('/my-tasks')}>
            すべて表示
          </ViewAllButton>
        </SectionHeader>
        {recentTasks.length === 0 ? (
          <List>
            <EmptyState>タスクがありません</EmptyState>
          </List>
        ) : (
          <List>
            {recentTasks.map(task => (
              <ListItem key={task.id} onClick={() => navigate('/my-tasks')}>
                <ItemTitle>{task.title}</ItemTitle>
                <ItemMeta>
                  {task.due_date ? `期限: ${task.due_date}` : '期限なし'} • 
                  {task.status === 'todo' ? ' 未着手' : 
                   task.status === 'inProgress' ? ' 進行中' : 
                   task.status === 'review' ? ' レビュー' : ' 完了'}
                </ItemMeta>
              </ListItem>
            ))}
          </List>
        )}
      </Section>

      <Section>
        <SectionHeader>
          <SectionTitle>プロジェクト</SectionTitle>
        </SectionHeader>
        {projects.length === 0 ? (
          <List>
            <EmptyState>プロジェクトがありません</EmptyState>
          </List>
        ) : (
          <List>
            {projects.map(project => (
              <ListItem key={project.id} onClick={() => navigate(`/project/${project.id}`)}>
                <ItemTitle>
                  <ProjectIcon color={project.color} />
                  {project.title}
                </ItemTitle>
                <ItemMeta>{project.description || '説明なし'}</ItemMeta>
              </ListItem>
            ))}
          </List>
        )}
      </Section>
    </PageContainer>
  );
};

export default HomePage;
