import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { CopyIcon, CheckIcon, PlusIcon, HistoryIcon, WalletIcon } from '../icons';

export const Wallet: React.FC = () => {
  const { balance, transactions, addFunds, user } = useWallet();
  const [copied, setCopied] = useState(false);
  const [showFunding, setShowFunding] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [copiedTxId, setCopiedTxId] = useState(false);

  const bankDetails = {
    bank: user?.bankName || 'Wema Bank (Simulated Sandbox)',
    accountNumber: user?.accountNumber || '—',
    accountName: user?.name || '—',
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `${bankDetails.bank}\n${bankDetails.accountNumber}\n${bankDetails.accountName}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyTxId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedTxId(true);
    setTimeout(() => setCopiedTxId(false), 1500);
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
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
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
            style={{ background: 'var(--accent-blue)', color: 'white', border: 'none' }}
          >
            <PlusIcon size={14} /> Top Up
          </button>
          <button
            onClick={handleDemoTopUp}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'var(--inset-bg)', color: 'var(--accent-blue)', border: '1px solid var(--card-border)' }}
          >
            Demo Fund
          </button>
        </div>
      </div>

      {/* Bank details (toggle) */}
      {showFunding && (
        <div
          className="rounded-2xl p-5 animate-fade-up"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <SectionLabel text="FUND VIA TRANSFER" />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: 'var(--inset-bg)', color: 'var(--accent-blue-light)', border: '1px solid var(--card-border)' }}
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
            <div key={label} className="flex justify-between py-3" style={{ borderBottom: '1px solid var(--card-border)' }}>
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
                onClick={() => setSelectedTx(tx)}
                className="flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{tx.description}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {new Date(tx.createdAt).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-bold"
                    style={{
                      color: tx.type === 'credit' ? 'var(--green-active)' : 'var(--text-primary)',
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {tx.type === 'credit' ? '+' : '−'}₦{tx.amount.toLocaleString()}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-blue-500/80 hover:text-blue-500">View</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sleek, Clean Receipt Modal */}
      {selectedTx && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedTx(null)}
        >
          <div 
            className="w-full max-w-sm rounded-2xl p-6 space-y-6 shadow-xl border animate-fade-in"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--card-border)' }}>
              <div className="flex items-center gap-2">
                <WalletIcon size={16} className="text-blue-500" />
                <span className="text-sm font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>TRANSACTION RECEIPT</span>
              </div>
              <button 
                onClick={() => setSelectedTx(null)} 
                className="text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Close
              </button>
            </div>

            {/* Receipt Content */}
            <div className="text-center space-y-2 py-2">
              <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Amount</p>
              <p className="text-3xl font-black font-mono" style={{ color: selectedTx.type === 'credit' ? 'var(--green-active)' : 'var(--text-primary)' }}>
                {selectedTx.type === 'credit' ? '+' : '−'}₦{selectedTx.amount.toLocaleString()}
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                   style={{ background: 'var(--inset-bg)', color: 'var(--green-active)', border: '1px solid var(--card-border)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span>Transaction Successful</span>
              </div>
            </div>

            {/* Metadata Rows */}
            <div className="space-y-3.5 py-2">
              {[
                { label: 'Destination / Purpose', value: selectedTx.description },
                { label: 'Reference ID', value: selectedTx.id, mono: true, copyable: true },
                { label: 'Type', value: selectedTx.type === 'credit' ? 'Inbound Credit (Deposit)' : 'Outbound Debit (Transit Booking)' },
                { label: 'Payment Channel', value: 'Monnify Sandbox Gateway' },
                { label: 'Status Code', value: '00 (SUCCESS)' },
                { label: 'Date & Time', value: new Date(selectedTx.createdAt).toLocaleString('en-NG', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                }) },
              ].map(({ label, value, mono, copyable }) => (
                <div key={label} className="flex justify-between items-start text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <div className="text-right max-w-[200px] space-y-1">
                    <p className={`font-semibold ${mono ? 'font-mono' : ''}`} style={{ color: 'var(--text-primary)' }}>
                      {value}
                    </p>
                    {copyable && (
                      <button 
                        onClick={() => handleCopyTxId(selectedTx.id)}
                        className="text-[9px] font-bold text-blue-500 uppercase hover:underline"
                      >
                        {copiedTxId ? 'Copied!' : 'Copy Reference'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <button 
              onClick={() => {
                alert('Receipt downloaded/shared successfully!');
                setSelectedTx(null);
              }}
              className="w-full py-3 rounded-xl text-xs font-bold transition-all text-white bg-blue-600 hover:bg-blue-700 active:scale-98"
            >
              Share / Download Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};