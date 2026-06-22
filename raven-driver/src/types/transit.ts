export type TransitDayStatus = 'closed' | 'standby' | 'active';

export interface TransitStatus {
  status: TransitDayStatus;
  isWithinHours: boolean;
  isDayStarted: boolean;
  dayStartedAt: string | null;
  startedByDriverId: string | null;
  startedByDriverName: string | null;
  startedByBookingId: string | null;
  openHour: number;
  closeHour: number;
  timezone: string;
  localTime: string;
  localDate: string;
  message: string;
}