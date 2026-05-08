import { useQuery } from '@tanstack/react-query';
import { WebCommonControllerApi } from '../generated';

const webCommonApi = new WebCommonControllerApi();

export function useCode(codeUpper: string) {
  return useQuery({
    queryKey: ['selectLowerCodeByCodeUpper', codeUpper],
    queryFn: async () => {
      const res = await webCommonApi.selectLowerCodeByCodeUpper({ codeUpper: codeUpper });
      return res.data.body;
    },
    enabled: !!codeUpper,
  });
}
