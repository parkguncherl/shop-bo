'use client';

import { useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useAuthStore } from '../../../stores';
import Loading from '../../../components/Loading';

/**
 * 로그아웃을 희망할 시 리다이렉트하는 페이지의 클라이언트 영역
 * 토큰 무효화 이후 리다이렉트는 프록시에 의존
 * */
const LogoutClient = () => {
  const session = useSession();
  const { logout } = useAuthStore();

  /**
   * 반드시 백앤드 영역 로그아웃을 처리한 뒤 next Auth 를 통한 토큰 무효화 동작 실행하여야
   * 그러지 아니할 경우 프록시로 인하여 이후 동작 처리 전 리다이렉트 될 위험
   * */
  const immediateProcessor = async () => {
    await logout(session?.data?.user.loginId ? session?.data?.user.loginId : '');
    await signOut({ redirect: true, callbackUrl: '/login' }); // 클라이언트 토큰 무효화
  };

  // 랜더링 즉시 실행
  useEffect(() => {
    // 인증된 사용자만 접근하도록 프록시로 강제되었으므로 if 문 생략
    immediateProcessor();
  }, []);

  return <Loading />;
};

export default LogoutClient;
