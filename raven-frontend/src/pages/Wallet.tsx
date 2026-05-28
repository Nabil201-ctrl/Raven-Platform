import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { CopyIcon, CheckIcon, PlusIcon, HistoryIcon, WalletIcon } from '../icons';

export const Wallet: React.FC = () => {
  const { balance, transactions, addFunds } = useWallet();
  const [copied, setCopied] = useState(false);
  const [showFunding, setShowFunding] = useState(false);

  const bankDetails = {
    bank: 'Moniepoint MFB',
    accountNumber: '8102345678',
    accountName: 'Raven — Oluwafemi S.',
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `${bankDetails.bank}\n${bankDetails.accountNumber}\n${bankDetails.accountName}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDemoTopUp = () => {
    const val = prompt('Enter amount to add (₦):', '1000');
    if (val && !isNaN(Number(val)) && Number(val) > 0) {
      addFunds(Number(val));
    }
  };

  const SectionLabel: React.FC<{ text: string }> = ({ text }) => (
    <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: 'var(--text-muted)', letterSpacing: '1.5px' }}>
      {text}
    </p>
  );

  return (
    <div className="space-y-6 animate-fade-up">

      {/* Balance card */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, var(--navy-800), var(--navy-700))',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <WalletIcon size={16} style={{ color: 'var(--text-muted)' } as React.CSSProperties} />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>MAIN TRANSIT BALANCE</p>
        </div>
        <p
          className="text-4xl font-bold mb-4"
          style={{ color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace" }}
        >
          ₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFunding(!showFunding)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <PlusIcon size={14} /> Top Up
          </button>
          <button
            onClick={handleDemoTopUp}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'rgba(42,111,245,0.2)', color: 'var(--accent-blue-light)', border: '1px solid rgba(42,111,245,0.3)' }}
          >
            Demo Fund
          </button>
        </div>
      </div>

      {/* Bank details (toggle) */}
      {showFunding && (
        <div
          className="rounded-2xl p-5 animate-fade-up"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <SectionLabel text="FUND VIA TRANSFER" />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: 'rgba(42,111,245,0.12)', color: 'var(--accent-blue-light)', border: '1px solid rgba(42,111,245,0.2)' }}
            >
              {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          {[
            { label: 'Bank', value: bankDetails.bank },
            { label: 'Account Number', value: bankDetails.accountNumber, mono: true },
            { label: 'Account Name', value: bankDetails.accountName },
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex justify-between py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span
                className="text-sm font-semibold"
                style={{ color: 'var(--text-primary)', fontFamily: mono ? "'DM Mono', monospace" : undefined }}
              >
                {value}
              </span>
            </div>
          ))}
          <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
            Reflects in 2 min via payment webhook
          </p>
        </div>
      )}

      {/* Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel text="RECENT ACTIVITY" />
          <HistoryIcon size={15} style={{ color: 'var(--text-muted)' } as React.CSSProperties} />
        </div>

        <div className="space-y-2">
          {transactions.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No transactions yet</p>
          ) : (
            transactions.slice(0, 8).map(tx => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{tx.description}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {new Date(tx.createdAt).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span
                  className="text-sm font-bold"
                  style={{
                    color: tx.type === 'credit' ? 'var(--green-active)' : '#ef4444',
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {tx.type === 'credit' ? '+' : '−'}₦{tx.amount.toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};