'use client';

import { useEffect } from 'react';
import { authApi } from '../../../libs';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * 로그아웃을 희망할 시 리다이렉트하는 페이지의 클라이언트 영역
 * 토큰 무효화 이후 리다이렉트는 프록시에 의존
 * */
const LogoutClient = () => {
  const session = useSession();
  const router = useRouter();

  const logout = async () => {
    // await logout(session?.data?.user.loginId ? session?.data?.user.loginId : ''); // 백앤드 영역 로그아웃 처리
    // await signOut({ redirect: true, callbackUrl: '/login' }); // 클라이언트 토큰 무효화
    // try {
    //   await authApi.get('/auth/logoutAuto');
    //   location.href = '/login';
    // } catch (error) {
    //   console.error('Logout failed:', error);
    // }
  };

  useEffect(() => {
    // 인증된 사용자만 접근하도록 프록시로 강제되었으므로 if 문 생략
    logout();
  }, []);

  return <></>;
};

export default LogoutClient;
