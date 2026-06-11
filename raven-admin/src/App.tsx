import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminConsole } from './pages/AdminConsole';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminConsole />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;