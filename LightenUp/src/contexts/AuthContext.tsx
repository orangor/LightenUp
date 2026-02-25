import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '../api/apiService';
import type { User } from '../api/types';

// 定义认证上下文的类型
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  // 预留权限检查函数
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者属性
interface AuthProviderProps {
  children: ReactNode;
}

// 认证提供者组件
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化时检查用户是否已登录
  useEffect(() => {
    const initAuth = () => {
      try {
        // 从本地存储获取用户信息
        const currentUser = AuthService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('初始化认证失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // 登录函数
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await AuthService.login(email, password);
      setUser(response.user);
      
      // 检查是否有重定向路径
      const redirectPath = localStorage.getItem('redirectPath');
      if (redirectPath) {
        localStorage.removeItem('redirectPath');
        window.location.href = redirectPath;
      } else {
        window.location.href = '/';
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 注册函数
  const register = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await AuthService.register(email, password);
      // 注册成功后可以自动登录或跳转到登录页
      window.location.href = '/login';
    } finally {
      setIsLoading(false);
    }
  };

  // 退出登录
  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  // 权限检查函数
  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  // 角色检查函数
  const hasRole = (role: string): boolean => {
    if (!user || !user.role) return false;
    return user.role === role;
  };

  // 提供上下文值
  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// 自定义钩子，用于在组件中访问认证上下文
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};