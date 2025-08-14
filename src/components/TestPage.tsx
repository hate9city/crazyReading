import React, { useState, useEffect } from 'react';
import { supabase } from '../contexts/AuthContext';

const TestPage: React.FC = () => {
  const [status, setStatus] = useState('Testing connection...');
  const [error, setError] = useState('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing Supabase connection...');
        console.log('Supabase client available:', !!supabase);
        
        if (!supabase) {
          setError('Supabase client not available');
          setStatus('Client error');
          return;
        }
        
        // 测试连接
        const { data, error } = await supabase.from('users').select('count').single();
        
        if (error) {
          console.error('Supabase error:', error);
          setError(error.message);
          setStatus('Connection failed');
        } else {
          console.log('Supabase connected successfully:', data);
          setStatus('Connected successfully!');
        }
      } catch (err: any) {
        console.error('Test error:', err);
        setError(err.message);
        setStatus('Test failed');
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Supabase Connection Test</h1>
      <div style={{ margin: '1rem 0', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
        <strong>Status:</strong> {status}
      </div>
      {error && (
        <div style={{ margin: '1rem 0', padding: '1rem', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      <div style={{ margin: '1rem 0' }}>
        <h3>Environment Variables:</h3>
        <div>REACT_APP_SUPABASE_URL: {process.env.REACT_APP_SUPABASE_URL ? 'Set' : 'Missing'}</div>
        <div>REACT_APP_SUPABASE_ANON_KEY: {process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</div>
        <div>REACT_APP_ADMIN_EMAIL: {process.env.REACT_APP_ADMIN_EMAIL || 'Not set'}</div>
      </div>
    </div>
  );
};

export default TestPage;