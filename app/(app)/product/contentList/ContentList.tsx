'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, Table, Title, toastSuccess } from '../../../../components';
import { ProductContentListRequestProductContentListFilter, ProductContentListResponseProductContent } from '../../../../generated';
import { ColDef } from 'ag-grid-community';
import { TableHeader, toastError } from '../../../../components';
import { useCommonStore } from '../../../../stores';
import { useMutation, useQuery } from '@tanstack/react-query';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import { useAgGridApi } from '../../../../hooks';
import { authApi } from '../../../../libs';
import TunedGrid, { addPagingOptions, TunedGridRef } from '../../../../components/grid/TunedGrid';
import { useProductContentListStore } from '../../../../stores/product/useProductContentListStore';
import useFilters from '../../../../hooks/useFilters';
import useDebounce from '../../../../hooks/useDebounce';
import { AlertMessage, Placeholder, RegExpression } from '../../../../libs/const';
import ProductContentShowPop from '../../../../components/popup/product/contentList/ProductContentShowPop';
import ProductContentAddPop from '../../../../components/popup/product/contentList/ProductContentAddPop';
import { ConfirmModal } from '../../../../components/ConfirmModal';

/** 상품관리 - 상품컨텐츠 목록 페이지 */
const ContentList = () => {
  /** Grid Api */
  const { onGridReady } = useAgGridApi();

  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);

  /** 코드관리 스토어 - State */
  const [paging, setPaging, modals, openModal, closeModal, deleteProductContents] = useProductContentListStore((s) => [
    s.paging,
    s.setPaging,
    s.modals,
    s.openModal,
    s.closeModal,
    s.deleteProductContents,
  ]);

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
        return params.value
          .replace(RegExpression.ProductContent.imgToken, '') // 이미지 토큰 제거
          .replace(RegExpression.ProductContent.carriageReturn, '\n') // 줄바꿈 기호 제거
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

  // lastInfos, paging.curPage 디바운스 처리하여 그리드 내부 페이징 상태 초기화 시 실행 순서를 보장토록 함
  const debouncedCurPage = useDebounce(paging.curPage?.toString() || '', 500); // 0.5초 대기 todo 디바운싱 상태가 원하는 경우에 업데이트되는지 확인하며 페이징 동작 손보기
  //  // const debouncedFilters = useDebounce(filters.newsTitle + '☆' + paging.curPage, 500); // 0.5초 대기

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    await onSearch();
  };

  const onSearch = async () => {
    await productContentListResponseRefetch();
  };

  /** 초기 페이징 상태로 복귀 */
  const revertToInitPageStatus = async () => {
    // Promise 반환 영역 우선
    await gridRef.current?.customs.api.initializePagingStatus();

    setPaging({
      ...paging,
      curPage: 1,
    });
    onlastInfosReset();
  };

  const { mutate: deleteProductContentsMutate } = useMutation(deleteProductContents, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('컨텐츠가 정상 삭제되었습니다.');
          closeModal('DEL_CONF');
          revertToInitPageStatus();
        } else {
          toastError(`컨텐츠 삭제 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  useEffect(() => {
    // spa 수준에서 페이지 이동 시(해당 csc 관점에서 최초 랜더링) 필요한 동작
    return () => {
      // 언마운트 시 paging 전역 상태 초기화하여 추후 재방문 시 상태 오염으로 인한 오동작 방지, 페이징 관련 초기화 동작도 수행
      setPaging({
        ...paging,
        curPage: 1,
      });
      onChangelastInfos('lastId', undefined);
    };
  }, []);

  // useEffect(() => {
  //   if (!pagingOption) return;
  //   const fetchData = async () => {
  //     if (paging.curPage === 1) {
  //       // 본 시점에 초기화 동작 수행
  //
  //       // 1. 그리드 상태 초기화 (Promise 반환 시 기다림)
  //       await gridRef.current?.customs.api.initializePagingStatus();
  //
  //       // 2. 필터 초기화
  //       onlastInfosReset();
  //     }
  //   };
  //
  //   //fetchData();
  // }, [paging.curPage]);

  /** 상품컨텐츠 페이징 목록 조회 */
  const {
    data: productContentListResponse,
    isSuccess: isProductContentListResponseSuccess,
    isLoading: isProductContentListResponseLoading,
    refetch: productContentListResponseRefetch,
  } = useQuery({
    queryKey: ['/productContentList/productContentListPaging', filters, debouncedCurPage],
    queryFn: () =>
      authApi.get('/productContentList/productContentListPaging', {
        params: {
          //curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
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
        const perPagesRowCnt = paging.pageRowCount as number;
        if (perPagesRowCnt) {
          console.log('body.rows: ', body.rows);
          setProductContentList((body.rows || []).slice(0, perPagesRowCnt));
          setLastProductContent((body.rows || [])[perPagesRowCnt]);
        } else {
          console.error('pageRowCount 를 찾을 수 없음');
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [productContentListResponse, isProductContentListResponseSuccess]);

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
            enableClickSelection: true,
          }}
          onRowDoubleClicked={(e) => openModal('SHOW', e.data)}
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
                openModal('ADD');
              }}
            >
              {'행추가'}
            </button>
            <button
              className={'btn '}
              onClick={() => {
                const selectedRows = gridRef.current?.api.getSelectedRows();
                if (selectedRows && selectedRows.length > 0) {
                  openModal('DEL_CONF', selectedRows[0]);
                } else {
                  toastError('하나의 행을 선택한 후 재시도하십시요.');
                }
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
      <ProductContentAddPop
        open={modals.type == 'ADD' && modals.active}
        onClose={(closeRes) => {
          if (closeRes == 'success') {
            productContentListResponseRefetch();
          }

          closeModal('ADD');
        }}
      />
      <ProductContentShowPop open={modals.type == 'SHOW' && modals.active} productContentData={modals.stored_temporary} onClose={() => closeModal('SHOW')} />
      <ConfirmModal
        open={modals.type == 'DEL_CONF' && modals.active}
        title={`'${(modals.stored_temporary as ProductContentListResponseProductContent | undefined)?.newsTitle}' 컨텐츠를 삭제 하시겠습니까?`}
        confirmText={'삭제'}
        onConfirm={() => {
          deleteProductContentsMutate(modals.stored_temporary as ProductContentListResponseProductContent);
        }}
        onClose={() => {
          closeModal('DEL_CONF');
        }}
      />
    </div>
  );
};

export default ContentList;
