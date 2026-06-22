import { useAppContext } from '../context/AppContext';

export const useAuth = () => {
  const { user, authChecking, isAuthenticated } = useAppContext();
  return { user, loading: authChecking, isAuthenticated };
};