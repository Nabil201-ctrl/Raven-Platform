import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Driver, Shuttle } from '../types';
import { io, Socket } from 'socket.io-client';

// Beautiful coordinate coordinates along Giri-Gwagwalada Route
const SIMULATED_PATH = [
  { lat: 9.0152, lng: 7.0025 },
  { lat: 9.0125, lng: 7.0090 },
  { lat: 9.0095, lng: 7.0150 },
  { lat: 9.0060, lng: 7.0210 },
  { lat: 9.0020, lng: 7.0270 },
  { lat: 8.9980, lng: 7.0330 },
  { lat: 8.9940, lng: 7.0390 },
  { lat: 8.9905, lng: 7.0450 },
];

export const DriverConsole: React.FC = () => {
  const navigate = useNavigate();

  // Retrieve logged-in driver profile
  const loggedInDriverStr = localStorage.getItem('raven_logged_in_driver');
  const loggedInDriver = loggedInDriverStr ? JSON.parse(loggedInDriverStr) as Driver : null;

  useEffect(() => {
    if (!loggedInDriver) {
      navigate('/login');
    }
  }, [loggedInDriver, navigate]);

  const [selectedDriverId] = useState<string>(loggedInDriver?.id || '');
  const [driverDetails, setDriverDetails] = useState<Driver | null>(null);
  const [shuttleDetails, setShuttleDetails] = useState<Shuttle | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [currentCoords, setCurrentCoords] = useState({ lat: SIMULATED_PATH[0].lat, lng: SIMULATED_PATH[0].lng });
  const [speed, setSpeed] = useState(0);
  
  // Real-time seat locks
  const [lockedSeats, setLockedSeats] = useState<Record<number, string>>({});
  const socketRef = useRef<Socket | null>(null);
  const intervalRef = useRef<any>(null);
  const pathIndexRef = useRef(0);

  const activeDriver = loggedInDriver;

  const handleLogout = () => {
    localStorage.removeItem('raven_logged_in_driver');
    navigate('/login');
  };

  // Load Driver and Shuttle details
  const loadData = async () => {
    if (!selectedDriverId) return;
    try {
      const d = await api.getDriverDetails(selectedDriverId);
      if (d.isVerified === false || d.isApproved === false) {
        localStorage.removeItem('raven_logged_in_driver');
        navigate('/login', { state: { error: 'Your driver profile is pending administrator verification or approval.' } });
        return;
      }
      setDriverDetails(d);
      setIsOnline(d.isActive);
      
      if (d.vehicleType === 'shuttle') {
        // Find corresponding shuttle. Shuttle code matches driver's systemCode or id
        const shuttles = await api.getAvailableShuttles();
        const found = shuttles.find(s => s.driver.id === selectedDriverId || s.shuttleCode === d.systemCode);
        if (found) {
          const detailed = await api.getShuttleDetails(found.id);
          setShuttleDetails(detailed);
        } else {
          setShuttleDetails(null);
        }
      } else {
        setShuttleDetails(null);
      }
    } catch (e) {
      console.error('Error loading driver console data:', e);
    }
  };

  useEffect(() => {
    if (!selectedDriverId || !activeDriver) return;
    loadData();

    // Connect socket
    const socket = io('http://localhost:5000/booking', {
      query: { userId: `driver_${selectedDriverId}` }
    });
    socketRef.current = socket;

    if (activeDriver.vehicleType === 'shuttle') {
      const roomId = `shuttle_sh_${activeDriver.systemCode}`;
      socket.emit('room:join', { roomId });

      socket.on('seat:locks:sync', (data: { locks: Record<number, { userId: string }> }) => {
        const active: Record<number, string> = {};
        for (const [seatStr, lock] of Object.entries(data.locks)) {
          active[parseInt(seatStr)] = lock.userId;
        }
        setLockedSeats(active);
      });

      socket.on('seat:locked', (data: { seatNumber: number; userId: string }) => {
        setLockedSeats(prev => ({ ...prev, [data.seatNumber]: data.userId }));
      });

      socket.on('seat:unlocked', (data: { seatNumber: number }) => {
        setLockedSeats(prev => {
          const copy = { ...prev };
          delete copy[data.seatNumber];
          return copy;
        });
      });

      socket.on('shuttle:details:updated', (updatedShuttle: Shuttle) => {
        if (updatedShuttle.shuttleCode === activeDriver.systemCode) {
          setShuttleDetails(updatedShuttle);
        }
      });
    }

    return () => {
      if (activeDriver.vehicleType === 'shuttle') {
        socket.emit('room:leave', { roomId: `shuttle_sh_${activeDriver.systemCode}` });
      }
      socket.disconnect();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [selectedDriverId, activeDriver]);

  // Handle telemetry simulation
  useEffect(() => {
    if (simulating) {
      setSpeed(48); // km/h
      intervalRef.current = setInterval(() => {
        const next = (pathIndexRef.current + 1) % SIMULATED_PATH.length;
        pathIndexRef.current = next;
        const coords = SIMULATED_PATH[next];
        setCurrentCoords(coords);
        
        // Emit telemetry update
        if (socketRef.current) {
          socketRef.current.emit('driver:telemetry:update', {
            driverId: selectedDriverId,
            latitude: coords.lat,
            longitude: coords.lng,
            speed: 48,
            heading: 135
          });
        }
      }, 2000);
    } else {
      setSpeed(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [simulating, selectedDriverId]);

  const toggleOnline = async () => {
    try {
      const nextState = !isOnline;
      await api.toggleFavoriteDriver(selectedDriverId, nextState); // Using favorite endpoint as mock toggle/update or we assume active state toggled
      setIsOnline(nextState);
      if (driverDetails) {
        setDriverDetails({ ...driverDetails, isActive: nextState });
      }
    } catch (e) {
      alert('Error updating status');
    }
  };

  const handleResetSeats = async () => {
    try {
      if (!shuttleDetails) return;
      const res = await api.resetShuttleSeats(shuttleDetails.shuttleCode);
      alert(res.message || 'Seats reset successfully');
      loadData();
    } catch (e) {
      alert('Error resetting seats');
    }
  };

  const triggerReverseTripAlert = () => {
    if (!activeDriver) return;
    if (socketRef.current) {
      socketRef.current.emit('transit:reverse-trip:trigger', {
        vehicleCode: activeDriver.systemCode,
        route: activeDriver.systemCode === '1001' ? 'Gwagwalada → Giri' : 'Giri → Gwagwalada',
        driverName: activeDriver.name
      });
      alert('Reverse trip alert broadcasted to all active passengers!');
    }
  };

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
            <h1 className="text-xl font-bold tracking-tight">Raven Driver Console</h1>
          </div>
          <p className="text-[10px] text-gray-500 font-semibold tracking-wider mt-0.5">
            STANDALONE SIMULATOR & TELEMETRY CONTROL
          </p>
        </div>
        <button 
          onClick={() => window.location.href = 'http://localhost:3000'} 
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-900 border border-gray-800 hover:bg-gray-800 transition-all cursor-pointer"
        >
          Exit Console
        </button>
      </div>

      {/* Main Panel */}
      <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        
        {/* Left Side: Configuration & Telemetry */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#111215] border border-gray-800 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-800/60">
              <h2 className="text-xs font-bold tracking-widest text-gray-400 uppercase">Driver Profile</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#2a6ff5]/10 text-[#2a6ff5] border border-[#2a6ff5]/20 font-bold uppercase tracking-wide">
                Verified Profile
              </span>
            </div>

            {driverDetails ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base"
                    style={{
                      background: 'linear-gradient(135deg, rgba(42, 111, 245, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%)',
                      border: '1px solid rgba(42, 111, 245, 0.3)',
                      color: '#2a6ff5'
                    }}
                  >
                    {driverDetails.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{driverDetails.name}</h3>
                    <p className="text-xs text-gray-500 capitalize">{driverDetails.vehicleType} Driver</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-gray-900">
                    <p className="text-[9px] text-gray-500 font-bold uppercase">Plate Number</p>
                    <p className="text-white font-bold mt-0.5">{driverDetails.vehiclePlate}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-gray-900">
                    <p className="text-[9px] text-gray-500 font-bold uppercase">System Code</p>
                    <p className="text-white font-bold mt-0.5">{driverDetails.systemCode}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    onClick={toggleOnline}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      isOnline 
                        ? 'bg-[#2a6ff5]/15 text-[#2a6ff5] border-[#2a6ff5]/30 hover:bg-[#2a6ff5]/25' 
                        : 'bg-gray-800/40 text-gray-400 border-gray-700/30 hover:bg-gray-800/60'
                    }`}
                  >
                    {isOnline ? '● Go Offline' : '○ Go Online'}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-red-950/20 text-red-400 border border-red-900/20 hover:bg-red-950/40 transition-all cursor-pointer"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500 flex items-center justify-center py-4">
                <div className="w-4 h-4 rounded-full border-2 border-gray-500 border-t-transparent animate-spin mr-2" />
                Loading driver profile...
              </div>
            )}
          </div>

          {/* Telemetry Simulator Widget */}
          <div className="p-5 rounded-2xl bg-[#111215] border border-gray-800 space-y-4">
            <h2 className="text-xs font-bold tracking-widest text-gray-400">GPS & ROUTE TELEMETRY</h2>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3 rounded-xl bg-black border border-gray-800">
                <p className="text-[10px] text-gray-500 font-semibold uppercase">Latitude</p>
                <p className="text-sm font-bold text-[#2a6ff5] mt-1">{currentCoords.lat.toFixed(6)}</p>
              </div>
              <div className="p-3 rounded-xl bg-black border border-gray-800">
                <p className="text-[10px] text-gray-500 font-semibold uppercase">Longitude</p>
                <p className="text-sm font-bold text-[#2a6ff5] mt-1">{currentCoords.lng.toFixed(6)}</p>
              </div>
              <div className="p-3 rounded-xl bg-black border border-gray-800">
                <p className="text-[10px] text-gray-500 font-semibold uppercase">Speed</p>
                <p className="text-sm font-bold text-white mt-1">{speed} km/h</p>
              </div>
              <div className="p-3 rounded-xl bg-black border border-gray-800">
                <p className="text-[10px] text-gray-500 font-semibold uppercase">Status</p>
                <p className={`text-sm font-bold mt-1 ${simulating ? 'text-white animate-pulse' : 'text-gray-400'}`}>
                  {simulating ? 'Moving' : 'Stationary'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setSimulating(!simulating)}
                className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${
                  simulating 
                    ? 'bg-white text-black hover:bg-gray-200' 
                    : 'bg-[#2a6ff5] text-white hover:bg-blue-600'
                }`}
              >
                {simulating ? 'Stop Telemetry Simulation' : 'Start Live Telemetry'}
              </button>

              <button
                onClick={triggerReverseTripAlert}
                className="px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-xs font-bold hover:bg-gray-800 transition-all text-[#2a6ff5]"
              >
                Reverse Trip
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Seat Occupancy / Live Bookings Map */}
        <div className="p-5 rounded-2xl bg-[#111215] border border-gray-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold tracking-widest text-gray-400">VEHICLE OCCUPANCY & BOOKINGS</h2>
              {shuttleDetails && (
                <button
                  onClick={handleResetSeats}
                  className="text-[10px] font-bold text-gray-400 hover:text-white uppercase hover:underline"
                >
                  Reset Seats Map
                </button>
              )}
            </div>

            {shuttleDetails ? (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-black border border-gray-800 flex justify-between text-xs">
                  <div>
                    <span className="text-gray-500">Route:</span>{' '}
                    <span className="font-semibold text-white">
                      {shuttleDetails.route.from} → {shuttleDetails.route.to}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Occupied:</span>{' '}
                    <span className="font-semibold text-white font-mono">
                      {shuttleDetails.bookedSeats.length} / {shuttleDetails.totalSeats}
                    </span>
                  </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-4 gap-2.5 p-3 rounded-xl bg-black/40 border border-gray-800/80">
                  {Array.from({ length: shuttleDetails.totalSeats }, (_, i) => i + 1).map(num => {
                    const isBooked = shuttleDetails.bookedSeats.includes(num);
                    const isLocked = lockedSeats[num];
                    
                    let color = 'border-[#2a6ff5]/40 text-[#2a6ff5] bg-[#2a6ff5]/5';
                    let label = 'Vacant';
                    if (isBooked) {
                      color = 'bg-white/5 border-white/20 text-white';
                      label = 'Booked';
                    } else if (isLocked) {
                      color = 'bg-[#2a6ff5]/15 border-[#2a6ff5] text-[#2a6ff5] animate-pulse';
                      label = 'Locked';
                    }

                    return (
                      <div
                        key={num}
                        className={`aspect-square rounded-xl border flex flex-col items-center justify-center p-1 font-mono ${color}`}
                        title={`Seat ${num}: ${label}`}
                      >
                        <span className="text-sm font-bold">{num}</span>
                        <span className="text-[8px] uppercase tracking-wider scale-90 opacity-70">
                          {isBooked ? 'Rsvd' : isLocked ? 'Hold' : 'Free'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-gray-500">
                <span className="text-3xl mb-2">🛺</span>
                <p className="text-sm font-medium">Keke Driver Mode Active</p>
                <p className="text-xs text-gray-600 mt-1 max-w-xs">
                  Telemetry updates are broadcasting. Keke ride fares are requested on-site by entering code {activeDriver?.systemCode || ''}.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-800 text-[11px] text-gray-500 space-y-1">
            <p>· Active seat locks clear automatically after 2 minutes.</p>
            <p>· Connect client devices to check real-time telemetry changes.</p>
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
