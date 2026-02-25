
import React, { useState } from 'react';
import { List } from 'antd';
import { RightOutlined, PlusOutlined, CheckOutlined } from '@ant-design/icons';
import { Category, tasks, Task } from './mockData';
import TaskForm from './TaskForm';
import './Home.scss';

interface CategoryListProps {
  categories: Category[];
}

const CategoryList: React.FC<CategoryListProps> = ({ categories }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isTaskFormVisible, setIsTaskFormVisible] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [taskList, setTaskList] = useState<Task[]>(tasks);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    // If clicking the add icon, don't toggle
    e.stopPropagation();
    
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleAddClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCategoryId(id);
    setIsTaskFormVisible(true);
  };

  const getTasksForCategory = (categoryId: string) => {
    return taskList.filter(t => t.categoryId === categoryId);
  };

  return (
    <div className="category-list">
      <List
        dataSource={categories}
        renderItem={(item) => {
          const isExpanded = expandedIds.has(item.id);
          const categoryTasks = getTasksForCategory(item.id);

          return (
            <div key={item.id}>
              <List.Item 
                className="category-item"
                onClick={(e) => toggleExpand(item.id, e)}
              >
                <div className="category-left">
                  <RightOutlined className={`expand-icon ${isExpanded ? 'expanded' : ''}`} />
                  <div 
                    className="category-icon-wrapper" 
                    style={{ backgroundColor: item.color }}
                  >
                    <span className="category-icon">{item.icon || '◎'}</span>
                  </div>
                  <span className="category-title">{item.title}</span>
                </div>
                <div className="category-right">
                  <span className="task-count">{categoryTasks.length > 0 ? categoryTasks.length : ''}</span>
                  <PlusOutlined 
                    className="add-icon" 
                    onClick={(e) => handleAddClick(item.id, e)}
                  />
                </div>
              </List.Item>
              
              {isExpanded && categoryTasks.length > 0 && (
                <div className="task-list">
                  {categoryTasks.map((task: Task) => (
                    <div key={task.id} className="task-item">
                      <div 
                        className={`task-checkbox ${task.completed ? 'completed' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const newTaskList = taskList.map(t => 
                            t.id === task.id ? { ...t, completed: !t.completed } : t
                          );
                          setTaskList(newTaskList);
                        }}
                      >
                        {task.completed && <CheckOutlined style={{ color: '#fff', fontSize: 12 }} />}
                      </div>
                      <div className="task-content">
                        <div className={`task-title ${task.completed ? 'completed' : ''}`}>
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="task-desc">{task.description}</div>
                        )}
                        <div className="task-date">{task.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }}
      />

      <TaskForm 
        visible={isTaskFormVisible}
        onClose={() => setIsTaskFormVisible(false)}
        onSubmit={(values) => {
          const newTask: Task = {
            id: Date.now().toString(),
            categoryId: selectedCategoryId,
            ...values,
          };
          setTaskList([...taskList, newTask]);
          
          // Auto expand the category to show new task
          setExpandedIds(prev => new Set(prev).add(selectedCategoryId));
          
          setIsTaskFormVisible(false);
        }}
      />
    </div>
  );
};

export default CategoryList;
