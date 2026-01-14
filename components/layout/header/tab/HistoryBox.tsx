'use client';

import { ReactSortable, SortableEvent } from 'react-sortablejs';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { redirect, RedirectType, usePathname } from 'next/navigation';
import { HistoryType, useCommonStore, useMypageStore } from '../../../../stores';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { authApi } from '../../../../libs';
import { ApiResponseAuthResponseMenuAuth } from '../../../../generated';

interface Props {
  ref?: React.Ref<{ closeAllTabs: () => void }>;
}
// 이하 local type, interface
interface HistoryTypeForSorting extends HistoryType {
  id: number; // id는 소팅 영역에서 필요하므로 필수값으로 지정함, 최초 0부터 시작
}

/**
 * 페이지 방문 이력에 따른 즉시 이동 가능 bar 목록 생성 영역
 * */
const HistoryBox = ({ ref }: Props) => {
  /** context hook(provided by Root Provider) */
  const pathname = usePathname();

  const listRef = useRef<HTMLDivElement>(null); // list Ref 생성
  const listDivRef = useRef<HTMLDivElement>(null); // 전체 list div Ref 생성
  const contextMenuRef = useRef<HTMLUListElement>(null);

  /** 전역 상태 */
  const [regFavoritesAll] = useMypageStore((s) => [s.regFavoritesAll]);
  const [historyList, setHistoryList] = useCommonStore((s) => [s.historyList, s.setHistoryList]);

  /** 지역(local) states */
  // ReactSortable 내부 동작과 zustand 의 불변성 요구 모두를 충족하기 위한 완충 state, 상태 관리는 여전히 전역 관할이나 sortable 영역 상태의 동기화는 해당 state 관할
  const [historyListAsMiddleState, setHistoryListAsMiddleState] = useState<HistoryTypeForSorting[]>([]);

  // 각각의 바 관리를 위한 상태
  const [activeIndex, setActiveIndex] = useState<number | null>(0); // 활성화 탭
  const [translateXValue, setTranslateXValue] = useState<number>(0); // 왼쪽 오른쪽 이동

  // 최대 이동 범위
  const [maxTranslateX, setMaxTranslateX] = useState<number>(0);
  const [divWidth, setDivWidth] = useState<number>(0);

  const [isButtonVisible, setIsButtonVisible] = useState(false); // 즐겨찾기영역 이동 버튼
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 }); // 우클릭시 출력되어지는 컨텍스트 메뉴의 상태
  const [hoverIndex, setHoverIndex] = useState<number | null>(null); // Hover 상태 관리

  useImperativeHandle(ref, () => ({
    closeAllTabs,
    closeOtherTabs,
  }));

  const { data: menuAuthList, isSuccess: isMenuCheckSuccess } = useQuery({
    queryKey: ['/auth/check/menu', pathname],
    queryFn: () =>
      authApi.get<ApiResponseAuthResponseMenuAuth>('/auth/check/menu', {
        params: {
          menuUri: pathname,
        },
      }),
  });

  /**
   * 히스토리탭에서 사용되는 uri 목록 생성
   * */
  useEffect(() => {
    if (isMenuCheckSuccess) {
      const { resultCode, body, resultMessage } = menuAuthList.data;
      if (resultCode == 200) {
        if (body && body.menuNm) {
          if (historyList.filter((history) => history.histMenuUri == pathname).length == 0) {
            // 신규 경로
            if (body.menuNm !== 'mainPage') {
              // 메인페이지 외 경로만 추가 후보
              const pushedHistoryList = [...historyList];
              pushedHistoryList.push({
                //id: pushedHistoryList[pushedHistoryList.length - 1] ? pushedHistoryList[pushedHistoryList.length - 1].id : 1, // 기본 1부터 시작
                histMenuNm: body.menuNm as string,
                histMenuUri: pathname,
              } as HistoryType);
              setHistoryList(pushedHistoryList);
            }
          }
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [isMenuCheckSuccess, menuAuthList]);

  const dragStart = (event: SortableEvent) => {
    const idx = event.oldIndex ?? -1; // 드래그 시작 시의 인덱스
    if (idx >= 0) {
      setActiveIndex(idx); // 드래깅 인덱스 업데이트
    }
  };

  // 드래그가 끝났을 때 최종 처리
  const dragEnd = (event: SortableEvent) => {
    const startIndex = event.oldIndex ?? -1; // 드래그 시작 인덱스
    const endIndex = event.newIndex ?? -1; // 드래그 끝 인덱스

    if (startIndex >= 0 && endIndex >= 0 && startIndex !== endIndex) {
      const updatedList = [...historyList];
      const [movedItem] = updatedList.splice(startIndex, 1); // 시작 인덱스에서 아이템 제거
      updatedList.splice(endIndex, 0, movedItem); // 끝 인덱스에 아이템 삽입

      setHistoryList(updatedList); // 리스트 상태 업데이트
      // 드래그 종료된 페이지로 이동
      redirect(updatedList[endIndex].histMenuUri, RedirectType.push);
    }

    // 최종 드래깅한 아이템에 on 클래스 추가
    setActiveIndex(endIndex);
  };

  // 활성화 탭
  const handleActivateItem = (index: number, histMenuUri: string) => {
    updateButtonVisibility();
    if (histMenuUri !== pathname) {
      setActiveIndex(index);
      redirect(histMenuUri || '', RedirectType.push);
    }
  };

  // 현재 URI와 같은 histMenuUri를 가진 탭을 찾아 활성화
  useEffect(() => {
    const foundIndex = historyList.findIndex((item) => item.histMenuUri === pathname);
    if (foundIndex !== -1) {
      setActiveIndex(foundIndex);
    } else {
      setActiveIndex(null); // 현재 URI와 일치하는 히스토리 탭이 없으면 activeIndex를 null로 설정
    }
  }, [pathname, historyList]);

  // 닫힘 동작
  const closeHistory = (index: number, historyList: HistoryType[]) => {
    updateButtonVisibility();
    // 리스트에서 선택된 히스토리를 삭제
    const updatedList = historyList.filter((_, idx) => idx !== index);
    setHistoryList(updatedList);

    // 남은 히스토리가 없으면 홈 페이지로 이동
    if (updatedList.length === 0) {
      redirect('/', RedirectType.push);
    }
  };

  /** 창 너비 혹은 고려할 만한 상호작용 발생 시 이에 맞추어 버튼 출력 동기화 */
  const updateButtonVisibility = () => {
    if (listRef.current && listDivRef.current) {
      // listRef와 listDivRef 크기 비교
      const listWidth = listRef.current.offsetWidth;
      const divWidth = listDivRef.current.offsetWidth;
      // listRef가 listDivRef보다 크면 버튼 표시, 아니면 숨기기
      setIsButtonVisible(listWidth > divWidth);
      // 최대 이동 범위와 외부 div 크기 업데이트
      setMaxTranslateX(listWidth);
      setDivWidth(divWidth);
    }
  };

  // 초기 렌더링 및 창 크기 변경 이벤트 처리
  useEffect(() => {
    updateButtonVisibility();

    // 창 크기 변경 이벤트 추가
    window.addEventListener('resize', updateButtonVisibility);

    // cleanup 함수
    return () => {
      window.removeEventListener('resize', updateButtonVisibility);
    };
  }, []);

  const moveLeft = () => {
    if (translateXValue === 0) return; // 이미 최대값에 도달한 경우, 더 이상 이동하지 않음

    const newValue = translateXValue + 175; // 오른쪽으로 이동
    setTranslateXValue(Math.min(0, newValue)); // 최소값을 0으로 제한
  };

  const moveRight = () => {
    if (translateXValue <= -maxTranslateX + divWidth) return; // 이미 최소값에 도달한 경우, 더 이상 이동하지 않음

    const newValue = translateXValue - 175; // 왼쪽으로 이동
    setTranslateXValue(Math.max(-maxTranslateX + divWidth, newValue)); // 최소값을 -maxTranslateX + divWidth로 제한
  };

  // 모든탭 닫기
  const closeAllTabs = () => {
    // 컨텍스트 메뉴 닫기
    closeContextMenu();
    // 상태 초기화
    setHistoryList([]);
    setActiveIndex(null);
    redirect('/', RedirectType.push);
  };
  const queryClient = useQueryClient();

  /** 즐겨찾기 영역 등록 영역 */
  const { mutate: regFavoritesAllMutate } = useMutation(regFavoritesAll, {
    onSuccess: async (e) => {
      const { resultCode } = e.data;
      try {
        if (resultCode === 200) {
          toastSuccess('즐겨찾기 등록에 성공했습니다.');
          await queryClient.invalidateQueries({ queryKey: ['favoriteList'] }); // 즐겨찾기 영역 cached fetch 무효화
        } else {
          console.log(e);
          toastError('등록 과정 중 문제 발생');
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  // 현재 출력된 탭들을 즐겨찾기로 일괄 등록
  const makeFavorite = async () => {
    const history: HistoryType[] = [...historyList];
    const historyArray: string[] = history.map((menu) => menu.histMenuUri); // Assuming 'name' is a string property in MenuHistory
    regFavoritesAllMutate({ menuUris: historyArray });
  };

  // 우클릭 전체 닫기 이벤트
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({ visible: true, x: event.clientX, y: event.clientY });
  };

  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
  };

  // 현재 탭을 제외한 다른 모든 탭 닫기
  const closeOtherTabs = () => {
    if (activeIndex !== null) {
      const currentTab = historyList[activeIndex];
      const updatedList = [currentTab];
      setHistoryList(updatedList);
      closeContextMenu();
      setActiveIndex(0);
    } else {
      console.log('활성화된 탭이 없습니다.');
      closeAllTabs();
    }
  };
  // 현재 탭의 오른쪽에 있는 모든 탭 닫기
  const closeRightTabs = () => {
    if (activeIndex !== null) {
      // 현재 탭까지만 유지하고 나머지 오른쪽 탭들은 제거
      const updatedList = historyList.slice(0, activeIndex + 1);
      setHistoryList(updatedList);
      closeContextMenu();
    }
  };

  // 현재 탭의 왼쪽에 있는 모든 탭 닫기
  const closeLeftTabs = () => {
    if (activeIndex !== null) {
      // 현재 탭부터 끝까지 유지하고 나머지 왼쪽 탭들은 제거
      const updatedList = historyList.slice(activeIndex);
      setHistoryList(updatedList);
      setActiveIndex(0); // 현재 탭이 첫 번째 탭이 됨
      closeContextMenu();
    }
  };
  // 현재 탭만 닫기
  const closeCurrentTab = () => {
    if (activeIndex !== null) {
      const updatedList = historyList.filter((_, index) => index !== activeIndex);
      setHistoryList(updatedList);
      closeContextMenu();
      if (updatedList.length === 0) {
        // 모든 탭이 닫혔다면 홈페이지로 이동
        redirect('/', RedirectType.push);
        setActiveIndex(null);
      } else {
        // 다음 탭으로 이동 (마지막 탭이었다면 이전 탭으로)
        const newActiveIndex = activeIndex >= updatedList.length ? updatedList.length - 1 : activeIndex;
        setActiveIndex(newActiveIndex);

        redirect(updatedList[newActiveIndex].histMenuUri, RedirectType.push);
      }
    }
  };

  // box 이외 영역 클릭 시 메뉴 비활성 동작
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        closeContextMenu();
      }
    };
    if (typeof window !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('mousedown', handleClickOutside);
      }
    };
  }, []);

  useEffect(() => {
    // historyList 에 따라 중간 상태 동기화
    setHistoryListAsMiddleState(
      historyList.map((history, index) => {
        return {
          ...history,
          id: index,
        };
      }),
    );
  }, [historyList]);

  return (
    <div className="historyBox" onContextMenu={handleContextMenu}>
      <div className="list" ref={listDivRef}>
        <div style={{ transform: `translateX(${translateXValue}px)` }} ref={listRef}>
          <ReactSortable
            key={pathname} // 경로 변경 시점에 내부 Sortable 인스턴스 상태 초기화하여 내부 상태 부조화로 인한 드래그 동작 미동작 방지
            list={historyListAsMiddleState}
            setList={setHistoryListAsMiddleState}
            // setList={(newState: HistoryTypeForSorting[], sortable: Sortable | null, store: Store) => {
            //   console.log('(newState: HistoryTypeForSorting[], sortable: Sortable | null, store: Store): ', newState, sortable, store);
            // }}
            animation={200} // 드래그 애니메이션
            multiDrag
            swap
            forceFallback
            onStart={(event) => dragStart(event)}
            onEnd={(event) => dragEnd(event)}
            handle=".drag-handle" // 드래그 동작이 일어나는 요소를 클래스명으로 명확히 정의함
          >
            {historyList.map((item, index) => {
              const isHover = index === hoverIndex;
              const active = activeIndex || 0;
              const activePrev = index === active - 1;
              const isNotHover = hoverIndex !== null && index === hoverIndex - 1;

              return (
                <div
                  key={index}
                  className={`item-${index} ${isHover ? 'hover' : ''} ${isNotHover ? 'notHover' : ''} ${activePrev ? 'notHover' : ''} ${
                    index === activeIndex && pathname !== '/' && pathname !== '' ? 'on' : ''
                  }`}
                  onMouseEnter={() => setHoverIndex(index)} // 마우스가 들어오면 hover 상태 설정
                  onMouseLeave={() => setHoverIndex(null)} // 마우스가 나가면 hover 상태 초기화
                >
                  <div
                    className={'drag-handle'} // 드래그가 발생하는 요소
                    style={{
                      userSelect: 'none',
                    }}
                    onClick={() => {
                      if (item.histMenuUri) {
                        handleActivateItem(index, item.histMenuUri);
                      }
                    }}
                  >
                    {item.histMenuNm}
                  </div>
                  <button
                    onClick={() => {
                      closeHistory(index, historyList);
                    }}
                  >
                    <span></span>
                    <span></span>
                  </button>
                </div>
              );
            })}
          </ReactSortable>
        </div>
      </div>
      <div className="listBtn" style={{ display: isButtonVisible ? 'flex' : 'none' }}>
        <button onClick={moveLeft}>왼쪽</button>
        <button onClick={moveRight}>오른쪽</button>
      </div>
      {contextMenu.visible && (
        <ul
          className={`rightClickMenu ${contextMenu.visible ? 'on' : ''}`}
          ref={contextMenuRef}
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
          }}
        >
          <li>
            <button onClick={makeFavorite}>· 즐겨찾기정보 일괄 생성</button>
          </li>
          <li>
            <button onClick={closeAllTabs}>· 전체 탭 닫기</button>
          </li>
          <li>
            <button onClick={closeOtherTabs}>· 다른 탭 닫기</button>
          </li>
          <li>
            <button onClick={closeRightTabs}>· 우측 탭 닫기</button>
          </li>
          <li>
            <button onClick={closeLeftTabs}>· 왼쪽 탭 닫기</button>
          </li>
          <li>
            <button onClick={closeCurrentTab}>· 현재 탭 닫기</button>
          </li>
        </ul>
      )}
    </div>
  );
};

export default HistoryBox;
