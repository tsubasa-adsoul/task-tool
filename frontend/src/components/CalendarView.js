import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import HolidayJp from '@holiday-jp/holiday_jp';
import { colors } from '../styles/GlobalStyles';
import { taskAPI } from '../services/api';
import TaskDetailModal from './TaskDetailModal';

moment.locale('ja', {
  months: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split('_'),
  monthsShort: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split('_'),
  weekdays: '日曜日_月曜日_火曜日_水曜日_木曜日_金曜日_土曜日'.split('_'),
  weekdaysShort: '日_月_火_水_木_金_土'.split('_'),
  weekdaysMin: '日_月_火_水_木_金_土'.split('_'),
});

const localizer = momentLocalizer(moment);

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

const CalendarContainer = styled.div`
  background-color: ${colors.white};
  border-radius: 8px;
  padding: 24px;
  height: calc(100vh - 200px);

  .rbc-calendar {
    font-family: inherit;
    height: 100%;
  }

  .rbc-header {
    padding: 12px 0;
    font-weight: 600;
    color: ${colors.text.primary};
    border-bottom: 2px solid ${colors.border};

    &.rbc-header-sunday {
      color: #d32f2f;
    }

    &.rbc-header-saturday {
      color: #1976d2;
    }
  }

  .rbc-today {
    background-color: #e8f5e9;
  }

  .rbc-date-cell {
    padding: 8px;
    text-align: right;

    &.rbc-date-sunday {
      color: #d32f2f;
    }

    &.rbc-date-saturday {
      color: #1976d2;
    }

    &.rbc-date-holiday {
      color: #d32f2f;
    }
  }

  .rbc-event {
    background-color: ${colors.primary};
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 13px;
    cursor: pointer;

    &:hover {
      opacity: 0.9;
    }
  }

  .rbc-event.priority-high {
    background-color: #dc3545;
  }

  .rbc-event.priority-medium {
    background-color: #ffc107;
    color: #000;
  }

  .rbc-event.priority-low {
    background-color: #0d6efd;
  }

  .rbc-event.status-done {
    opacity: 0.5;
    text-decoration: line-through;
  }

  .rbc-toolbar {
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    button {
      padding: 8px 16px;
      border: 1px solid ${colors.border};
      background-color: ${colors.white};
      color: ${colors.text.primary};
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;

      &:hover {
        background-color: ${colors.hover};
      }

      &.rbc-active {
        background-color: ${colors.primary};
        color: ${colors.white};
        border-color: ${colors.primary};
      }
    }
  }

  .rbc-toolbar-label {
    font-size: 18px;
    font-weight: 700;
    color: ${colors.text.primary};
  }

  .rbc-month-view,
  .rbc-time-view,
  .rbc-agenda-view {
    border: 1px solid ${colors.border};
    border-radius: 8px;
    height: 100%;
  }

  .rbc-time-view {
    .rbc-allday-cell {
      min-height: 80px;
    }

    .rbc-time-header {
      border-bottom: 1px solid ${colors.border};
    }

    .rbc-time-content {
      border-top: 1px solid ${colors.border};
    }

    .rbc-timeslot-group {
      min-height: 60px;
      border-bottom: 1px solid ${colors.border};
    }

    .rbc-time-slot {
      border-top: 1px solid ${colors.border};
    }

    .rbc-current-time-indicator {
      background-color: ${colors.primary};
      height: 2px;
    }
  }

  .rbc-agenda-view {
    table {
      width: 100%;
      border-collapse: collapse;

      thead {
        background-color: ${colors.background};
      }

      th, td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid ${colors.border};
      }

      tbody tr:hover {
        background-color: ${colors.hover};
      }
    }
  }

  .rbc-day-bg {
    border-left: 1px solid ${colors.border};
  }

  .rbc-off-range-bg {
    background-color: ${colors.background};
  }

  .rbc-time-header-content {
    border-left: 1px solid ${colors.border};
  }

  .rbc-day-slot .rbc-time-slot {
    border-top: 1px solid ${colors.border};
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 48px;
  font-size: 16px;
  color: ${colors.text.secondary};
`;

