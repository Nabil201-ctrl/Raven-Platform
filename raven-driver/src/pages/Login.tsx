import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { driverStorage } from '../services/driverStorage';
import type { Driver } from '../types';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [systemCode, setSystemCode] = useState('');

  const [name, setName] = useState('');
  const [vehicleType, setVehicleType] = useState<'shuttle' | 'keke' | 'bike'>('shuttle');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [registeredCode, setRegisteredCode] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const stateError = (location.state as { error?: string })?.error;
  const [error, setError] = useState<string | null>(stateError || null);
  const [pendingVerification, setPendingVerification] = useState<Driver | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!systemCode.trim()) {
      setError('Please enter your system code.');
      return;
    }
    setLoading(true);
    setError(null);
    setPendingVerification(null);

    try {
      const driver = await api.verifyDriverCode(systemCode.trim());

      if (driver.isVerified === false || driver.isApproved === false) {
        setPendingVerification(driver);
        return;
      }

      driverStorage.setDriver(driver);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please check your system code.');
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
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 select-none"
      style={{
        background: '#050608',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: '#111215',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Raven Drivers</h1>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
            Driver Console Access
          </p>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{
            background: '#111215',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div
            className="flex p-1 rounded-xl mb-6"
            style={{
              background: '#0a0c10',
              border: '1px solid rgba(255, 255, 255, 0.04)',
            }}
          >
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(null); setPendingVerification(null); }}
              className="flex-1 py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              style={{
                background: isLogin ? 'rgba(255, 255, 255, 0.07)' : 'transparent',
                color: isLogin ? '#ffffff' : '#9ca3af',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(null); setRegisteredCode(null); setPendingVerification(null); }}
              className="flex-1 py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              style={{
                background: !isLogin ? 'rgba(255, 255, 255, 0.07)' : 'transparent',
                color: !isLogin ? '#ffffff' : '#9ca3af',
              }}
            >
              Register
            </button>
          </div>

          {error && (
            <div
              className="p-3 rounded-lg mb-4 text-xs font-medium border"
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
              className="p-4 rounded-lg mb-4 text-xs border space-y-2"
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                color: '#fbbf24',
                borderColor: 'rgba(245, 158, 11, 0.15)',
              }}
            >
              <p className="font-semibold text-sm">
                {!pendingVerification.isVerified ? 'Verification pending' : 'Approval pending'}
              </p>
              <p>
                Profile <strong className="text-white">{pendingVerification.name}</strong> is awaiting{' '}
                {!pendingVerification.isVerified ? 'credential verification' : 'administrator approval'}.
              </p>
              <p className="text-gray-400 leading-relaxed">
                Contact your administrator to approve this profile, then sign in with code{' '}
                <strong className="font-mono text-white">{pendingVerification.systemCode}</strong>.
              </p>
            </div>
          )}

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  System Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1001"
                  value={systemCode}
                  onChange={e => setSystemCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#2563eb] font-mono"
                  style={{
                    background: '#0a0c10',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50 cursor-pointer"
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                }}
              >
                {loading ? 'Verifying...' : 'Enter Console'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              {registeredCode ? (
                <div className="p-4 rounded-xl bg-[#0a0c10] border border-gray-800 text-xs text-gray-300 space-y-3">
                  <p className="text-green-400 font-semibold text-sm">Registration received</p>
                  <p>
                    Your system code:{' '}
                    <strong className="font-mono text-white text-base">{registeredCode}</strong>
                  </p>
                  <p className="text-gray-400 leading-relaxed">
                    An administrator must verify your profile before you can access the console.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSystemCode(registeredCode);
                      setRegisteredCode(null);
                      setIsLogin(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#2563eb] text-xs font-semibold text-white mt-2 cursor-pointer"
                  >
                    Proceed to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#2563eb]"
                      style={{
                        background: '#0a0c10',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#ffffff',
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        Vehicle Type
                      </label>
                      <select
                        value={vehicleType}
                        onChange={e => setVehicleType(e.target.value as 'shuttle' | 'keke' | 'bike')}
                        className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#2563eb]"
                        style={{
                          background: '#0a0c10',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: '#ffffff',
                        }}
                      >
                        <option value="shuttle">Shuttle</option>
                        <option value="keke">Keke</option>
                        <option value="bike">Bike</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        Plate Number
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ABJ-456-ZZ"
                        value={vehiclePlate}
                        onChange={e => setVehiclePlate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#2563eb] font-mono"
                        style={{
                          background: '#0a0c10',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: '#ffffff',
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 mt-2 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50 cursor-pointer"
                    style={{
                      background: '#ffffff',
                      color: '#050608',
                    }}
                  >
                    {loading ? 'Submitting...' : 'Submit Registration'}
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