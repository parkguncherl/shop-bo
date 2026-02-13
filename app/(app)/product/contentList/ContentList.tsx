'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, Table, Title, toastSuccess } from '../../../../components';
import { ProductContentListRequestProductContentListFilter, ProductContentListResponseProductContent } from '../../../../generated';
import { ColDef } from 'ag-grid-community';
import { TableHeader, toastError } from '../../../../components';
import { useCommonStore } from '../../../../stores';
import { useQuery } from '@tanstack/react-query';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import { useAgGridApi } from '../../../../hooks';
import { authApi } from '../../../../libs';
import TunedGrid, { addPagingOptions, TunedGridRef } from '../../../../components/grid/TunedGrid';
import { useProductContentListStore } from '../../../../stores/product/useProductContentListStore';
import useFilters from '../../../../hooks/useFilters';
import useDebounce from '../../../../hooks/useDebounce';
import { AlertMessage, Placeholder, RegExpression } from '../../../../libs/const';

/** 상품관리 - 상품컨텐츠 목록 페이지 */
const ContentList = () => {
  /** Grid Api */
  const { onGridReady } = useAgGridApi();

  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);

  /** 코드관리 스토어 - State */
  const [paging, setPaging, modals, openModal] = useProductContentListStore((s) => [s.paging, s.setPaging, s.modals, s.openModal]);

  const gridRef = useRef<TunedGridRef<ProductContentListResponseProductContent>>(null);

  /** 컬럼 설정 - 권한 컬럼 포함 */
  const [columnDefs] = useState<ColDef<ProductContentListResponseProductContent | { no: number }>[]>([
    {
      field: 'no',
      headerName: 'NO',
      minWidth: 50,
      maxWidth: 50,
      valueGetter: (params) => (params.node ? (params.node.rowIndex ?? 0) + 1 : ''),
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    { field: 'newsTitle', headerName: '제목', minWidth: 60, maxWidth: 150, suppressHeaderMenuButton: true },
    { field: 'newsSubTitle', headerName: '하위 제목', minWidth: 60, maxWidth: 150, suppressHeaderMenuButton: true },
    {
      field: 'newsContents',
      headerName: '본문',
      minWidth: 150,
      maxWidth: 1300,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        // return (
        //   params.value
        //     // 이미지 토큰 제거
        //     .replace(/<<IMG\|[^>]+>>/g, '')
        //
        //     // 줄바꿈 기호 제거
        //     .replace(/\\n/g, '\n')
        //
        //     .trim()
        // );
        return params.value
          .replace(RegExpression.removeImgToken, '') // 이미지 토큰 제거
          .replace(RegExpression.removeCarriageReturn, '\n') // 줄바꿈 기호 제거
          .trim(); // 양 끝단 공백 제거
      },
    },
  ]);

  const [productContentList, setProductContentList] = useState<ProductContentListResponseProductContent[]>([]);
  const [lastProductContent, setLastProductContent] = useState<ProductContentListResponseProductContent | undefined>(undefined); // 다음 페이징 동작에서 사용할 마지막 행의 정보(last row's info)

  const [pagingOption] = useState<addPagingOptions | undefined>({
    pagingStrategy: 'add',
  });

  /** filters, lastInfo's filters*/
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters<ProductContentListRequestProductContentListFilter>({
    newsTitle: undefined,
  });
  const [lastInfos, onChangelastInfos, onlastInfosReset] = useFilters<ProductContentListRequestProductContentListFilter>({
    lastId: undefined,
  });

  /** 메뉴관리 페이징 목록 조회 */
  const {
    data: productContentListResponse,
    isSuccess: isProductContentListResponseSuccess,
    isLoading: isProductContentListResponseLoading,
    refetch: productContentListResponseRefetch,
  } = useQuery({
    queryKey: ['/productContentList/productContentListPaging', filters],
    queryFn: () =>
      authApi.get('/productContentList/productContentListPaging', {
        params: {
          ...filters,
          ...lastInfos,
        },
      }),
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (isProductContentListResponseSuccess) {
      const { resultCode, body, resultMessage } = productContentListResponse.data;
      if (resultCode === 200) {
        console.log(body.rows);
        const perPagesRowCnt = paging.pageRowCount as number;
        if (perPagesRowCnt) {
          setProductContentList((body.rows || []).slice(0, perPagesRowCnt));
          setLastProductContent((body.rows || [])[perPagesRowCnt]); // 51번째 요소
        } else {
          console.error('pageRowCount 를 찾을 수 없음');
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [productContentListResponse, isProductContentListResponseSuccess]);

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    await onSearch();
  };

  const onSearch = async () => {
    await productContentListResponseRefetch();
  };

  const debouncedFilters = useDebounce(filters.newsTitle + '☆' + paging.curPage, 500); // 0.5초 대기

  useEffect(() => {
    if (!pagingOption) return;
    const fetchData = async () => {
      if (paging.curPage === 1) {
        // 1. 그리드 상태 초기화 (Promise 반환 시 기다림)
        await gridRef.current?.initializePagingStatus();

        // 2. 필터 초기화
        // ※ 주의: 상태 업데이트는 비동기이므로, 초기화된 값을 refetch에 직접 넘기는 것이 안전합니다.
        onlastInfosReset();
        // 3. 데이터 조회
      }
    };

    fetchData().then(() => productContentListResponseRefetch());
  }, [debouncedFilters, pagingOption]);

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} />
      <Search className="type_2">
        <Search.Input title={'컨텐츠 제목'} name={'newsTitle'} placeholder={Placeholder.Input} value={filters.newsTitle} onChange={onChangeFilters} />
      </Search>
      <Table>
        <TableHeader count={((paging.curPage || 1) - 1) * (paging.pageRowCount || 0) + productContentList.length} search={search}></TableHeader>
        <TunedGrid<ProductContentListResponseProductContent>
          headerHeight={35}
          ref={gridRef}
          onGridReady={onGridReady}
          loading={isProductContentListResponseLoading}
          rowData={productContentList}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection={{
            mode: 'singleRow',
            enableClickSelection: false,
          }}
          pagingOptions={pagingOption}
          onTouchedByBottom={() => {
            if (pagingOption) {
              // 페이징 관련 동작 처리 영역
              if (lastProductContent != undefined) {
                onChangelastInfos('lastId', lastProductContent.id);
                setPaging({
                  ...paging,
                  curPage: paging.curPage ? paging.curPage + 1 : 1,
                });
              } else {
                if (paging.curPage != 1) {
                  toastSuccess(AlertMessage.LastDataHasBeenReached);
                }
              }
            }
            return {
              pausedMilliseconds: 1000,
            };
          }}
        />
        <div className="btnArea between">
          <div className="left">
            <button
              className={'btn '}
              onClick={() => {
                // todo
              }}
            >
              {'행추가'}
            </button>
            <button
              className={'btn '}
              onClick={() => {
                // todo
              }}
            >
              {'행삭제'}
            </button>
          </div>
          <div className="right">
            <button
              className={'btn btn_blue'}
              onClick={() => {
                // todo
              }}
            >
              {'저장'}
            </button>
          </div>
        </div>
      </Table>
    </div>
  );
};

export default ContentList;
