import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { format } from 'date-fns';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      // Send local date to ensure server queries the correct "Today" range
      const localDate = format(new Date(), 'yyyy-MM-dd');
      const { data } = await api.get(`/dashboard/summary?date=${localDate}`);
      return data;
    },
  });
}
