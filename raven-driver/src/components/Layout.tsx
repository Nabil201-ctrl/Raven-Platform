import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../hooks/useWallet';
import { useAppContext } from '../context/AppContext';
import { HomeIcon, WalletIcon, PhoneIcon, UserIcon } from '../icons';

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { path: '/',        Icon: HomeIcon,   label: 'Home'    },
  { path: '/wallet',  Icon: WalletIcon, label: 'Wallet'  },
  { path: '/calls',   Icon: PhoneIcon,  label: 'Calls'   },
  { path: '/profile', Icon: UserIcon,   label: 'Profile' },
] as const;

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { balance } = useWallet();
  const { theme } = useAppContext();

  const isDark = theme === 'dark';

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'RV';

  // Runtime CSS variables — swapped by theme so every page just uses var(--x)
  const cssVars = isDark
    ? {
        '--bg-app':            '#000000',
        '--card-bg':           '#111111',
        '--card-border':       '#222222',
        '--inset-bg':          '#1a1a1a',
        '--avatar-bg':         '#1a2744',
        '--header-bg':         'rgba(0,0,0,0.92)',
        '--nav-bg':            'rgba(0,0,0,0.96)',
        '--text-primary':      '#ffffff',
        '--text-secondary':    'rgba(255,255,255,0.75)',
        '--text-muted':        '#666666',
        '--accent-blue':       '#2a6ff5',
        '--accent-blue-light': '#4a8aff',
        '--accent-cyan':       '#00c0ff',
        '--green-active':      '#22c55e',
        '--amber-premium':     '#f59e0b',
      }
    : {
        '--bg-app':            '#f7f8fa',
        '--card-bg':           '#ffffff',
        '--card-border':       '#e5e7eb',
        '--inset-bg':          '#f1f3f5',
        '--avatar-bg':         '#e0e8f5',
        '--header-bg':         'rgba(247,248,250,0.92)',
        '--nav-bg':            'rgba(247,248,250,0.96)',
        '--text-primary':      '#111827',
        '--text-secondary':    '#374151',
        '--text-muted':        '#9ca3af',
        '--accent-blue':       '#2563eb',
        '--accent-blue-light': '#3b82f6',
        '--accent-cyan':       '#0284c7',
        '--green-active':      '#16a34a',
        '--amber-premium':     '#b45309',
      };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ ...(cssVars as React.CSSProperties), background: 'var(--bg-app)' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b w-full"
        style={{
          background: 'var(--header-bg)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderColor: 'var(--card-border)',
        }}
      >
        <div className="max-w-md mx-auto w-full px-4 py-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="var(--accent-blue)"/>
                <circle cx="16" cy="16" r="5" fill="white"/>
                <circle cx="16" cy="16" r="2" fill="var(--accent-blue)"/>
              </svg>
              <span className="text-xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                Raven
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '0.6rem', letterSpacing: '0.6px' }}>
              SWIPE WALLET · SMART TRANSIT
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Balance</p>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace" }}>
                ₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Link to="/profile">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold hover:opacity-80 transition-opacity"
                style={{ background: 'var(--accent-blue)', color: 'white' }}
              >
                {initials}
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-5 pb-28">
        {children}
      </main>

      {/* Bottom nav — fixed, but clipped to the same max-w-md column */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <nav
          className="w-full max-w-md pointer-events-auto border-t"
          style={{
            background: 'var(--nav-bg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderColor: 'var(--card-border)',
          }}
        >
          <div className="flex justify-around items-center py-1 px-2">
            {NAV_ITEMS.map(({ path, Icon, label }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl transition-all"
                  style={{
                    color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
                    background: active
                      ? isDark ? 'rgba(42,111,245,0.12)' : 'rgba(42,111,245,0.08)'
                      : 'transparent',
                    minWidth: 60,
                    textDecoration: 'none',
                  }}
                >
                  <Icon size={21} strokeWidth={active ? 2 : 1.6} />
                  <span style={{ fontSize: '0.62rem', fontWeight: active ? 600 : 400, letterSpacing: '0.3px' }}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};