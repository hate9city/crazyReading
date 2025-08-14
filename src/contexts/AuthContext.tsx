import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 用户类型定义
interface User {
  id: string;
  email: string;
  username: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

// 认证上下文类型
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, username: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ error: string | null }>;
  isAdmin: boolean;
}

// 创建Supabase客户端
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  throw new Error('Supabase URL and API key are required');
}

// 导出 Supabase 实例供其他组件使用
export { supabase };

// 创建上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 自定义Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 认证提供者组件
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // 检查用户会话
  useEffect(() => {
    const checkSession = async () => {
      console.log('Starting auth check...');
      try {
        // 简单的会话检查
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('Session check completed:', { hasSession: !!session, error });
        
        if (error) {
          console.error('Session error:', error);
        }
        
        // 暂时跳过用户数据获取，只设置基本的会话状态
        if (session?.user) {
          console.log('User found:', session.user.email);
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.user_metadata?.username || 'unknown',
            status: 'approved' as const,
            created_at: new Date().toISOString()
          });
          setIsAdmin(session.user.email === process.env.REACT_APP_ADMIN_EMAIL);
        } else {
          console.log('No session found');
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
        setIsAdmin(false);
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // 用户注册
  const signUp = async (email: string, username: string, password: string) => {
    try {
      // 1. 创建认证用户（设置 email_confirm 为 true）
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            email_confirm: true
          }
        }
      });

      if (authError) {
        return { error: authError.message };
      }

      if (!authData.user) {
        return { error: '注册失败，请重试' };
      }

      // 2. 创建用户记录（使用 upsert 避免冲突）
      const now = new Date().toISOString();
      const { error: userError } = await supabase.from('users').upsert([
        {
          id: authData.user.id,
          email,
          username,
          status: 'pending',
          created_at: now,
          updated_at: now,
        },
      ], { onConflict: 'id' });

      if (userError) {
        console.error('User record error:', userError);
        return { error: '创建用户记录失败' };
      }

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: '注册过程中发生错误' };
    }
  };

  // 用户登录
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (!data.user) {
        return { error: '登录失败' };
      }

      // 检查用户状态
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('status, username')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        return { error: '用户信息不存在' };
      }

      if (userData.status !== 'approved') {
        await supabase.auth.signOut();
        return { error: '账户尚未批准，请等待管理员审核' };
      }

      // 登录成功，更新用户状态
      setUser({
        id: data.user.id,
        email: data.user.email || '',
        username: userData.username,
        status: userData.status,
        created_at: data.user.created_at || new Date().toISOString()
      });
      setIsAdmin(data.user.email === process.env.REACT_APP_ADMIN_EMAIL);

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: '登录过程中发生错误' };
    }
  };

  // 用户登出
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // 修改密码
  const changePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error('Change password error:', error);
      return { error: '修改密码失败' };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    changePassword,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};