const CalendarView = () => {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    // 日付セルにクラスを追加
    const updateDateCells = () => {
      const dateCells = document.querySelectorAll('.rbc-date-cell');
      dateCells.forEach(cell => {
        const dateButton = cell.querySelector('button');
        if (dateButton) {
          const dateText = dateButton.textContent;
          const dateNum = parseInt(dateText);
          
          if (!isNaN(dateNum)) {
            // 現在表示中の月を取得
            const currentMonth = date.getMonth();
            const currentYear = date.getFullYear();
            const cellDate = new Date(currentYear, currentMonth, dateNum);
            const dayOfWeek = cellDate.getDay();
            
            // 祝日判定
            const isHoliday = HolidayJp.isHoliday(cellDate);
            
            // クラスをリセット
            cell.classList.remove('rbc-date-sunday', 'rbc-date-saturday', 'rbc-date-holiday');
            
            // 祝日が最優先
            if (isHoliday) {
              cell.classList.add('rbc-date-holiday');
            } else if (dayOfWeek === 0) {
              cell.classList.add('rbc-date-sunday');
            } else if (dayOfWeek === 6) {
              cell.classList.add('rbc-date-saturday');
            }
          }
        }
      });

      // ヘッダーにクラスを追加
      const headers = document.querySelectorAll('.rbc-header');
      headers.forEach((header, index) => {
        header.classList.remove('rbc-header-sunday', 'rbc-header-saturday');
        if (index === 0) {
          header.classList.add('rbc-header-sunday');
        } else if (index === 6) {
          header.classList.add('rbc-header-saturday');
        }
      });
    };

    // 少し遅延させて実行
    const timer = setTimeout(updateDateCells, 100);
    return () => clearTimeout(timer);
  }, [date, view]);

  const fetchTasks = async () => {
    try {
      const response = await taskAPI.getTasks(true);
      const tasksData = response.data;
      
      const calendarEvents = tasksData
        .filter(task => task.due_date)
        .map(task => {
          let startDate, endDate;
          
          if (task.start_time && task.end_time) {
            startDate = new Date(`${task.due_date}T${task.start_time}`);
            endDate = new Date(`${task.due_date}T${task.end_time}`);
          } else {
            startDate = new Date(task.due_date);
            endDate = new Date(task.due_date);
          }
          
          return {
            id: task.id,
            title: task.title,
            start: startDate,
            end: endDate,
            allDay: !task.start_time,
            resource: task,
            className: `priority-${task.priority} status-${task.status}`
          };
        });

      setTasks(tasksData);
      setEvents(calendarEvents);
      setLoading(false);
    } catch (error) {
      console.error('タスクの取得に失敗しました:', error);
      setLoading(false);
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedTask(event.resource);
  };

  const handleModalClose = () => {
    setSelectedTask(null);
  };

  const handleUpdate = () => {
    fetchTasks();
  };

  const eventStyleGetter = (event) => {
    let className = '';
    const task = event.resource;

    if (task.priority === 'high') {
      className = 'priority-high';
    } else if (task.priority === 'medium') {
      className = 'priority-medium';
    } else {
      className = 'priority-low';
    }

    if (task.status === 'done') {
      className += ' status-done';
    }

    return { className };
  };

  const messages = {
    today: '今日',
    previous: '前',
    next: '次',
    month: '月',
    week: '週',
    day: '日',
    agenda: '予定',
    date: '日付',
    time: '時間',
    event: 'イベント',
    allDay: '終日',
    work_week: '平日',
    yesterday: '昨日',
    tomorrow: '明日',
    noEventsInRange: 'この期間にタスクはありません',
    showMore: (total) => `+${total} 件`
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingMessage>読み込み中...</LoadingMessage>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>カレンダー</PageTitle>
      </PageHeader>

      <CalendarContainer>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          messages={messages}
          views={['month', 'week', 'agenda']}
          view={view}
          onView={(newView) => setView(newView)}
          date={date}
          onNavigate={(newDate) => setDate(newDate)}
          popup
          step={60}
          showMultiDayTimes
        />
      </CalendarContainer>

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

export default CalendarView;
