import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import type { Complaint, Shuttle, Driver } from '../types';
import { io } from 'socket.io-client';
import { WS_BASE, BOOKING_WS_NAMESPACE } from '../config';
import { AdminCharts } from '../components/AdminCharts';

type AdminSection = 'overview' | 'drivers' | 'complaints' | 'shuttles' | 'settings';
type DriverFilter = 'action' | 'all' | 'keke';
type ComplaintFilter = 'pending' | 'all' | 'resolved';

const needsAuth = (d: Driver) => !d.isVerified || !d.isApproved;

function driverStatus(d: Driver): { label: string; styles: string } {
  if (!d.isVerified) {
    return { label: 'Needs verification', styles: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
  }
  if (!d.isApproved) {
    return { label: 'Needs approval', styles: 'bg-orange-500/15 text-orange-400 border-orange-500/30' };
  }
  return { label: 'Approved', styles: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
}

export const AdminConsole: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [shuttles, setShuttles] = useState<Shuttle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminKey, setAdminKey] = useState(localStorage.getItem('raven_admin_key') || '');
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [driverFilter, setDriverFilter] = useState<DriverFilter>('action');
  const [complaintFilter, setComplaintFilter] = useState<ComplaintFilter>('pending');
  const [verifyCodeInput, setVerifyCodeInput] = useState('');

  const [shuttleCode, setShuttleCode] = useState('');
  const [from, setFrom] = useState<'Giri' | 'Gwagwalada'>('Giri');
  const [to, setTo] = useState<'Giri' | 'Gwagwalada'>('Gwagwalada');
  const [departureTime, setDepartureTime] = useState('08:00');
  const [arrivalTime, setArrivalTime] = useState('08:20');
  const [pricePerSeat, setPricePerSeat] = useState(250);
  const [premiumPrice, setPremiumPrice] = useState(1500);
  const [driverId, setDriverId] = useState('');

  const pendingDrivers = useMemo(() => drivers.filter(needsAuth), [drivers]);
  const pendingComplaints = useMemo(
    () => complaints.filter(c => c.status === 'pending'),
    [complaints],
  );

  const filteredDrivers = useMemo(() => {
    let list = drivers;
    if (driverFilter === 'action') list = pendingDrivers;
    else if (driverFilter === 'keke') list = drivers.filter(d => d.vehicleType === 'keke');
    return [...list].sort((a, b) => {
      const aPending = needsAuth(a) ? 0 : 1;
      const bPending = needsAuth(b) ? 0 : 1;
      return aPending - bPending;
    });
  }, [drivers, driverFilter, pendingDrivers]);

  const filteredComplaints = useMemo(() => {
    if (complaintFilter === 'pending') return complaints.filter(c => c.status === 'pending');
    if (complaintFilter === 'resolved') return complaints.filter(c => c.status === 'resolved');
    return [...complaints].sort((a, b) => {
      const aPending = a.status === 'pending' ? 0 : 1;
      const bPending = b.status === 'pending' ? 0 : 1;
      return aPending - bPending;
    });
  }, [complaints, complaintFilter]);

  const totalRevenue = shuttles.reduce((acc, s) => acc + s.bookedSeats.length * s.pricePerSeat, 0);
  const avgOccupancy = shuttles.length
    ? Math.round(
        (shuttles.reduce((acc, s) => acc + s.bookedSeats.length, 0) /
          shuttles.reduce((acc, s) => acc + s.totalSeats, 0)) *
          100,
      )
    : 0;

  const loadData = async () => {
    setLoading(true);
    try {
      const [compRes, shutRes, drvRes] = await Promise.all([
        api.getComplaints(),
        api.getAvailableShuttles(),
        api.getDrivers(),
      ]);
      setComplaints(compRes.data || []);
      setShuttles(shutRes);
      setDrivers(drvRes);
    } catch (e) {
      console.error('Error fetching admin details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const socket = io(`${WS_BASE}${BOOKING_WS_NAMESPACE}`);
    socket.on('transit:reverse-trip:added', loadData);
    socket.on('shuttle:updated', loadData);
    socket.on('shuttle:details:updated', loadData);
    return () => { socket.disconnect(); };
  }, []);

  const handleQuickVerifyByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCodeInput.trim()) return;
    try {
      const code = verifyCodeInput.trim().toUpperCase();
      let found = drivers.find(d => d.systemCode.toUpperCase() === code);
      if (!found) found = await api.verifyDriverCode(code);
      if (found) {
        if (!found.isVerified) await api.verifyDriver(found.id);
        if (!found.isApproved) await api.approveDriver(found.id);
        setVerifyCodeInput('');
        loadData();
      }
    } catch (e: any) {
      alert(`Error verifying/approving driver: ${e.message}`);
    }
  };

  const handleVerifyDriver = async (id: string) => {
    try {
      await api.verifyDriver(id);
      loadData();
    } catch (e: any) {
      alert(`Error verifying driver: ${e.message}`);
    }
  };

  const handleApproveDriver = async (id: string) => {
    try {
      await api.approveDriver(id);
      loadData();
    } catch (e: any) {
      alert(`Error approving driver: ${e.message}`);
    }
  };

  const saveAdminKey = () => {
    localStorage.setItem('raven_admin_key', adminKey);
    loadData();
  };

  const handleResolve = async (id: string) => {
    try {
      await api.resolveComplaint(id);
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
    const approvedDrivers = drivers.filter(d => d.isVerified && d.isApproved);
    const selectedDriverId = driverId || approvedDrivers[0]?.id;
    if (!selectedDriverId) {
      alert('No verified/approved drivers available to assign.');
      return;
    }
    try {
      await api.createShuttle({
        shuttleCode: shuttleCode.trim(),
        route: { from, to },
        departureTime,
        arrivalTime,
        totalSeats: 14,
        pricePerSeat: Number(pricePerSeat),
        premiumPricePerSeat: Number(premiumPrice),
        driverId: selectedDriverId,
      });
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
      loadData();
    } catch (e: any) {
      alert(`Error removing shuttle: ${e.message}`);
    }
  };

  const handleResetSeats = async (code: string) => {
    try {
      await api.resetShuttleSeats(code);
      loadData();
    } catch (e: any) {
      alert(`Error resetting seats: ${e.message}`);
    }
  };

  const navItems: { id: AdminSection; label: string; badge?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'drivers', label: 'Drivers', badge: pendingDrivers.length },
    { id: 'complaints', label: 'Complaints', badge: pendingComplaints.length },
    { id: 'shuttles', label: 'Shuttles' },
    { id: 'settings', label: 'Settings' },
  ];

  const renderDriverCard = (d: Driver, compact = false) => {
    const status = driverStatus(d);
    const pending = needsAuth(d);
    return (
      <div
        key={d.id}
        className={`rounded-xl border p-4 space-y-3 ${
          pending ? 'bg-amber-950/20 border-amber-500/30' : 'bg-[#0a0c10] border-gray-800'
        }`}
      >
        <div className="flex justify-between items-start gap-2">
          <div>
            <p className={`font-semibold text-white ${compact ? 'text-sm' : 'text-base'}`}>{d.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {d.vehicleType} · {d.vehiclePlate} · Code <span className="font-mono text-gray-400">{d.systemCode}</span>
            </p>
          </div>
          <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border font-semibold shrink-0 ${status.styles}`}>
            {status.label}
          </span>
        </div>
        {pending && (
          <div className="flex gap-2">
            {!d.isVerified && (
              <button
                type="button"
                onClick={() => handleVerifyDriver(d.id)}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer"
              >
                Verify
              </button>
            )}
            {d.isVerified && !d.isApproved && (
              <button
                type="button"
                onClick={() => handleApproveDriver(d.id)}
                className="px-3 py-1.5 rounded-lg bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-semibold cursor-pointer"
              >
                Approve
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderComplaintCard = (c: Complaint) => {
    const isPending = c.status === 'pending';
    return (
      <div
        key={c.id}
        className={`rounded-xl border p-4 space-y-3 ${
          isPending ? 'bg-red-950/15 border-red-500/25' : 'bg-[#0a0c10] border-gray-800'
        }`}
      >
        <div className="flex justify-between items-center gap-2">
          <span className="text-[10px] font-mono text-gray-500">{c.bookingId}</span>
          <span
            className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-semibold border ${
              isPending
                ? 'bg-red-500/15 text-red-400 border-red-500/30'
                : 'bg-gray-800 text-gray-400 border-gray-700'
            }`}
          >
            {c.status}
          </span>
        </div>
        <p className="text-sm text-gray-200 leading-relaxed">{c.message}</p>
        {isPending && (
          <button
            type="button"
            onClick={() => handleResolve(c.id)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
          >
            Mark resolved
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500 text-sm">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Tab navigation */}
      <nav className="sticky top-0 z-10 px-4 sm:px-6 py-3 border-b border-gray-800 bg-[#07080a]/95 backdrop-blur-sm">
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {navItems.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeSection === item.id
                  ? 'bg-[#2563eb] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              {item.label}
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    activeSection === item.id ? 'bg-white/20 text-white' : 'bg-amber-500 text-black'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={loadData}
            className="ml-auto px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-white hover:bg-gray-900 cursor-pointer shrink-0"
          >
            Refresh
          </button>
        </div>
      </nav>

      <div className="p-4 sm:p-6 flex-1">
        {/* Overview */}
        {activeSection === 'overview' && (
          <div className="space-y-6 max-w-6xl">
            <div>
              <h2 className="text-lg font-bold text-white">Overview</h2>
              <p className="text-sm text-gray-500 mt-0.5">Items that need your attention</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => { setActiveSection('drivers'); setDriverFilter('action'); }}
                className="text-left p-5 rounded-2xl border transition-colors cursor-pointer hover:border-amber-500/50 bg-[#111215] border-gray-800"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Drivers awaiting authorization</p>
                  <span className={`text-2xl font-bold ${pendingDrivers.length ? 'text-amber-400' : 'text-gray-600'}`}>
                    {pendingDrivers.length}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {pendingDrivers.length
                    ? 'Verify credentials or approve access so drivers can sign in.'
                    : 'All drivers are verified and approved.'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => { setActiveSection('complaints'); setComplaintFilter('pending'); }}
                className="text-left p-5 rounded-2xl border transition-colors cursor-pointer hover:border-red-500/40 bg-[#111215] border-gray-800"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Open complaints</p>
                  <span className={`text-2xl font-bold ${pendingComplaints.length ? 'text-red-400' : 'text-gray-600'}`}>
                    {pendingComplaints.length}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {pendingComplaints.length
                    ? 'Review passenger feedback and resolve issues.'
                    : 'No open complaints right now.'}
                </p>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Active routes', value: shuttles.length },
                { label: 'Total drivers', value: drivers.length },
                { label: 'Est. revenue', value: `₦${totalRevenue.toLocaleString()}` },
                { label: 'Avg occupancy', value: `${avgOccupancy}%` },
              ].map(stat => (
                <div key={stat.label} className="p-4 rounded-xl bg-[#111215] border border-gray-800">
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">{stat.label}</p>
                  <p className="text-lg font-bold text-white mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            <AdminCharts drivers={drivers} complaints={complaints} shuttles={shuttles} layout="overview" />

            {pendingDrivers.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Drivers needing action</h3>
                  <button
                    type="button"
                    onClick={() => { setActiveSection('drivers'); setDriverFilter('action'); }}
                    className="text-xs text-[#2563eb] hover:underline cursor-pointer"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-3">
                  {pendingDrivers.slice(0, 3).map(d => renderDriverCard(d, true))}
                </div>
              </section>
            )}

            {pendingComplaints.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Recent complaints</h3>
                  <button
                    type="button"
                    onClick={() => { setActiveSection('complaints'); setComplaintFilter('pending'); }}
                    className="text-xs text-[#2563eb] hover:underline cursor-pointer"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-3">
                  {pendingComplaints.slice(0, 3).map(renderComplaintCard)}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Drivers */}
        {activeSection === 'drivers' && (
          <div className="space-y-5 max-w-4xl">
            <div>
              <h2 className="text-lg font-bold text-white">Driver authorization</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {pendingDrivers.length} driver{pendingDrivers.length !== 1 ? 's' : ''} need your review
              </p>
            </div>

            <AdminCharts drivers={drivers} complaints={complaints} shuttles={shuttles} layout="drivers" />

            <form onSubmit={handleQuickVerifyByCode} className="p-4 rounded-xl bg-[#111215] border border-gray-800 flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">Quick approve by code</label>
                <input
                  type="text"
                  placeholder="Enter driver system code"
                  value={verifyCodeInput}
                  onChange={e => setVerifyCodeInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black border border-gray-800 text-sm text-white font-mono outline-none focus:border-[#2563eb]"
                />
              </div>
              <button
                type="submit"
                className="self-end px-4 py-2 rounded-lg bg-[#2563eb] hover:bg-blue-600 text-white text-sm font-semibold cursor-pointer"
              >
                Verify & approve
              </button>
            </form>

            <div className="flex gap-1 p-1 rounded-xl bg-[#111215] border border-gray-800 w-fit">
              {([
                { id: 'action' as const, label: 'Needs action', count: pendingDrivers.length },
                { id: 'all' as const, label: 'All drivers', count: drivers.length },
                { id: 'keke' as const, label: 'Keke only', count: drivers.filter(d => d.vehicleType === 'keke').length },
              ]).map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDriverFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    driverFilter === tab.id ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className="text-[10px] text-gray-500">({tab.count})</span>
                </button>
              ))}
            </div>

            {filteredDrivers.length === 0 ? (
              <div className="py-16 text-center rounded-xl bg-[#111215] border border-gray-800">
                <p className="text-sm text-gray-400">
                  {driverFilter === 'action' ? 'No drivers waiting for authorization.' : 'No drivers in this list.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDrivers.map(d => renderDriverCard(d))}
              </div>
            )}
          </div>
        )}

        {/* Complaints */}
        {activeSection === 'complaints' && (
          <div className="space-y-5 max-w-4xl">
            <div>
              <h2 className="text-lg font-bold text-white">Complaints</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {pendingComplaints.length} open · {complaints.length} total
              </p>
            </div>

            <AdminCharts drivers={drivers} complaints={complaints} shuttles={shuttles} layout="complaints" />

            <div className="flex gap-1 p-1 rounded-xl bg-[#111215] border border-gray-800 w-fit">
              {([
                { id: 'pending' as const, label: 'Open', count: pendingComplaints.length },
                { id: 'all' as const, label: 'All', count: complaints.length },
                { id: 'resolved' as const, label: 'Resolved', count: complaints.filter(c => c.status === 'resolved').length },
              ]).map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setComplaintFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    complaintFilter === tab.id ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className="text-[10px] text-gray-500">({tab.count})</span>
                </button>
              ))}
            </div>

            {filteredComplaints.length === 0 ? (
              <div className="py-16 text-center rounded-xl bg-[#111215] border border-gray-800">
                <p className="text-sm text-gray-400">
                  {complaintFilter === 'pending' ? 'No open complaints.' : 'No complaints in this list.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredComplaints.map(renderComplaintCard)}
              </div>
            )}
          </div>
        )}

        {/* Shuttles */}
        {activeSection === 'shuttles' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Shuttle routes</h2>
              <p className="text-sm text-gray-500 mt-0.5">{shuttles.length} active routes</p>
            </div>

            <AdminCharts drivers={drivers} complaints={complaints} shuttles={shuttles} layout="shuttles" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-[#111215] border border-gray-800">
                <h3 className="text-sm font-semibold text-white mb-4">Create route</h3>
                <form onSubmit={handleCreateShuttle} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Shuttle code (e.g. 1002)"
                    value={shuttleCode}
                    onChange={e => setShuttleCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-gray-800 text-sm text-white font-mono outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={from}
                      onChange={e => setFrom(e.target.value as 'Giri' | 'Gwagwalada')}
                      className="px-3 py-2 rounded-lg bg-black border border-gray-800 text-sm text-white outline-none"
                    >
                      <option value="Giri">From Giri</option>
                      <option value="Gwagwalada">From Gwagwalada</option>
                    </select>
                    <select
                      value={to}
                      onChange={e => setTo(e.target.value as 'Giri' | 'Gwagwalada')}
                      className="px-3 py-2 rounded-lg bg-black border border-gray-800 text-sm text-white outline-none"
                    >
                      <option value="Gwagwalada">To Gwagwalada</option>
                      <option value="Giri">To Giri</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={departureTime}
                      onChange={e => setDepartureTime(e.target.value)}
                      placeholder="Departure"
                      className="px-3 py-2 rounded-lg bg-black border border-gray-800 text-sm text-white font-mono outline-none"
                    />
                    <input
                      type="text"
                      value={arrivalTime}
                      onChange={e => setArrivalTime(e.target.value)}
                      placeholder="Arrival"
                      className="px-3 py-2 rounded-lg bg-black border border-gray-800 text-sm text-white font-mono outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={pricePerSeat}
                      onChange={e => setPricePerSeat(Number(e.target.value))}
                      placeholder="Seat price"
                      className="px-3 py-2 rounded-lg bg-black border border-gray-800 text-sm text-white outline-none"
                    />
                    <input
                      type="number"
                      value={premiumPrice}
                      onChange={e => setPremiumPrice(Number(e.target.value))}
                      placeholder="Premium price"
                      className="px-3 py-2 rounded-lg bg-black border border-gray-800 text-sm text-white outline-none"
                    />
                  </div>
                  <select
                    value={driverId}
                    onChange={e => setDriverId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-gray-800 text-sm text-white outline-none"
                  >
                    <option value="">Assign approved driver</option>
                    {drivers.filter(d => d.isVerified && d.isApproved).map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.systemCode})
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-[#2563eb] hover:bg-blue-600 text-sm font-semibold text-white cursor-pointer"
                  >
                    Add route
                  </button>
                </form>
              </div>

              <div className="p-5 rounded-2xl bg-[#111215] border border-gray-800">
                <h3 className="text-sm font-semibold text-white mb-4">Active routes</h3>
                <div className="space-y-3 max-h-[520px] overflow-y-auto">
                  {shuttles.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No shuttles yet.</p>
                  ) : (
                    shuttles.map(s => (
                      <div key={s.id} className="p-4 rounded-xl bg-black border border-gray-900 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-semibold">{s.route.from} → {s.route.to}</p>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">
                              {s.shuttleCode} · {s.departureTime}–{s.arrivalTime}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400">₦{s.pricePerSeat}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">
                            {s.bookedSeats.length}/{s.totalSeats} seats
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleResetSeats(s.shuttleCode)}
                              className="px-2 py-1 rounded text-amber-400 border border-amber-500/30 text-[10px] font-semibold cursor-pointer"
                            >
                              Reset
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteShuttle(s.id)}
                              className="px-2 py-1 rounded text-red-400 border border-red-500/30 text-[10px] font-semibold cursor-pointer"
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
            </div>
          </div>
        )}

        {/* Settings */}
        {activeSection === 'settings' && (
          <div className="space-y-5 max-w-xl">
            <div>
              <h2 className="text-lg font-bold text-white">Settings</h2>
              <p className="text-sm text-gray-500 mt-0.5">API configuration</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#111215] border border-gray-800 space-y-3">
              <label className="text-xs font-semibold text-gray-400 block">Admin API key (optional)</label>
              <p className="text-xs text-gray-600 leading-relaxed">
                Required only if your backend has <code className="text-gray-400">RAVEN_ADMIN_KEY</code> configured.
              </p>
              <input
                type="password"
                placeholder="Enter RAVEN_ADMIN_KEY"
                value={adminKey}
                onChange={e => setAdminKey(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black border border-gray-800 text-sm text-white font-mono outline-none"
              />
              <button
                type="button"
                onClick={saveAdminKey}
                className="px-4 py-2 rounded-lg bg-[#2563eb] hover:bg-blue-600 text-sm font-semibold text-white cursor-pointer"
              >
                Save key
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};