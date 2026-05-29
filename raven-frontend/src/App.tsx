import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
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

function App() {
  return (
    // AppProvider wraps everything so wallet, calls, theme and
    // booked-seat state are shared across every page and hook.
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/"                        element={<Dashboard />} />
            <Route path="/shuttle/:id"             element={<ShuttleBooking />} />
            <Route path="/keke/:id"                element={<KekeBooking />} />
            <Route path="/payment"                 element={<Payment />} />
            <Route path="/confirmation/:bookingId" element={<BookingConfirmation />} />
            <Route path="/last-ride/:id"           element={<LastRideDetails />} />
            <Route path="/wallet"                  element={<Wallet />} />
            <Route path="/calls"                   element={<Calls />} />
            <Route path="/profile"                 element={<Profile />} />
            <Route path="*"                        element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;