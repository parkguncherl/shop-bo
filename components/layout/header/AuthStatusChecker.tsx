'use client';

import { ApiResponseAuthResponseMenuAuth } from '../../../generated';
import { authApi } from '../../../libs';
import { usePathname, useRouter } from 'next/navigation';
import { toastError } from '../../ToastMessage';
import { LOCAL_STORAGE_WMS_HISTORY } from '../../../libs/const';
import { useCommonStore } from '../../../stores';
import { useEffect } from 'react';

/**
 * 클라이언트 영역에서 경로를 이동하는 때마다 권한 체크, 부적합할 시 필요한 동작을 수행하는 영역
 * */
const AuthStatusChecker = () => {
  const router = useRouter();
  const pathname = usePathname();

  const [setHistoryList, setUpMenuNm, setMenuNm, setMenuUpdYn, setMenuExcelYn] = useCommonStore((s) => [
    s.setHistoryList,
    s.setUpMenuNm,
    s.setMenuNm,
    s.setMenuUpdYn,
    s.setMenuExcelYn,
  ]);

  // 메뉴 권한 체크 함수
  const authCheck = async () => {
    const result = await authApi.get<ApiResponseAuthResponseMenuAuth>('/auth/check/menu', {
      params: {
        menuUri: pathname,
      },
    });
    const { body } = result.data;
    if (body) {
      if (body.menuReadYn === 'N') {
        toastError('해당메뉴[' + pathname + ']에 접근권한이 없습니다. (history 삭제)');
        localStorage.removeItem(LOCAL_STORAGE_WMS_HISTORY);
        setHistoryList([]);
        router.back(); // 이전 경로로
      } else {
        setUpMenuNm(body.upMenuNm || '');
        setMenuNm(body.menuNm || '');
        setMenuUpdYn(body.menuUpdYn === 'Y');
        setMenuExcelYn(body.menuExcelYn === 'Y');
      }
    } else {
      toastError('토큰이 만료되었습니다.');
      router.push('/logout');
    }
  };

  useEffect(() => {
    /** 경로를 이동하는 매 순간 실행되어 권한을 검증 */
    authCheck();
  }, [pathname]);

  return <></>;
};

export default AuthStatusChecker;
