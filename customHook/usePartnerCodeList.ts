// hooks/usePartnerCodeList.ts
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/libs';
import { toastError } from '@/components';
import { PartnerCodeResponseLowerSelect } from '@/generated';
import { DropDownOption } from '@/types/DropDownOptions';
interface UsePartnerCodeListParams {
  codeUpper: string;
  searchKeyword?: string;
  orderType?: string;
  enabled?: boolean;
  queryKey?: string | number; // ✅ 단순 식별자로 변경
  staleTime?: number;
  refetchOnMount?: boolean | 'always';
}

export const usePartnerCodeList = ({
  codeUpper,
  searchKeyword = '',
  orderType = 'NAME',
  enabled = true,
  queryKey,
  staleTime,
  refetchOnMount,
}: UsePartnerCodeListParams) => {
  return useQuery({
    queryKey: ['/partnerCode/lowerCodeList/', codeUpper, queryKey],
    queryFn: () =>
      authApi.get('/partnerCode/lowerCodeList', {
        params: { codeUpper, searchKeyword, orderType },
      }),
    select: (response) => {
      const { resultCode, body, resultMessage } = response.data;

      if (resultCode !== 200 || !body || body.length === 0) {
        toastError(resultMessage || '데이터 조회 실패');
        return [];
      }

      return body.map(
        (item: any) =>
          ({
            key: item.codeCd,
            value: item.codeCd,
            label: item.codeNm,
            defCodeVal: item.defCodeVal,
          }) as DropDownOption,
      );
    },
    enabled: enabled,
    staleTime: staleTime ?? 0, // ✅ 추가
    refetchOnMount: refetchOnMount ?? true, // ✅ 추가
  });
};
