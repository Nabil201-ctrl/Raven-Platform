import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useAppContext } from '../context/AppContext';
import { api } from '../services/api';
import type { PaymentState } from '../types';
import { ArrowLeftIcon, WalletIcon } from '../icons';

export const Payment: React.FC = () => {
  const location    = useLocation();
  const navigate    = useNavigate();
  const { balance, deductFunds } = useWallet();
  const { syncState } = useAppContext();
  const paymentData = location.state as PaymentState | null;

  const defaultAmount =
    paymentData?.totalAmount ??
    paymentData?.priceOptions?.[0] ??
    0;

  const [selectedAmount, setSelectedAmount] = useState<number>(defaultAmount);
  const [processing, setProcessing]         = useState(false);

  if (!paymentData) {
    return (
      <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
        <p className="text-sm">No payment information found. Please go back and try again.</p>
        <button onClick={() => navigate('/')} className="mt-4 underline" style={{ color: 'var(--accent-blue-light)' }}>
          Return home
        </button>
      </div>
    );
  }

  const isShuttle          = paymentData.type === 'shuttle';
  const hasSufficientBalance = balance >= selectedAmount;

  const handleConfirm = async () => {
    if (!hasSufficientBalance) {
      alert(`Insufficient wallet balance. Please top up ₦${(selectedAmount - balance).toLocaleString()} more.`);
      return;
    }
    setProcessing(true);
    try {
      const routeLabel = paymentData.route ||
        (isShuttle ? 'Shuttle ride' : `Keke — ${paymentData.driverName || 'Driver'}`);

      // Deduct with meaningful transaction description
      await deductFunds(selectedAmount, routeLabel);

      // Create booking record
      const booking = await api.createBooking({
        type: paymentData.type,
        amount: selectedAmount,
        driverId: paymentData.driverId,
        shuttleId: paymentData.shuttleId,
        seats: paymentData.selectedSeats,
        isPremium: paymentData.isPremium,
        route: routeLabel,
        departureTime: paymentData.departureTime,
      });

      await syncState();

      navigate(`/confirmation/${booking.id}`, {
        state: { booking: { ...booking, departureTime: paymentData.departureTime }, paymentData },
      });
    } catch (err) {
      alert('Payment failed. Please try again.');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const InfoRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
    <div className="flex justify-between items-center py-2.5" style={{ borderBottom: '1px solid var(--card-border)' }}>
      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-sm font-semibold"
        style={{ color: 'var(--text-primary)', fontFamily: mono ? "'DM Mono', monospace" : undefined }}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-up">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
        style={{ color: 'var(--text-secondary)' }}>
        <ArrowLeftIcon size={18} /> Back
      </button>

      <p className="text-xs font-semibold tracking-widest"
        style={{ color: 'var(--text-muted)', letterSpacing: '1.5px' }}>
        PAYMENT SUMMARY
      </p>

      {/* Summary card */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
        {isShuttle ? (
          <>
            <InfoRow label="Route"     value={paymentData.route || '—'} />
            <InfoRow label="Departure" value={paymentData.departureTime || '—'} mono />
            <InfoRow label="Seats"     value={paymentData.selectedSeats?.join(', ') || '—'} />
            {paymentData.isPremium && <InfoRow label="Type" value="Premium — All seats" />}
          </>
        ) : (
          <>
            <InfoRow label="Driver"  value={paymentData.driverName || '—'} />
            <InfoRow label="Vehicle" value={paymentData.vehiclePlate || '—'} mono />
            <InfoRow label="Route"   value={paymentData.route || 'On-site'} />
          </>
        )}
        <div className="flex justify-between items-center pt-3 mt-1">
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Total</span>
          <span className="text-xl font-bold"
            style={{ color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace" }}>
            ₦{selectedAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Price chips — Keke only */}
      {paymentData.type === 'keke' && paymentData.priceOptions && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)', letterSpacing: '1px' }}>
            SELECT AMOUNT
          </p>
          <div className="grid grid-cols-2 gap-2">
            {paymentData.priceOptions.map(amt => (
              <button key={amt} onClick={() => setSelectedAmount(amt)}
                className="py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: selectedAmount === amt ? 'var(--accent-blue)' : 'var(--inset-bg)',
                  border: `1px solid ${selectedAmount === amt ? 'var(--accent-blue)' : 'var(--card-border)'}`,
                  color: selectedAmount === amt ? 'white' : 'var(--text-secondary)',
                  fontFamily: "'DM Mono', monospace",
                }}>
                ₦{amt.toLocaleString()}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              const val = prompt('Enter custom amount (₦):');
              if (val && !isNaN(Number(val)) && Number(val) >= 120) setSelectedAmount(Number(val));
            }}
            className="mt-2 w-full py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'var(--inset-bg)', border: '1px solid var(--card-border)', color: 'var(--text-muted)' }}>
            Other amount
          </button>
        </div>
      )}

      {/* Wallet balance row */}
      <div className="flex items-center justify-between rounded-xl px-4 py-3"
        style={{ background: 'var(--inset-bg)', border: '1px solid var(--card-border)' }}>
        <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <WalletIcon size={16} />
          <span className="text-sm">Wallet balance</span>
        </div>
        <span className="text-sm font-bold"
          style={{ color: hasSufficientBalance ? 'var(--green-active)' : '#ef4444',
                   fontFamily: "'DM Mono', monospace" }}>
          ₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {!hasSufficientBalance && (
        <p className="text-xs text-center" style={{ color: '#ef4444' }}>
          Top up ₦{(selectedAmount - balance).toLocaleString()} more to proceed.
        </p>
      )}

      {/* Pay button */}
      <button onClick={handleConfirm}
        disabled={processing || !hasSufficientBalance}
        className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98]"
        style={{
          background: hasSufficientBalance ? 'var(--accent-blue)' : 'var(--inset-bg)',
          color: hasSufficientBalance ? 'white' : 'var(--text-muted)',
          cursor: !hasSufficientBalance ? 'not-allowed' : 'pointer',
          border: 'none',
        }}>
        {processing ? 'Processing…' : `Pay ₦${selectedAmount.toLocaleString()}`}
      </button>
    </div>
  );
};