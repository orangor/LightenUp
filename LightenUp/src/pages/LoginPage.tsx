import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Tabs, message, Checkbox } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.scss';

const REMEMBERED_LOGIN_KEY = 'lightenup_remembered_login';

type LoginFormValues = {
  email: string;
  password: string;
  remember?: boolean;
};

type RegisterFormValues = {
  email: string;
  password: string;
  confirmPassword: string;
};

const LoginPage: React.FC = () => {
  const { login, register, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [loginForm] = Form.useForm<LoginFormValues>();

  useEffect(() => {
    const rememberedLogin = localStorage.getItem(REMEMBERED_LOGIN_KEY);

    if (!rememberedLogin) {
      loginForm.setFieldsValue({ remember: false });
      return;
    }

    try {
      const parsed = JSON.parse(rememberedLogin) as Partial<LoginFormValues>;
      loginForm.setFieldsValue({
        email: parsed.email ?? '',
        password: parsed.password ?? '',
        remember: Boolean(parsed.email && parsed.password),
      });
    } catch {
      localStorage.removeItem(REMEMBERED_LOGIN_KEY);
      loginForm.setFieldsValue({ remember: false });
    }
  }, [loginForm]);

  const handleLogin = async (values: LoginFormValues) => {
    try {
      await login(values.email, values.password);
      if (values.remember) {
        localStorage.setItem(
          REMEMBERED_LOGIN_KEY,
          JSON.stringify({ email: values.email, password: values.password }),
        );
      } else {
        localStorage.removeItem(REMEMBERED_LOGIN_KEY);
      }
      message.success('登录成功');
    } catch (error) {
    }
  };

  const handleRegister = async (values: RegisterFormValues) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    try {
      await register(values.email, values.password);
      message.success('注册成功，请查收验证邮件');
      setActiveTab('login');
    } catch (error) {
      // 错误已在 AuthService 中统一处理
    }
  };

  const tabItems = [
    {
      key: 'login',
      label: '登录',
      children: (
        <Form
          form={loginForm}
          name="login"
          initialValues={{ remember: false }}
          onFinish={handleLogin}
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input
              prefix={<MailOutlined className="site-form-item-icon" />}
              placeholder="请输入邮箱账号"
              autoComplete="username"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="请输入登录密码"
              autoComplete="current-password"
            />
          </Form.Item>
          <Form.Item
            name="remember"
            valuePropName="checked"
            className="login-options"
          >
            <Checkbox className="remember-checkbox">记住密码</Checkbox>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="submit-button"
              loading={isLoading}
              block
            >
              立即登录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <Form 
          name="register" 
          onFinish={handleRegister} 
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input
              prefix={<MailOutlined className="site-form-item-icon" />}
              placeholder="请输入邮箱账号"
              autoComplete="username"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 8, message: '密码长度不能少于8个字符' },
            ]}
          >
            <Input.Password prefix={<LockOutlined className="site-form-item-icon" />} placeholder="设置登录密码" />
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
            <Input.Password prefix={<LockOutlined className="site-form-item-icon" />} placeholder="确认登录密码" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="submit-button"
              loading={isLoading}
              block
            >
              注册账号
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo-container">
            <span className="logo-icon">🌀</span>
          </div>
          <h1 className="app-title">LightenUp & 执行清单</h1>
          <p className="app-subtitle">让每一天都充满能量与效率</p>
        </div>
        
        <div className="login-card">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            items={tabItems} 
            centered
          />
        </div>

        <div className="login-footer">
          © {new Date().getFullYear()} LightenUp. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
