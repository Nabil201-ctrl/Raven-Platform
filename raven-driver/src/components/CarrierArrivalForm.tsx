import React, { useState, useEffect } from 'react';
import type { Driver } from '../types';
import type { TransitStatus } from '../types/transit';
import {
  CARRIER_ROUTES,
  getCarrierRouteLabel,
  getCarrierRouteLockStatus,
  formatLockTime,
  defaultSeatCapacity,
  maxSeatCapacity,
  seatCapacityLabel,
} from '../constants/carrierRoutes';

interface CarrierArrivalFormProps {
  driver: Driver;
  transitStatus: TransitStatus | null;
  onSubmit: (routeId: string, notes: string, seatCapacity: number) => Promise<void>;
  onEndListing: () => Promise<void>;
  loading?: boolean;
}

export const CarrierArrivalForm: React.FC<CarrierArrivalFormProps> = ({
  driver,
  transitStatus,
  onSubmit,
  onEndListing,
  loading = false,
}) => {
  const [routeId, setRouteId] = useState(CARRIER_ROUTES[0].id);
  const [notes, setNotes] = useState('');
  const [seatCapacity, setSeatCapacity] = useState(
    () => driver.carrierSeatCapacity ?? defaultSeatCapacity(driver.vehicleType),
  );
  const [submitting, setSubmitting] = useState(false);
  const [lockTick, setLockTick] = useState(0);
  const maxSeats = maxSeatCapacity(driver.vehicleType);

  const isClosed = transitStatus?.status === 'closed';
  const isStandby = transitStatus?.status === 'standby';
  const isListed = !!(driver.isCarrier && driver.carrierRouteId);
  const selectedRoute = CARRIER_ROUTES.find(r => r.id === routeId);
  const { canChangeRoute, msRemaining } = getCarrierRouteLockStatus(driver);
  const isChangingRoute = isListed && routeId !== driver.carrierRouteId;
  const routeLocked = isListed && !canChangeRoute && isChangingRoute;

  useEffect(() => {
    if (driver.carrierRouteId) setRouteId(driver.carrierRouteId);
    setNotes(driver.carrierNotes || '');
    setSeatCapacity(driver.carrierSeatCapacity ?? defaultSeatCapacity(driver.vehicleType));
  }, [driver.carrierRouteId, driver.carrierNotes, driver.carrierSeatCapacity, driver.isCarrier, driver.vehicleType]);

  useEffect(() => {
    if (!isListed || canChangeRoute) return;
    const interval = setInterval(() => setLockTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, [isListed, canChangeRoute, lockTick]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (routeLocked) return;
    setSubmitting(true);
    try {
      const effectiveSeats = driver.vehicleType === 'bike' ? 1 : seatCapacity;
      await onSubmit(routeId, notes, effectiveSeats);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRouteSelect = (id: string) => {
    if (isListed && !canChangeRoute && id !== driver.carrierRouteId) return;
    setRouteId(id);
  };

  return (
    <div
      className={`p-5 rounded-2xl bg-[#111215] border space-y-4 ${
        isListed ? 'border-emerald-500/30' : 'border-[#2563eb]/30'
      }`}
    >
      {transitStatus && (
        <div
          className={`p-3 rounded-xl text-xs border ${
            isClosed
              ? 'bg-red-950/20 border-red-500/30 text-red-300'
              : isStandby
                ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <p className="font-semibold">
            {isClosed ? 'Transit closed' : isStandby ? 'Standby — day not started' : 'Transit active'}
            {' · '}{transitStatus.localTime} WAT
          </p>
          <p className="mt-1 opacity-90">{transitStatus.message}</p>
          <p className="mt-1 text-[10px] opacity-75">
            Operating hours: 4:00 AM – 7:00 PM daily · Route changes every 2 hours
          </p>
          {isStandby && !isListed && (
            <p className="mt-1 text-[10px]">
              Listing your route will start transit for everyone today.
            </p>
          )}
        </div>
      )}

      {isListed ? (
        <div className="flex items-start justify-between gap-3 pb-2 border-b border-gray-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Listed on route
            </p>
            <p className="text-sm font-bold text-white mt-1">
              {getCarrierRouteLabel(driver.carrierRouteId) || `${driver.carrierFrom} → ${driver.carrierTo}`}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Pickup at <strong className="text-white">{driver.carrierFrom}</strong> · Passengers going to{' '}
              <strong className="text-white">{driver.carrierTo}</strong> can book you
            </p>
            {driver.carrierSeatCapacity != null && (
              <p className="text-xs text-gray-400 mt-1">
                <strong className="text-white">{driver.carrierSeatCapacity}</strong>{' '}
                passenger seat{driver.carrierSeatCapacity === 1 ? '' : 's'} available
              </p>
            )}
            {!canChangeRoute && (
              <p className="text-xs text-amber-400 mt-2">
                Route locked for {formatLockTime(msRemaining)} — minimum 2-hour commitment
              </p>
            )}
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shrink-0">
            Live
          </span>
        </div>
      ) : (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2563eb]">
            Route check-in
          </p>
          <h2 className="text-lg font-bold text-white mt-1">Set your operating route</h2>
          <p className="text-sm text-gray-400 mt-1">
            Choose the route you will operate for at least <strong className="text-white">2 hours</strong> before you can switch.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Select route
          </label>
          {!canChangeRoute && isListed && (
            <p className="text-[11px] text-gray-500">
              Other routes are unavailable until your 2-hour lock ends. You can still update your passenger note.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-1">
            {CARRIER_ROUTES.map(route => {
              const isCurrent = driver.carrierRouteId === route.id;
              const isDisabled = isListed && !canChangeRoute && !isCurrent;
              return (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => handleRouteSelect(route.id)}
                  disabled={isDisabled}
                  className={`text-left p-3 rounded-xl border transition-colors ${
                    isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                  } ${
                    routeId === route.id
                      ? 'bg-[#2563eb]/15 border-[#2563eb] text-white'
                      : 'bg-black border-gray-800 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <p className="text-sm font-semibold">{route.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Pickup: {route.from}
                    {isCurrent && isListed ? ' · Current' : ''}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {selectedRoute && (
          <div className="p-3 rounded-xl bg-black/50 border border-gray-800 text-xs text-gray-400">
            You must be at <strong className="text-white">{selectedRoute.from}</strong> to accept passengers
            travelling to <strong className="text-white">{selectedRoute.to}</strong>.
            {!isListed && (
              <span className="block mt-1 text-amber-400/90">
                Once listed, this route cannot be changed for 2 hours.
              </span>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Seats in your {seatCapacityLabel(driver.vehicleType)}
          </label>
          {driver.vehicleType === 'bike' ? (
            <p className="text-sm text-gray-400 px-1">1 passenger seat (bike)</p>
          ) : (
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={maxSeats}
                value={seatCapacity}
                onChange={e => {
                  const next = parseInt(e.target.value, 10);
                  if (!Number.isNaN(next)) {
                    setSeatCapacity(Math.min(maxSeats, Math.max(1, next)));
                  }
                }}
                className="w-24 px-3 py-2.5 rounded-xl bg-black border border-gray-800 text-sm text-white outline-none focus:border-[#2563eb] font-mono"
              />
              <p className="text-xs text-gray-500">
                How many passengers can you take? (max {maxSeats})
              </p>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Note for passengers (optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Near main gate, 3 seats free"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-black border border-gray-800 text-sm text-white outline-none focus:border-[#2563eb]"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="submit"
            disabled={loading || submitting || routeLocked || isClosed}
            className="flex-1 py-3 rounded-xl font-semibold text-sm bg-[#2563eb] hover:bg-blue-600 text-white cursor-pointer disabled:opacity-50"
          >
            {submitting
              ? 'Saving...'
              : routeLocked
                ? `Locked — ${formatLockTime(msRemaining)} left`
                : isListed
                  ? isChangingRoute
                    ? `Switch to ${selectedRoute?.label}`
                    : 'Update listing'
                  : `List me on ${selectedRoute?.label || 'route'} (2h lock)`}
          </button>
          {isListed && (
            <button
              type="button"
              disabled={loading || submitting}
              onClick={async () => {
                setSubmitting(true);
                try {
                  await onEndListing();
                } finally {
                  setSubmitting(false);
                }
              }}
              className="px-4 py-3 rounded-xl text-sm font-semibold bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 cursor-pointer disabled:opacity-50"
            >
              End listing
            </button>
          )}
        </div>
      </form>
    </div>
  );
};