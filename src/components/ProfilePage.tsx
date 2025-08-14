import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, changePassword, signOut } = useAuth();

  const validateForm = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('请填写所有字段');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return false;
    }

    if (newPassword.length < 6) {
      setError('新密码长度至少为6位');
      return false;
    }

    if (newPassword === currentPassword) {
      setError('新密码不能与当前密码相同');
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

    const { error: changeError } = await changePassword(newPassword);

    if (changeError) {
      setError(changeError);
    } else {
      setSuccess('密码修改成功！');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div style={styles.container}>
      <div style={styles.profileBox}>
        <div style={styles.header}>
          <h1 style={styles.title}>个人中心</h1>
          <Link to="/" style={styles.backLink}>返回首页</Link>
        </div>

        {/* 用户信息 */}
        <div style={styles.userInfo}>
          <h2 style={styles.sectionTitle}>用户信息</h2>
          <div style={styles.infoCard}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>用户名:</span>
              <span style={styles.infoValue}>{user?.username}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>邮箱:</span>
              <span style={styles.infoValue}>{user?.email}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>状态:</span>
              <span style={{...styles.infoValue, color: '#50c878'}}>已激活</span>
            </div>
          </div>
        </div>

        {/* 密码修改 */}
        <div style={styles.passwordSection}>
          <h2 style={styles.sectionTitle}>修改密码</h2>
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label htmlFor="currentPassword" style={styles.label}>当前密码</label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={styles.input}
                required
                placeholder="请输入当前密码"
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="newPassword" style={styles.label}>新密码</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={styles.input}
                required
                placeholder="请输入新密码（至少6位）"
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="confirmPassword" style={styles.label}>确认新密码</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={styles.input}
                required
                placeholder="请再次输入新密码"
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
              {loading ? '修改中...' : '修改密码'}
            </button>
          </form>
        </div>

        {/* 操作按钮 */}
        <div style={styles.actions}>
          <button
            onClick={handleSignOut}
            style={styles.signOutButton}
          >
            退出登录
          </button>
        </div>

        {/* 管理员入口 */}
        {user?.email === process.env.REACT_APP_ADMIN_EMAIL && (
          <div style={styles.adminSection}>
            <Link to="/admin" style={styles.adminLink}>
              进入管理控制台
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    backgroundColor: '#f8f8f8',
    padding: '2rem',
    paddingTop: '4rem',
  },
  profileBox: {
    backgroundColor: 'white',
    padding: '3rem',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '600px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e0e0e0',
  },
  title: {
    color: '#333',
    fontSize: '2rem',
    margin: 0,
  },
  backLink: {
    color: '#4a90e2',
    textDecoration: 'none',
    fontWeight: 'bold',
    padding: '0.5rem 1rem',
    border: '2px solid #4a90e2',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
  userInfo: {
    marginBottom: '3rem',
  },
  sectionTitle: {
    color: '#333',
    fontSize: '1.5rem',
    marginBottom: '1.5rem',
    marginTop: 0,
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1.5rem',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#555',
    fontSize: '0.9rem',
  },
  infoValue: {
    color: '#333',
    fontSize: '0.9rem',
  },
  passwordSection: {
    marginBottom: '3rem',
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
    backgroundColor: '#4a90e2',
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
  actions: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '2rem',
  },
  signOutButton: {
    padding: '0.875rem 2rem',
    backgroundColor: '#ff6b6b',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  adminSection: {
    textAlign: 'center',
    padding: '1.5rem',
    backgroundColor: '#f0f8ff',
    border: '1px solid #e0e8f0',
    borderRadius: '8px',
  },
  adminLink: {
    color: '#4a90e2',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '1.1rem',
  },
};

export default ProfilePage;