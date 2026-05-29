import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Booking, Driver } from '../types';
import {
  CheckCircleIcon, StarIcon, HeartIcon, FlagIcon, ThumbsUpIcon, PhoneIcon, ArrowLeftIcon,
} from '../icons';

/* ── QR placeholder (SVG pattern) ───────────────────── */
const QrPlaceholder: React.FC = () => (
  <svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
    {/* Outer corners */}
    <rect x="2" y="2" width="22" height="22" rx="2" fill="none" stroke="currentColor" strokeWidth="2.5"/>
    <rect x="6" y="6" width="14" height="14" rx="1" fill="currentColor" opacity="0.7"/>
    <rect x="56" y="2" width="22" height="22" rx="2" fill="none" stroke="currentColor" strokeWidth="2.5"/>
    <rect x="60" y="6" width="14" height="14" rx="1" fill="currentColor" opacity="0.7"/>
    <rect x="2" y="56" width="22" height="22" rx="2" fill="none" stroke="currentColor" strokeWidth="2.5"/>
    <rect x="6" y="60" width="14" height="14" rx="1" fill="currentColor" opacity="0.7"/>
    {/* Middle dots pattern */}
    {[28,32,36,40,44,48,52].flatMap(x =>
      [28,32,36,40,44,48,52].map(y =>
        Math.random() > 0.4 ? <rect key={`${x}${y}`} x={x} y={y} width="3" height="3" rx="0.5" fill="currentColor" opacity="0.5"/> : null
      )
    )}
    {/* bottom-right data area */}
    <rect x="56" y="56" width="22" height="22" rx="1" fill="currentColor" opacity="0.08"/>
    <rect x="60" y="60" width="6" height="6" rx="0.5" fill="currentColor" opacity="0.5"/>
    <rect x="68" y="60" width="6" height="6" rx="0.5" fill="currentColor" opacity="0.5"/>
    <rect x="60" y="68" width="6" height="6" rx="0.5" fill="currentColor" opacity="0.5"/>
  </svg>
);

