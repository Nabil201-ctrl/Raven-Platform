import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Driver } from '../types';
import type { TransitStatus } from '../types/transit';
import { PageHeader } from '../components/PageHeader';
import { KekeIcon, StarIcon } from '../icons';
import { CARRIER_ROUTES } from '../constants/carrierRoutes';
import { io } from 'socket.io-client';
import { WS_BASE, BOOKING_WS_NAMESPACE } from '../config';

const KekeListItem: React.FC<{ driver: Driver; onClick: () => void }> = ({ driver, onClick }) => {
  const isAvailable = driver.isCarrier && driver.isActive;
  const routeLabel = driver.carrierFrom && driver.carrierTo
    ? `${driver.carrierFrom} → ${driver.carrierTo}`
    : 'Route not set';

  return (
    <button
      onClick={onClick}
      disabled={!isAvailable}
      className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.99] hover:shadow-sm"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        opacity: isAvailable ? 1 : 0.55,
        cursor: isAvailable ? 'pointer' : 'not-allowed',
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
          style={{ background: 'var(--avatar-bg)', color: 'var(--text-primary)' }}
        >
          {driver.name.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-base truncate" style={{ color: 'var(--text-primary)' }}>
              {driver.name}
            </p>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
              style={{
                background: isAvailable ? 'rgba(34,197,94,0.12)' : 'rgba(156,163,175,0.12)',
                color: isAvailable ? 'var(--green-active)' : 'var(--text-muted)',
              }}
            >
              {isAvailable ? 'Available' : 'Not listed'}
            </span>
          </div>

          <p className="text-sm font-semibold mt-1" style={{ color: 'var(--accent-blue)' }}>
            {routeLabel}
          </p>

          <div className="flex items-center gap-1.5 mt-1 flex-wrap" style={{ color: 'var(--text-muted)' }}>
            <KekeIcon size={12} />
            <span className="text-xs capitalize">{driver.vehicleType}</span>
            <span className="text-xs">·</span>
            <span className="text-xs" style={{ fontFamily: "'DM Mono', monospace" }}>
              {driver.vehiclePlate}
            </span>
            {driver.carrierFrom && (
              <>
                <span className="text-xs">·</span>
                <span className="text-xs">Pickup: {driver.carrierFrom}</span>
              </>
            )}
            {driver.carrierSeatCapacity != null && (
              <>
                <span className="text-xs">·</span>
                <span className="text-xs">
                  {driver.carrierSeatCapacity} seat{driver.carrierSeatCapacity === 1 ? '' : 's'}
                </span>
              </>
            )}
          </div>

          {driver.carrierNotes && (
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              {driver.carrierNotes}
            </p>
          )}

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <StarIcon
                  key={s}
                  size={11}
                  filled={s <= Math.round(driver.rating)}
                  style={{ color: s <= Math.round(driver.rating) ? '#fbbf24' : 'var(--text-muted)' } as React.CSSProperties}
                />
              ))}
              <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>{driver.rating}</span>
            </div>
            <span
              className="text-xs font-bold"
              style={{ color: 'var(--accent-cyan)', fontFamily: "'DM Mono', monospace" }}
            >
              Code {driver.systemCode}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

export const KekeList: React.FC = () => {
  const navigate = useNavigate();
  const [routeId, setRouteId] = useState(CARRIER_ROUTES[0].id);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [transitStatus, setTransitStatus] = useState<TransitStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedRoute = CARRIER_ROUTES.find(r => r.id === routeId);

  const loadTransitStatus = useCallback(async () => {
    try {
      const status = await api.getTransitStatus();
      setTransitStatus(status);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadCarriers = useCallback(async () => {
    try {
      await loadTransitStatus();
      const carriers = await api.getCarriers({ routeId });
      const kekeDrivers = carriers.filter(d => d.vehicleType === 'keke' || d.vehicleType === 'bike');
      kekeDrivers.sort((a, b) => b.rating - a.rating);
      setDrivers(kekeDrivers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [routeId, loadTransitStatus]);

  useEffect(() => {
    setLoading(true);
    loadCarriers();
  }, [loadCarriers]);

  useEffect(() => {
    const socket = io(`${WS_BASE}${BOOKING_WS_NAMESPACE}`);
    const refresh = () => loadCarriers();
    socket.on('driver:carrier:updated', refresh);
    socket.on('transit:day:started', refresh);
    socket.on('transit:closed', refresh);
    return () => { socket.disconnect(); };
  }, [loadCarriers]);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Book a Keke"
        subtitle="Choose your route, then pick an available driver"
        backTo="/"
      />

      {transitStatus && (
        <div
          className="rounded-2xl p-4 mb-5 text-sm"
          style={{
            background: transitStatus.status === 'active'
              ? 'rgba(34,197,94,0.08)'
              : transitStatus.status === 'standby'
                ? 'rgba(245,158,11,0.08)'
                : 'rgba(239,68,68,0.08)',
            border: `1px solid ${
              transitStatus.status === 'active'
                ? 'rgba(34,197,94,0.2)'
                : transitStatus.status === 'standby'
                  ? 'rgba(245,158,11,0.2)'
                  : 'rgba(239,68,68,0.2)'
            }`,
            color: 'var(--text-primary)',
          }}
        >
          <p className="font-semibold">
            {transitStatus.status === 'active' && 'Transit is live'}
            {transitStatus.status === 'standby' && 'Waiting for first driver'}
            {transitStatus.status === 'closed' && 'Transit closed'}
            {' · '}{transitStatus.localTime}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{transitStatus.message}</p>
          {transitStatus.status === 'standby' && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Service runs 4:00 AM – 7:00 PM. The day starts when the first driver lists on a route.
            </p>
          )}
        </div>
      )}

      <div className="mb-5">
        <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: 'var(--text-muted)', letterSpacing: '1.5px' }}>
          SELECT ROUTE
        </p>
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
          {CARRIER_ROUTES.map(route => (
            <button
              key={route.id}
              type="button"
              onClick={() => setRouteId(route.id)}
              className="w-full text-left px-4 py-3 rounded-xl transition-colors cursor-pointer"
              style={{
                background: routeId === route.id ? 'var(--accent-blue)' : 'var(--card-bg)',
                color: routeId === route.id ? '#fff' : 'var(--text-primary)',
                border: `1px solid ${routeId === route.id ? 'var(--accent-blue)' : 'var(--card-border)'}`,
              }}
            >
              <p className="text-sm font-semibold">{route.label}</p>
              <p
                className="text-[11px] mt-0.5"
                style={{ color: routeId === route.id ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)' }}
              >
                Pickup at {route.from}
              </p>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => (
            <div
              key={n}
              className="rounded-2xl h-24 animate-pulse"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
            />
          ))}
        </div>
      ) : transitStatus?.status !== 'active' ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <p className="text-4xl mb-3">{transitStatus?.status === 'closed' ? '🌙' : '⏳'}</p>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {transitStatus?.status === 'closed' ? 'No bookings right now' : 'Service has not started today'}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {transitStatus?.message}
          </p>
        </div>
      ) : drivers.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <p className="text-4xl mb-3">🛺</p>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            No drivers on {selectedRoute?.label} yet
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Drivers appear here after they check in at {selectedRoute?.from} for this route
          </p>
        </div>
      ) : (
        <section>
          <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: 'var(--text-muted)', letterSpacing: '1.5px' }}>
            AVAILABLE ON {selectedRoute?.label?.toUpperCase()} ({drivers.length})
          </p>
          <div className="space-y-3">
            {drivers.map(d => (
              <KekeListItem key={d.id} driver={d} onClick={() => navigate(`/keke/${d.id}`)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};