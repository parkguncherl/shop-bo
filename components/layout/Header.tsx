'use client';

import React, { useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import styles from '../../styles/layout/header.module.scss';
import Link from 'next/link';
import { useAuthStore, useCommonStore, useMypageStore } from '../../stores';
import { authApi } from '../../libs';
import { toastError } from '../ToastMessage';
import { ApiResponseAuthResponseMenuAuth, ApiResponseListSelectFavorites } from '../../generated';
import { useQuery } from '@tanstack/react-query';
import { TabMenu } from './TabMenu';
import { usePathname } from 'next/navigation';

interface Props {
  closed?: boolean;
}
// todo 정적 레이아웃 안정화 후 삭제

export const Header = ({ closed }: Props) => {
  const pathname = usePathname();
  const session = useSession();
  const { logout } = useAuthStore();
  /** 공통 스토어 - State */
  const [setUpMenuNm, setMenuNm, setMenuUpdYn, setMenuExcelYn] = useCommonStore((s) => [s.setUpMenuNm, s.setMenuNm, s.setMenuUpdYn, s.setMenuExcelYn]);
  const [setFavoriteList] = useMypageStore((s) => [s.setFavoriteList]);

  /**
   * 각 페이지(메뉴) 에 관한 사용자의 권한 확인, 권한 부재 시 역시 리다이렉트 및 로그아웃 처리
   * */
  const authCheck = async (pathname: string | null) => {
    const result = await authApi.get<ApiResponseAuthResponseMenuAuth>('/auth/check/menu', {
      params: {
        menuUri: pathname,
      },
    });
    const { body, resultCode, resultMessage } = result.data;
    if (body) {
      if (body.menuReadYn === 'N') {
        toastError('비정상적인 접근입니다2.');
        await logout(session?.data?.user.loginId ? session?.data?.user.loginId : '');
        await signOut({ redirect: true, callbackUrl: '/login' });
      } else {
        setUpMenuNm(body.upMenuNm || '');
        setMenuNm(body.menuNm || '');
        setMenuUpdYn(body.menuUpdYn === 'Y');
        setMenuExcelYn(body.menuExcelYn === 'Y');
      }
    } else {
      toastError(' wms 비정상적인 접근입니다3.');
      await logout(session?.data?.user.loginId ? session?.data?.user.loginId : '');
      await signOut({ redirect: true, callbackUrl: '/login' });
    }
  };

  const { data: favoriteData, isSuccess: isFavSuccess } = useQuery({
    queryKey: [],
    queryFn: () => authApi.get<ApiResponseListSelectFavorites>('/mypage/favorites', {}),
  });

  // 즐겨찾기 데이터가 변경될 때 상태 업데이트
  useEffect(() => {
    setFavoriteList(favoriteData?.data?.body ? favoriteData?.data?.body : []);
  }, [favoriteData?.data?.body, isFavSuccess, setFavoriteList]);

  useEffect(() => {
    /** 경로 이동에 따른 권한 점검 영역 */
    authCheck(pathname);
  }, [pathname]);

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    await logout(session?.data?.user.loginId ? session?.data?.user.loginId : '');
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  return (
    <header className={`${styles.header} ${styles.wmsHeader}`}>
      <div className={styles.left}>
        <h1>
          <Link href={'/'}>{'logo'}</Link>
        </h1>
      </div>
      <TabMenu />
      <div className={styles.right}>
        <button title={'로그아웃'} onClick={handleLogout}>
          {'로그아웃'}
        </button>
      </div>
    </header>
  );
};
