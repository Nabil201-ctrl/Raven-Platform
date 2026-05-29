import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { api } from '../services/api';
import type { Shuttle } from '../types';
import {
  SearchIcon, ClockIcon, ArrowRightIcon,
  KekeIcon, PhoneIcon, MapPinIcon,
} from '../icons';
import { io } from 'socket.io-client';


/* ── View-all bottom sheet ───────────────────────────── */
const AllShuttlesSheet: React.FC<{
  title: string;
  shuttles: Shuttle[];
  onClose: () => void;
  onSelect: (id: string) => void;
}> = ({ title, shuttles, onClose, onSelect }) => (
  <div
    className="fixed inset-0 z-50 flex flex-col justify-end"
    style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
    onClick={onClose}
  >
    <div
      className="max-w-md mx-auto w-full rounded-t-3xl p-5 pb-10 max-h-[75vh] overflow-y-auto"
      style={{ background: 'var(--bg-app)', border: '1px solid var(--card-border)' }}
      onClick={e => e.stopPropagation()}
    >
      {/* Handle */}
      <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--card-border)' }} />
      <p className="text-xs font-semibold tracking-widest mb-4" style={{ color: 'var(--text-muted)', letterSpacing: '1.5px' }}>
        {title}
      </p>
      <div className="space-y-2">
        {shuttles.map(s => (
          <button
            key={s.id}
            onClick={() => { onSelect(s.id); onClose(); }}
            disabled={s.status === 'full'}
            className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.99]"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              opacity: s.status === 'full' ? 0.55 : 1,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {s.route.from} → {s.route.to}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>
                  {s.departureTime} · {s.shuttleCode}
                </p>
              </div>
              <div className="text-right">
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{
                    background: s.status === 'full' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                    color:      s.status === 'full' ? '#ef4444'              : 'var(--green-active)',
                  }}
                >
                  {s.status === 'full' ? 'Full' : `${s.availableSeats} seats`}
                </span>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>
                  ₦{s.pricePerSeat.toLocaleString()}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>
);

