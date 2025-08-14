import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../contexts/AuthContext';

interface User {
  id: string;
  email: string;
  username: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      setUsers(data || []);
      
      // 计算统计数据
      const total = data?.length || 0;
      const pending = data?.filter(u => u.status === 'pending').length || 0;
      const approved = data?.filter(u => u.status === 'approved').length || 0;
      const rejected = data?.filter(u => u.status === 'rejected').length || 0;
      
      setStats({ total, pending, approved, rejected });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      // 1. 更新用户状态为已批准
      const { error: updateError } = await supabase
        .from('users')
        .update({ status: 'approved' })
        .eq('id', userId);

      if (updateError) {
        console.error('Error approving user:', updateError);
        return;
      }

      // 2. 确认用户邮箱（通过 RPC 调用存储过程）
      const { error: confirmError } = await supabase.rpc('confirm_user_email', {
        user_id: userId
      });

      if (confirmError) {
        console.error('Error confirming email:', confirmError);
        // 不阻止批准流程，只记录错误
      }

      await fetchUsers();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'rejected' })
        .eq('id', userId);

      if (error) {
        console.error('Error rejecting user:', error);
        return;
      }

      await fetchUsers();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#50c878';
      case 'rejected':
        return '#ff6b6b';
      case 'pending':
        return '#ffa500';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return '已批准';
      case 'rejected':
        return '已拒绝';
      case 'pending':
        return '待审核';
      default:
        return '未知';
    }
  };

  if (!isAdmin) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <h2>访问被拒绝</h2>
          <p>您没有管理员权限访问此页面。</p>
          <Link to="/" style={styles.link}>返回首页</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>管理员控制台</h1>
        <Link to="/" style={styles.backLink}>返回首页</Link>
      </div>

      {/* 统计卡片 */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3 style={styles.statNumber}>{stats.total}</h3>
          <p style={styles.statLabel}>总用户数</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={{...styles.statNumber, color: '#ffa500'}}>{stats.pending}</h3>
          <p style={styles.statLabel}>待审核</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={{...styles.statNumber, color: '#50c878'}}>{stats.approved}</h3>
          <p style={styles.statLabel}>已批准</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={{...styles.statNumber, color: '#ff6b6b'}}>{stats.rejected}</h3>
          <p style={styles.statLabel}>已拒绝</p>
        </div>
      </div>

      {/* 用户列表 */}
      <div style={styles.userListContainer}>
        <h2 style={styles.sectionTitle}>用户管理</h2>
        
        {loading ? (
          <div style={styles.loading}>
            <div style={styles.spinner}></div>
            <p>加载中...</p>
          </div>
        ) : (
          <div style={styles.userList}>
            {users.map((user) => (
              <div key={user.id} style={styles.userCard}>
                <div style={styles.userInfo}>
                  <div>
                    <h3 style={styles.username}>{user.username}</h3>
                    <p style={styles.email}>{user.email}</p>
                    <p style={styles.date}>
                      注册时间: {new Date(user.created_at).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <div style={styles.statusContainer}>
                    <span 
                      style={{
                        ...styles.status,
                        backgroundColor: getStatusColor(user.status),
                      }}
                    >
                      {getStatusText(user.status)}
                    </span>
                  </div>
                </div>
                
                {user.status === 'pending' && (
                  <div style={styles.actions}>
                    <button
                      onClick={() => handleApproveUser(user.id)}
                      disabled={actionLoading === user.id}
                      style={styles.approveButton}
                    >
                      {actionLoading === user.id ? '处理中...' : '批准'}
                    </button>
                    <button
                      onClick={() => handleRejectUser(user.id)}
                      disabled={actionLoading === user.id}
                      style={styles.rejectButton}
                    >
                      {actionLoading === user.id ? '处理中...' : '拒绝'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '2rem',
    backgroundColor: '#f8f8f8',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  title: {
    color: '#333',
    fontSize: '2.5rem',
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
  errorBox: {
    backgroundColor: 'white',
    padding: '3rem',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    maxWidth: '500px',
    margin: '0 auto',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '3rem',
    fontWeight: 'bold',
    margin: '0 0 0.5rem 0',
    color: '#4a90e2',
  },
  statLabel: {
    color: '#666',
    margin: 0,
    fontSize: '1rem',
  },
  userListContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  sectionTitle: {
    padding: '1.5rem 2rem',
    margin: 0,
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #e0e0e0',
    color: '#333',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #4a90e2',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  userList: {
    padding: '1rem',
  },
  userCard: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1rem',
    backgroundColor: '#fafafa',
  },
  userInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  username: {
    margin: '0 0 0.5rem 0',
    color: '#333',
    fontSize: '1.2rem',
  },
  email: {
    margin: '0 0 0.5rem 0',
    color: '#666',
    fontSize: '0.9rem',
  },
  date: {
    margin: 0,
    color: '#999',
    fontSize: '0.8rem',
  },
  statusContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  status: {
    color: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
  },
  approveButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#50c878',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
  },
  rejectButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#ff6b6b',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
  },
  link: {
    color: '#4a90e2',
    textDecoration: 'none',
    fontWeight: 'bold',
    marginTop: '1rem',
    display: 'inline-block',
  },
};

export default AdminDashboard;