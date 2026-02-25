import React from 'react';
import { Button, Card, Divider, message } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import './SettingsPage.css';

const SettingsPage: React.FC = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    message.success('退出登录成功');
  };

  return (
    <div className="page-container settings-page">
      <h1>设置</h1>
      <Card className="settings-card">
        <h2>账户设置</h2>
        <Divider />
        <Button 
          type="primary" 
          danger 
          icon={<LogoutOutlined />} 
          size="large" 
          onClick={handleLogout}
          className="logout-button"
        >
          退出登录
        </Button>
      </Card>
    </div>
  );
};

export default SettingsPage;