'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, Table, Title, toastSuccess } from '../../../../components';
import { ColDef, RowDragEndEvent, SelectionChangedEvent } from 'ag-grid-community';
import { TableHeader, toastError } from '../../../../components';
import { useCommonStore } from '../../../../stores';
import { useMutation, useQuery } from '@tanstack/react-query';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import { useAgGridApi } from '../../../../hooks';
import { authApi } from '../../../../libs';
import TunedGrid, { TunedGridRef } from '../../../../components/grid/TunedGrid';
import { useProductContentListStore } from '../../../../stores/product/useProductContentListStore';
import useFilters from '../../../../hooks/useFilters';
import useDebounce from '../../../../hooks/useDebounce';
import { Placeholder } from '../../../../libs/const';
import { ConfirmModal } from '../../../../components/ConfirmModal';
import ProductAddPop from '../../../../components/popup/product/contentList/ProductAddPop';
import { CustomSwitch } from '../../../../components/CustomSwitch';
import ImgPreviewBox, { ImgPreviewFileDet } from '../../../../components/content/ImgPreviewBox';
import ProductContentPop from '../../../../components/popup/product/contentList/ProductContentPop';
import ProductContentPreviewPop from '../../../../components/popup/product/contentList/ProductContentPreviewPop';
import {
  FileDet,
  ProductContentListRequestContentsProductInfoListFilter,
  ProductContentListRequestProductContentListFilter,
  ProductContentListResponseContentProductInfo,
  ProductContentListResponseProductContent,
} from '../../../../generated';

