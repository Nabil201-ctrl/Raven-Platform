import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { AdminLayout } from './components/AdminLayout';
import { AdminConsole } from './pages/AdminConsole';
import { Login } from './pages/Login';
import { ErrorBoundary } from './components/ErrorBoundary';
import { authStorage } from './services/authStorage';
import './App.css';

const AuthLoader: React.FC = () => (
  <div
    className="min-h-screen flex flex-col items-center justify-center"
    style={{
      background: '#050608',
      color: '#ffffff',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}
  >
    <div
      className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mb-4"
      style={{ borderColor: '#2563eb' }}
    />
    <p className="text-[10px] tracking-[0.2em] text-gray-500 font-bold uppercase">
      Verifying session...
    </p>
  </div>
);

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, authChecking } = useAppContext();
  const location = useLocation();

  if (authChecking) {
    return <AuthLoader />;
  }

  if (!authStorage.getToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!user) {
    return <AuthLoader />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, authChecking } = useAppContext();
  const location = useLocation();

  if (authChecking) {
    return <AuthLoader />;
  }

  if (authStorage.getToken() && user) {
    const redirectTo = (location.state as { from?: string })?.from || '/';
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route path="/" element={<ProtectedLayout><AdminConsole /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          <AppContent />
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;