export const TRANSIT_OPEN_HOUR = 4; // 4:00 AM
export const TRANSIT_CLOSE_HOUR = 19; // 7:00 PM
export const TRANSIT_TIMEZONE = 'Africa/Lagos';

export type TransitDayStatus = 'closed' | 'standby' | 'active';

export interface LagosClock {
  date: string;
  hour: number;
  minute: number;
  timeLabel: string;
}

export function getLagosClock(now = new Date()): LagosClock {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: TRANSIT_TIMEZONE }).format(now);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TRANSIT_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const timeLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  return { date, hour, minute, timeLabel };
}

export function isWithinTransitHours(clock = getLagosClock()): boolean {
  return clock.hour >= TRANSIT_OPEN_HOUR && clock.hour < TRANSIT_CLOSE_HOUR;
}

export function buildTransitMessage(status: TransitDayStatus, clock: LagosClock): string {
  if (status === 'closed') {
    if (clock.hour < TRANSIT_OPEN_HOUR) {
      return `Transit is closed. Service resumes today at ${TRANSIT_OPEN_HOUR}:00 AM.`;
    }
    return `Transit is closed for the day. Service resumes tomorrow at ${TRANSIT_OPEN_HOUR}:00 AM.`;
  }
  if (status === 'standby') {
    return 'Waiting for the first driver to start the day. Transport begins once a driver lists on a route.';
  }
  return 'Transit is active for today.';
}