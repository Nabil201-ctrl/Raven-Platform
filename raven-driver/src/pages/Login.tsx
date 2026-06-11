import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import type { Driver } from '../types';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [systemCode, setSystemCode] = useState('');
  
  // Registration state
  const [name, setName] = useState('');
  const [vehicleType, setVehicleType] = useState<'shuttle' | 'keke' | 'bike'>('shuttle');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [registeredCode, setRegisteredCode] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const stateError = (location.state as any)?.error;
  const [error, setError] = useState<string | null>(stateError || null);
  const [pendingVerification, setPendingVerification] = useState<Driver | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!systemCode.trim()) {
      setError('Please enter your System Code.');
      return;
    }
    setLoading(true);
    setError(null);
    setPendingVerification(null);

    try {
      // Call api.verifyDriverCode
      const driver = await api.verifyDriverCode(systemCode.trim());
      
      // If the driver exists but is not verified or approved, block access
      if (driver.isVerified === false || driver.isApproved === false) {
        setPendingVerification(driver);
        return;
      }

      // Successful login
      localStorage.setItem('raven_logged_in_driver', JSON.stringify(driver));
      navigate('/');
    } catch (err: any) {
      console.error('Driver verification failed:', err);
      setError(err?.message || 'Verification failed. Please verify your system code.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !vehiclePlate.trim()) {
      setError('Please fill in all registration fields.');
      return;
    }
    setLoading(true);
    setError(null);
    setRegisteredCode(null);

    try {
      const newDriver = await api.registerDriver({
        name: name.trim(),
        vehicleType,
        vehiclePlate: vehiclePlate.trim(),
      });
      setRegisteredCode(newDriver.systemCode);
      setName('');
      setVehiclePlate('');
    } catch (err: any) {
      console.error('Driver registration failed:', err);
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden select-none animate-fade-in"
      style={{
        background: 'radial-gradient(circle at top right, rgba(42, 111, 245, 0.08), transparent 40%), #07080a',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Decorative ambient glow blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full filter blur-[120px] opacity-10" style={{ background: '#2a6ff5' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full filter blur-[120px] opacity-5" style={{ background: '#ffffff' }} />

      <div className="w-full max-w-[440px] z-10">
        {/* Brand logo container */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgba(42, 111, 245, 0.15) 0%, rgba(255, 255, 255, 0.02) 100%)',
              border: '1px solid rgba(42, 111, 245, 0.25)',
              boxShadow: '0 8px 32px rgba(42, 111, 245, 0.1)',
            }}
          >
            {/* Elegant Raven Driver Icon (SVG) */}
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#2a6ff5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="#2a6ff5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="#2a6ff5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="7" r="2" fill="#ffffff" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: '#ffffff' }}>
            RAVEN DRIVERS
          </h1>
          <p className="text-sm font-medium" style={{ color: '#7c8ba1' }}>
            Campus Transit Telemetry Console
          </p>
        </div>

        {/* Auth Glass Card */}
        <div
          className="rounded-3xl p-8 transition-all duration-300"
          style={{
            background: 'rgba(17, 18, 21, 0.75)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Switch tabs */}
          <div 
            className="flex p-1 rounded-xl mb-6"
            style={{
              background: 'rgba(10, 12, 16, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
            }}
          >
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(null); setPendingVerification(null); }}
              className="flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all"
              style={{
                background: isLogin ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: isLogin ? '#ffffff' : '#7c8ba1',
              }}
            >
              Console Access
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(null); setRegisteredCode(null); setPendingVerification(null); }}
              className="flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all"
              style={{
                background: !isLogin ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: !isLogin ? '#ffffff' : '#7c8ba1',
              }}
            >
              Register Profile
            </button>
          </div>

          {error && (
            <div 
              className="p-4 rounded-xl mb-5 text-xs font-medium border animate-shake"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#f87171',
                borderColor: 'rgba(239, 68, 68, 0.15)',
              }}
            >
              {error}
            </div>
          )}

          {pendingVerification && (
            <div 
              className="p-4 rounded-xl mb-5 text-xs border space-y-2"
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                color: '#fbbf24',
                borderColor: 'rgba(245, 158, 11, 0.15)',
              }}
            >
              <div className="font-bold text-sm">
                {!pendingVerification.isVerified ? 'Verification Pending' : 'Approval Pending'}
              </div>
              <p>
                Driver Profile <strong className="text-white">{pendingVerification.name}</strong> is awaiting {!pendingVerification.isVerified ? 'credentials verification' : 'administrator approval'}.
              </p>
              <p className="text-gray-400 text-[11px] leading-relaxed">
                Please visit the Admin Console at <span className="font-mono text-white">http://localhost:3002</span> to approve this profile, then log in using code <strong className="font-mono text-white text-sm bg-black/40 px-1 py-0.5 rounded border border-gray-800">{pendingVerification.systemCode}</strong>.
              </p>
            </div>
          )}

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">
                  System Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1001"
                  value={systemCode}
                  onChange={e => setSystemCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#2a6ff5]/50"
                  style={{
                    background: 'rgba(10, 12, 16, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                  }}
                />
              </div>

              <div className="text-[10px] text-gray-500 font-medium leading-relaxed">
                ⚡ Seeded testing profiles: <code className="text-[#2a6ff5] font-bold">1001</code> (Shuttle), <code className="text-[#2a6ff5] font-bold">2002</code> (Keke), <code className="text-[#2a6ff5] font-bold">DRV002</code> (Shuttle).
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-6 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #2a6ff5 0%, #1e50b3 100%)',
                  color: '#ffffff',
                  boxShadow: '0 4px 20px rgba(42, 111, 245, 0.2)',
                }}
              >
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : 'Enter Console'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              {registeredCode ? (
                <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/30 text-xs text-gray-300 space-y-3">
                  <p className="text-green-400 font-bold text-sm">✓ Registration Received</p>
                  <p>
                    Your generated system code is:{' '}
                    <strong className="font-mono text-white text-base bg-black px-2 py-0.5 rounded border border-gray-800">
                      {registeredCode}
                    </strong>
                  </p>
                  <p className="text-gray-400 leading-relaxed text-[11px]">
                    To access the driver telemetry console, this profile must first be verified by an administrator.
                  </p>
                  <div className="pt-2">
                    <a
                      href="http://localhost:3002"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block px-3 py-1.5 rounded bg-[#2a6ff5] hover:bg-blue-600 text-white font-bold text-[11px] transition-all"
                    >
                      Open Admin Console (Port 3002)
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSystemCode(registeredCode);
                      setRegisteredCode(null);
                      setIsLogin(true);
                    }}
                    className="w-full py-2.5 rounded bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-bold text-white mt-2"
                  >
                    Proceed to Login
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Ade"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#2a6ff5]/50"
                      style={{
                        background: 'rgba(10, 12, 16, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#ffffff',
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-400">
                        Vehicle Type
                      </label>
                      <select
                        value={vehicleType}
                        onChange={e => setVehicleType(e.target.value as any)}
                        className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#2a6ff5]/50 outline-none"
                        style={{
                          background: 'rgba(10, 12, 16, 0.5)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: '#ffffff',
                        }}
                      >
                        <option value="shuttle" style={{ background: '#0a0c10' }}>Shuttle</option>
                        <option value="keke" style={{ background: '#0a0c10' }}>Keke</option>
                        <option value="bike" style={{ background: '#0a0c10' }}>Bike</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-400">
                        Plate Number
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. ABJ-456-ZZ"
                        value={vehiclePlate}
                        onChange={e => setVehiclePlate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#2a6ff5]/50 font-mono"
                        style={{
                          background: 'rgba(10, 12, 16, 0.5)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: '#ffffff',
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 mt-6 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                      color: '#050608',
                      boxShadow: '0 4px 20px rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    {loading ? (
                      <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    ) : 'Submit Registration'}
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
