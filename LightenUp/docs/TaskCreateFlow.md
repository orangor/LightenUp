# 任务创建与列表更新流程

## 1. 基本原理

TaskDashboard（父组件）包含 TaskCreate 和 TaskList（子组件），数据流动遵循 React 单向数据流原则。
当用户创建新任务时，数据流动遵循以下路径：
TaskCreate -> API -> TaskDashboard -> TaskList

## 2. 组件关系

TaskDashboard（负责状态管理和数据流转）
├── TaskCreate（处理任务创建表单）
│ ├── 表单字段：标题、描述、优先级等
│ └── 提交处理：API 调用和父组件通知
└── TaskList（展示任务列表）
└── TaskItem（单个任务展示）

## 3. 数据流动过程

### 3.1 创建任务与更新列表

// TaskCreate 组件
const TaskCreate: React.FC`<TaskCreateProps>` = ({ onTaskCreated }) => {
const [formData, setFormData] = useState({
title: '',
description: '',
priority: 'medium',
status: 'pending'
});

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();
try {
// 1. 调用 API 创建任务
await taskApi.createTask(formData);
// 2. 通知父组件需要更新
onTaskCreated();
// 3. 重置表单
setFormData({
title: '',
description: '',
priority: 'medium',
status: 'pending'
});
} catch (error) {
console.error('创建失败:', error);
}
};

return (
`<form onSubmit={handleSubmit}>`
<input
type="text"
value={formData.title}
onChange={(e) => setFormData(prev => ({
...prev,
title: e.target.value
}))}
/>
{/_ 其他表单字段 _/}
`<button type="submit">`创建任务`</button>`
`</form>`
);
};

// TaskDashboard 组件
const TaskDashboard = () => {
// 1. 维护任务列表状态
const [tasks, setTasks] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

// 2. 获取任务列表
const fetchTasks = async () => {
setLoading(true);
try {
const taskList = await taskApi.getTasks();
setTasks(taskList);
setError(null);
} catch (err) {
setError('获取任务列表失败');
console.error(err);
} finally {
setLoading(false);
}
};

// 3. 首次加载时获取任务列表
useEffect(() => {
fetchTasks();
}, []);

// 4. 任务创建后的回调
const handleTaskCreated = () => {
fetchTasks(); // 重新获取列表
};

// 5. 任务状态更新处理
const handleStatusChange = async (taskId: string, newStatus: string) => {
try {
await taskApi.updateTaskStatus(taskId, newStatus);
fetchTasks(); // 更新列表
} catch (err) {
setError('更新任务状态失败');
}
};

return (
`<div className="dashboard-container">`
`<TaskCreate onTaskCreated={handleTaskCreated} />`
{loading ? (
`<div>`加载中...`</div>`
) : error ? (
`<div className="error-message">`{error}`</div>`
) : (
`<TaskList 
          tasks={tasks}
          onStatusChange={handleStatusChange}
        />`
)}
`</div>`
);
};

## 4. 更新机制

1. 用户提交创建任务表单

   - 表单验证
   - 收集表单数据
   - 调用 API

2. TaskCreate 组件处理提交

   - 阻止表单默认提交行为
   - 调用 API 创建任务
   - 成功后通知父组件
   - 重置表单状态

3. TaskDashboard 处理更新

   - 接收到创建成功通知
   - 调用 fetchTasks 获取最新列表
   - 处理加载状态和错误状态
   - 更新本地任务列表状态

4. React 更新机制

   - setTasks 触发状态更新
   - React 调度更新
   - 组件重新渲染
   - 子组件接收新的 props

5. TaskList 更新显示

   - 接收新的 tasks 数据
   - 重新渲染任务列表
   - 更新 UI 显示

## 5. 为什么会自动更新？

1. React 的状态管理

   - useState 提供状态更新能力
   - 状态更新触发组件重新渲染
   - 虚拟 DOM 对比和更新

2. Props 传递机制

   - 父组件状态更新
   - 子组件接收新的 props
   - 子组件重新渲染

3. 单向数据流

   - 数据从父组件流向子组件
   - 子组件通过回调通知父组件
   - 父组件统一管理状态

## 6. 注意事项

1. 错误处理

   - API 调用错误
   - 表单验证错误
   - 网络错误

2. 加载状态

   - 首次加载
   - 创建任务时
   - 更新状态时

3. 性能优化

   - 防抖处理
   - 条件渲染
   - 状态更新优化
