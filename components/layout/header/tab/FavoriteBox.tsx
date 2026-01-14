'use client';

import React, { useEffect, useRef, useState } from 'react';
import { redirect, RedirectType } from 'next/navigation';
import { HistoryType, useCommonStore, useMypageStore } from '../../../../stores';
import { LOCAL_STORAGE_WMS_HISTORY } from '../../../../libs/const';
import { useQuery } from '@tanstack/react-query';
import { toastError } from '../../../ToastMessage';
import Link from 'next/link';
import { ApiResponseListSelectFavorites, SelectFavorites } from '../../../../generated';
import { authApi } from '../../../../libs';

/**
 * 즐겨찾기 영역(버튼 및 활성 시점에 출력되는 tab)
 * */
const FavoriteBox = () => {
  /** 참조 */
  const containerRef = useRef<HTMLDivElement>(null); // 즐겨찾기 div 영역

  /** 전역상태 */
  const [favoriteList, setFavoriteList] = useMypageStore((s) => [s.favoriteList, s.setFavoriteList]); // todo 현재는 다른 영역에서의 사용이 식별되어 전역 상태 유지하나 이후 불필요하다 여겨질 시 즉시 지역 상태로 전환할 것!
  const [setHistoryList] = useCommonStore((s) => [s.setHistoryList]);

  /** 지역(local) states */
  const [favoriteBtn, setFavoriteBtn] = useState(false); // 즐겨찾기 onoff

  // 즐겨찾기 버튼
  const handleFavoriteBtnOnOff = () => {
    setFavoriteBtn(!favoriteBtn);
  };

  // 즐겨찾기 영역 외 클릭시 닫기
  useEffect(() => {
    // 컴포넌트가 마운트될 때 클릭 이벤트 리스너를 추가
    const handleClickOutside = (event: MouseEvent) => {
      // containerRef가 유효하고, 클릭된 요소가 containerRef의 외부에 있으면 드롭다운을 닫음
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setFavoriteBtn(false);
      }
    };
    // document에 클릭 이벤트 리스너를 등록
    if (typeof window !== 'undefined') {
      document.addEventListener('click', handleClickOutside);
    }
    // 컴포넌트가 언마운트될 때 클릭 이벤트 리스너를 제거
    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('click', handleClickOutside);
      }
    };
  }, []);

  // 즐겨찾기 링크
  const handleFavoriteLink = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, menuUri: string | undefined) => {
    e.preventDefault();
    if (menuUri) {
      redirect(menuUri, RedirectType.push);
    }
  };

  // 즐겨찾기 목록 전체 펼침
  const handleFavoriteAllOpen = () => {
    const prevHistoryList = [...favoriteList];
    const favHistoryList: HistoryType[] = prevHistoryList.map((menu: SelectFavorites, index) => ({
      id: prevHistoryList.length + (index + 1),
      histMenuNm: menu.menuNm as string,
      histMenuUri: menu.menuUri as string,
    }));
    setHistoryList(favHistoryList); // 전역 상태 동기화
  };

  const { data: favoriteData, isSuccess: isFavSuccess } = useQuery({
    queryKey: ['favoriteList'], // 해당 키를 통한 무효화로 인하여 본 값에 의존적인 영역이 다수 존재함에 유념
    queryFn: () => authApi.get<ApiResponseListSelectFavorites>('/mypage/favorites', {}),
  });

  useEffect(() => {
    if (isFavSuccess) {
      const { resultCode, body, resultMessage } = favoriteData.data;
      if (resultCode == 200) {
        setFavoriteList(body || []);
      } else {
        toastError(resultMessage);
      }
    }
  }, [favoriteData, isFavSuccess]);

  return (
    <div className={`favoriteBox ${favoriteBtn ? 'on' : ''}`} ref={containerRef}>
      <button className="favoriteBtn" onClick={handleFavoriteBtnOnOff}>
        즐겨찾기
      </button>
      <ul className="favoriteList">
        <li className="tabMenuListAdd">
          <button
            onClick={() => {
              handleFavoriteAllOpen();
            }}
          >
            탭메뉴 생성
          </button>
        </li>
        {favoriteList && favoriteList.length > 0 ? (
          favoriteList.map((data, index) => (
            <li key={'FAV_LIST_' + index}>
              <Link
                href=""
                onClick={(e) => {
                  handleFavoriteLink(e, data?.menuUri);
                }}
              >
                {data.menuNm}
              </Link>
            </li>
          ))
        ) : (
          <li>
            <span>즐겨찾기 메뉴가 없습니다.</span>
          </li>
        )}
      </ul>
    </div>
  );
};

export default FavoriteBox;
