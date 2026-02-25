import React, { useState } from 'react';
import { Form, Input, Button, Card, Tabs, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

// 使用 AntD Tabs 的 items API，移除已弃用的 TabPane

const LoginPage: React.FC = () => {
  const { login, register, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('login');

  // tabItems 定义已移动至返回 JSX 之前，避免引用未定义的处理函数

  // 登录表单提交
  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      await login(values.email, values.password);
      message.success('登录成功');
    } catch (error) {
      // 错误已在 AuthService 中统一处理（HttpClient 拦截器）
    }
  };

  // 注册表单提交
  const handleRegister = async (values: { email: string; password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    try {
      await register(values.email, values.password);
      message.success('注册成功，请查收验证邮件');
      setActiveTab('login'); // 注册成功后切换到登录页
    } catch (error) {
      // 错误已在 AuthService 中统一处理（HttpClient 拦截器）
    }
  };

  const tabItems = [
    {
      key: 'login',
      label: '登录',
      children: (
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={handleLogin}
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="邮箱" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="login-button"
              loading={isLoading}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <Form name="register" onFinish={handleRegister} size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="邮箱" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 8, message: '密码长度不能少于8个字符' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="login-button"
              loading={isLoading}
            >
              注册
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div className="login-container">
      <Card className="login-card" title="DayDo 任务管理系统">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>
    </div>
  );
};

export default LoginPage;