/* ── Component ───────────────────────────────────────── */
export const BookingConfirmation: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(location.state?.booking ?? null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(!booking);

  useEffect(() => {
    if (!booking && bookingId) {
      api.getBooking(bookingId)
        .then(setBooking)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [bookingId, booking]);

  useEffect(() => {
    if (booking?.driverId) {
      api.getDriverDetails(booking.driverId).then(setDriver).catch(console.error);
    }
  }, [booking]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-muted)' }}>
        <p className="text-sm">Loading booking details…</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
        <p className="text-sm">Booking ticket not found or expired.</p>
        <button onClick={() => navigate('/')} className="mt-3 underline" style={{ color: 'var(--accent-blue-light)' }}>
          Return home
        </button>
      </div>
    );
  }

  const routeLabel = booking.route || 'Giri → Gwagwalada';
  const [routeFrom, routeTo] = routeLabel.split(' → ');

  const handleToggleFavorite = async () => {
    if (!driver) return;
    const next = !isFavorite;
    setIsFavorite(next);
    await api.toggleFavoriteDriver(driver.id, next);
  };

  const handleRate = async (r: number) => {
    if (!driver) return;
    await api.rateDriver(driver.id, r);
  };

  const handleComplaint = async () => {
    const msg = prompt('Describe your issue:');
    if (msg && driver) {
      await api.submitComplaint({ bookingId: booking.id, driverId: driver.id, message: msg });
      alert('Complaint submitted. Our team will respond within 24h.');
    }
  };

  const handleCall = () => {
    navigate('/calls');
  };

  return (
    <div className="space-y-5 animate-fade-up">

      {/* Back */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ArrowLeftIcon size={18} /> Back to Home
      </button>

      {/* Success header */}
      <div className="text-center pt-2">
        <div
          className="inline-flex w-14 h-14 rounded-full items-center justify-center mb-3"
          style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}
        >
          <CheckCircleIcon size={28} className="" style={{ color: 'var(--green-active)' } as React.CSSProperties} />
        </div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Booking Confirmed</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>
          {booking.ticketId}
        </p>
      </div>

      {/* Digital Ticket (matches Image 2) */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#ffffff', border: '1px solid #e8eef8', color: 'var(--navy-900)' }}
      >
        {/* Header strip */}
        <div className="px-5 pt-5 pb-4">
          <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: '#2a6ff5', letterSpacing: '1.5px' }}>
            TICKET ID
          </p>
          <p className="text-lg font-bold" style={{ color: '#2a6ff5', fontFamily: "'DM Mono', monospace" }}>
            {booking.ticketId}
          </p>
        </div>

        {/* Route section */}
        <div className="px-5 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div>
              <div
                className="w-3 h-3 rounded-full border-2"
                style={{ borderColor: '#2a6ff5', background: 'white' }}
              />
            </div>
            <div className="flex-1 h-px" style={{ background: 'repeating-linear-gradient(90deg, #2a6ff5 0, #2a6ff5 4px, transparent 4px, transparent 8px)' }} />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.03 7.03 1 12 1C16.97 1 21 5.03 21 10Z" fill="#2a6ff5"/>
              <circle cx="12" cy="10" r="3" fill="white"/>
            </svg>
          </div>

          <div className="flex justify-between items-start">
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--navy-900)', fontFamily: "'DM Sans', sans-serif" }}>
                {routeFrom}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: 'var(--navy-900)' }}>
                {routeTo}
              </p>
            </div>
          </div>
        </div>

        {/* Details row */}
        <div className="grid grid-cols-3 px-5 py-3" style={{ borderTop: '1px dashed #dde6f5', borderBottom: '1px dashed #dde6f5' }}>
          <div>
            <p className="text-xs" style={{ color: '#7a92b0' }}>Date</p>
            <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--navy-900)' }}>
              {new Date(booking.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: '#7a92b0' }}>Depart</p>
            <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--navy-900)', fontFamily: "'DM Mono', monospace" }}>
              {booking.departureTime || '—'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: '#7a92b0' }}>Status</p>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 inline-block"
              style={{
                background: booking.status === 'confirmed' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                color: booking.status === 'confirmed' ? '#15803d' : '#ef4444',
              }}
            >
              {booking.status === 'confirmed' ? 'Active' : 'Expired'}
            </span>
          </div>
        </div>

        {/* Seat + Plate */}
        <div className="grid grid-cols-2 px-5 py-3" style={{ borderBottom: '1px dashed #dde6f5' }}>
          <div>
            <p className="text-xs" style={{ color: '#7a92b0' }}>Seat(s)</p>
            <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--navy-900)', fontFamily: "'DM Mono', monospace" }}>
              {booking.seatNumbers?.join(', ') || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: '#7a92b0' }}>Plate</p>
            <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--navy-900)', fontFamily: "'DM Mono', monospace" }}>
              {driver?.vehiclePlate || '—'}
            </p>
          </div>
        </div>

        {/* QR code */}
        <div className="px-5 py-4 flex flex-col items-center gap-2">
          <div style={{ color: 'var(--navy-900)', opacity: 0.85 }}>
            <QrPlaceholder />
          </div>
          <p className="text-xs" style={{ color: '#7a92b0' }}>Scan to verify</p>
        </div>
      </div>

      {/* Driver section (post-payment State B) */}
      {driver && (
        <div
          className="rounded-2xl p-4 space-y-4"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
              style={{ background: 'var(--avatar-bg)', color: 'var(--text-primary)' }}
            >
              {driver.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{driver.name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>
                {driver.vehicleType} · {driver.vehiclePlate}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {[1,2,3,4,5].map(s => (
                  <StarIcon key={s} size={11} filled={s <= Math.round(driver.rating)} className="text-amber-400" />
                ))}
                <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>{driver.rating}</span>
                <span
                  className="ml-2 text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: driver.isActive ? 'var(--inset-bg)' : 'var(--inset-bg)',
                    color: driver.isActive ? 'var(--green-active)' : 'var(--text-muted)',
                    border: '1px solid var(--card-border)',
                  }}
                >
                  {driver.isActive ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            <button
              onClick={handleCall}
              className="p-2.5 rounded-full transition-all active:scale-95"
              style={{ background: 'var(--inset-bg)', color: 'var(--accent-blue-light)', border: '1px solid var(--card-border)' }}
            >
              <PhoneIcon size={16} />
            </button>
          </div>

          {/* Action trio */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Favorite', Icon: HeartIcon, action: handleToggleFavorite, active: isFavorite, activeColor: '#ef4444' },
              { label: 'Rate',     Icon: ThumbsUpIcon, action: () => handleRate(5), active: false, activeColor: 'var(--accent-blue-light)' },
              { label: 'Report',   Icon: FlagIcon, action: handleComplaint, active: false, activeColor: '#f59e0b' },
            ].map(({ label, Icon, action, active, activeColor }) => (
              <button
                key={label}
                onClick={action}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all active:scale-95"
                style={{
                  background: 'var(--inset-bg)',
                  border: '1px solid var(--card-border)',
                  color: active ? activeColor : 'var(--text-secondary)',
                }}
              >
                <Icon size={17} filled={active as any} />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};