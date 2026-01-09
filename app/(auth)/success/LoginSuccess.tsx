'use client';

import Loading from '../../../components/Loading';
import { signOut, useSession } from 'next-auth/react';
import { LOCAL_STORAGE_WMS_HISTORY } from '../../../libs/const';
import { ApiResponseListSelectFavorites, SelectFavorites } from '../../../generated';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../stores';
import { toastError } from '../../../components';

/**
 * 로그인 성공 직후 리다이렉트 되는 영역
 * 해당 영역에서 로그인 직후 필요한 동작(초기 구성 등) 처리
 * 또한 해당 영역에서 리다이렉트 경로 지정 가능
 * */
const LoginSuccess = () => {
  /** 세션 기반으로 로그인 직후 초기 동작 정의 */
  const session = useSession();
  const router = useRouter();

  const { logout } = useAuthStore();

  // 세션이 생겼을때 즐겨찾기 목록 가져오기
  const { refetch: favRefetch } = useQuery({
    queryKey: [],
    queryFn: () => authApi.get<ApiResponseListSelectFavorites>('/mypage/favorites', {}),
    enabled: false, // 쿼리가 자동으로 실행되지 않도록 설정
  });

  useEffect(() => {
    if (session.status == 'authenticated' && session.data?.user && session.data.token.errMessage == undefined) {
      // 리다이렉트 이후 인증 상태 정상인 경우
      processAfterSuccess();
    } else {
      // 비정상일 시 로그아웃 절차 전개
      processAfterFailure();
    }
  }, [session]);

  const processAfterSuccess = async () => {
    const { data: favorites } = await favRefetch(); // 데이터가 로드될 때까지 기다림
    const favHistoryList = favorites?.data?.body?.map((menu: SelectFavorites) => ({
      histMenuNm: menu.menuNm,
      histMenuUri: menu.menuUri,
      histParamList: [],
    }));
    if (favHistoryList && favHistoryList.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_WMS_HISTORY, JSON.stringify(favHistoryList));
    }

    router.push('/'); // 리다이렉트
  };

  const processAfterFailure = async () => {
    toastError(session.data?.token.errMessage || '인증 실패');
    await logout(session?.data?.user.loginId ? session?.data?.user.loginId : ''); // 백앤드 영역 로그아웃 처리
    await signOut({ redirect: true, callbackUrl: '/login' }); // 클라이언트 토큰 무효화
  };

  return <Loading />;
};

export default LoginSuccess;
