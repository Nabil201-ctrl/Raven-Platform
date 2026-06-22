export type RouteStop = 'Giri' | 'Gwagwalada' | 'Main Campus';

export interface CarrierRoute {
  id: string;
  from: RouteStop;
  to: RouteStop;
  label: string;
}

export const CARRIER_ROUTES: CarrierRoute[] = [
  { id: 'gwagwalada-giri', from: 'Gwagwalada', to: 'Giri', label: 'Gwagwalada → Giri' },
  { id: 'giri-gwagwalada', from: 'Giri', to: 'Gwagwalada', label: 'Giri → Gwagwalada' },
  { id: 'gwagwalada-main', from: 'Gwagwalada', to: 'Main Campus', label: 'Gwagwalada → Main Campus' },
  { id: 'main-gwagwalada', from: 'Main Campus', to: 'Gwagwalada', label: 'Main Campus → Gwagwalada' },
  { id: 'giri-main', from: 'Giri', to: 'Main Campus', label: 'Giri → Main Campus' },
  { id: 'main-giri', from: 'Main Campus', to: 'Giri', label: 'Main Campus → Giri' },
  { id: 'giri-gwagwalada-express', from: 'Giri', to: 'Gwagwalada', label: 'Giri → Gwagwalada (Express)' },
  { id: 'gwagwalada-giri-express', from: 'Gwagwalada', to: 'Giri', label: 'Gwagwalada → Giri (Express)' },
];

export function getCarrierRouteLabel(id?: string): string | undefined {
  return CARRIER_ROUTES.find(r => r.id === id)?.label;
}

export const CARRIER_ROUTE_LOCK_MS = 2 * 60 * 60 * 1000; // 2 hours

export type VehicleType = 'shuttle' | 'keke' | 'bike';

export function defaultSeatCapacity(vehicleType: VehicleType): number {
  switch (vehicleType) {
    case 'shuttle':
      return 14;
    case 'keke':
      return 3;
    case 'bike':
      return 1;
  }
}

export function maxSeatCapacity(vehicleType: VehicleType): number {
  switch (vehicleType) {
    case 'shuttle':
      return 30;
    case 'keke':
      return 4;
    case 'bike':
      return 1;
  }
}

export function seatCapacityLabel(vehicleType: VehicleType): string {
  switch (vehicleType) {
    case 'shuttle':
      return 'bus / shuttle';
    case 'keke':
      return 'keke';
    case 'bike':
      return 'bike';
  }
}

export function getCarrierRouteLockStatus(driver: {
  carrierListedAt?: string;
  carrierRouteId?: string;
  isCarrier?: boolean;
}) {
  if (!driver.isCarrier || !driver.carrierListedAt) {
    return { canChangeRoute: true, msRemaining: 0 };
  }
  const elapsed = Date.now() - new Date(driver.carrierListedAt).getTime();
  const msRemaining = Math.max(0, CARRIER_ROUTE_LOCK_MS - elapsed);
  return { canChangeRoute: msRemaining === 0, msRemaining };
}

export function formatLockTime(ms: number): string {
  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}