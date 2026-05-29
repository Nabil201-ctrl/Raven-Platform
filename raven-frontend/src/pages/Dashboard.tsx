import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { api } from '../services/api';
import type { Shuttle, Driver } from '../types';
import {
  SearchIcon, ClockIcon, ArrowRightIcon,
  KekeIcon, StarIcon, PhoneIcon, MapPinIcon,
} from '../icons';

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

/* ── Main ─────────────────────────────────────────────── */
export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { lastRide } = useAppContext();

  const [searchCode, setSearchCode]           = useState('');
  const [searching, setSearching]             = useState(false);
  const [verifiedDriver, setVerifiedDriver]   = useState<Driver | null>(null);
  const [availableShuttles, setAvailableShuttles] = useState<Shuttle[]>([]);
  const [recommendedShuttles, setRecommendedShuttles] = useState<Shuttle[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [viewAllSheet, setViewAllSheet]       = useState<null | 'available' | 'recommended'>(null);

  useEffect(() => {
    Promise.all([api.getAvailableShuttles(), api.getRecommendedShuttles()])
      .then(([avail, recs]) => { setAvailableShuttles(avail); setRecommendedShuttles(recs); })
      .finally(() => setLoading(false));
  }, []);

  const handleDriverSearch = async () => {
    if (!searchCode.trim()) return;
    setSearching(true);
    try {
      const driver = await api.verifyDriverCode(searchCode.trim());
      setVerifiedDriver(driver);
    } catch {
      alert('No driver found for that code. Please check and try again.');
    } finally {
      setSearching(false);
    }
  };

  const handlePayDriver = (driver: Driver) => {
    navigate('/payment', {
      state: {
        type: 'keke',
        driverId: driver.id,
        driverName: driver.name,
        vehiclePlate: driver.vehiclePlate,
        route: 'On-site Keke',
        priceOptions: [120, 220, 320, 420],
      },
    });
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

      {/* ── On-site Keke booking ── */}
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
              onClick={handleDriverSearch}
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
        </div>

        {/* Driver verification (State A) */}
        {verifiedDriver && (
          <div className="mt-3 rounded-2xl p-4 animate-fade-up"
            style={{ background: 'var(--card-bg)', border: '1px solid rgba(42, 111, 245, 0.4)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                style={{ background: 'var(--inset-bg)', color: 'var(--text-primary)' }}>
                {verifiedDriver.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{verifiedDriver.name}</h3>
                <div className="flex items-center gap-1.5 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  <KekeIcon size={11} />
                  <span className="text-xs">{verifiedDriver.vehicleType.toUpperCase()} · {verifiedDriver.vehiclePlate}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {[1,2,3,4,5].map(s => (
                    <StarIcon key={s} size={11} filled={s <= Math.round(verifiedDriver.rating)}
                      style={{ color: s <= Math.round(verifiedDriver.rating) ? '#fbbf24' : 'var(--card-border)' } as React.CSSProperties} />
                  ))}
                  <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>{verifiedDriver.rating}</span>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full active-dot"
                style={{ background: verifiedDriver.isActive ? 'var(--green-active)' : 'var(--text-muted)' }} />
            </div>

            <div className="rounded-xl px-3 py-2 mb-4 flex justify-between"
              style={{ background: 'var(--inset-bg)', border: '1px solid var(--card-border)' }}>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>System Code</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace" }}>
                  {verifiedDriver.systemCode}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Plate</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace" }}>
                  {verifiedDriver.vehiclePlate}
                </p>
              </div>
            </div>

            <button
              onClick={() => handlePayDriver(verifiedDriver)}
              className="w-full py-3 rounded-xl font-bold text-white transition-all active:scale-[0.98]"
              style={{ background: 'var(--accent-blue)', border: 'none' }}
            >
              Pay Fare
            </button>
          </div>
        )}
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

      {/* ── Last Ride — reads from context so it updates after every payment ── */}
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
    </div>
  );
};