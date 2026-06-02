import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ShuttleBooking } from './pages/ShuttleBooking';
import { KekeBooking } from './pages/KekeBooking';
import { Payment } from './pages/Payment';
import { BookingConfirmation } from './pages/BookingConfirmation';
import { LastRideDetails } from './pages/LastRideDetails';
import { Wallet } from './pages/Wallet';
import { Calls } from './pages/Calls';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';

// Secures routes and displays a sleek command center loader during user state hydration
const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAppContext();
  const isLoggedIn = localStorage.getItem('raven_is_logged_in') === 'true';

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center"
        style={{
          background: '#050608',
          color: '#ffffff',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
        }}
      >
        <div 
          className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mb-4" 
          style={{ borderColor: 'var(--accent-blue, #146ef5)' }}
        />
        <p className="text-[10px] tracking-[0.2em] text-gray-500 font-bold uppercase">
          Hydrating Command Center...
        </p>
      </div>
    );
  }

  return <Layout>{children}</Layout>;
};

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/shuttle/:id" element={<ProtectedLayout><ShuttleBooking /></ProtectedLayout>} />
      <Route path="/keke/:id" element={<ProtectedLayout><KekeBooking /></ProtectedLayout>} />
      <Route path="/payment" element={<ProtectedLayout><Payment /></ProtectedLayout>} />
      <Route path="/confirmation/:bookingId" element={<ProtectedLayout><BookingConfirmation /></ProtectedLayout>} />
      <Route path="/last-ride/:id" element={<ProtectedLayout><LastRideDetails /></ProtectedLayout>} />
      <Route path="/wallet" element={<ProtectedLayout><Wallet /></ProtectedLayout>} />
      <Route path="/calls" element={<ProtectedLayout><Calls /></ProtectedLayout>} />
      <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
}

export default App;