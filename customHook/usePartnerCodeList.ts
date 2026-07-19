// hooks/usePartnerCodeList.ts
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/libs';
import { toastError } from '@/components';
import { DropDownOption } from '@/types/DropDownOptions';
/** usePartnerCodeList 훅 파라미터 */
interface UsePartnerCodeListParams {
  /** 상위 코드 (예: 'P0006' → 해당 상위코드의 하위 코드 목록 조회) */
  codeUpper: string;
  /** 코드명 검색어 (부분 일치) */
  searchKeyword?: string;
  /** 정렬 기준 ('NAME' 등) */
  orderType?: string;
  /** 쿼리 실행 여부 (false 면 자동 조회 안 함) */
  enabled?: boolean;
  /** 동일 codeUpper 를 다른 캐시로 분리하고 싶을 때 쓰는 식별자 */
  queryKey?: string | number; // ✅ 단순 식별자로 변경
  /** 캐시 신선도 유지 시간(ms). 기본 0 = 매번 stale */
  staleTime?: number;
  /** 마운트 시 재조회 여부. 기본 true */
  refetchOnMount?: boolean | 'always';
}

/**
 * 파트너 하위 코드 목록을 드롭다운 옵션(DropDownOption[])으로 조회하는 커스텀 훅.
 *
 * 반환값은 배열이 아니라 react-query 의 결과 객체(UseQueryResult)입니다.
 * 가공된 옵션 배열은 그 안의 `.data` 에 담깁니다.
 *   const codeList = usePartnerCodeList({ codeUpper: 'P0006' });
 *   codeList.data      // → DropDownOption[] (로딩 전엔 undefined)
 *   codeList.isLoading // 로딩 상태
 * 따라서 <FormDropDown options={...} /> 에는 `codeList.data ?? []` 를 넘겨야 합니다.
 */
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
    // 캐시 키: 상위코드 + 선택적 식별자 조합으로 구분
    queryKey: ['/partnerCode/lowerCodeList/', codeUpper, queryKey],
    // 실제 서버 호출 (공통 응답 래퍼 형태로 반환됨)
    queryFn: () =>
      authApi.get('/partnerCode/lowerCodeList', {
        params: { codeUpper, searchKeyword, orderType },
      }),
    // select: 서버 원본 응답 → 화면에서 바로 쓰는 DropDownOption[] 로 변환.
    //         이 콜백의 반환값이 곧 UseQueryResult.data 가 된다.
    select: (response) => {
      const { resultCode, body, resultMessage } = response.data;

      // 실패 or 빈 결과: 토스트 안내 후 빈 배열 반환
      if (resultCode !== 200 || !body || body.length === 0) {
        toastError(resultMessage || '데이터 조회 실패');
        return [];
      }

      // 코드 항목 → 드롭다운 옵션 매핑
      // value 는 partner_code 의 PK(id) 를 사용한다.
      //  - TB_PRODUCT.DOMAE_ID 등 FK 가 codeCd 가 아닌 id(PK)를 저장하므로,
      //    선택값이 id 로 저장·매칭되어야 라벨이 정상 표시된다.
      return body.map(
        (item: any) =>
          ({
            key: item.id,
            value: item.id,
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
