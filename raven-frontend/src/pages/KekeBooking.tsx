import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Driver } from '../types';
import { ArrowLeftIcon, KekeIcon, StarIcon } from '../icons';

const PRICE_OPTIONS = [120, 220, 320, 420] as const;

export const KekeBooking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.getKekeDriverDetails(id)
      .then(setDriver)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handlePayment = (amount: number) => {
    if (!driver) return;
    navigate('/payment', {
      state: {
        type: 'keke',
        driverId: driver.id,
        driverName: driver.name,
        vehiclePlate: driver.vehiclePlate,
        priceOptions: PRICE_OPTIONS,
        amount,
      },
    });
  };

  if (loading || !driver) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-muted)' }}>
        <div className="text-center">
          <KekeIcon size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Loading driver details…</p>
        </div>
      </div>
    );
  }

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
        DRIVER DETAILS
      </p>

      {/* Driver card */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
            style={{ background: 'var(--navy-700)', color: 'var(--text-primary)' }}
          >
            {driver.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{driver.name}</h2>
            <div className="flex items-center gap-1.5 mt-1" style={{ color: 'var(--text-muted)' }}>
              <KekeIcon size={12} />
              <span className="text-xs">{driver.vehicleType.toUpperCase()}</span>
              <span className="text-xs">·</span>
              <span className="text-xs" style={{ fontFamily: "'DM Mono', monospace" }}>{driver.vehiclePlate}</span>
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              {[1,2,3,4,5].map(s => (
                <StarIcon key={s} size={12} filled={s <= Math.round(driver.rating)} className="text-amber-400"
                  style={{ color: s <= Math.round(driver.rating) ? '#fbbf24' : 'rgba(255,255,255,0.15)' } as React.CSSProperties}
                />
              ))}
              <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>{driver.rating}</span>
              <span
                className="ml-2 text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: driver.isActive ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)',
                  color: driver.isActive ? 'var(--green-active)' : 'var(--text-muted)',
                }}
              >
                {driver.isActive ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        <div
          className="mt-4 rounded-xl px-3 py-2 flex justify-between"
          style={{ background: 'rgba(0,0,0,0.2)' }}
        >
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>System Code</p>
            <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace" }}>
              {driver.systemCode}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Plate</p>
            <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace" }}>
              {driver.vehiclePlate}
            </p>
          </div>
        </div>

        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          Phone number not displayed for privacy protection.
        </p>
      </div>

      {/* Price chips */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)', letterSpacing: '1px' }}>
          SELECT FARE
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PRICE_OPTIONS.map(amt => (
            <button
              key={amt}
              onClick={() => handlePayment(amt)}
              className="py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
              style={{
                background: 'rgba(42,111,245,0.1)',
                border: '1px solid rgba(42,111,245,0.25)',
                color: 'var(--accent-blue-light)',
                fontFamily: "'DM Mono', monospace",
              }}
            >
              ₦{amt.toLocaleString()}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            const val = prompt('Enter amount (₦):');
            if (val && !isNaN(Number(val)) && Number(val) >= 120) {
              handlePayment(Number(val));
            }
          }}
          className="mt-2 w-full py-3 rounded-xl text-sm font-medium transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--text-muted)',
          }}
        >
          Other amount
        </button>
      </div>
    </div>
  );
};