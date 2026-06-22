import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { RideHistoryEntry } from '../types';
import {
  ArrowLeftIcon, HeartIcon, FlagIcon, ThumbsUpIcon,
  StarIcon, KekeIcon, ShuttleIcon,
} from '../icons';

export const LastRideDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ride, setRide] = useState<RideHistoryEntry | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userRating, setUserRating] = useState(0);

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
        <div className="grid grid-cols-2 gap-2">
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


    </div>
  );
};