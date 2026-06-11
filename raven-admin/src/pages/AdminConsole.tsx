import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Complaint, Shuttle, Driver } from '../types';

export const AdminConsole: React.FC = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [shuttles, setShuttles] = useState<Shuttle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminKey, setAdminKey] = useState(localStorage.getItem('raven_admin_key') || '');

  // New Shuttle form fields
  const [shuttleCode, setShuttleCode] = useState('');
  const [from, setFrom] = useState<'Giri' | 'Gwagwalada'>('Giri');
  const [to, setTo] = useState<'Giri' | 'Gwagwalada'>('Gwagwalada');
  const [departureTime, setDepartureTime] = useState('08:00');
  const [arrivalTime, setArrivalTime] = useState('08:20');
  const [pricePerSeat, setPricePerSeat] = useState(250);
  const [premiumPrice, setPremiumPrice] = useState(1500);

  // Keke Driver verification state
  const [driverTab, setDriverTab] = useState<'all' | 'keke'>('all');
  const [verifyCodeInput, setVerifyCodeInput] = useState('');

  const handleQuickVerifyByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCodeInput.trim()) return;
    try {
      const code = verifyCodeInput.trim().toUpperCase();
      let found = drivers.find(d => d.systemCode.toUpperCase() === code);
      if (!found) {
        found = await api.verifyDriverCode(code);
      }
      if (found) {
        if (!found.isVerified) {
          await api.verifyDriver(found.id);
        }
        if (!found.isApproved) {
          await api.approveDriver(found.id);
        }
        alert(`Driver ${found.name} (${found.vehicleType}) verified and approved successfully!`);
        setVerifyCodeInput('');
        loadData();
      }
    } catch (e: any) {
      alert(`Error verifying/approving driver: ${e.message}`);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch complaints
      const compRes = await api.getComplaints();
      setComplaints(compRes.data || []);

      // Fetch shuttles
      const shutRes = await api.getAvailableShuttles();
      setShuttles(shutRes);

      // Fetch drivers
      const drvRes = await api.getDrivers();
      setDrivers(drvRes);
    } catch (e) {
      console.error('Error fetching admin details:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDriver = async (id: string) => {
    try {
      await api.verifyDriver(id);
      alert('Driver credentials verified. Awaiting admin approval.');
      loadData();
    } catch (e: any) {
      alert(`Error verifying driver: ${e.message}`);
    }
  };

  const handleApproveDriver = async (id: string) => {
    try {
      await api.approveDriver(id);
      alert('Driver approved successfully! They can now access their dashboard.');
      loadData();
    } catch (e: any) {
      alert(`Error approving driver: ${e.message}`);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveAdminKey = () => {
    localStorage.setItem('raven_admin_key', adminKey);
    alert('Admin API Key updated successfully!');
    loadData();
  };

  const handleResolve = async (id: string) => {
    try {
      await api.resolveComplaint(id);
      alert('Complaint resolved successfully!');
      loadData();
    } catch (e: any) {
      alert(`Error resolving complaint: ${e.message}`);
    }
  };

  const handleCreateShuttle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shuttleCode.trim()) {
      alert('Shuttle code is required.');
      return;
    }

    try {
      const data = {
        shuttleCode: shuttleCode.trim(),
        route: { from, to },
        departureTime,
        arrivalTime,
        totalSeats: 14,
        pricePerSeat: Number(pricePerSeat),
        premiumPricePerSeat: Number(premiumPrice),
        driverId: 'd1', // assign default driver
      };

      await api.createShuttle(data);
      alert('Shuttle created successfully!');
      setShuttleCode('');
      loadData();
    } catch (e: any) {
      alert(`Error creating shuttle: ${e.message}`);
    }
  };

  const handleDeleteShuttle = async (id: string) => {
    if (!confirm('Are you sure you want to remove this shuttle route?')) return;
    try {
      await api.deleteShuttle(id);
      alert('Shuttle removed successfully!');
      loadData();
    } catch (e: any) {
      alert(`Error removing shuttle: ${e.message}`);
    }
  };

  const handleResetSeats = async (code: string) => {
    try {
      const res = await api.resetShuttleSeats(code);
      alert(res.message || 'Seats reset map successful!');
      loadData();
    } catch (e: any) {
      alert(`Error resetting seats: ${e.message}`);
    }
  };

  // Stats computation
  const totalRevenue = shuttles.reduce((acc, s) => {
    const bookedCount = s.bookedSeats.length;
    return acc + (bookedCount * s.pricePerSeat);
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07080a] text-gray-500 font-mono tracking-widest text-xs">
        LOADING ADMIN COMMAND CENTER...
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-6 flex flex-col justify-between"
      style={{
        background: '#07080a',
        color: '#ffffff',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
      }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#2a6ff5] animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight">Raven Admin Command Center</h1>
          </div>
          <p className="text-[10px] text-gray-500 font-semibold tracking-wider mt-0.5">
            CRITICAL CONTROL PANEL & SYSTEM STATE
          </p>
        </div>
        <button 
          onClick={() => navigate('/')} 
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-900 border border-gray-800 hover:bg-gray-800 transition-all"
        >
          Exit Panel
        </button>
      </div>

      {/* API Key Panel */}
      <div className="mt-4 p-4 rounded-xl bg-gray-950 border border-gray-900 flex flex-col sm:flex-row items-center gap-3">
        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
          Admin API/X-Admin-Key Auth
        </span>
        <div className="flex-1 w-full flex gap-2">
          <input
            type="password"
            placeholder="Enter RAVEN_ADMIN_KEY (if configured)"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg bg-black border border-gray-800 text-xs text-white font-mono outline-none"
          />
          <button
            onClick={saveAdminKey}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold transition-all"
          >
            Save Key
          </button>
        </div>
      </div>

      {/* Quick Statistics Strip */}
      <div className="my-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Routes', value: shuttles.length, color: 'text-[#2a6ff5]' },
          { label: 'Pending Complaints', value: complaints.filter(c => c.status === 'pending').length, color: 'text-white' },
          { label: 'Est. Shuttle Revenue', value: `₦${totalRevenue.toLocaleString()}`, color: 'text-white' },
          { label: 'Seat Occupancy (Avg)', value: shuttles.length ? `${Math.round((shuttles.reduce((acc, s) => acc + s.bookedSeats.length, 0) / shuttles.reduce((acc, s) => acc + s.totalSeats, 0)) * 100)}%` : '0%', color: 'text-[#2a6ff5]' },
        ].map((stat, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-[#111215] border border-gray-800/80">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{stat.label}</p>
            <p className={`text-xl font-bold font-mono mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 flex-1 mb-6">
        
        {/* Left Col: Shuttle Management Form */}
        <div className="p-5 rounded-2xl bg-[#111215] border border-gray-800 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold tracking-widest text-gray-400 mb-4 uppercase">Create Shuttle Route</h2>
            
            <form onSubmit={handleCreateShuttle} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Shuttle Code</label>
                <input
                  type="text"
                  placeholder="e.g. 1002"
                  value={shuttleCode}
                  onChange={(e) => setShuttleCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-gray-800 text-xs outline-none text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">From</label>
                  <select
                    value={from}
                    onChange={(e) => setFrom(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-gray-800 text-xs outline-none text-white"
                  >
                    <option value="Giri">Giri</option>
                    <option value="Gwagwalada">Gwagwalada</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">To</label>
                  <select
                    value={to}
                    onChange={(e) => setTo(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-gray-800 text-xs outline-none text-white"
                  >
                    <option value="Gwagwalada">Gwagwalada</option>
                    <option value="Giri">Giri</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Dep. Time</label>
                  <input
                    type="text"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    placeholder="08:00"
                    className="w-full px-3 py-2 rounded-lg bg-black border border-gray-800 text-xs outline-none text-white font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Arr. Time</label>
                  <input
                    type="text"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    placeholder="08:20"
                    className="w-full px-3 py-2 rounded-lg bg-black border border-gray-800 text-xs outline-none text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Seat Price (₦)</label>
                  <input
                    type="number"
                    value={pricePerSeat}
                    onChange={(e) => setPricePerSeat(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-gray-800 text-xs outline-none text-white font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Premium All (₦)</label>
                  <input
                    type="number"
                    value={premiumPrice}
                    onChange={(e) => setPremiumPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-gray-800 text-xs outline-none text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold transition-all text-white mt-4"
              >
                Add Shuttle Route
              </button>
            </form>
          </div>

          <p className="text-[10px] text-gray-600 mt-4 leading-relaxed">
            Note: Creating a route automatically assigns Mustapha Yusuf as the mock driver.
          </p>
        </div>

        {/* Middle Col: Shuttle Route List & Commands */}
        <div className="p-5 rounded-2xl bg-[#111215] border border-gray-800 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold tracking-widest text-gray-400 mb-4 uppercase">Shuttle Route Controllers</h2>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {shuttles.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">No shuttles found.</p>
              ) : (
                shuttles.map(s => (
                  <div key={s.id} className="p-3.5 rounded-xl bg-black border border-gray-900 flex flex-col justify-between gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold">{s.route.from} → {s.route.to}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
                          Code: {s.shuttleCode} · Dep: {s.departureTime} · Arr: {s.arrivalTime}
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded-full font-mono">
                        ₦{s.pricePerSeat}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs gap-3">
                      <span className="text-gray-500">
                        Booked:{' '}
                        <strong className="text-white font-mono">{s.bookedSeats.length} / {s.totalSeats}</strong>
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResetSeats(s.shuttleCode)}
                          className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/20"
                        >
                          Reset Seats
                        </button>
                        <button
                          onClick={() => handleDeleteShuttle(s.id)}
                          className="px-2 py-1 rounded bg-red-900/20 hover:bg-red-900/40 text-red-400 text-[10px] font-bold border border-red-500/20"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-between text-[10px] text-gray-500">
            <span>Dynamic updates via websockets</span>
            <button onClick={loadData} className="hover:underline text-blue-400">Refresh Data</button>
          </div>
        </div>

        {/* Right Col: Complaints List & Resolving */}
        <div className="p-5 rounded-2xl bg-[#111215] border border-gray-800 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold tracking-widest text-gray-400 mb-4 uppercase">Passenger Complaints Log</h2>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {complaints.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">No complaints logged.</p>
              ) : (
                complaints.map(c => (
                  <div key={c.id} className="p-3.5 rounded-xl bg-black border border-gray-900 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono text-gray-500">{c.id}</span>
                      <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                        c.status === 'resolved' 
                          ? 'bg-white/5 text-gray-400 border border-white/10' 
                          : 'bg-[#2a6ff5]/10 text-[#2a6ff5] border border-[#2a6ff5]/20'
                      }`}>
                        {c.status}
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed">"{c.message}"</p>

                    <div className="flex justify-between items-center text-[10px] text-gray-500 pt-1 border-t border-gray-900">
                      <span>Booking: <strong className="font-mono text-white">{c.bookingId}</strong></span>
                      {c.status !== 'resolved' && (
                        <button
                          onClick={() => handleResolve(c.id)}
                          className="px-2.5 py-1 rounded bg-green-600 hover:bg-green-700 text-white font-bold"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 text-[10px] text-gray-600">
            Powered by GlobalExceptionFilter & AdminGuard.
          </div>
        </div>

        {/* Fourth Col: Drivers List & Verification */}
        <div className="p-5 rounded-2xl bg-[#111215] border border-gray-800 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-xs font-bold tracking-widest text-gray-400 uppercase">Driver Registry</h2>

            {/* Quick Verify Form */}
            <form onSubmit={handleQuickVerifyByCode} className="p-3 rounded-xl bg-black border border-gray-900 space-y-2">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                Quick Verify Driver by Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 2002"
                  value={verifyCodeInput}
                  onChange={(e) => setVerifyCodeInput(e.target.value)}
                  className="flex-1 min-w-0 px-2.5 py-1.5 rounded bg-black/60 border border-gray-800 text-xs text-white outline-none focus:border-[#2a6ff5]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-[#2a6ff5] hover:bg-blue-600 text-white text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap"
                >
                  Verify
                </button>
              </div>
            </form>

            {/* Driver Filter Tabs */}
            <div className="flex p-0.5 rounded-lg bg-black/40 border border-gray-900">
              <button
                type="button"
                onClick={() => setDriverTab('all')}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                  driverTab === 'all' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                All Drivers
              </button>
              <button
                type="button"
                onClick={() => setDriverTab('keke')}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                  driverTab === 'keke' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Keke Fleet Only
              </button>
            </div>

            {/* Drivers List */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {(() => {
                const filtered = drivers.filter(d => driverTab === 'all' || d.vehicleType === 'keke');
                if (filtered.length === 0) {
                  return (
                    <p className="text-xs text-gray-500 text-center py-8">
                      No {driverTab === 'keke' ? 'keke ' : ''}drivers found.
                    </p>
                  );
                }
                return filtered.map(d => {
                  const isVerified = d.isVerified === true;
                  const isApproved = d.isApproved === true;
                  
                  // Compute status badge
                  let badgeText = 'Pending Verify';
                  let badgeStyles = 'bg-amber-950/40 text-amber-400 border border-amber-500/20';
                  
                  if (isVerified) {
                    if (isApproved) {
                      badgeText = 'Approved';
                      badgeStyles = 'bg-blue-950/40 text-[#2a6ff5] border border-[#2a6ff5]/20';
                    } else {
                      badgeText = 'Awaiting Approval';
                      badgeStyles = 'bg-purple-950/40 text-purple-400 border border-purple-500/20';
                    }
                  }

                  return (
                    <div key={d.id} className="p-3.5 rounded-xl bg-black border border-gray-900 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-mono text-gray-500">{d.id}</span>
                        <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${badgeStyles}`}>
                          {badgeText}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          {d.name}
                          {d.vehicleType === 'keke' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-bold uppercase tracking-wider">
                              Keke
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
                          {d.vehicleType.toUpperCase()} · Plate: {d.vehiclePlate} · Code: {d.systemCode}
                        </p>
                      </div>

                      <div className="pt-1 flex justify-end gap-2">
                        {!isVerified && (
                          <button
                            onClick={() => handleVerifyDriver(d.id)}
                            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Verify Profile
                          </button>
                        )}
                        {isVerified && !isApproved && (
                          <button
                            onClick={() => handleApproveDriver(d.id)}
                            className="px-2.5 py-1 rounded bg-[#2a6ff5] hover:bg-blue-600 text-white text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Approve Access
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div className="mt-4 text-[10px] text-gray-600">
            Keke drivers must be verified to accept bookings.
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-gray-600">
        © 2026 Raven Transit Technologies. Standalone Testing Sandbox.
      </div>
    </div>
  );
};
