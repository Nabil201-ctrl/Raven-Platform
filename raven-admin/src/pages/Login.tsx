import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAppContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify your credentials.');
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
      <div className="w-full max-w-[400px]">
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
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Raven Admin</h1>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
            Administrator Sign In
          </p>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{
            background: '#111215',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="admin@raven.transit"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#2563eb]"
                style={{
                  background: '#0a0c10',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#2563eb]"
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
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-[10px] text-gray-600 text-center mt-5 leading-relaxed">
            Administrator accounts are provisioned by your organization.
          </p>
        </div>
      </div>
    </div>
  );
};