/** 상품관리 - 상품컨텐츠 목록 페이지 */
const ContentList = () => {
  /** Grid Api */
  const { onGridReady } = useAgGridApi();

  /** 공통 스토어 - State */
  const [upMenuNm, menuNm, getFileUrl, getFileList] = useCommonStore((s) => [s.upMenuNm, s.menuNm, s.getFileUrl, s.getFileList]);

  /** 코드관리 스토어 - State */
  const [paging, setPaging, modals, openModal, closeModal, deleteProductContents, updateContentsProductSeq] = useProductContentListStore((s) => [
    s.paging,
    s.setPaging,
    s.modals,
    s.openModal,
    s.closeModal,
    s.deleteProductContents,
    s.updateContentsProductSeq,
  ]);

  const gridRef = useRef<TunedGridRef<ProductContentListResponseProductContent>>(null);
  const rightGridRef = useRef<TunedGridRef<ProductContentListResponseProductContent>>(null);

  /** 컬럼 설정 - 권한 컬럼 포함 */
  const [columnDefs] = useState<ColDef<ProductContentListResponseProductContent | { no: number }>[]>([
    {
      field: 'no',
      headerName: 'NO',
      minWidth: 37,
      maxWidth: 37,
      valueGetter: (params) => (params.node ? (params.node.rowIndex ?? 0) + 1 : ''),
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    { field: 'newsTitle', headerName: '제목', minWidth: 200, maxWidth: 250, suppressHeaderMenuButton: true },
    { field: 'newsSubTitle', headerName: '하위 제목', minWidth: 100, maxWidth: 200, suppressHeaderMenuButton: true },
    {
      field: 'imageCnt',
      headerName: '이미지 건수',
      minWidth: 80,
      maxWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'productCnt',
      headerName: '연결상품',
      minWidth: 80,
      maxWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
  ]);

  /** 컬럼 설정 - 권한 컬럼 포함 */
  const [rightColumnDefs] = useState<ColDef<ProductContentListResponseContentProductInfo | { no: number }>[]>([
    {
      field: 'no',
      headerName: 'NO',
      minWidth: 50,
      maxWidth: 50,
      valueGetter: (params) => (params.node ? (params.node.rowIndex ?? 0) + 1 : ''),
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    { field: 'prodNm', headerName: '상품명', minWidth: 130, maxWidth: 200, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.LEFT },
    {
      field: 'prodTpNm',
      headerName: '분류',
      minWidth: 120,
      maxWidth: 120,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'prodDetTpNm',
      headerName: '소분류',
      minWidth: 120,
      maxWidth: 120,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'prodColors',
      headerName: '칼라',
      minWidth: 120,
      maxWidth: 120,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.LEFT,
    },
    {
      field: 'prodSizes',
      headerName: '사이즈',
      minWidth: 120,
      maxWidth: 120,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.LEFT,
    },
    {
      field: 'sellAmt',
      headerName: '판매가',
      minWidth: 160,
      maxWidth: 160,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      cellRenderer: 'NUMBER_COMMA',
    },
    {
      field: 'discountRate',
      headerName: '할인율',
      minWidth: 80,
      maxWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.RIGHT,
    },
  ]);

  const [productContentList, setProductContentList] = useState<ProductContentListResponseProductContent[]>([]);
  const [lastProductContent, setLastProductContent] = useState<ProductContentListResponseProductContent | undefined>(undefined); // 다음 페이징 동작에서 사용할 마지막 행의 정보(last row's info)

  const [contentsProductInfoList, setContentsProductInfoList] = useState<ProductContentListResponseContentProductInfo[]>([]);

  const [selectedRowsData, setSelectedRowsData] = useState<ProductContentListResponseProductContent | undefined>(undefined);

  const [imgPreviewBoxOn, setImgPreviewBoxOn] = useState(false);
  const [resized, setResized] = useState(false);
  const [imgPreviewFileDetList, setImgPreviewFileDetList] = useState<ImgPreviewFileDet[]>([]);

  /** filters, lastInfo's filters*/
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters<ProductContentListRequestProductContentListFilter>({
    newsTitle: undefined,
  });

  /** filters, lastInfo's filters*/
  const [filtersForContentsProduct, onChangeFiltersForContentsProduct, onFiltersForContentsProductReset] =
    useFilters<ProductContentListRequestContentsProductInfoListFilter>({
      contentsId: undefined,
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

  /** row선택 이벤트 (이미지) */
  const onSelectionChangedByRigSideGrid = (e: SelectionChangedEvent) => {
    const selectedRows: ProductContentListResponseContentProductInfo[] = e.api.getSelectedRows();
    if (selectedRows.length > 0) {
      const selectedRow = selectedRows[0];
      if (selectedRow.repFileId) {
        getFileList(selectedRow.repFileId).then(async (result) => {
          const { resultCode, body, resultMessage } = result.data;
          if (resultCode == 200) {
            // 각 파일의 URL
            if (body != undefined) {
              const fileDetList: ImgPreviewFileDet[] = [];
              await Promise.all(
                (body as FileDet[]).map(async (file: FileDet) => {
                  if (file.sysFileNm == undefined) {
                    return;
                  }
                  fileDetList.push({ ...file, url: await getFileUrl(file.sysFileNm) });
                }),
              );
              setImgPreviewFileDetList(fileDetList);
            }
          } else {
            toastError(`이미지 정보 조회 도중 문제가 발생하였습니다: ${resultMessage}`);
          }
        });
      } else {
        setImgPreviewFileDetList([]); // 초기화
      }
    }
  };

  // const onRowDragMoveHandler = (event: RowDragMoveEvent<ProductContentListResponseContentProductInfo>) => {
  //   const movingNode = event.node;
  //   const overNode = event.overNode;
  //
  //   if (movingNode.id && overNode?.id && movingNode.id != overNode?.id) {
  //     // 유의미한 드래깅이 발생한 경우
  //     const movingData = movingNode.data;
  //     const overData = overNode?.data;
  //
  //     console.log('movingData, overData: ', movingData?.prodNm, overData?.prodNm);
  //
  //     if (movingData && overData) {
  //       const fromIndex = contentsProductInfoList.indexOf(movingData);
  //       const toIndex = contentsProductInfoList.indexOf(overData);
  //
  //       console.log('moveInArray(contentsProductInfoList, fromIndex, toIndex): ', moveInArray(contentsProductInfoList, fromIndex, toIndex));
  //       function moveInArray(prevArr: any[], fromIndex: number, toIndex: number) {
  //         const element = prevArr[fromIndex];
  //         prevArr.splice(fromIndex, 1);
  //         prevArr.splice(toIndex, 0, element);
  //
  //         return prevArr;
  //       }
  //     }
  //   }
  // };

  const { mutate: deleteProductContentsMutate } = useMutation({
    mutationFn: deleteProductContents,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('컨텐츠가 정상 삭제되었습니다.');
          productContentListResponseRefetch();
          closeModal('DEL_CONF');
        } else {
          toastError(`컨텐츠 삭제 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

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

  /** 상품컨텐츠 페이징 목록 조회 */
  const {
    data: contentsProductInfoListResponse,
    isSuccess: isContentsProductInfoListResponseSuccess,
    // isLoading: isContentsProductInfoListResponseLoading,
    refetch: contentsProductInfoListRefetch,
  } = useQuery({
    queryKey: ['/productContentList/contentsProductInfoList', filtersForContentsProduct.contentsId],
    queryFn: () =>
      authApi.get('/productContentList/contentsProductInfoList', {
        params: {
          ...filtersForContentsProduct,
        },
      }),
    enabled: filtersForContentsProduct.contentsId != undefined,
  });

  useEffect(() => {
    if (isContentsProductInfoListResponseSuccess) {
      const { resultCode, body, resultMessage } = contentsProductInfoListResponse.data;
      if (resultCode === 200) {
        setContentsProductInfoList(body || []);
      } else {
        toastError(resultMessage);
      }
    }
  }, [contentsProductInfoListResponse, isContentsProductInfoListResponseSuccess]);

  return (
    <div>
      <div className="layoutBox">
        <div className={'layout40'}>
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
              onRowDoubleClicked={(e) => openModal('SHOW', e.data)}
              onSelectionChanged={(event) => {
                const selectedRows = event.api.getSelectedRows();
                setSelectedRowsData(selectedRows.length > 0 ? selectedRows[0] : undefined);
                onChangeFiltersForContentsProduct('contentsId', selectedRows.length > 0 ? selectedRows[0].id : undefined);
              }}
              pagingDeps={[filters]}
              className={'default check'}
            />
            <div className="btnArea between">
              <div className="left">
                <button
                  className={'btn btnPurple'}
                  onClick={() => {
                    openModal('ADD');
                  }}
                >
                  {'신규'}
                </button>
                <button
                  className={selectedRowsData == undefined ? 'btn' : 'btn btnPurple'}
                  disabled={selectedRowsData == undefined}
                  onClick={() => {
                    openModal('MOD', selectedRowsData);
                  }}
                >
                  {'수정'}
                </button>
                <button
                  className={'btn btnPurple'}
                  onClick={() => {
                    const selectedRows = gridRef.current?.api.getSelectedRows();
                    if (selectedRows && selectedRows.length > 0) {
                      openModal('DEL_CONF', selectedRows[0]);
                    } else {
                      toastError('하나의 행을 선택한 후 재시도하십시요.');
                    }
                  }}
                >
                  {'삭제'}
                </button>
                <button
                  className={selectedRowsData == undefined ? 'btn' : 'btn btnPurple'}
                  disabled={selectedRowsData == undefined}
                  onClick={() => openModal('PREVIEW', selectedRowsData)}
                >
                  {'미리보기'}
                </button>
              </div>
              <div className="right">
                <button
                  className={'btn btnPurple'}
                  onClick={() => {
                    if (selectedRowsData) {
                      openModal('ADD_PROD');
                    } else {
                      toastError('상품을 추가할 본 컨텐츠 선택 후 다시 시도하십시요.');
                    }
                  }}
                >
                  {'상품추가'}
                </button>
              </div>
            </div>
          </Table>
        </div>
        <div className={'layout60'}>
          <Title title={'연결품목목록'} detail={true} />
          <Search className="type_2">
            <CustomSwitch
              title={'이미지보기'}
              name={'imgShow'}
              checkedLabel={'켜기'}
              uncheckedLabel={'끄기'}
              onChange={(e, value) => {
                setImgPreviewBoxOn(value);
              }}
            />
          </Search>
          <Table>
            <TableHeader count={contentsProductInfoList.length} search={search}></TableHeader>
            <TunedGrid<ProductContentListResponseContentProductInfo>
              headerHeight={35}
              ref={rightGridRef}
              onGridReady={onGridReady}
              rowData={contentsProductInfoList}
              columnDefs={rightColumnDefs}
              defaultColDef={defaultColDef}
              rowSelection={{
                mode: 'singleRow',
                enableClickSelection: true,
              }}
              onSelectionChanged={onSelectionChangedByRigSideGrid}
              className={'default check'}
            />
            <div className="btnArea between">
              <div className="left"></div>
              <div className="right">
                <button
                  className={'btn btnPurple'}
                  onClick={() => {
                    // todo
                  }}
                >
                  {'연결끊기'}
                </button>
              </div>
            </div>
            <ImgPreviewBox open={imgPreviewBoxOn} resized={resized} onReSizeReq={() => setResized(!resized)} fileDetList={imgPreviewFileDetList} />
          </Table>
        </div>
      </div>
      {/*<ProductContentAddPop*/}
      {/*  open={modals.type == 'ADD' && modals.active}*/}
      {/*  onClose={(closeRes) => {*/}
      {/*    if (closeRes == 'success') {*/}
      {/*      productContentListResponseRefetch();*/}
      {/*    }*/}

      {/*    closeModal('ADD');*/}
      {/*  }}*/}
      {/*/>*/}
      {/*<ProductContentShowPop open={modals.type == 'SHOW' && modals.active} productContentData={modals.stored_temporary} onClose={() => closeModal('SHOW')} />*/}
      <ProductContentPop
        open={(modals.type == 'ADD' || modals.type == 'MOD' || modals.type == 'SHOW') && modals.active}
        mode={modals.type as 'SHOW' | 'ADD' | 'MOD' | undefined}
        productContentData={modals.stored_temporary}
        onClose={() => closeModal(modals.type)}
        onSuccess={() => {
          closeModal(modals.type);
          productContentListResponseRefetch();
          contentsProductInfoListRefetch();
        }}
      />
      <ProductAddPop
        open={modals.type == 'ADD_PROD' && modals.active}
        onClose={() => closeModal('ADD_PROD')}
        selectedContent={selectedRowsData}
        onSuccess={() => {
          closeModal('ADD_PROD');
          contentsProductInfoListRefetch();
        }}
      />
      <ProductContentPreviewPop
        open={modals.type == 'PREVIEW' && modals.active}
        productContentData={modals.stored_temporary}
        onClose={() => closeModal('PREVIEW')}
      />
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
