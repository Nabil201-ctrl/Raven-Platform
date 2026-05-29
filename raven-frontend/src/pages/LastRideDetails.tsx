import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { RideHistoryEntry } from '../types';
import { useCalls } from '../hooks/useCalls';
import {
  ArrowLeftIcon, PhoneIcon, HeartIcon, FlagIcon, ThumbsUpIcon,
  StarIcon, KekeIcon, ShuttleIcon,
} from '../icons';

export const LastRideDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasMinutes, useCallMinute } = useCalls();

  const [ride, setRide] = useState<RideHistoryEntry | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [activeCall, setActiveCall] = useState<{
    proxyPhone: string;
    driverName: string;
    established: boolean;
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getRideDetails(id).then(r => {
      setRide(r);
      setIsFavorite(r.isFavorited);
    }).catch(console.error);
  }, [id]);

  if (!ride) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-muted)' }}>
        <p className="text-sm">Loading ride details…</p>
      </div>
    );
  }

  const handleCall = async () => {
    if (!hasMinutes) {
      alert('No call minutes remaining. Purchase a call pack first.');
      navigate('/calls');
      return;
    }
    try {
      const res = await api.initiateMaskedCall(ride.driver.id);
      useCallMinute();
      setActiveCall({
        proxyPhone: res.proxyPhone || (ride.driver.systemCode === '1001' ? '+234 700 748 8853' : '+234 700 748 8854'),
        driverName: ride.driver.name,
        established: false,
      });
      setTimeout(() => {
        setActiveCall(prev => prev ? { ...prev, established: true } : null);
      }, 3000);
    } catch {
      alert('Could not initiate call. Please try again.');
    }
  };

  const handleToggleFavorite = async () => {
    const next = !isFavorite;
    setIsFavorite(next);
    await api.toggleFavoriteDriver(ride.driver.id, next);
  };

  const handleRate = async (r: number) => {
    setUserRating(r);
    await api.rateDriver(ride.driver.id, r);
  };

  const handleComplaint = () => {
    const msg = prompt('Describe your complaint:');
    if (msg) {
      api.submitComplaint({ bookingId: ride.bookingId, driverId: ride.driver.id, message: msg });
      alert('Complaint submitted. We will respond within 24h.');
    }
  };

  const VehicleIcon = ride.driver.vehicleType === 'keke' ? KekeIcon : ShuttleIcon;

  return (
    <div className="space-y-5 animate-fade-up">

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ArrowLeftIcon size={18} /> Back
      </button>

      <p className="text-xs font-semibold tracking-widest" style={{ color: 'var(--text-muted)', letterSpacing: '1.5px' }}>
        LAST RIDE
      </p>

      {/* Driver profile card */}
      <div
        className="rounded-2xl p-5 space-y-5"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
      >
        {/* Top row */}
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{ background: 'var(--avatar-bg)', color: 'var(--text-primary)' }}
          >
            {ride.driver.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-bold text-lg leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {ride.driver.name}
                </h2>
                <div className="flex items-center gap-1.5 mt-1" style={{ color: 'var(--text-muted)' }}>
                  <VehicleIcon size={13} />
                  <span className="text-xs">{ride.driver.vehicleType.toUpperCase()}</span>
                  <span className="text-xs">·</span>
                  <span className="text-xs" style={{ fontFamily: "'DM Mono', monospace" }}>{ride.driver.vehiclePlate}</span>
                </div>
              </div>
              {/* Favorite */}
              <button
                onClick={handleToggleFavorite}
                className="p-2 rounded-full transition-all active:scale-90"
                style={{
                  background: isFavorite ? 'rgba(239,68,68,0.12)' : 'var(--inset-bg)',
                  border: `1px solid ${isFavorite ? 'rgba(239,68,68,0.3)' : 'var(--card-border)'}`,
                  color: isFavorite ? '#ef4444' : 'var(--text-muted)',
                }}
              >
                <HeartIcon size={16} filled={isFavorite} />
              </button>
            </div>

            {/* Rating stars (interactive) */}
            <div className="flex items-center gap-1 mt-2">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => handleRate(s)} className="transition-transform active:scale-90">
                  <StarIcon
                    size={15}
                    filled={s <= (userRating || Math.round(ride.driver.rating))}
                    className={s <= (userRating || Math.round(ride.driver.rating)) ? 'text-amber-400' : ''}
                    style={{ color: s <= (userRating || Math.round(ride.driver.rating)) ? '#fbbf24' : 'var(--text-muted)' } as React.CSSProperties}
                  />
                </button>
              ))}
              <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>
                {userRating > 0 ? `Your rating: ${userRating}` : ride.driver.rating.toFixed(1)}
              </span>
            </div>

            {/* Active status */}
            <div className="flex items-center gap-2 mt-2">
              <div
                className="w-2 h-2 rounded-full active-dot"
                style={{ background: ride.driver.isActive ? 'var(--green-active)' : '#4b5563' }}
              />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {ride.driver.isActive ? 'Currently online' : 'Offline'}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {ride.date}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--card-border)' }} />

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleCall}
            className="flex flex-col items-center gap-2 py-4 rounded-xl transition-all active:scale-95"
            style={{
              background: 'var(--inset-bg)',
              border: '1px solid var(--card-border)',
              color: 'var(--accent-blue-light)',
            }}
          >
            <PhoneIcon size={18} />
            <span className="text-xs font-medium">Call</span>
          </button>

          <button
            onClick={handleComplaint}
            className="flex flex-col items-center gap-2 py-4 rounded-xl transition-all active:scale-95"
            style={{
              background: 'var(--inset-bg)',
              border: '1px solid var(--card-border)',
              color: 'var(--amber-premium)',
            }}
          >
            <FlagIcon size={18} />
            <span className="text-xs font-medium">Report</span>
          </button>

          <button
            onClick={() => handleRate(5)}
            className="flex flex-col items-center gap-2 py-4 rounded-xl transition-all active:scale-95"
            style={{
              background: 'var(--inset-bg)',
              border: '1px solid var(--card-border)',
              color: 'var(--green-active)',
            }}
          >
            <ThumbsUpIcon size={18} />
            <span className="text-xs font-medium">Rate</span>
          </button>
        </div>
      </div>

      {/* Ride summary card */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
      >
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)', letterSpacing: '1px' }}>
          RIDE SUMMARY
        </p>
        {[
          { label: 'Route', value: ride.route },
          { label: 'Amount paid', value: `₦${ride.price.toLocaleString()}`, mono: true },
          { label: 'Ticket ID', value: ride.ticketId, mono: true },
        ].map(({ label, value, mono }) => (
          <div key={label} className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--card-border)' }}>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span
              className="text-sm font-semibold"
              style={{ color: 'var(--text-primary)', fontFamily: mono ? "'DM Mono', monospace" : undefined }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Secure Masked Call Overlay */}
      {activeCall && (
        <div
          className="fixed inset-0 z-55 flex flex-col items-center justify-center p-6 animate-fade-in"
          style={{ background: 'rgba(0, 10, 30, 0.95)', backdropFilter: 'blur(12px)', position: 'fixed', left: 0, right: 0, top: 0, bottom: 0 }}
        >
          <style>{`
            @keyframes pulseRing {
              0% { transform: scale(0.95); opacity: 0.8; }
              50% { transform: scale(1.15); opacity: 0.35; }
              100% { transform: scale(1.35); opacity: 0; }
            }
            .pulse-ring {
              position: absolute;
              inset: -20px;
              border: 2px solid var(--accent-blue);
              border-radius: 50%;
              animation: pulseRing 2s infinite ease-out;
            }
            .pulse-ring-2 {
              position: absolute;
              inset: -40px;
              border: 2px solid var(--accent-cyan);
              border-radius: 50%;
              animation: pulseRing 2s infinite ease-out;
              animation-delay: 0.75s;
            }
          `}</style>

          <div className="relative w-40 h-40 rounded-full flex items-center justify-center mb-8"
               style={{ background: 'var(--inset-bg)', border: '1px solid var(--card-border)' }}>
            <div className="pulse-ring" />
            <div className="pulse-ring-2" />
            <div className="w-32 h-32 rounded-full flex items-center justify-center" style={{ background: 'var(--avatar-bg)' }}>
              <PhoneIcon size={44} style={{ color: activeCall.established ? 'var(--green-active)' : 'var(--accent-blue-light)' } as React.CSSProperties} />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-white mb-2">{activeCall.driverName}</h2>
          <p className="text-sm text-center mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>SECURE PROXY DIALING</p>
          <p className="text-xl font-bold font-mono tracking-wide text-center mb-6" style={{ color: 'var(--accent-blue-light)' }}>
            {activeCall.proxyPhone}
          </p>

          <div className="px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider mb-12"
               style={{ 
                 background: activeCall.established ? 'rgba(34,197,94,0.12)' : 'rgba(42,111,245,0.12)', 
                 color: activeCall.established ? 'var(--green-active)' : 'var(--accent-blue-light)',
                 border: `1px solid ${activeCall.established ? 'rgba(34,197,94,0.3)' : 'rgba(42,111,245,0.3)'}`
               }}>
            {activeCall.established ? 'Secure Routing Established' : 'Initiating Secure Routing...'}
          </div>

          <button
            onClick={() => setActiveCall(null)}
            className="w-16 h-16 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-lg"
            style={{ border: 'none' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white rotate-[135deg]">
              <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.18.282-.108.43a13.39 13.39 0 0 0 5.252 5.252c.148.072.33.027.43-.108l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};