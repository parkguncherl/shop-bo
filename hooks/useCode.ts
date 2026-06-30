import { useQuery } from '@tanstack/react-query';
import { authApi } from '../libs';

export function useCode(codeUpper: string) {
  return useQuery({
    queryKey: ['selectLowerCodeByCodeUpper', codeUpper],
    queryFn: async () => {
      const res = await authApi.get('/code/lower/' + codeUpper);
      return res.data.body;
    },
    enabled: !!codeUpper,
  });
}
