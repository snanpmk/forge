import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { format } from 'date-fns';

import { useAuth } from '../context/AuthContext';

export function useDashboard() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard', user?._id || localStorage.getItem('userId')],
    queryFn: async () => {
      // Send local date to ensure server queries the correct "Today" range
      const localDate = format(new Date(), 'yyyy-MM-dd');
      // userId is now auto-injected by api.js
      const { data } = await api.get(`/dashboard/summary?date=${localDate}`);
      return data;
    },
    enabled: !!(user?._id || localStorage.getItem('userId')) // Run if we have an ID from either source
  });
}
