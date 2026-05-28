import { useAppContext } from '../context/AppContext';

export const useWallet = () => {
  const { balance, transactions, addFunds, deductFunds } = useAppContext();
  return { balance, transactions, addFunds, deductFunds };
};