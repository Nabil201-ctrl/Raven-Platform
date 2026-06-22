import React from 'react';
import { useNavigate } from 'react-router-dom';
import { driverStorage } from '../services/driverStorage';
import type { Driver } from '../types';

interface DriverLayoutProps {
  driver: Driver;
  children: React.ReactNode;
}

export const DriverLayout: React.FC<DriverLayoutProps> = ({ driver, children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    driverStorage.clear();
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
            <h1 className="text-lg font-bold tracking-tight">Raven Driver Console</h1>
          </div>
          <p className="text-[10px] text-gray-500 font-semibold tracking-wider mt-0.5 uppercase">
            {driver.vehicleType} · Code {driver.systemCode}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-semibold text-white">{driver.name}</p>
            <p className="text-[10px] text-gray-500 font-mono">{driver.vehiclePlate}</p>
          </div>
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