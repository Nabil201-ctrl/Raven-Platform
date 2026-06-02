import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAppContext();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('demo@raven.com');
  const [password, setPassword] = useState('password123');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/');
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden select-none animate-fade-in"
      style={{
        background: 'var(--bg-primary, #050608)',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <div className="w-full max-w-[420px] z-10">
        {/* Brand logo container */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 24px rgba(255, 255, 255, 0.03)',
            }}
          >
            {/* Elegant Raven Icon (SVG) */}
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--text-primary, #ffffff)' }}>
            RAVEN
          </h1>
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted, #7c8ba1)' }}>
            Next-Gen Campus Transit Platform
          </p>
        </div>

        {/* Auth Glass Card */}
        <div
          className="rounded-3xl p-8 transition-all duration-300"
          style={{
            background: 'rgba(25, 28, 36, 0.65)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Switch tabs */}
          <div 
            className="flex p-1 rounded-xl mb-6"
            style={{
              background: 'rgba(10, 12, 16, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(null); }}
              className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all"
              style={{
                background: isLogin ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: isLogin ? '#ffffff' : 'var(--text-muted, #7c8ba1)',
              }}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(null); }}
              className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all"
              style={{
                background: !isLogin ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: !isLogin ? '#ffffff' : 'var(--text-muted, #7c8ba1)',
              }}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div 
              className="p-4 rounded-xl mb-4 text-xs font-medium border animate-shake"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#f87171',
                borderColor: 'rgba(239, 68, 68, 0.2)',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-muted, #7c8ba1)' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oluwafemi Sheriff"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-1 focus:ring-white/30"
                  style={{
                    background: 'rgba(10, 12, 16, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-primary, #ffffff)',
                  }}
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-muted, #7c8ba1)' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="femi@raven.app"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-1 focus:ring-white/30"
                style={{
                  background: 'rgba(10, 12, 16, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-primary, #ffffff)',
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-muted, #7c8ba1)' }}>
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-1 focus:ring-white/30"
                style={{
                  background: 'rgba(10, 12, 16, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-primary, #ffffff)',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-6 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                color: '#050608',
                boxShadow: '0 4px 16px rgba(255, 255, 255, 0.05)',
              }}
            >
              {loading ? (
                <div 
                  className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin"
                />
              ) : isLogin ? 'Access Platform' : 'Create Account'}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
};
