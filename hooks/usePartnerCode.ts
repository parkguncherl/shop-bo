import { useQuery } from '@tanstack/react-query';
import { WebCommonControllerApi } from '../generated';

const webCommonApi = new WebCommonControllerApi();

export function usePartnerCode(partnerUpperCode: string) {
  return useQuery({
    queryKey: ['categoryList', partnerUpperCode],
    queryFn: async () => {
      const res = await webCommonApi.partnerCodeList({partnerUpperCode: partnerUpperCode });
      return res.data.body;
    },
    enabled: !!partnerUpperCode,
  });
}
