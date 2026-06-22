export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  walletBalance: number;
  callMinutes: number;
  accountNumber?: string;
  bankName?: string;
}

export type RouteStop = 'Giri' | 'Gwagwalada' | 'Main Campus';

export interface Driver {
  id: string;
  name: string;
  photo: string;
  vehicleType: 'shuttle' | 'keke' | 'bike';
  vehiclePlate: string;
  vehicleModel?: string;
  systemCode: string;
  rating: number;
  isActive: boolean;
  isFavorite?: boolean;
  isVerified?: boolean;
  isApproved?: boolean;
  isCarrier?: boolean;
  carrierRouteId?: string;
  carrierFrom?: RouteStop;
  carrierTo?: RouteStop;
  carrierNotes?: string;
  carrierSeatCapacity?: number;
  carrierListedAt?: string;
  carrierRouteLockedUntil?: string;
}

export interface Shuttle {
  id: string;
  shuttleCode: string;
  route: { from: 'Giri' | 'Gwagwalada'; to: 'Giri' | 'Gwagwalada' };
  departureTime: string;
  arrivalTime: string;
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number[];
  pricePerSeat: number;
  premiumPricePerSeat: number;
  status: 'available' | 'full' | 'departed';
  driver: Driver;
}

export interface Seat {
  number: number;
  isAvailable: boolean;
  isSelected?: boolean;
  passengerName?: string;
}

export interface Ticket {
  id: string;
  shuttleId: string;
  route: { from: string; to: string };
  seatNumbers: number[];
  plateNumber: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
  status: 'active' | 'expired';
  qrCodeUrl: string;
  isPremium: boolean;
  premiumCallExpiresAt: string | null;
}

export interface Booking {
  id: string;
  type: 'shuttle' | 'keke' | 'premium';
  route: string;
  driver: Driver;
  seats?: number[];
  seatNumbers?: number[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'expired' | 'completed';
  createdAt: string;
  expiresAt: string;
  ticketId?: string;
  qrCode?: string;
  driverId?: string;
  departureTime?: string;
}

export interface RideHistoryEntry {
  id: string;
  bookingId: string;
  type: 'shuttle' | 'keke';
  driver: Driver;
  route: string;
  date: string;
  price: number;
  ticketId: string;
  canCall: boolean;
  canRate: boolean;
  isFavorited: boolean;
}

export interface CallPackage {
  id: string;
  minutes: number;
  price: number;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'debit' | 'credit';
  description: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  bookingId: string;
  driverId: string;
  message: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

export interface Wallet {
  balance: number;
  currency: 'NGN';
  virtualAccount: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  callMinutesRemaining: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Payment navigation state
export interface PaymentState {
  type: 'shuttle' | 'keke';
  shuttleId?: string;
  driverId?: string;
  driverName?: string;
  vehiclePlate?: string;
  route?: string;
  departureTime?: string;
  selectedSeats?: number[];
  totalAmount?: number;
  isPremium?: boolean;
  pricePerSeat?: number;
  priceOptions?: number[];
  amount?: number;
}