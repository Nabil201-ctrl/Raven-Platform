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