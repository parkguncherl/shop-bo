import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PopupFooter } from '../../PopupFooter';
import { PopupContent } from '../../PopupContent';
import { PopupLayout } from '../../PopupLayout';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../../../../libs';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { FileDet, PageObject, ProductContentListRequestProductInfoListFilter, ProductContentListResponseProductInfo } from '../../../../generated';
import TunedGrid, { AddPagingOptions, TunedGridRef } from '../../../grid/TunedGrid';
import { PopupSearchBox, PopupSearchType } from '../../content';
import CustomGridLoading from '../../../CustomGridLoading';
import CustomNoRowsOverlay from '../../../CustomNoRowsOverlay';
import { GridSetting } from '../../../../libs/ag-grid';
import { ColDef, SelectionChangedEvent } from 'ag-grid-community';
import useFilters from '../../../../hooks/useFilters';
import { Search } from '../../../content';
import { AlertMessage } from '../../../../libs/const';
import { Utils } from '../../../../libs/utils';
import ImgPreviewBox, { ImgPreviewFileDet } from '../../../content/ImgPreviewBox';
import { useCommonStore } from '../../../../stores';

interface ProductContentShowPopProps {
  open: boolean;
  onClose: () => void;
}

/**
 * components/popup/product/contentList/ProductAddPop.tsx
 * desc: 상품추가 팝업
 * Date: 2026/03/24
 * Author: park junsung
 * */
const ProductAddPop = ({ open, onClose }: ProductContentShowPopProps) => {
  /** 공통 스토어 - State */
  const [getFileUrl, getFileList] = useCommonStore((s) => [s.getFileUrl, s.getFileList]);

  /** 팝업 내부 local state */
  const [productInfoList, setProductInfoList] = useState<ProductContentListResponseProductInfo[]>([]);
  const [lastProductInfo, setLastProductInfo] = useState<ProductContentListResponseProductInfo | undefined>(undefined);

  const [pagingOption] = useState<AddPagingOptions | undefined>({
    pagingStrategy: 'add',
  });
  const [paging, setPaging] = useState<PageObject>({
    curPage: 1,
    pageRowCount: 50,
  });

  const [imgPreviewBoxOn, setImgPreviewBoxOn] = useState(false);
  const [resized, setResized] = useState(false);
  const [imgPreviewFileDetList, setImgPreviewFileDetList] = useState<ImgPreviewFileDet[]>([]);

  /** filters, lastInfo's filters*/
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters<ProductContentListRequestProductInfoListFilter>({
    prodNm: undefined,
  });

  const [lastInfos, onChangelastInfos, onlastInfosReset] = useFilters<ProductContentListRequestProductInfoListFilter>({
    lastId: undefined,
  });

  const RefForGrid = useRef<TunedGridRef<ProductContentListResponseProductInfo>>(null);

  /** 컬럼 설정 */
  const columnDefs = useMemo<ColDef<ProductContentListResponseProductInfo>[]>(
    () => [
      {
        field: 'no',
        headerName: 'NO',
        minWidth: 50,
        maxWidth: 50,
        valueGetter: (params) => (params.node ? (params.node.rowIndex ?? 0) + 1 : ''),
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'partnerNm',
        headerName: '매장',
        minWidth: 160,
        maxWidth: 200,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.LEFT,
      },
      {
        field: 'prodTpNm',
        headerName: '구분',
        minWidth: 70,
        maxWidth: 90,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.LEFT,
      },
      {
        field: 'prodNm',
        headerName: '상품명',
        minWidth: 160,
        maxWidth: 200,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.LEFT,
      },
      {
        field: 'productDetColor',
        headerName: '컬러',
        minWidth: 80,
        maxWidth: 100,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.LEFT,
      },
      {
        field: 'productDetSize',
        headerName: '사이즈',
        minWidth: 80,
        maxWidth: 100,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.LEFT,
      },
      {
        field: 'sellAmt',
        headerName: '가격',
        minWidth: 120,
        maxWidth: 160,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => Utils.setComma(params.value),
      },
    ],
    [],
  );

  /** 상품상세정보 목록 조회 */
  const {
    data: productDetInfos,
    isSuccess: isProductDetInfosSuccess,
    isLoading: isProductDetInfosLoading,
    refetch: productDetInfosRefetch,
  } = useQuery({
    queryKey: ['/productContentList/productInfoListPaging'],
    queryFn: () =>
      authApi.get('/productContentList/productInfoListPaging', {
        params: {
          //curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filters,
          ...lastInfos,
        },
      }),
    refetchOnMount: 'always',
    enabled: open,
  });

  useEffect(() => {
    if (isProductDetInfosSuccess) {
      const { resultCode, body, resultMessage } = productDetInfos.data;
      if (resultCode === 200) {
        const perPagesRowCnt = paging.pageRowCount as number;
        if (perPagesRowCnt) {
          setProductInfoList((body.rows || []).slice(0, perPagesRowCnt));
          setLastProductInfo((body.rows || [])[perPagesRowCnt]);
        } else {
          console.error('pageRowCount 를 찾을 수 없음');
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [productDetInfos, isProductDetInfosSuccess]);

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    await onSearch();
  };

  const onSearch = async () => {
    await productDetInfosRefetch();
  };

  return (
    <div className="imgPopBox">
      <PopupLayout
        width={780}
        open={open}
        isEscClose={true}
        title={'신규 상품추가'}
        onClose={onClose}
        footer={
          <PopupFooter>
            <div className="btnArea between">
              <div className="left"></div>
              <div className="right">
                <button className="btn" onClick={onClose}>
                  닫기
                </button>
              </div>
            </div>
          </PopupFooter>
        }
      >
        <PopupContent>
          <PopupSearchBox>
            <PopupSearchType className={'type_2'}>
              <Search.Input
                title={'상품명'}
                name={'prodNm'}
                placeholder={'키워드 입력 후 엔터키 클릭'}
                value={filters.prodNm}
                onEnter={search}
                onChange={onChangeFilters}
                filters={filters}
              />
            </PopupSearchType>
          </PopupSearchBox>
          <div className="mt10">
            <TunedGrid<ProductContentListResponseProductInfo>
              columnDefs={columnDefs}
              rowData={productInfoList}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              ref={RefForGrid}
              loading={isProductDetInfosLoading}
              rowSelection={{
                mode: 'singleRow',
                enableClickSelection: true,
              }}
              // onSelectionChanged={(event) => {
              //   const selectedRows = event.api.getSelectedRows();
              //   setSelectedRowsData(selectedRows.length > 0 ? selectedRows[0] : undefined);
              // }}
              pagingOptions={pagingOption}
              pagingDeps={[filters]}
              onTouchedByBottom={() => {
                if (pagingOption) {
                  // 페이징 관련 동작 처리 영역
                  if (lastProductInfo != undefined) {
                    onChangelastInfos('lastId', lastProductInfo.id);
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
              onInitializePaging={() => {
                setPaging({
                  curPage: 1,
                  pageRowCount: 50,
                });
                onlastInfosReset();
              }}
            />
          </div>
          <ImgPreviewBox open={imgPreviewBoxOn} resized={resized} onReSizeReq={() => setResized(!resized)} fileDetList={imgPreviewFileDetList} />
        </PopupContent>
      </PopupLayout>
    </div>
  );
};

export default ProductAddPop;
