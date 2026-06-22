import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Dashboard } from './pages/Dashboard';
import { ShuttleList } from './pages/ShuttleList';
import { KekeList } from './pages/KekeList';
import { ShuttleBooking } from './pages/ShuttleBooking';
import { KekeBooking } from './pages/KekeBooking';
import { Payment } from './pages/Payment';
import { BookingConfirmation } from './pages/BookingConfirmation';
import { LastRideDetails } from './pages/LastRideDetails';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { authStorage } from './services/authStorage';

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
      style={{ borderColor: 'var(--accent-blue, #146ef5)' }}
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

  return <Layout>{children}</Layout>;
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
      <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/shuttles" element={<ProtectedLayout><ShuttleList /></ProtectedLayout>} />
      <Route path="/keke" element={<ProtectedLayout><KekeList /></ProtectedLayout>} />
      <Route path="/shuttle/:id" element={<ProtectedLayout><ShuttleBooking /></ProtectedLayout>} />
      <Route path="/keke/:id" element={<ProtectedLayout><KekeBooking /></ProtectedLayout>} />
      <Route path="/payment" element={<ProtectedLayout><Payment /></ProtectedLayout>} />
      <Route path="/confirmation/:bookingId" element={<ProtectedLayout><BookingConfirmation /></ProtectedLayout>} />
      <Route path="/last-ride/:id" element={<ProtectedLayout><LastRideDetails /></ProtectedLayout>} />
      <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
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