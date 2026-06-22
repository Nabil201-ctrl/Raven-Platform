import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { driverStorage } from '../services/driverStorage';
import { DriverLayout } from '../components/DriverLayout';
import { CarrierArrivalForm } from '../components/CarrierArrivalForm';
import type { Driver, Shuttle } from '../types';
import type { TransitStatus } from '../types/transit';
import { CARRIER_ROUTES, getCarrierRouteLockStatus } from '../constants/carrierRoutes';
import { io, Socket } from 'socket.io-client';
import { WS_BASE, BOOKING_WS_NAMESPACE } from '../config';

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
  const loggedInDriver = driverStorage.getDriver();

  const [selectedDriverId] = useState<string>(loggedInDriver?.id || '');
  const [driverDetails, setDriverDetails] = useState<Driver | null>(null);
  const [shuttleDetails, setShuttleDetails] = useState<Shuttle | null>(null);
  const [carrierLoading, setCarrierLoading] = useState(false);
  const [transitStatus, setTransitStatus] = useState<TransitStatus | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [currentCoords, setCurrentCoords] = useState({ lat: SIMULATED_PATH[0].lat, lng: SIMULATED_PATH[0].lng });
  const [speed, setSpeed] = useState(0);
  const [telemetryReceived, setTelemetryReceived] = useState(0); // proof that the WS telemetry channel works both ways
  
  // Real-time seat locks
  const [lockedSeats, setLockedSeats] = useState<Record<number, string>>({});
  const socketRef = useRef<Socket | null>(null);
  const intervalRef = useRef<any>(null);
  const pathIndexRef = useRef(0);

  const activeDriver = loggedInDriver;

  // Load Driver and Shuttle details
  const loadTransitStatus = async () => {
    try {
      const status = await api.getTransitStatus();
      setTransitStatus(status);
    } catch (e) {
      console.error('Error loading transit status:', e);
    }
  };

  const loadData = async () => {
    if (!selectedDriverId) return;
    try {
      await loadTransitStatus();
      const d = await api.getDriverDetails(selectedDriverId);
      if (d.isVerified === false || d.isApproved === false) {
        driverStorage.clear();
        navigate('/login', { state: { error: 'Your driver profile is pending administrator verification or approval.' } });
        return;
      }
      setDriverDetails(d);
      driverStorage.setDriver(d);

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
    const socket = io(`${WS_BASE}${BOOKING_WS_NAMESPACE}`, {
      query: { userId: `driver_${selectedDriverId}` }
    });
    socketRef.current = socket;
    socket.on('transit:day:started', loadTransitStatus);
    socket.on('transit:closed', () => { loadTransitStatus(); loadData(); });

    return () => {
      socket.disconnect();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [selectedDriverId, activeDriver]);

  // Join the correct shuttle room dynamically when shuttleDetails changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !shuttleDetails) return;

    const roomId = `shuttle_${shuttleDetails.id}`;
    socket.emit('room:join', { roomId });

    const handleLocksSync = (data: { locks: Record<number, { userId: string }> }) => {
      const active: Record<number, string> = {};
      for (const [seatStr, lock] of Object.entries(data.locks)) {
        active[parseInt(seatStr)] = lock.userId;
      }
      setLockedSeats(active);
    };

    const handleSeatLocked = (data: { seatNumber: number; userId: string }) => {
      setLockedSeats(prev => ({ ...prev, [data.seatNumber]: data.userId }));
    };

    const handleSeatUnlocked = (data: { seatNumber: number }) => {
      setLockedSeats(prev => {
        const copy = { ...prev };
        delete copy[data.seatNumber];
        return copy;
      });
    };

    const handleShuttleDetailsUpdated = (updatedShuttle: Shuttle) => {
      if (updatedShuttle.id === shuttleDetails.id) {
        setShuttleDetails(updatedShuttle);
      }
    };

    socket.on('seat:locks:sync', handleLocksSync);
    socket.on('seat:locked', handleSeatLocked);
    socket.on('seat:unlocked', handleSeatUnlocked);
    socket.on('shuttle:details:updated', handleShuttleDetailsUpdated);

    // Subscribe to telemetry channel (both the driver-specific and the broadcast one) — demonstrates correct WS usage for live position data
    const handleTelemetry = () => setTelemetryReceived(c => c + 1);
    socket.on('driver:telemetry', handleTelemetry);
    socket.on('driver:telemetry', handleTelemetry); // idempotent in practice

    return () => {
      socket.emit('room:leave', { roomId });
      socket.off('seat:locks:sync', handleLocksSync);
      socket.off('seat:locked', handleSeatLocked);
      socket.off('seat:unlocked', handleSeatUnlocked);
      socket.off('shuttle:details:updated', handleShuttleDetailsUpdated);
      socket.off('driver:telemetry', handleTelemetry);
    };
  }, [shuttleDetails?.id]);

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

  const handleRegisterCarrier = async (routeId: string, notes: string, seatCapacity: number) => {
    if (!selectedDriverId) return;
    setCarrierLoading(true);
    try {
      const updated = await api.registerCarrier(selectedDriverId, {
        routeId,
        seatCapacity,
        notes: notes.trim() || undefined,
      });
      setDriverDetails(updated);
      driverStorage.setDriver(updated);
    } catch (e: any) {
      alert(e?.message || 'Failed to register as carrier');
    } finally {
      setCarrierLoading(false);
    }
  };

  const handleEndCarrierListing = async () => {
    if (!selectedDriverId) return;
    setCarrierLoading(true);
    try {
      const updated = await api.clearCarrier(selectedDriverId);
      setDriverDetails(updated);
      driverStorage.setDriver(updated);
    } catch (e: any) {
      alert(e?.message || 'Failed to end carrier listing');
    } finally {
      setCarrierLoading(false);
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

  if (!loggedInDriver) {
    return null;
  }

  return (
    <DriverLayout driver={loggedInDriver}>
      <div className="p-6 flex flex-col justify-between">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        
        {/* Left Side: Carrier check-in & profile */}
        <div className="space-y-6">
          {driverDetails && (
            <CarrierArrivalForm
              driver={driverDetails}
              transitStatus={transitStatus}
              onSubmit={handleRegisterCarrier}
              onEndListing={handleEndCarrierListing}
              loading={carrierLoading}
            />
          )}

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

                {driverDetails.isCarrier && driverDetails.carrierFrom && (
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-400">
                    Route: <strong className="text-white">{driverDetails.carrierFrom} → {driverDetails.carrierTo}</strong>
                  </div>
                )}
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
              <div className="p-3 rounded-xl bg-black border border-gray-800 col-span-2">
                <p className="text-[10px] text-gray-500 font-semibold uppercase">Telemetry packets received (WS)</p>
                <p className="text-sm font-bold text-emerald-400 mt-1 font-mono">{telemetryReceived}</p>
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
                <div className="p-3 rounded-xl bg-black border border-gray-800 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
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
                  {(() => {
                    const returnRoute = CARRIER_ROUTES.find(
                      r => r.from === shuttleDetails.route.to && r.to === shuttleDetails.route.from,
                    );
                    const lock = getCarrierRouteLockStatus(driverDetails || {});
                    const returnBlocked = !!(
                      driverDetails?.isCarrier &&
                      returnRoute &&
                      driverDetails.carrierRouteId !== returnRoute.id &&
                      !lock.canChangeRoute
                    );
                    return (
                      <button
                        type="button"
                        disabled={carrierLoading || returnBlocked}
                        onClick={() => {
                          if (returnRoute) {
                            handleRegisterCarrier(
                              returnRoute.id,
                              `Shuttle ${shuttleDetails.shuttleCode} return leg`,
                              driverDetails?.carrierSeatCapacity ?? shuttleDetails.totalSeats,
                            );
                          }
                        }}
                        className="w-full py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold hover:bg-emerald-600/30 cursor-pointer disabled:opacity-50"
                      >
                        {returnBlocked
                          ? `Return route locked (${Math.ceil(lock.msRemaining / 60000)}m left)`
                          : `List return route (${shuttleDetails.route.to} → ${shuttleDetails.route.from})`}
                      </button>
                    );
                  })()}
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
                <p className="text-sm font-medium">Keke / bike mode</p>
                <p className="text-xs text-gray-600 mt-1 max-w-xs">
                  Select your route on the left after arriving at the pickup point. Passengers on that route will see you in the keke list.
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

      <div className="text-center text-[10px] text-gray-600 mt-6">
        © 2026 Raven Transit Technologies
      </div>
      </div>
    </DriverLayout>
  );
};
