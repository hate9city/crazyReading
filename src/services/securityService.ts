import { supabase } from '../contexts/AuthContext';

// 获取客户端IP地址（在真实环境中，这需要从服务器端获取）
const getClientIP = async (): Promise<string> => {
  try {
    // 在实际部署中，这应该从服务器端获取
    // 这里使用一个简单的模拟
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || '127.0.0.1';
  } catch (error) {
    console.warn('无法获取IP地址，使用默认值');
    return '127.0.0.1';
  }
};

// 获取用户代理信息
const getUserAgent = (): string => {
  return navigator.userAgent || 'Unknown';
};

// 检查注册限制
export const checkRegistrationLimits = async (email: string): Promise<{ allowed: boolean; reason: string }> => {
  try {
    const ip = await getClientIP();
    
    const { data, error } = await supabase.rpc('check_registration_limit', {
      p_ip_address: ip,
      p_email: email
    });

    if (error) {
      console.error('检查注册限制失败:', error);
      return { allowed: true, reason: '检查失败，允许继续' };
    }

    return { 
      allowed: data[0]?.is_allowed || false, 
      reason: data[0]?.reason || '未知原因' 
    };
  } catch (error) {
    console.error('检查注册限制时发生错误:', error);
    return { allowed: true, reason: '检查失败，允许继续' };
  }
};

// 记录注册尝试
export const recordRegistrationAttempt = async (email: string, success: boolean): Promise<void> => {
  try {
    const ip = await getClientIP();
    
    const { error } = await supabase.rpc('record_registration_attempt', {
      p_ip_address: ip,
      p_email: email,
      p_success: success
    });

    if (error) {
      console.error('记录注册尝试失败:', error);
    }
  } catch (error) {
    console.error('记录注册尝试时发生错误:', error);
  }
};


// 记录安全日志
export const logSecurityEvent = async (action: string, details: any, success: boolean): Promise<void> => {
  try {
    const ip = await getClientIP();
    const userAgent = getUserAgent();
    
    const { error } = await supabase
      .from('security_logs')
      .insert([{
        ip_address: ip,
        user_agent: userAgent,
        action,
        details,
        success
      }]);

    if (error) {
      console.error('记录安全日志失败:', error);
    }
  } catch (error) {
    console.error('记录安全日志时发生错误:', error);
  }
};

// 检查密码强度
export const checkPasswordStrength = (password: string): { isStrong: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  if (password.length < 6) {
    issues.push('密码长度至少6位');
  }
  
  if (!/[a-z]/.test(password)) {
    issues.push('密码必须包含小写字母');
  }
  
  if (!/[A-Z]/.test(password)) {
    issues.push('密码必须包含大写字母');
  }
  
  if (!/\d/.test(password)) {
    issues.push('密码必须包含数字');
  }
  
  // 检查常见弱密码
  const commonPasswords = [
    'password', '123456', 'qwerty', 'abc123'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    issues.push('密码过于常见');
  }
  
  return {
    isStrong: issues.length === 0,
    issues
  };
};

// 验证邮箱格式
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 验证用户名格式
export const validateUsername = (username: string): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  if (username.length < 3) {
    issues.push('用户名长度至少3位');
  }
  
  if (username.length > 20) {
    issues.push('用户名长度不能超过20位');
  }
  
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
    issues.push('用户名只能包含字母、数字、下划线和中文');
  }
  
  if (/^\d+$/.test(username)) {
    issues.push('用户名不能全是数字');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};