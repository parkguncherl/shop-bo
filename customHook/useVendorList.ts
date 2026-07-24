// customHook/useVendorList.ts
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/libs';
import { toastError } from '@/components';
import { DropDownOption } from '@/types/DropDownOptions';

/** useVendorList 훅 파라미터 */
interface UseVendorListParams {
  /** 쿼리 실행 여부 (false 면 자동 조회 안 함) */
  enabled?: boolean;
  /** 캐시 신선도 유지 시간(ms). 기본 0 = 매번 stale */
  staleTime?: number;
  /** 마운트 시 재조회 여부. 기본 true */
  refetchOnMount?: boolean | 'always';
}

/**
 * 협력업체(TB_PARTNER_VENDOR) 목록을 드롭다운 옵션(DropDownOption[])으로 조회하는 커스텀 훅.
 *
 * 반환값은 react-query 의 결과 객체이며, 가공된 옵션 배열은 `.data` 에 담깁니다.
 *   const vendorList = useVendorList();
 *   vendorList.data      // → DropDownOption[] (로딩 전엔 undefined)
 * <FormDropDown options={vendorList.data ?? []} /> 형태로 사용.
 *
 * value 는 협력업체 PK(id) 를 사용한다. (TB_PRODUCT.VENDOR_ID 가 id(PK) 를 저장)
 */
export const useVendorList = ({ enabled = true, staleTime, refetchOnMount }: UseVendorListParams = {}) => {
  return useQuery({
    queryKey: ['/partnerVendorMng/dropdown'],
    queryFn: () => authApi.get('/partnerVendorMng/dropdown'),
    select: (response) => {
      const { resultCode, body, resultMessage } = response.data;

      if (resultCode !== 200 || !body || body.length === 0) {
        if (resultCode !== 200) toastError(resultMessage || '협력업체 조회 실패');
        return [] as DropDownOption[];
      }

      return body.map(
        (item: any) =>
          ({
            key: item.id,
            value: item.id,
            label: item.vendorNm,
          }) as DropDownOption,
      );
    },
    enabled,
    staleTime: staleTime ?? 0,
    refetchOnMount: refetchOnMount ?? true,
  });
};
