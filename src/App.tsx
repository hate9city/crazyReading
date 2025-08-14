import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import BookShelf from './components/BookShelf';
import ReaderView from './components/ReaderView';
import CreatorView from './components/CreatorView';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import AdminDashboard from './components/AdminDashboard';
import ProfilePage from './components/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import TestPage from './components/TestPage';
import SimpleTest from './components/SimpleTest';
import PdfTestPage from './components/PdfTestPage';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <Routes>
            {/* 公开路由 */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/simple" element={<SimpleTest />} />
            <Route path="/pdf-test" element={<PdfTestPage />} />
            
            {/* 受保护的路由 */}
            <Route path="/" element={
              <ProtectedRoute>
                <BookShelf />
              </ProtectedRoute>
            } />
            <Route path="/read/:bookId" element={
              <ProtectedRoute>
                <ReaderView />
              </ProtectedRoute>
            } />
            <Route path="/create/:bookId" element={
              <ProtectedRoute>
                <CreatorView />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;