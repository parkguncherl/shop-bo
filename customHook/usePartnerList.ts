// hooks/usePartnerCodeList.ts
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../libs';
import { toastError } from '../components';
import { PartnerResponseForSearching } from '../generated';
interface UsePartnerListParams {
  enabled?: boolean;
  staleTime?: number;
  refetchOnMount?: boolean | 'always';
}

export const usePartnerList = ({ enabled = true, staleTime, refetchOnMount }: UsePartnerListParams) => {
  return useQuery({
    queryKey: ['/partner/list'],
    queryFn: () => authApi.get('/partner/list'),
    select: (response) => {
      const { resultCode, body, resultMessage } = response.data;

      if (resultCode !== 200 || !body || body.length === 0) {
        toastError(resultMessage || '데이터 조회 실패');
        return [];
      }

      return body.map(
        (item: any) =>
          ({
            key: item.id,
            value: item.id as string,
            label: item.partnerNm,
          } as PartnerResponseForSearching),
      );
    },
    enabled: enabled,
    staleTime: staleTime ?? 0, // ✅ 추가
    refetchOnMount: refetchOnMount ?? true, // ✅ 추가
  });
};
