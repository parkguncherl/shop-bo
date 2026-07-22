// hooks/usePartnerInfo.ts
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/libs';
import { Partner } from '@/generated';

export const usePartnerInfo = () => {
  return useQuery({
    queryKey: ['/partner/detail'],
    queryFn: async () => {
      const response = await authApi.get('/partner/detail');
      const { resultCode, body, resultMessage } = response.data;

      if (resultCode !== 200 || !body) {
        console.log('데이터 조회 실패 ===>', resultCode, resultMessage);
      }

      return body as Partner;
    },
  });
};
