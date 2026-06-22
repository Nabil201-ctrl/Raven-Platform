import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api } from '../services/api';
import type { Shuttle } from '../types';
import { PageHeader } from '../components/PageHeader';
import { ClockIcon, MapPinIcon } from '../icons';
import { WS_BASE, BOOKING_WS_NAMESPACE } from '../config';

const ShuttleListItem: React.FC<{ shuttle: Shuttle; onClick: () => void }> = ({ shuttle, onClick }) => {
  const isFull = shuttle.status === 'full';
  const isDeparted = shuttle.status === 'departed';

  return (
    <button
      onClick={onClick}
      disabled={isFull || isDeparted}
      className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.99] hover:shadow-sm"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        opacity: isFull || isDeparted ? 0.55 : 1,
        cursor: isFull || isDeparted ? 'not-allowed' : 'pointer',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-lg font-bold"
              style={{ color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace" }}
            >
              {shuttle.departureTime}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: isFull
                  ? 'rgba(239,68,68,0.12)'
                  : isDeparted
                    ? 'rgba(156,163,175,0.12)'
                    : 'rgba(34,197,94,0.12)',
                color: isFull ? '#ef4444' : isDeparted ? 'var(--text-muted)' : 'var(--green-active)',
              }}
            >
              {isFull ? 'Full' : isDeparted ? 'Departed' : `${shuttle.availableSeats} seats`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mb-1" style={{ color: 'var(--text-secondary)' }}>
            <MapPinIcon size={12} />
            <span className="text-sm font-medium truncate">
              {shuttle.route.from} → {shuttle.route.to}
            </span>
          </div>

          <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>
            {shuttle.shuttleCode} · Arrives {shuttle.arrivalTime}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <p
            className="text-base font-bold"
            style={{ color: 'var(--accent-blue)', fontFamily: "'DM Mono', monospace" }}
          >
            ₦{shuttle.pricePerSeat.toLocaleString()}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>per seat</p>
        </div>
      </div>

      <div className="flex items-center gap-1 mt-3 pt-3" style={{ borderTop: '1px solid var(--card-border)', color: 'var(--text-muted)' }}>
        <ClockIcon size={11} />
        <span className="text-xs">{shuttle.driver.name}</span>
      </div>
    </button>
  );
};

export const ShuttleList: React.FC = () => {
  const navigate = useNavigate();
  const [shuttles, setShuttles] = useState<Shuttle[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  useEffect(() => {
    api.getAvailableShuttles()
      .then(setShuttles)
      .catch(console.error)
      .finally(() => setLoading(false));

    const socket = io(`${WS_BASE}${BOOKING_WS_NAMESPACE}`);
    socketRef.current = socket;

    socket.on('sync:initial', (data: { shuttles?: Shuttle[] }) => {
      if (data.shuttles?.length) setShuttles(data.shuttles);
    });

    socket.on('shuttle:updated', (updated: Shuttle) => {
      setShuttles(prev => prev.map(s => (s.id === updated.id ? updated : s)));
    });

    socket.on('shuttle:details:updated', (updated: Shuttle) => {
      setShuttles(prev => prev.map(s => (s.id === updated.id ? updated : s)));
    });

    return () => {
      socketRef.current = null;
      socket.disconnect();
    };
  }, []);

  const available = shuttles.filter(s => s.status === 'available' && s.availableSeats > 0);
  const unavailable = shuttles.filter(s => s.status !== 'available' || s.availableSeats === 0);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Book a Shuttle"
        subtitle="Choose from available campus shuttles"
        backTo="/"
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => (
            <div
              key={n}
              className="rounded-2xl h-28 animate-pulse"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
            />
          ))}
        </div>
      ) : shuttles.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <p className="text-4xl mb-3">🚐</p>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No shuttles right now</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Check back shortly for new departures</p>
        </div>
      ) : (
        <div className="space-y-6">
          {available.length > 0 && (
            <section>
              <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: 'var(--text-muted)', letterSpacing: '1.5px' }}>
                AVAILABLE ({available.length})
              </p>
              <div className="space-y-3">
                {available.map(s => (
                  <ShuttleListItem key={s.id} shuttle={s} onClick={() => navigate(`/shuttle/${s.id}`)} />
                ))}
              </div>
            </section>
          )}

          {unavailable.length > 0 && (
            <section>
              <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: 'var(--text-muted)', letterSpacing: '1.5px' }}>
                UNAVAILABLE ({unavailable.length})
              </p>
              <div className="space-y-3">
                {unavailable.map(s => (
                  <ShuttleListItem key={s.id} shuttle={s} onClick={() => navigate(`/shuttle/${s.id}`)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};