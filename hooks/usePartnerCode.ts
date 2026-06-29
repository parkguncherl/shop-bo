import { useQuery } from '@tanstack/react-query';
import { authApi } from '../libs';

export function usePartnerCode(partnerUpperCode: string) {
  return useQuery({
    queryKey: ['categoryList', partnerUpperCode],
    queryFn: async () => {
      const res = await authApi.get('/partner/code/lower', { params: { partnerUpperCode } });
      return res.data.body;
    },
    enabled: !!partnerUpperCode,
  });
}