/* ── Shuttle card ─────────────────────────────────────── */
const ShuttleCard: React.FC<{ shuttle: Shuttle; onClick: () => void }> = ({ shuttle, onClick }) => {
  const isFull = shuttle.status === 'full';
  return (
    <button
      onClick={onClick}
      disabled={isFull}
      className="text-left rounded-2xl p-4 flex-shrink-0 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        minWidth: 215,
        opacity: isFull ? 0.55 : 1,
        cursor: isFull ? 'not-allowed' : 'pointer',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-2xl font-bold leading-none"
            style={{ color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace" }}>
            {shuttle.departureTime}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Departure</p>
        </div>
        <div className="w-2.5 h-2.5 rounded-full mt-1 active-dot"
          style={{ background: isFull ? '#ef4444' : 'var(--green-active)' }} />
      </div>

      <div className="flex items-center gap-1.5 mb-2" style={{ color: 'var(--text-secondary)' }}>
        <MapPinIcon size={11} />
        <span className="text-xs font-medium">{shuttle.route.from} → {shuttle.route.to}</span>
      </div>

      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>
        {shuttle.shuttleCode}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1" style={{ color: 'var(--accent-cyan)' }}>
          <ClockIcon size={11} />
          <span className="text-xs">On time</span>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{
            background: isFull ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
            color:      isFull ? '#ef4444'              : 'var(--green-active)',
          }}
        >
          {isFull ? 'Full' : `${shuttle.availableSeats} seats`}
        </span>
      </div>
    </button>
  );
};

/* ── Inbound reverse trip live tracking sheet ────────── */
const InboundTrackingSheet: React.FC<{
  trip: any;
  onClose: () => void;
  onPreBook: () => void;
  bookingLoading: boolean;
}> = ({ trip, onClose, onPreBook, bookingLoading }) => {
  const [secondsLeft, setSecondsLeft] = useState(480); // 8 minutes default ETA

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
        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-2" style={{ background: 'var(--card-border)' }} />
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded" 
                  style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'var(--amber-premium)', border: '1px solid rgba(245,158,11,0.2)' }}>
              Live Inbound Tracking
            </span>
            <h3 className="text-xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
              Shuttle {trip.vehicleCode}
            </h3>
          </div>
          <button onClick={onClose} className="text-xs" style={{ color: 'var(--text-muted)' }}>Close</button>
        </div>

        {/* Live progress indicator */}
        <div className="rounded-2xl p-4 space-y-4" style={{ background: 'var(--inset-bg)', border: '1px solid var(--card-border)' }}>
          <div className="flex justify-between items-center text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-semibold">{isFromGiri ? 'Giri' : 'Gwagwalada'}</span>
            <span className="font-mono text-amber-500 font-bold">ETA: {formatTime(secondsLeft)}</span>
            <span className="font-semibold">{isFromGiri ? 'Gwagwalada' : 'Giri'}</span>
          </div>

          {/* Visual Bar with moving shuttle */}
          <div className="h-2 w-full rounded-full relative" style={{ background: 'var(--card-border)' }}>
            <div className="h-full rounded-full transition-all duration-1000" 
                 style={{ width: `${progressPercent}%`, background: 'var(--accent-blue)' }} />
            
            {/* Pulsing Shuttle icon */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-1000 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 border border-white text-[10px] text-white shadow-lg animate-pulse"
                 style={{ left: `${progressPercent}%` }}>
              🚐
            </div>
          </div>

          <p className="text-[11px] text-center italic" style={{ color: 'var(--text-muted)' }}>
            Shuttle is currently outbound on opposite leg. Returning immediately.
          </p>
        </div>

        {/* Vehicle / Driver details */}
        <div className="flex items-center gap-3 rounded-2xl p-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" 
               style={{ background: 'var(--avatar-bg)', color: 'var(--text-primary)' }}>
            {trip.driverName.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{trip.driverName}</p>
            <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{trip.vehicleDetails}</p>
          </div>
          <div className="text-right">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" 
                  style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--green-active)' }}>
              INBOUND
            </span>
          </div>
        </div>

        {/* Pre-book CTA */}
        <button
          onClick={onPreBook}
          disabled={bookingLoading || secondsLeft === 0}
          className="w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-white"
          style={{ 
            background: 'var(--accent-blue)', 
            boxShadow: '0 4px 14px 0 rgba(42,111,245,0.3)',
            opacity: bookingLoading ? 0.6 : 1
          }}
        >
          {bookingLoading ? 'Securing Seat...' : 'Pre-book Returning Seat — ₦500'}
        </button>
      </div>
    </div>
  );
};

