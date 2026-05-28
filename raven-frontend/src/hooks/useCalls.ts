import { useAppContext } from '../context/AppContext';

export const useCalls = () => {
  const { callMinutes, purchaseMinutes, hasMinutes, useCallMinute } = useAppContext();
  return { minutes: callMinutes, purchaseMinutes, hasMinutes, useCallMinute };
};