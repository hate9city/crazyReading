import React, { useState, useEffect } from 'react';

const SimpleTest: React.FC = () => {
  const [status, setStatus] = useState('Testing...');
  const [envStatus, setEnvStatus] = useState<{
    supabaseUrl?: string;
    supabaseKey?: string;
    adminEmail?: string;
  }>({});

  useEffect(() => {
    // 检查环境变量
    const envCheck = {
      supabaseUrl: process.env.REACT_APP_SUPABASE_URL ? 'Set' : 'Missing',
      supabaseKey: process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      adminEmail: process.env.REACT_APP_ADMIN_EMAIL || 'Not set'
    };
    setEnvStatus(envCheck);
    setStatus('Environment check complete');

    // 测试简单的同步操作
    try {
      const test = 'Simple test passed';
      setStatus(test);
    } catch (error) {
      setStatus('Simple test failed: ' + error);
    }
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Simple Test Page</h1>
      <div style={{ margin: '1rem 0', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
        <strong>Status:</strong> {status}
      </div>
      <div style={{ margin: '1rem 0' }}>
        <h3>Environment Variables:</h3>
        <div>REACT_APP_SUPABASE_URL: {envStatus.supabaseUrl}</div>
        <div>REACT_APP_SUPABASE_ANON_KEY: {envStatus.supabaseKey}</div>
        <div>REACT_APP_ADMIN_EMAIL: {envStatus.adminEmail}</div>
      </div>
    </div>
  );
};

export default SimpleTest;