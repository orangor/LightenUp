import React from 'react';
import { Button, message, Switch, Avatar } from 'antd';
import { 
  LogoutOutlined, 
  RightOutlined, 
  UserOutlined, 
  BellOutlined, 
  SafetyCertificateOutlined,
  QuestionCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import './SettingsPage.scss';

const SettingsPage: React.FC = () => {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    message.success('已退出登录');
  };

  const SettingItem = ({ icon, title, value, onClick, isDestructive = false }: any) => (
    <div className={`setting-item ${onClick ? 'clickable' : ''}`} onClick={onClick}>
      <div className="item-left">
        <div className={`icon-wrapper ${isDestructive ? 'destructive' : ''}`}>
          {icon}
        </div>
        <span className={`item-title ${isDestructive ? 'destructive-text' : ''}`}>{title}</span>
      </div>
      <div className="item-right">
        {value && <span className="item-value">{value}</span>}
        {onClick && <RightOutlined className="arrow-icon" />}
      </div>
    </div>
  );

  return (
    <div className="settings-page">
      <h1>设置</h1>
      
      <div className="settings-content">
        {/* 用户信息卡片 */}
        <div className="settings-section user-profile-section">
          <div className="user-info">
            <Avatar size={64} icon={<UserOutlined />} className="user-avatar" />
            <div className="user-details">
              <h2 className="user-name">{user?.username || 'LightenUp User'}</h2>
              <p className="user-email">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
          <div className="edit-profile-btn">
            <RightOutlined />
          </div>
        </div>

        {/* 通用设置 */}
        <div className="section-title">通用</div>
        <div className="settings-section">
          <SettingItem 
            icon={<UserOutlined />} 
            title="个人资料" 
            onClick={() => {}} 
          />
          <SettingItem 
            icon={<BellOutlined />} 
            title="通知提醒" 
            value={<Switch defaultChecked size="small" />} 
          />
          <SettingItem 
            icon={<SafetyCertificateOutlined />} 
            title="隐私与安全" 
            onClick={() => {}} 
          />
        </div>

        {/* 支持与关于 */}
        <div className="section-title">支持</div>
        <div className="settings-section">
          <SettingItem 
            icon={<QuestionCircleOutlined />} 
            title="帮助中心" 
            onClick={() => {}} 
          />
          <SettingItem 
            icon={<InfoCircleOutlined />} 
            title="关于 LightenUp" 
            value="v1.0.0" 
            onClick={() => {}} 
          />
        </div>

        {/* 退出登录 */}
        <div className="settings-section logout-section">
          <div className="setting-item clickable" onClick={handleLogout}>
            <div className="item-center">
              <span className="destructive-text">退出登录</span>
            </div>
          </div>
        </div>
        
        <div className="version-footer">
          LightenUp for Web · Version 1.0.0
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;