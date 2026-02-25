import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import BottomNav from '../components/navigation/BottomNav';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES, type RouteConfig } from '../config/navigation';

// 受保护的路由组件
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>加载中...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};
const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="app-container">
      <Routes>
        {/* 登录路由 */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* 根据统一配置自动生成路由 */}
        {ROUTES.map(({ path, element, isProtected }: RouteConfig) => (
          <Route
            key={path}
            path={path}
            element={isProtected ? <ProtectedRoute>{element}</ProtectedRoute> : element}
          />
        ))}
      </Routes>
      {isAuthenticated && <BottomNav />}
    </div>
  );
};

export default AppRoutes;