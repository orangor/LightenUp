import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router, useLocation } from 'react-router-dom';
import AppRoutes from './routes';
import Chat from './components/chat/Chat';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './index.scss';

// 根据路由与认证状态决定是否渲染 Chat（登录/注册页不显示）
const RouteAwareChat: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const hidePaths = ['/login', '/register'];
  const shouldShow = isAuthenticated && !hidePaths.includes(location.pathname);
  return shouldShow ? <Chat /> : null;
};

const App = () => {
  useEffect(() => {
    // 禁用微信浏览器的滑动手势
    const disableGesture = () => {
      if (typeof WeixinJSBridge !== 'undefined') {
        WeixinJSBridge.call('hideOptionMenu');
        WeixinJSBridge.call('handleForbidSlideBack', {
          forbid: true
        });
      }
    };

    document.addEventListener('WeixinJSBridgeReady', disableGesture);
    
    return () => {
      document.removeEventListener('WeixinJSBridgeReady', disableGesture);
    };
  }, []);

  return (
    <Router>
      <AuthProvider>
        <>
          <AppRoutes />
          <RouteAwareChat />
        </>
      </AuthProvider>
    </Router>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);