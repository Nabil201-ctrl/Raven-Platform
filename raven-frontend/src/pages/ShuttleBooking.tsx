import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Shuttle } from '../types';
import { useAppContext } from '../context/AppContext';
import { ArrowLeftIcon, CrownIcon, MapPinIcon, ClockIcon, StarIcon } from '../icons';

export const ShuttleBooking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBookedSeats, addBookedSeats } = useAppContext();

  const [shuttle, setShuttle] = useState<Shuttle | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [isPremiumMode, setIsPremiumMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // All seats considered booked = API booked + locally booked by this user
  const locallyBooked = id ? getBookedSeats(id) : [];

  useEffect(() => {
    if (!id) return;
    api.getShuttleDetails(id)
      .then(setShuttle)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !shuttle) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-muted)' }}>
        <p className="text-sm">Loading shuttle details…</p>
      </div>
    );
  }

  // Merge API bookedSeats with locally persisted ones
  const allBookedSeats = [...new Set([...shuttle.bookedSeats, ...locallyBooked])];

  const handleSeatToggle = (seatNum: number) => {
    if (allBookedSeats.includes(seatNum)) return;
    if (isPremiumMode) return;
    setSelectedSeats(prev =>
      prev.includes(seatNum) ? prev.filter(s => s !== seatNum) : [...prev, seatNum]
    );
  };

  const handlePremium = () => {
    if (allBookedSeats.length > 0) {
      alert('Premium unavailable: one or more seats are already booked.');
      return;
    }
    setIsPremiumMode(true);
    setSelectedSeats(Array.from({ length: shuttle.totalSeats }, (_, i) => i + 1));
  };

  const handleProceed = () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat.');
      return;
    }
    const pricePerSeat = isPremiumMode ? shuttle.premiumPricePerSeat : shuttle.pricePerSeat;

    // Persist seats to context immediately so they show as booked when user returns
    if (id) addBookedSeats(id, selectedSeats);

    navigate('/payment', {
      state: {
        type: 'shuttle',
        shuttleId: shuttle.id,
        driverId: shuttle.driver.id,
        route: `${shuttle.route.from} → ${shuttle.route.to}`,
        departureTime: shuttle.departureTime,
        selectedSeats,
        totalAmount: selectedSeats.length * pricePerSeat,
        isPremium: isPremiumMode,
        pricePerSeat,
      },
    });
  };

  const totalCost = selectedSeats.length * (isPremiumMode ? shuttle.premiumPricePerSeat : shuttle.pricePerSeat);

  const seatState = (num: number): 'booked' | 'selected' | 'available' => {
    if (allBookedSeats.includes(num)) return 'booked';
    if (selectedSeats.includes(num)) return 'selected';
    return 'available';
  };

  return (
    <div className="space-y-5 animate-fade-up">

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ArrowLeftIcon size={18} /> Back
      </button>

      {/* Shuttle info */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace" }}>
              {shuttle.departureTime}
              <span className="mx-2 text-sm font-normal" style={{ color: 'var(--text-muted)' }}>→</span>
              {shuttle.arrivalTime}
            </p>
            <div className="flex items-center gap-1.5 mt-1" style={{ color: 'var(--text-secondary)' }}>
              <MapPinIcon size={12} />
              <span className="text-sm font-medium">{shuttle.route.from} → {shuttle.route.to}</span>
            </div>
          </div>
          <div className="text-xs px-2 py-1 rounded-full font-mono" style={{ background: 'rgba(42,111,245,0.15)', color: 'var(--accent-blue-light)' }}>
            {shuttle.shuttleCode}
          </div>
        </div>

        {/* Driver row */}
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: 'var(--inset-bg)' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: 'var(--avatar-bg)', color: 'var(--text-primary)' }}>
            {shuttle.driver.name.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{shuttle.driver.name}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>{shuttle.driver.vehiclePlate}</p>
          </div>
          <div className="flex items-center gap-1">
            <StarIcon size={11} filled className="text-amber-400" />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{shuttle.driver.rating}</span>
          </div>
          <div className="w-2 h-2 rounded-full active-dot" style={{ background: shuttle.driver.isActive ? 'var(--green-active)' : '#4b5563' }} />
        </div>
      </div>

      {/* Premium button */}
      {!isPremiumMode ? (
        <button
          onClick={handlePremium}
          className="w-full py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: 'var(--amber-premium)' }}
        >
          <CrownIcon size={16} />
          Book Premium — All seats · ₦{shuttle.premiumPricePerSeat.toLocaleString()} per seat
        </button>
      ) : (
        <div className="py-3 px-4 rounded-2xl flex items-center justify-between" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <div className="flex items-center gap-2" style={{ color: 'var(--amber-premium)' }}>
            <CrownIcon size={16} />
            <span className="font-semibold text-sm">Premium — All seats reserved</span>
          </div>
          <button onClick={() => { setIsPremiumMode(false); setSelectedSeats([]); }} className="text-xs underline" style={{ color: 'var(--text-muted)' }}>Cancel</button>
        </div>
      )}

      {/* Seat grid */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{shuttle.shuttleCode}</p>
          <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <MapPinIcon size={11} />
            <span className="text-xs">{shuttle.route.from} → {shuttle.route.to}</span>
            <ClockIcon size={11} />
            <span className="text-xs">{shuttle.departureTime} – {shuttle.arrivalTime}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4">
          {[
            { label: 'Available', color: 'var(--accent-blue)' },
            { label: 'Booked',    color: '#ef4444' },
            { label: 'Selected',  color: 'var(--green-active)' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: color }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Circles */}
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: shuttle.totalSeats }, (_, i) => i + 1).map(num => {
            const state = seatState(num);
            const styles = {
              available: { bg: 'rgba(42,111,245,0.12)', border: 'rgba(42,111,245,0.4)',  text: 'var(--accent-blue-light)' },
              booked:    { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.5)',   text: '#ef4444' },
              selected:  { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.6)',   text: 'var(--green-active)' },
            }[state];

            return (
              <button
                key={num}
                onClick={() => handleSeatToggle(num)}
                disabled={state === 'booked' || isPremiumMode}
                className="aspect-square rounded-full flex items-center justify-center font-semibold text-sm transition-all active:scale-95"
                style={{
                  background: styles.bg,
                  border: `1.5px solid ${styles.border}`,
                  color: styles.text,
                  cursor: state === 'booked' ? 'not-allowed' : 'pointer',
                  opacity: state === 'booked' ? 0.7 : 1,
                }}
              >
                {num}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sticky CTA */}
      {selectedSeats.length > 0 && (
        <div
          className="rounded-2xl p-4 flex items-center justify-between animate-fade-up"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Seats: {selectedSeats.sort((a, b) => a - b).join(', ')}
            </p>
          </div>
          <button
            onClick={handleProceed}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.97]"
            style={{ background: 'var(--accent-blue)' }}
          >
            Pay ₦{totalCost.toLocaleString()}
          </button>
        </div>
      )}
    </div>
  );
};