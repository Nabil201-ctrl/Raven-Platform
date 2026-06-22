import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAppContext } from '../context/AppContext';
import { HomeIcon, UserIcon, ShuttleIcon, KekeIcon } from '../icons';

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { path: '/',         Icon: HomeIcon,    label: 'Home'     },
  { path: '/shuttles', Icon: ShuttleIcon, label: 'Shuttles' },
  { path: '/keke',     Icon: KekeIcon,    label: 'Keke'     },
  { path: '/profile',  Icon: UserIcon,    label: 'Profile'  },
] as const;

function isNavActive(pathname: string, navPath: string): boolean {
  if (navPath === '/') return pathname === '/';
  if (navPath === '/shuttles') return pathname === '/shuttles' || pathname.startsWith('/shuttle/');
  if (navPath === '/keke') return pathname === '/keke' || pathname.startsWith('/keke/');
  return pathname === navPath;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { theme } = useAppContext();

  const isDark = theme === 'dark';

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'RV';

  const cssVars = isDark
    ? {
        '--bg-app':            '#000000',
        '--card-bg':           '#111111',
        '--card-border':       '#222222',
        '--inset-bg':          '#1a1a1a',
        '--avatar-bg':         '#1e293b',
        '--header-bg':         'rgba(0,0,0,0.92)',
        '--nav-bg':            'rgba(0,0,0,0.96)',
        '--text-primary':      '#ffffff',
        '--text-secondary':    'rgba(255,255,255,0.75)',
        '--text-muted':        '#666666',
        '--accent-blue':       '#2a6ff5',
        '--accent-blue-light': '#4a8aff',
        '--accent-cyan':       '#0891b2',
        '--green-active':      '#22c55e',
        '--amber-premium':     '#f59e0b',
      }
    : {
        '--bg-app':            '#f7f8fa',
        '--card-bg':           '#ffffff',
        '--card-border':       '#e5e7eb',
        '--inset-bg':          '#f1f3f5',
        '--avatar-bg':         '#e5e7eb',
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
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div className="flex items-center gap-2">
              <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="var(--accent-blue)" />
                <circle cx="16" cy="16" r="5" fill="white" />
                <circle cx="16" cy="16" r="2" fill="var(--accent-blue)" />
              </svg>
              <div>
                <span className="text-xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                  Raven
                </span>
                <p className="text-[0.6rem] tracking-wide" style={{ color: 'var(--text-muted)', letterSpacing: '0.6px' }}>
                  SMART CAMPUS TRANSIT
                </p>
              </div>
            </div>
          </Link>

          <Link to="/profile">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold hover:opacity-80 transition-opacity"
              style={{ background: 'var(--accent-blue)', color: 'white' }}
            >
              {initials}
            </div>
          </Link>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-5 pb-28">
        {children}
      </main>

      {/* Bottom nav */}
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
          <div className="flex justify-around items-center py-1 px-1">
            {NAV_ITEMS.map(({ path, Icon, label }) => {
              const active = isNavActive(location.pathname, path);
              return (
                <Link
                  key={path}
                  to={path}
                  className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all"
                  style={{
                    color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
                    background: active
                      ? isDark ? 'rgba(42,111,245,0.12)' : 'rgba(42,111,245,0.08)'
                      : 'transparent',
                    minWidth: 56,
                    textDecoration: 'none',
                  }}
                >
                  <Icon size={20} strokeWidth={active ? 2 : 1.6} />
                  <span style={{ fontSize: '0.58rem', fontWeight: active ? 600 : 400, letterSpacing: '0.2px' }}>
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