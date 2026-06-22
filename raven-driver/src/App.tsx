import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DriverConsole } from './pages/DriverConsole';
import { Login } from './pages/Login';
import { ErrorBoundary } from './components/ErrorBoundary';
import { driverStorage } from './services/driverStorage';
import './App.css';

const ProtectedDriverRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const driver = driverStorage.getDriver();

  if (!driver) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  if (driverStorage.isLoggedIn()) {
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
      <Route
        path="/"
        element={
          <ProtectedDriverRoute>
            <DriverConsole />
          </ProtectedDriverRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
}

export default App;