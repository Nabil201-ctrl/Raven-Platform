import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import {
  WalletIcon, PhoneIcon, StarIcon,
  ArrowRightIcon, CheckIcon,
} from '../icons';

/* ── Small reusable row ──────────────────────────────── */
const SettingRow: React.FC<{
  label: string;
  value?: string;
  onClick?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
}> = ({ label, value, onClick, right, danger }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between py-3.5 px-4 rounded-xl transition-all active:scale-[0.99]"
    style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      cursor: onClick ? 'pointer' : 'default',
      color: danger ? '#ef4444' : 'var(--text-primary)',
    }}
  >
    <span className="text-sm font-medium">{label}</span>
    <div className="flex items-center gap-2">
      {value && <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{value}</span>}
      {right}
      {onClick && !right && <ArrowRightIcon size={14} style={{ color: 'var(--text-muted)' } as React.CSSProperties} />}
    </div>
  </button>
);

/* ── Toggle switch ───────────────────────────────────── */
const Toggle: React.FC<{ on: boolean; onToggle: () => void }> = ({ on, onToggle }) => (
  <button
    onClick={onToggle}
    className="relative flex-shrink-0 transition-all"
    style={{
      width: 44,
      height: 24,
      borderRadius: 12,
      background: on ? 'var(--accent-blue)' : 'var(--inset-bg)',
      border: 'none',
      cursor: 'pointer',
    }}
    aria-label="Toggle"
  >
    <span
      className="absolute top-0.5 transition-all duration-200"
      style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: 'white',
        left: on ? 22 : 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {on && <CheckIcon size={11} style={{ color: 'var(--accent-blue)' } as React.CSSProperties} />}
    </span>
  </button>
);

/* ── Sun / Moon SVG icons (inline, no emoji) ─────────── */
const SunIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M12 2V4M12 20V22M2 12H4M20 12H22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const MoonIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
  </svg>
);

const ShieldIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
    <path d="M12 22C12 22 4 18 4 12V5L12 2L20 5V12C20 18 12 22 12 22Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BellIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const LogOutIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

/* ── Main component ──────────────────────────────────── */
export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, balance, callMinutes, theme, toggleTheme } = useAppContext();

  const [notifications, setNotifications] = useState(true);

  const isDark = theme === 'dark';

  const SectionLabel: React.FC<{ text: string }> = ({ text }) => (
    <p
      className="text-xs font-semibold tracking-widest mt-6 mb-2 px-1"
      style={{ color: 'var(--text-muted)', letterSpacing: '1.5px' }}
    >
      {text}
    </p>
  );

  return (
    <div className="space-y-1 animate-fade-up pb-4">

      {/* Avatar card */}
      <div
        className="rounded-2xl p-5 flex items-center gap-4 mb-2"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
          style={{ background: 'var(--accent-blue)', color: 'white' }}
        >
          {user?.name
            ?.split(' ')
            .map(n => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'RV'}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
            {user?.name || 'Student'}
          </h2>
          <p className="text-sm mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
            {user?.email || '—'}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-2 h-2 rounded-full active-dot" style={{ background: 'var(--green-active)' }} />
            <span className="text-xs" style={{ color: 'var(--green-active)' }}>Active student</span>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {[
          {
            Icon: WalletIcon,
            label: 'Wallet Balance',
            value: `₦${balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
            mono: true,
            onClick: () => navigate('/wallet'),
          },
          {
            Icon: PhoneIcon,
            label: 'Call Minutes',
            value: `${callMinutes} min`,
            mono: true,
            onClick: () => navigate('/calls'),
          },
        ].map(({ Icon, label, value, mono, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
          >
            <Icon size={16} style={{ color: 'var(--accent-blue-light)' } as React.CSSProperties} />
            <p className="text-xs mt-2 mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p
              className="text-base font-bold"
              style={{
                color: 'var(--text-primary)',
                fontFamily: mono ? "'DM Mono', monospace" : undefined,
              }}
            >
              {value}
            </p>
          </button>
        ))}
      </div>

      {/* Appearance */}
      <SectionLabel text="APPEARANCE" />
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
      >
        <div className="flex items-center justify-between py-3.5 px-4">
          <div className="flex items-center gap-3">
            <span style={{ color: 'var(--text-muted)' }}>
              {isDark ? <MoonIcon size={16} /> : <SunIcon size={16} />}
            </span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {isDark ? 'Dark mode' : 'Light mode'}
            </span>
          </div>

          {/* Theme picker — two buttons side by side */}
          <div
            className="flex items-center rounded-xl overflow-hidden"
            style={{ background: 'var(--inset-bg)', border: '1px solid var(--card-border)', padding: 3, gap: 3 }}
          >
            {(['dark', 'light'] as const).map(t => (
              <button
                key={t}
                onClick={() => { if (theme !== t) toggleTheme(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: theme === t ? 'var(--accent-blue)' : 'transparent',
                  color: theme === t ? 'white' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {t === 'dark' ? <MoonIcon size={12} /> : <SunIcon size={12} />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preferences */}
      <SectionLabel text="PREFERENCES" />
      <div className="space-y-1.5">
        <div
          className="flex items-center justify-between py-3.5 px-4 rounded-xl"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <div className="flex items-center gap-3">
            <BellIcon size={16} style={{ color: 'var(--text-muted)' } as React.CSSProperties} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Ride notifications
            </span>
          </div>
          <Toggle on={notifications} onToggle={() => setNotifications(p => !p)} />
        </div>
      </div>

      {/* Account */}
      <SectionLabel text="ACCOUNT" />
      <div className="space-y-1.5">
        <SettingRow
          label="Privacy & Security"
          right={<ShieldIcon size={15} style={{ color: 'var(--text-muted)' } as React.CSSProperties} />}
          onClick={() => alert('Privacy settings — coming soon.')}
        />
        <SettingRow
          label="Raven App Version"
          value="1.0.0"
        />
        <SettingRow
          label="Rate the App"
          right={
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => (
                <StarIcon key={s} size={12} filled className="text-amber-400"
                  style={{ color: '#fbbf24' } as React.CSSProperties}
                />
              ))}
            </div>
          }
          onClick={() => alert('Thank you for your feedback!')}
        />
        <SettingRow
          label="Sign Out"
          danger
          onClick={() => {
            if (confirm('Sign out of Raven?')) navigate('/');
          }}
          right={<LogOutIcon size={15} style={{ color: '#ef4444' } as React.CSSProperties} />}
        />
      </div>
    </div>
  );
};