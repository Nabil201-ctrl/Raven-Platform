import { useAppContext } from '../context/AppContext';

export const useAuth = () => {
  const { user } = useAppContext();
  return { user, loading: user === null };
};