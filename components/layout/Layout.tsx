'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from '../../styles/layout/layout.module.scss';
import { useSession } from 'next-auth/react';
import Loading from '../Loading';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../libs';
import { ApiResponseAuthResponseMenuAuth } from '../../generated';
import { LOCAL_STORAGE_HISTORY, LOCAL_STORAGE_WMS_HISTORY } from '../../libs/const';
import { LeftNav } from './LeftNav';
import { HeaderWms } from './HeaderWms';
import { useCommonStore } from '../../stores';
import { usePathname, useRouter } from 'next/navigation';

interface Props {
  children: React.ReactNode;
}

type MenuHistory = {
  histMenuUri: string | null;
  histMenuNm: string;
  histParamList: [MenuParam];
};

type MenuParam = {
  paramNm: string;
  paramValue: string;
};

/**
 * client side 기본 레이아웃 구성(shell)
 * */
export const Layout = ({ children }: Props) => {
  /** context hook(provided by Root Provider) */
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();

  /** local states */
  //const [closed, setClosed] = useState<boolean>(false);
  const [menuHistoryState, setMenuHistoryState] = useState<MenuHistory>({
    histMenuNm: '',
    histMenuUri: '',
    histParamList: [{ paramNm: '', paramValue: '' }],
  });

  /** 전역 상태 */
  const [setHistoryList] = useCommonStore((s) => [s.setHistoryList]);

  /** 참조 */
  const isMatch = useRef(false);

  /** 컴포넌트 상수 */
  const authGroupCd = session.data?.user?.authCd ? session.data?.user.authCd?.substring(0, 1) : '';

  const { data: menuAuthList, isLoading } = useQuery({
    queryKey: ['/auth/check/menu', pathname],
    queryFn: () =>
      authApi.get<ApiResponseAuthResponseMenuAuth>('/auth/check/menu', {
        params: {
          menuUri: pathname,
        },
      }),
    enabled: !!session.data?.user,
  });

  /** 히스토리탭에서 사용되는 uri 목록 생성 */
  const refreshHistList = (updatedMenuHistoryState: MenuHistory) => {
    const history: MenuHistory[] = JSON.parse(localStorage.getItem(authGroupCd === '3' ? LOCAL_STORAGE_HISTORY : LOCAL_STORAGE_WMS_HISTORY) || '[]');
    const historyListData: MenuHistory[] = [];
    // 히스토리가 없는경우
    if (!history || history.length === 0) {
      if (updatedMenuHistoryState.histMenuNm !== 'mainPage') {
        // 메인페이지는  추가 하지 않는다.
        historyListData.push(JSON.parse(JSON.stringify(updatedMenuHistoryState)));
        localStorage.setItem(authGroupCd === '3' ? LOCAL_STORAGE_HISTORY : LOCAL_STORAGE_WMS_HISTORY, JSON.stringify(historyListData));
        setHistoryList(
          historyListData.map((historyData) => {
            return {
              histMenuNm: historyData.histMenuNm,
              histMenuUri: historyData.histMenuUri || '',
            };
          }),
        );
        // 기존히스토리가 있는경우는 중복체크해서 없는것만 추가된다.
      }
    } else {
      if (updatedMenuHistoryState.histMenuNm !== 'mainPage') {
        isMatch.current = false;
        for (let i = 0; i < history.length; i++) {
          if (history[i].histMenuUri === updatedMenuHistoryState.histMenuUri) {
            isMatch.current = true;
            break;
          }
        }

        if (!isMatch.current) {
          // 기존에 열린 목록과 일치하는것이 하나도 없으면 새로운 페이지임
          history.unshift(JSON.parse(JSON.stringify(updatedMenuHistoryState)));
          localStorage.setItem(authGroupCd === '3' ? LOCAL_STORAGE_HISTORY : LOCAL_STORAGE_WMS_HISTORY, JSON.stringify(history));
        }
      }
      setHistoryList(
        history.map((historyData) => {
          return {
            histMenuNm: historyData.histMenuNm,
            histMenuUri: historyData.histMenuUri || '',
          };
        }),
      );
    }
  };

  /** uri 목록 동기화 */
  useEffect(() => {
    if (menuAuthList && menuAuthList.data && menuAuthList.data.body && menuAuthList.data.body.menuNm) {
      setMenuHistoryState((prevState) => {
        const updatedMenuHistoryState = {
          ...prevState,
          histMenuNm: menuAuthList.data.body?.menuNm as string,
          histMenuUri: pathname,
        };
        refreshHistList(updatedMenuHistoryState);
        return updatedMenuHistoryState;
      });
    }
  }, [menuAuthList]);

  // 반환 영역
  if (session.status === 'loading') {
    return <Loading />;
  } else {
    return (
      <>
        {session.status === 'authenticated' && !isLoading && (
          <div className={`wmsLayout ${styles.layout}`}>
            {/*<HeaderWms closed={closed} toggle={() => setClosed(!closed)} />*/}
            <HeaderWms />
            <div className={`container ${styles.container} ${closed ? styles.on : ''}`}>
              <LeftNav />
              <div className={`content ${styles.content}`}>{children}</div>
            </div>
          </div>
        )}
      </>
    );
  }
};
