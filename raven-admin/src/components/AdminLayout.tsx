import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: '#07080a',
        color: '#ffffff',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <header className="px-6 py-4 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
            <h1 className="text-lg font-bold tracking-tight">Raven Admin</h1>
          </div>
          <p className="text-[10px] text-gray-500 font-semibold tracking-wider mt-0.5 uppercase">
            Command Center
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <div className="text-right">
              <p className="text-xs font-semibold text-white">{user.name}</p>
              <p className="text-[10px] text-gray-500">{user.email}</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-900 border border-gray-800 hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
};