import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { api } from '../services/api';
import {
  SearchIcon, KekeIcon, ShuttleIcon, ArrowRightIcon,
} from '../icons';
import { io } from 'socket.io-client';
import { WS_BASE, BOOKING_WS_NAMESPACE } from '../config';

/* ── Inbound reverse trip live tracking sheet ────────── */
const InboundTrackingSheet: React.FC<{
  trip: any;
  onClose: () => void;
  onPreBook: () => void;
  bookingLoading: boolean;
}> = ({ trip, onClose, onPreBook, bookingLoading }) => {
  const [secondsLeft, setSecondsLeft] = useState(480);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const progressPercent = Math.min(100, Math.max(0, ((480 - secondsLeft) / 480) * 100));
  const isFromGiri = trip.route.includes('Giri →');

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)' }}
      onClick={onClose}
    >
      <div
        className="max-w-md mx-auto w-full rounded-t-3xl p-6 pb-10 space-y-6 animate-fade-up"
        style={{ background: 'var(--bg-app)', border: '1px solid var(--card-border)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-2" style={{ background: 'var(--card-border)' }} />

        <div className="flex items-center justify-between">
          <div>
            <span
              className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded"
              style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'var(--amber-premium)', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              Live Inbound
            </span>
            <h3 className="text-xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
              Shuttle {trip.vehicleCode}
            </h3>
          </div>
          <button onClick={onClose} className="text-xs" style={{ color: 'var(--text-muted)' }}>Close</button>
        </div>

        <div className="rounded-2xl p-4 space-y-4" style={{ background: 'var(--inset-bg)', border: '1px solid var(--card-border)' }}>
          <div className="flex justify-between items-center text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-semibold">{isFromGiri ? 'Giri' : 'Gwagwalada'}</span>
            <span className="font-mono text-amber-500 font-bold">ETA: {formatTime(secondsLeft)}</span>
            <span className="font-semibold">{isFromGiri ? 'Gwagwalada' : 'Giri'}</span>
          </div>

          <div className="h-2 w-full rounded-full relative" style={{ background: 'var(--card-border)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%`, background: 'var(--accent-blue)' }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-1000 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 border border-white text-[10px] text-white shadow-lg animate-pulse"
              style={{ left: `${progressPercent}%` }}
            >
              🚐
            </div>
          </div>

          <p className="text-[11px] text-center italic" style={{ color: 'var(--text-muted)' }}>
            Shuttle is returning on the opposite leg. Pre-book your return seat now.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl p-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
            style={{ background: 'var(--avatar-bg)', color: 'var(--text-primary)' }}
          >
            {trip.driverName.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{trip.driverName}</p>
            <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{trip.vehicleDetails}</p>
          </div>
        </div>

        <button
          onClick={onPreBook}
          disabled={bookingLoading || secondsLeft === 0}
          className="w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-white"
          style={{
            background: 'var(--accent-blue)',
            boxShadow: '0 4px 14px 0 rgba(42,111,245,0.3)',
            opacity: bookingLoading ? 0.6 : 1,
          }}
        >
          {bookingLoading ? 'Securing Seat...' : 'Pre-book Return Seat — ₦500'}
        </button>
      </div>
    </div>
  );
};

/* ── Service action card ─────────────────────────────── */
const ServiceCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
  onClick: () => void;
}> = ({ icon, title, description, accent, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] group"
    style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    }}
  >
    <div className="flex items-center gap-4">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: accent, color: 'white' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>
      </div>
      <ArrowRightIcon
        size={18}
        className="flex-shrink-0 transition-transform group-hover:translate-x-0.5"
        style={{ color: 'var(--text-muted)' } as React.CSSProperties}
      />
    </div>
  </button>
);

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { lastRide, user, syncState } = useAppContext();

  const [searchCode, setSearchCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [reverseTrips, setReverseTrips] = useState<any[]>([]);
  const [trackingTrip, setTrackingTrip] = useState<any | null>(null);
  const [preBooking, setPreBooking] = useState(false);
  const [shuttleCount, setShuttleCount] = useState(0);
  const [kekeCount, setKekeCount] = useState(0);

  useEffect(() => {
    api.getAvailableShuttles()
      .then(shuttles => setShuttleCount(shuttles.filter(s => s.status === 'available' && s.availableSeats > 0).length))
      .catch(() => {});

    api.getDrivers()
      .then(drivers => setKekeCount(drivers.filter(d => (d.vehicleType === 'keke' || d.vehicleType === 'bike') && d.isActive).length))
      .catch(() => {});

    api.getReverseTrips()
      .then(setReverseTrips)
      .catch(() => {});

    const socket = io(`${WS_BASE}${BOOKING_WS_NAMESPACE}`);

    socket.on('sync:initial', (data: { shuttles?: any[]; reverseTrips?: any[] }) => {
      if (data.shuttles) {
        setShuttleCount(data.shuttles.filter(s => s.status === 'available' && s.availableSeats > 0).length);
      }
      if (data.reverseTrips) setReverseTrips(data.reverseTrips);
    });

    socket.on('transit:reverse-trip:added', (alert: any) => {
      setReverseTrips(prev => [alert, ...prev]);
    });

    return () => { socket.disconnect(); };
  }, []);

  const handlePreBook = async () => {
    if (!trackingTrip) return;
    setPreBooking(true);
    try {
      const bookingPayload: any = {
        type: 'shuttle',
        amount: 500,
        route: trackingTrip.route || 'Return leg',
        departureTime: trackingTrip.departureTime || '07:30',
      };

      const response = await api.createBooking(bookingPayload);
      alert(`Pre-booking Confirmed!\nTicket Code: ${response.ticketId}\nReturn leg secured.`);
      setTrackingTrip(null);
      await Promise.all([
        api.getReverseTrips().then(setReverseTrips).catch(() => {}),
        syncState(),
      ]);
    } catch (e: any) {
      alert(`Pre-booking failed: ${e.message || e}`);
    } finally {
      setPreBooking(false);
    }
  };

  const handleDriverSearch = async (overrideCode?: string) => {
    const code = (overrideCode || searchCode).trim();
    if (!code) return;
    setSearching(true);
    try {
      const res = await api.getVehicleDetailsByCode(code);
      if (res.route) {
        navigate(`/shuttle/${res.id}`);
      } else {
        navigate(`/keke/${res.id}`);
      }
    } catch {
      alert('No active vehicle found for that code. Please check and try again.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero */}
      <div
        className="rounded-3xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--accent-blue) 0%, #1a4fd6 100%)',
          boxShadow: '0 8px 32px rgba(42,111,245,0.25)',
        }}
      >
        <div className="relative z-10">
          <p className="text-xs font-semibold tracking-widest text-white/70 uppercase">Campus Transit</p>
          <h1 className="text-2xl font-black text-white mt-1">
            Hello, {user?.name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-sm text-white/80 mt-2 max-w-[260px]">
            Book a shuttle or keke in just a few taps.
          </p>
        </div>
        <div
          className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-20"
          style={{ background: 'white' }}
        />
      </div>

      {/* Primary actions */}
      <div className="space-y-3">
        <ServiceCard
          icon={<ShuttleIcon size={26} />}
          title="Book Shuttle"
          description={shuttleCount > 0 ? `${shuttleCount} shuttle${shuttleCount !== 1 ? 's' : ''} available now` : 'View available shuttles'}
          accent="rgba(42,111,245,0.9)"
          onClick={() => navigate('/shuttles')}
        />
        <ServiceCard
          icon={<KekeIcon size={26} />}
          title="Book Keke"
          description={kekeCount > 0 ? `${kekeCount} driver${kekeCount !== 1 ? 's' : ''} online nearby` : 'View available keke drivers'}
          accent="#0891b2"
          onClick={() => navigate('/keke')}
        />
      </div>

      {/* Reverse trip alert */}
      {reverseTrips.length > 0 && (
        <button
          className="w-full rounded-2xl p-4 text-left transition-all active:scale-[0.99]"
          onClick={() => setTrackingTrip(reverseTrips[0])}
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1.5px solid rgba(245, 158, 11, 0.25)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">⚡</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--amber-premium)' }}>
                Return Trip Available
              </p>
              <p className="text-sm mt-0.5 truncate" style={{ color: 'var(--text-primary)' }}>
                {reverseTrips[0].message}
              </p>
            </div>
            <ArrowRightIcon size={14} style={{ color: 'var(--amber-premium)' } as React.CSSProperties} />
          </div>
        </button>
      )}

      {/* Quick code search */}
      <section>
        <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: 'var(--text-muted)', letterSpacing: '1.5px' }}>
          HAVE A VEHICLE CODE?
        </p>
        <div className="rounded-2xl p-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
          <div className="flex gap-2">
            <div
              className="flex-1 flex items-center gap-2 px-3 rounded-xl"
              style={{ background: 'var(--inset-bg)', border: '1px solid var(--card-border)' }}
            >
              <SearchIcon size={14} style={{ color: 'var(--text-muted)' } as React.CSSProperties} />
              <input
                type="text"
                placeholder="Enter 4-digit code"
                value={searchCode}
                onChange={e => setSearchCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleDriverSearch()}
                maxLength={6}
                className="flex-1 bg-transparent py-3 text-sm outline-none"
                style={{ color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace" }}
              />
            </div>
            <button
              onClick={() => handleDriverSearch()}
              disabled={searching || !searchCode.trim()}
              className="px-5 py-3 rounded-xl text-sm font-semibold transition-all text-white"
              style={{
                background: 'var(--accent-blue)',
                opacity: searching || !searchCode.trim() ? 0.45 : 1,
              }}
            >
              {searching ? '…' : 'Go'}
            </button>
          </div>
        </div>
      </section>

      {/* Last ride */}
      {lastRide && (
        <section>
          <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: 'var(--text-muted)', letterSpacing: '1.5px' }}>
            LAST RIDE
          </p>
          <button
            onClick={() => navigate(`/last-ride/${lastRide.id}`)}
            className="w-full rounded-2xl p-4 text-left transition-all active:scale-[0.99]"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center font-bold"
                  style={{ background: 'var(--inset-bg)', color: 'var(--text-primary)' }}
                >
                  {lastRide.driver.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {lastRide.driver.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {lastRide.route} · {lastRide.date}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace" }}>
                  ₦{lastRide.price.toLocaleString()}
                </p>
                <p className="text-xs" style={{ color: 'var(--accent-blue-light)' }}>Details →</p>
              </div>
            </div>
          </button>
        </section>
      )}

      {trackingTrip && (
        <InboundTrackingSheet
          trip={trackingTrip}
          bookingLoading={preBooking}
          onClose={() => setTrackingTrip(null)}
          onPreBook={handlePreBook}
        />
      )}
    </div>
  );
};