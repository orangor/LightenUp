import React from 'react';
import { Task } from '../types';
import { 
  PRIORITY_MAP, 
  STATUS_MAP, 
  TIMEFRAME_MAP, 
  STATUS_COLORS, 
  PRIORITY_COLORS,
  TASK_ITEM_TEXT 
} from '../constants/dictionaries';
import './TaskItem.css';

interface TaskItemProps {
  task?: Task;
}

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  return (
    <div className="task-item" style={{ borderLeftColor: task ? STATUS_COLORS[task.status] : '#ddd' }}>
      <div className="task-header">
        <h3>{task?.title || TASK_ITEM_TEXT.example.task}</h3>
        <span 
          className="task-priority"
          style={{ backgroundColor: task ? PRIORITY_COLORS[task.priority] : '#ddd' }}
        >
          {task ? PRIORITY_MAP[task.priority] : TASK_ITEM_TEXT.example.priority}
        </span>
      </div>
      <p>{task?.description || TASK_ITEM_TEXT.example.description}</p>
      <div className="task-footer">
        <span>{task ? TIMEFRAME_MAP[task.timeframe] : TASK_ITEM_TEXT.example.timeframe}</span>
        <span>{task ? STATUS_MAP[task.status] : TASK_ITEM_TEXT.example.status}</span>
      </div>
    </div>
  );
};

export default TaskItem; 