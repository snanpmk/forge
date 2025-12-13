import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/summary');
      return data;
    },
  });
}
