import { useQuery } from '@tanstack/react-query';
import { CodeControllerApi } from '@/generated';

const codeApi = new CodeControllerApi();

export function useCode(codeUpper: string) {
  return useQuery({
    queryKey: ['selectLowerCodeByCodeUpper', codeUpper],
    queryFn: async () => {
      const res = await codeApi.selectLowerCodeByCodeUpper(codeUpper);
      return res.data.body;
    },
    enabled: !!codeUpper,
  });
}