/* ── Main ─────────────────────────────────────────────── */
export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { lastRide, user, balance, syncState } = useAppContext();

  const [searchCode, setSearchCode]           = useState('');
  const [searching, setSearching]             = useState(false);
  const [availableShuttles, setAvailableShuttles] = useState<Shuttle[]>([]);
  const [recommendedShuttles, setRecommendedShuttles] = useState<Shuttle[]>([]);
  const [reverseTrips, setReverseTrips]       = useState<any[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [viewAllSheet, setViewAllSheet]       = useState<null | 'available' | 'recommended'>(null);
  const [trackingTrip, setTrackingTrip]       = useState<any | null>(null);
  const [preBooking, setPreBooking]           = useState(false);

  const handlePreBook = async () => {
    if (!trackingTrip) return;
    setPreBooking(true);
    try {
      const response = await api.createBooking({
        type: 'shuttle',
        amount: 500,
        shuttleId: 'sh_KQ07', // Standard return shuttle route
        seats: [7], // Pre-assign seat 7
        route: trackingTrip.route,
        departureTime: '07:30',
      });
      alert(`Pre-booking Confirmed!\nTicket Code: ${response.ticketId}\nDriver: ${trackingTrip.driverName}\nSeat pre-assigned: Seat 7.`);
      setTrackingTrip(null);
      await syncState();
    } catch (e: any) {
      alert(`Pre-booking failed: ${e.message}`);
    } finally {
      setPreBooking(false);
    }
  };

  useEffect(() => {
    // Fetch initial REST data
    Promise.all([api.getAvailableShuttles(), api.getRecommendedShuttles(), api.getReverseTrips()])
      .then(([avail, recs, trips]) => { 
        setAvailableShuttles(avail); 
        setRecommendedShuttles(recs); 
        setReverseTrips(trips);
      })
      .finally(() => setLoading(false));

    // Connect to WebSocket namespace 'booking'
    const socket = io('http://localhost:5000/booking');

    // Listen for live reverse trip alerts
    socket.on('transit:reverse-trip:added', (alert: any) => {
      setReverseTrips(prev => [alert, ...prev]);
    });

    // Listen for live shuttle state changes (e.g. booked seats, occupancy status)
    socket.on('shuttle:updated', (updated: Shuttle) => {
      setAvailableShuttles(prev => prev.map(s => s.id === updated.id ? updated : s));
      setRecommendedShuttles(prev => prev.map(s => s.id === updated.id ? updated : s));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleDriverSearch = async (overrideCode?: string) => {
    const code = (overrideCode || searchCode).trim();
    if (!code) return;
    setSearching(true);
    try {
      const res = await api.getVehicleDetailsByCode(code);
      if (res.route) {
        // It is a Shuttle route
        navigate(`/shuttle/${res.id}`);
      } else {
        // It is a Keke / Bike driver profile
        navigate(`/keke/${res.id}`);
      }
    } catch (error) {
      alert('No active transit vehicle or driver found for that code. Please check and try again.');
    } finally {
      setSearching(false);
    }
  };

  const SectionHeader: React.FC<{ label: string; onViewAll?: () => void }> = ({ label, onViewAll }) => (
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs font-semibold tracking-widest" style={{ color: 'var(--text-muted)', letterSpacing: '1.5px' }}>
        {label}
      </p>
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--accent-blue-light)' }}
        >
          View all <ArrowRightIcon size={12} />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-up">

      {/* ── Welcome & Sandbox Wallet Header Widget ── */}
      <div 
        className="rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between md:flex-row md:items-center gap-6"
        style={{ 
          background: 'var(--card-bg)', 
          border: '1px solid var(--card-border)',
          boxShadow: '0 4px 24px 0 rgba(0,0,0,0.06)'
        }}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
              Hello, {user?.name || 'Oluwafemi'}!
            </h1>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Your Monnify virtual account details are active
          </p>
          <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-xl text-[11px] font-semibold tracking-wide w-fit"
               style={{ background: 'var(--inset-bg)', border: '1px solid var(--card-border)' }}>
            <span style={{ color: 'var(--accent-blue)' }}>WEMA BANK</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span className="font-mono cursor-pointer" style={{ color: 'var(--text-primary)' }}
                  onClick={() => {
                    navigator.clipboard.writeText("8823490123");
                    alert("Virtual account number copied: 8823490123");
                  }}>
              8823490123 (Copy Account)
            </span>
          </div>
        </div>

        {/* Dynamic Balance Display */}
        <button 
          onClick={() => navigate('/wallet')}
          className="text-left p-4 rounded-2xl flex flex-col justify-center min-w-[180px] transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ 
            background: 'var(--accent-blue)', 
            border: 'none',
          }}
        >
          <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Monnify Wallet Balance
          </p>
          <p className="text-2xl font-black mt-1 font-mono" style={{ color: 'white' }}>
            ₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1 mt-2 text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <span>Top up Funds</span>
            <ArrowRightIcon size={10} />
          </div>
        </button>
      </div>

      {/* ── Dynamic Inbound Alert Banner ── */}
      {reverseTrips.length > 0 && (
        <div className="rounded-2xl p-4 animate-pulse cursor-pointer"
             onClick={() => setTrackingTrip(reverseTrips[0])}
             style={{ 
               background: 'var(--inset-bg)', 
               border: '1.5px solid var(--card-border)',
               boxShadow: '0 0 15px rgba(245, 158, 11, 0.06)'
             }}>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2 py-1 rounded bg-amber-500/20 text-amber-500 font-mono">ALERT</span>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--amber-premium)' }}>
                Reverse Trip Alert
              </p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {reverseTrips[0].message}
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: 'var(--inset-bg)', border: '1px solid var(--card-border)', color: 'var(--amber-premium)' }}>
              {reverseTrips[0].status}
            </span>
          </div>
        </div>
      )}

      {/* ── On-site Booking ── */}
      <section className="animate-fade-up-1">
        <SectionHeader label="ON-SITE BOOKING" />
        <div className="rounded-2xl p-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
          <div className="flex items-center gap-1.5 mb-3">
            <KekeIcon size={15} style={{ color: 'var(--accent-blue-light)' } as React.CSSProperties} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Enter vehicle code</p>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 rounded-xl"
              style={{ background: 'var(--inset-bg)', border: '1px solid var(--card-border)' }}>
              <SearchIcon size={14} style={{ color: 'var(--text-muted)' } as React.CSSProperties} />
              <input
                type="text"
                placeholder="4–5 digit code on vehicle"
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
              className="px-4 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: 'var(--accent-blue)',
                color: 'white',
                opacity: searching || !searchCode.trim() ? 0.45 : 1,
                border: 'none',
              }}
            >
              {searching ? '…' : 'Search'}
            </button>
          </div>

          {/* Quick-tap Transit Code Pills */}
          <div className="mt-4 pt-4 flex flex-wrap gap-2" style={{ borderTop: '1px solid var(--card-border)' }}>
            <button 
              onClick={() => {
                setSearchCode('1001');
                handleDriverSearch('1001');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{ background: 'var(--inset-bg)', border: '1px solid var(--card-border)', color: 'var(--accent-blue-light)' }}
            >
              <span>Shuttle 1001</span>
            </button>
            <button 
              onClick={() => {
                setSearchCode('2002');
                handleDriverSearch('2002');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{ background: 'var(--inset-bg)', border: '1px solid var(--card-border)', color: 'var(--accent-cyan)' }}
            >
              <span>Keke 2002</span>
            </button>
            <button 
              onClick={async () => {
                try {
                  const res = await api.resetShuttleSeats('1001');
                  alert(`${res.message}`);
                } catch (e) {
                  alert('Error resetting seats map');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{ background: 'var(--inset-bg)', border: '1px solid var(--card-border)', color: 'var(--amber-premium)' }}
            >
              <span>Reset Seats (Vacant 1)</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Available shuttles ── */}
      <section className="animate-fade-up-2">
        <SectionHeader
          label="AVAILABLE SHUTTLES"
          onViewAll={() => setViewAllSheet('available')}
        />
        {loading ? (
          <div className="scroll-row">
            {[1, 2].map(n => (
              <div key={n} className="rounded-2xl flex-shrink-0" style={{
                background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                minWidth: 215, height: 150,
              }} />
            ))}
          </div>
        ) : (
          <div className="scroll-row">
            {availableShuttles.map(s => (
              <ShuttleCard key={s.id} shuttle={s} onClick={() => navigate(`/shuttle/${s.id}`)} />
            ))}
          </div>
        )}
      </section>

      {/* ── Recommended ── */}
      <section className="animate-fade-up-3">
        <SectionHeader
          label="RECOMMENDED"
          onViewAll={() => setViewAllSheet('recommended')}
        />
        <div className="scroll-row">
          {recommendedShuttles.map(s => (
            <ShuttleCard key={s.id} shuttle={s} onClick={() => navigate(`/shuttle/${s.id}`)} />
          ))}
        </div>
      </section>

      {/* ── Last Ride ── */}
      {lastRide && (
        <section className="animate-fade-up-4">
          <SectionHeader label="LAST RIDE" />
          <button
            onClick={() => navigate(`/last-ride/${lastRide.id}`)}
            className="w-full rounded-2xl p-4 text-left transition-all active:scale-[0.99]"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold"
                  style={{ background: 'var(--inset-bg)', color: 'var(--text-primary)' }}>
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
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full" style={{ background: 'rgba(42,111,245,0.12)' }}>
                  <PhoneIcon size={14} style={{ color: 'var(--accent-blue-light)' } as React.CSSProperties} />
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold"
                    style={{ color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace" }}>
                    ₦{lastRide.price.toLocaleString()}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--accent-blue-light)' }}>View →</p>
                </div>
              </div>
            </div>
          </button>
        </section>
      )}

      {/* ── View all sheet ── */}
      {viewAllSheet && (
        <AllShuttlesSheet
          title={viewAllSheet === 'available' ? 'ALL AVAILABLE SHUTTLES' : 'RECOMMENDED SHUTTLES'}
          shuttles={viewAllSheet === 'available' ? availableShuttles : recommendedShuttles}
          onClose={() => setViewAllSheet(null)}
          onSelect={id => navigate(`/shuttle/${id}`)}
        />
      )}

      {/* ── Live Inbound Tracking Sheet ── */}
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