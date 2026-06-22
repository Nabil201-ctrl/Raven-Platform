import type { Driver } from '../types';

const DRIVER_KEY = 'raven_logged_in_driver';

export const driverStorage = {
  getDriver(): Driver | null {
    try {
      const raw = localStorage.getItem(DRIVER_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as Driver;
    } catch {
      return null;
    }
  },

  setDriver(driver: Driver): void {
    localStorage.setItem(DRIVER_KEY, JSON.stringify(driver));
  },

  clear(): void {
    localStorage.removeItem(DRIVER_KEY);
  },

  isLoggedIn(): boolean {
    return this.getDriver() !== null;
  },
};