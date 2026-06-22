const TOKEN_KEY = 'raven_auth_token';
const LOGGED_IN_KEY = 'raven_is_logged_in';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(LOGGED_IN_KEY, 'true');
  },

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LOGGED_IN_KEY);
    localStorage.removeItem('raven_cached_user');
    localStorage.removeItem('raven_cached_transactions');
    localStorage.removeItem('raven_cached_last_ride');
  },

  isLoggedIn(): boolean {
    return !!this.getToken();
  },
};