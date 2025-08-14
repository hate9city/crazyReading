import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  checkRegistrationLimits, 
  recordRegistrationAttempt, 
  checkPasswordStrength,
  validateEmail,
  validateUsername,
  logSecurityEvent
} from '../services/securityService';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [usernameErrors, setUsernameErrors] = useState<string[]>([]);
  const { signUp, user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const validateForm = () => {
    // 重置错误状态
    setPasswordErrors([]);
    setUsernameErrors([]);
    setError('');

    if (!email || !username || !password || !confirmPassword) {
      setError('请填写所有字段');
      return false;
    }

    // 验证邮箱格式
    if (!validateEmail(email)) {
      setError('请输入有效的邮箱地址');
      return false;
    }

    // 验证用户名
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      setUsernameErrors(usernameValidation.issues);
      return false;
    }

    // 验证密码强度
    const passwordValidation = checkPasswordStrength(password);
    if (!passwordValidation.isStrong) {
      setPasswordErrors(passwordValidation.issues);
      return false;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return false;
    }

    return true;
  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // 检查注册限制
      const limitCheck = await checkRegistrationLimits(email);
      if (!limitCheck.allowed) {
        setError(limitCheck.reason);
        return;
      }

      // 执行注册
      const { error: signUpError } = await signUp(email, username, password);

      if (signUpError) {
        setError(signUpError);
        await recordRegistrationAttempt(email, false);
        await logSecurityEvent('registration_failed', { email, reason: signUpError }, false);
      } else {
        setSuccess('注册成功！请等待管理员批准后登录。');
        setEmail('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        await recordRegistrationAttempt(email, true);
        await logSecurityEvent('registration_success', { email, username }, true);
      }
    } catch (error) {
      console.error('注册过程中发生错误:', error);
      setError('注册过程中发生错误');
      await recordRegistrationAttempt(email, false);
      await logSecurityEvent('registration_failed', { email, reason: 'system_error' }, false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.registerBox}>
        <h1 style={styles.title}>用户注册</h1>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>邮箱</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
              placeholder="请输入邮箱"
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="username" style={styles.label}>用户名</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              required
              placeholder="请输入用户名"
            />
            {usernameErrors.length > 0 && (
              <div style={styles.fieldErrors}>
                {usernameErrors.map((error, index) => (
                  <div key={index} style={styles.fieldError}>{error}</div>
                ))}
              </div>
            )}
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>密码</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
              placeholder="请输入密码（至少6位，包含大小写字母和数字）"
            />
            {passwordErrors.length > 0 && (
              <div style={styles.fieldErrors}>
                {passwordErrors.map((error, index) => (
                  <div key={index} style={styles.fieldError}>{error}</div>
                ))}
              </div>
            )}
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="confirmPassword" style={styles.label}>确认密码</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
              required
              placeholder="请再次输入密码"
            />
          </div>

          
          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          {success && (
            <div style={styles.success}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={styles.button}
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div style={styles.infoBox}>
          <h3 style={styles.infoTitle}>注册说明</h3>
          <ul style={styles.infoList}>
            <li>注册后需要管理员审核批准</li>
            <li>批准后方可使用登录系统</li>
            <li>密码必须包含大小写字母和数字，至少6位</li>
            <li>用户名长度3-20位，可包含中文、字母、数字和下划线</li>
            <li>同一邮箱24小时内只能注册3次</li>
            <li>同一IP频繁注册将被临时阻止</li>
          </ul>
        </div>

        <div style={styles.links}>
          <span style={styles.linkText}>已有账户？</span>
          <Link to="/login" style={styles.link}>立即登录</Link>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: '2rem',
  },
  registerBox: {
    backgroundColor: 'white',
    padding: '3rem',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '500px',
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '2rem',
    fontSize: '2rem',
    fontWeight: 'bold',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#555',
  },
  input: {
    padding: '0.75rem',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'border-color 0.2s',
    outline: 'none',
  },
  button: {
    padding: '0.875rem',
    backgroundColor: '#50c878',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '1rem',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '0.75rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    textAlign: 'center',
  },
  success: {
    backgroundColor: '#efe',
    color: '#3c3',
    padding: '0.75rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#f0f8ff',
    border: '1px solid #e0e8f0',
    borderRadius: '8px',
    padding: '1.5rem',
    margin: '2rem 0',
  },
  infoTitle: {
    color: '#4a90e2',
    fontSize: '1.1rem',
    marginBottom: '1rem',
    marginTop: 0,
  },
  infoList: {
    margin: 0,
    paddingLeft: '1.5rem',
    color: '#666',
    fontSize: '0.9rem',
  },
  links: {
    textAlign: 'center',
    marginTop: '2rem',
    paddingTop: '2rem',
    borderTop: '1px solid #e0e0e0',
  },
  linkText: {
    color: '#666',
    marginRight: '0.5rem',
  },
  link: {
    color: '#4a90e2',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
    fieldErrors: {
    marginTop: '0.5rem',
  },
  fieldError: {
    color: '#e74c3c',
    fontSize: '0.8rem',
    marginBottom: '0.25rem',
  },
  };

export default RegisterPage;