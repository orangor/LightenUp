
import React, { useState, useEffect } from 'react';
import { Input, DatePicker, Button, message } from 'antd';
import { LeftOutlined, CloseOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './Home.scss';

interface TaskFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  initialDate?: string;
}

const TaskForm: React.FC<TaskFormProps> = ({ visible, onClose, onSubmit, initialDate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(dayjs());

  // Reset form when opened
  useEffect(() => {
    if (visible) {
      setTitle('');
      setDescription('');
      setDate(initialDate ? dayjs(initialDate) : dayjs());
    }
  }, [visible, initialDate]);

  const handleSave = () => {
    if (!title.trim()) {
      // If no title, maybe just close or show warning? 
      // For now, let's treat it as "no save" if empty, just close, 
      // or we can prevent closing. User said "save effect".
      // Let's assume valid data is needed.
      if (title.trim() === '') {
         onClose();
         return;
      }
    }
    
    onSubmit({
      title,
      description,
      date: date.format('YYYY/M/D'),
      completed: false,
    });
  };

  if (!visible) return null;

  return (
    <div className="task-form-overlay">
      <div className="task-form-container">
        <div className="task-form-header">
          <Button type="text" icon={<LeftOutlined />} onClick={handleSave} />
          <span className="task-form-title">新增事项</span>
          <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
        </div>
        
        <div className="task-form-content">
          <div className="form-item">
            <Input 
              placeholder="事项" 
              bordered={false} 
              className="task-input-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onPressEnter={handleSave}
              autoFocus
            />
          </div>
          
          <div className="form-item">
            <Input.TextArea 
              placeholder="添加内容" 
              bordered={false} 
              autoSize={{ minRows: 3 }}
              className="task-input-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-item date-item">
            <ClockCircleOutlined className="date-icon" />
            <DatePicker 
              value={date}
              onChange={(d) => d && setDate(d)}
              format="YYYY/M/D" 
              bordered={false}
              suffixIcon={null}
              allowClear={false}
              className="task-datepicker"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskForm;
