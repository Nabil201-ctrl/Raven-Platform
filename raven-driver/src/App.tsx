import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DriverConsole } from './pages/DriverConsole';
import { Login } from './pages/Login';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<DriverConsole />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;