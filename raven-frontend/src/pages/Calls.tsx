import React, { useState } from 'react';
import { useCalls } from '../hooks/useCalls';
import { useWallet } from '../hooks/useWallet';
import { PhoneIcon, ClockIcon, SignalIcon } from '../icons';

const PACKAGES = [
  { id: 'p1', minutes: 10, price: 150, talkTime: 3,  label: 'Starter' },
  { id: 'p2', minutes: 30, price: 400, talkTime: 10, label: 'Standard' },
  { id: 'p3', minutes: 60, price: 750, talkTime: 20, label: 'Extended' },
] as const;

export const Calls: React.FC = () => {
  const { minutes, purchaseMinutes } = useCalls();
  const { balance, deductFunds } = useWallet();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (pkg: typeof PACKAGES[number]) => {
    if (balance < pkg.price) {
      alert(`Insufficient balance. You need ₦${pkg.price} — current balance ₦${balance.toFixed(2)}.`);
      return;
    }
    setPurchasing(pkg.id);
    try {
      await deductFunds(pkg.price);
      await purchaseMinutes(pkg.minutes);
    } catch {
      alert('Purchase failed. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const minutesPercent = Math.min(100, (minutes / 60) * 100);

  return (
    <div className="space-y-6 animate-fade-up">

      {/* Minutes card */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, var(--navy-800), #0d1f40)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <SignalIcon size={15} style={{ color: 'var(--accent-blue-light)' } as React.CSSProperties} />
          <p className="text-xs" style={{ color: 'var(--text-muted)', letterSpacing: '1px' }}>RAVEN CALL PACK</p>
        </div>

        <p
          className="text-4xl font-bold mb-1"
          style={{ color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace" }}
        >
          {minutes}
          <span className="text-lg ml-1 font-normal" style={{ color: 'var(--text-muted)' }}>min left</span>
        </p>

        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Masked calls to drivers only — real numbers never shared
        </p>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div
            className="h-1.5 rounded-full transition-all duration-700"
            style={{ width: `${minutesPercent}%`, background: 'var(--accent-blue)' }}
          />
        </div>
        <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
          {minutes === 0 ? 'No minutes remaining — purchase a pack below' : `${minutes} of 60 max minutes`}
        </p>
      </div>

      {/* Buy packs */}
      <div>
        <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: 'var(--text-muted)', letterSpacing: '1.5px' }}>
          BUY CALL PACKS
        </p>

        <div className="space-y-2">
          {PACKAGES.map(pkg => {
            const canAfford = balance >= pkg.price;
            const isLoading = purchasing === pkg.id;

            return (
              <div
                key={pkg.id}
                className="flex items-center justify-between rounded-2xl px-4 py-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(42,111,245,0.12)', color: 'var(--accent-blue-light)' }}
                  >
                    <ClockIcon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {pkg.minutes} minutes
                      <span
                        className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(42,111,245,0.12)', color: 'var(--accent-blue-light)' }}
                      >
                        {pkg.label}
                      </span>
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      ~{pkg.talkTime} min talk time · ₦50 platform fee included
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className="text-sm font-bold"
                    style={{ color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace" }}
                  >
                    ₦{pkg.price}
                  </span>
                  <button
                    onClick={() => handlePurchase(pkg)}
                    disabled={!canAfford || !!purchasing}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                    style={{
                      background: canAfford ? 'var(--accent-blue)' : 'rgba(255,255,255,0.07)',
                      color: canAfford ? 'white' : 'var(--text-muted)',
                      cursor: !canAfford ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isLoading ? '…' : 'Buy'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info card */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(42,111,245,0.06)', border: '1px solid rgba(42,111,245,0.15)' }}
      >
        <div className="flex items-start gap-3">
          <PhoneIcon size={16} style={{ color: 'var(--accent-blue-light)', flexShrink: 0 } as React.CSSProperties} />
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--accent-blue-light)' }}>How masked calls work</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Your call is bridged through a secure Raven proxy. Neither you nor the driver
              see each other's real phone number. Calls are hard-capped at your purchased
              minutes to protect both parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};