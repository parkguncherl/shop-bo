'use client';

import React, { useEffect, useState } from 'react';
import { Search, Table, Title } from '../../../../components';
import { ProductMngRequestProductInfoFilter, ProductMngResponseProductInfo } from '../../../../generated';
import { ColDef } from 'ag-grid-community';
import { TableHeader, toastError } from '../../../../components';
import { useCommonStore, useMenuStore } from '../../../../stores';
import { useQuery } from '@tanstack/react-query';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import { useAgGridApi } from '../../../../hooks';
import { authApi } from '../../../../libs';
import TunedGrid, { AddPagingOptions } from '../../../../components/grid/TunedGrid';
import useFilters from '../../../../hooks/useFilters';
import { useProductContentListStore } from '../../../../stores/product/useProductContentListStore';
import { useProductMngStore } from '../../../../stores/product/useProductMngStore';
import { Placeholder } from '../../../../libs/const';

/** 시스템 - 상품관리 페이지 */
const ProductMng = () => {
  /** Grid Api */
  const { onGridReady } = useAgGridApi();

  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);

  /** 상품관리 스토어 - State */
  const [modals, openModal, closeModal] = useProductMngStore((s) => [s.modals, s.openModal, s.closeModal]);

  /** 검색 필터 */
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters<ProductMngRequestProductInfoFilter>({
    prodNm: undefined,
  });

  /** local states */
  const [productInfoList, setproductInfoList] = useState<ProductMngResponseProductInfo[]>([]);

  /** 메뉴관리 페이징 목록 조회 */
  const {
    data: productInfos,
    isSuccess: isProductInfosSuccess,
    isLoading: isProductInfosLoading,
    refetch: productInfosRefetch,
  } = useQuery({
    queryKey: ['/productMng/productInfoList'],
    queryFn: () =>
      authApi.get('/productMng/productInfoList', {
        params: {
          ...filters,
        },
      }),
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (isProductInfosSuccess) {
      const { resultCode, body, resultMessage } = productInfos.data;
      if (resultCode === 200) {
        setproductInfoList(body || []);
      } else {
        toastError(resultMessage);
      }
    }
  }, [productInfos, isProductInfosSuccess]);

  /** 컬럼 설정 */
  const [columnDefs] = useState<ColDef<ProductMngResponseProductInfo>[]>([
    {
      field: 'no',
      headerName: 'NO',
      minWidth: 70,
      maxWidth: 80,
      valueGetter: (params) => (params.node ? (params.node.rowIndex ?? 0) + 1 : ''),
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    { field: 'prodNm', headerName: '상품명', minWidth: 150, maxWidth: 150, suppressHeaderMenuButton: true },
    { field: 'prodTpNm', headerName: '상품대분류', minWidth: 150, maxWidth: 150, suppressHeaderMenuButton: true },

    { field: 'prodDetTpNm', headerName: '상품소분류', minWidth: 150, maxWidth: 150, suppressHeaderMenuButton: true },

    { field: 'prodColors', headerName: '크기', minWidth: 150, maxWidth: 150, suppressHeaderMenuButton: true },

    { field: 'prodSizes', headerName: '색상', minWidth: 150, maxWidth: 150, suppressHeaderMenuButton: true },

    { field: 'composition', headerName: '혼용율', minWidth: 150, maxWidth: 150, suppressHeaderMenuButton: true },

    { field: 'makeYmd', headerName: '출시일', minWidth: 150, maxWidth: 150, suppressHeaderMenuButton: true },

    { field: 'orgAmt', headerName: '원가', minWidth: 150, maxWidth: 150, suppressHeaderMenuButton: true },

    { field: 'sellAmt', headerName: '판매가', minWidth: 150, maxWidth: 150, suppressHeaderMenuButton: true },

    { field: 'repFileIdCnt', headerName: '대표이미지', minWidth: 150, maxWidth: 150, suppressHeaderMenuButton: true },

    { field: 'detailFileIdCnt', headerName: '상세이미지', minWidth: 150, maxWidth: 150, suppressHeaderMenuButton: true },

    { field: 'sizeFileIdCnt', headerName: '사이즈이미지', minWidth: 150, maxWidth: 150, suppressHeaderMenuButton: true },

    { field: 'etcFileIdCnt', headerName: '기타이미지', minWidth: 150, maxWidth: 150, suppressHeaderMenuButton: true },
  ]);

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    await onSearch();
  };

  const onSearch = async () => {
    await productInfosRefetch();
  };

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} />
      <Search className="type_2">
        <Search.Input title={'미정'} name={'prodNm'} placeholder={Placeholder.Input} value={filters.prodNm} onChange={onChangeFilters} onEnter={onSearch} />
      </Search>
      <Table>
        <TableHeader count={0} search={search}></TableHeader>
        <div className="tblPreview">
          <div className="layoutBox">
            <div className={'layout60'}>
              <TunedGrid<ProductMngResponseProductInfo>
                headerHeight={35}
                onGridReady={onGridReady}
                loading={isProductInfosLoading}
                rowData={productInfoList}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                rowSelection={{
                  mode: 'singleRow',
                  enableClickSelection: false,
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
            </div>
            <div className={'layout40'}></div>
          </div>
        </div>
      </Table>
    </div>
  );
};

export default ProductMng;
