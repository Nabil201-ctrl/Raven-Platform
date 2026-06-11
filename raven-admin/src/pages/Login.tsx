import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAppContext();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('femi@raven.app');
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
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden select-none"
      style={{
        background: '#04060a',
        fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Decorative background orbs */}
      <div 
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-20 pointer-events-none blur-[120px]"
        style={{ background: 'radial-gradient(circle, #2a6ff5 0%, transparent 70%)' }}
      />
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-10 pointer-events-none blur-[150px]"
        style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-[420px] z-10 relative">
        {/* Brand logo container */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgba(42, 111, 245, 0.15) 0%, rgba(124, 58, 237, 0.05) 100%)',
              border: '1px solid rgba(42, 111, 245, 0.3)',
              boxShadow: '0 8px 32px rgba(42, 111, 245, 0.15)',
            }}
          >
            {/* Elegant Raven Icon (SVG) */}
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#2a6ff5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="#9061f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-1" style={{ color: '#ffffff', letterSpacing: '-0.025em' }}>
            RAVEN
          </h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#2a6ff5]">
            Next-Gen Campus Transit
          </p>
        </div>

        {/* Auth Glass Card */}
        <div
          className="rounded-3xl p-8 transition-all duration-300"
          style={{
            background: 'rgba(10, 12, 18, 0.75)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          }}
        >
          {/* Switch tabs */}
          <div 
            className="flex p-1 rounded-xl mb-6"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
            }}
          >
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(null); }}
              className="flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer"
              style={{
                background: isLogin ? 'rgba(255, 255, 255, 0.07)' : 'transparent',
                color: isLogin ? '#ffffff' : '#7c8ba1',
              }}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(null); }}
              className="flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer"
              style={{
                background: !isLogin ? 'rgba(255, 255, 255, 0.07)' : 'transparent',
                color: !isLogin ? '#ffffff' : '#7c8ba1',
              }}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div 
              className="p-4 rounded-xl mb-4 text-xs font-semibold border"
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
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oluwafemi Sheriff"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:border-[#2a6ff5] focus:ring-1 focus:ring-[#2a6ff5]/20"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                  }}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="femi@raven.app"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:border-[#2a6ff5] focus:ring-1 focus:ring-[#2a6ff5]/20"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:border-[#2a6ff5] focus:ring-1 focus:ring-[#2a6ff5]/20"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                }}
              />
            </div>

            <div className="text-[10px] text-gray-500 font-medium leading-relaxed pt-1">
              ⚡ Default testing account: <span className="text-[#2a6ff5] font-semibold">femi@raven.app</span> / <span className="text-[#2a6ff5] font-semibold">password123</span>.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-6 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #2a6ff5 0%, #1e50b3 100%)',
                color: '#ffffff',
                boxShadow: '0 8px 24px rgba(42, 111, 245, 0.25)',
              }}
            >
              {loading ? (
                <div 
                  className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"
                />
              ) : isLogin ? 'Access Platform' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
