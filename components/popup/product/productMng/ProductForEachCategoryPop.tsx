import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PopupFooter } from '../../PopupFooter';
import { PopupContent } from '../../PopupContent';
import { PopupLayout } from '../../PopupLayout';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../../libs';
import { toastError, toastSuccess } from '../../../ToastMessage';
import {
  PartnerCodeResponseLowerSelect,
  ProductMngRequestCategoryProductInfoFilter,
  ProductMngRequestProductInfoFilter,
  ProductMngResponseCategoryProductInfo,
  ProductMngResponseProductDetInfo,
  ProductMngResponseProductInfo,
} from '../../../../generated';
import TunedGrid, { TunedGridRef } from '../../../grid/TunedGrid';
import { PopupSearchBox, PopupSearchType } from '../../content';
import CustomGridLoading from '../../../CustomGridLoading';
import CustomNoRowsOverlay from '../../../CustomNoRowsOverlay';
import { GridSetting } from '../../../../libs/ag-grid';
import { ColDef } from 'ag-grid-community';
import useFilters from '../../../../hooks/useFilters';
import { Search } from '../../../content';
import { PARTNER_CODE } from '../../../../libs/const';
import { usePartnerCodeStore } from '../../../../stores/usePartnerCodeStore';

interface ProductContentShowPopProps {
  open: boolean;
  onClose: () => void;
}

/**
 * components/popup/product/productMng/ProductForEachCategoryPop.tsx
 * desc: 카테고리별 상품 팝업
 * Date: 2026/03/30
 * Author: park junsung
 * */
const ProductForEachCategoryPop = ({ open, onClose }: ProductContentShowPopProps) => {
  /** 공통 스토어 - State */
  //const [updateProductDet, deleteProductDet, insertProductDet] = useProductMngStore((s) => [s.updateProductDet, s.deleteProductDet, s.insertProductDet]);
  const { selectLowerPartnerCodeByCodeUpper } = usePartnerCodeStore();

  /** 팝업 내부 local state */
  const [productInfoListByCategory, setProductInfoListByCategory] = useState<ProductMngResponseCategoryProductInfo[]>([]);
  const [productInfoList, setProductInfoList] = useState<ProductMngResponseProductInfo[]>([]);

  // 각각 좌, 우측 선택된 행의 상태
  const [selectedProductInfoByCategory, setSelectedProductInfoByCategory] = useState<ProductMngResponseCategoryProductInfo | undefined>(undefined);
  const [selectedProductInfo, setSelectedProductInfo] = useState<ProductMngResponseProductInfo | undefined>(undefined);

  const [lowerPartnerCodeList, setLowerPartnerCodeList] = useState<PartnerCodeResponseLowerSelect[]>([]);

  /** 참조(ref) */
  const RefForLeftGrid = useRef<TunedGridRef<ProductMngResponseCategoryProductInfo>>(null);
  const RefForRightGrid = useRef<TunedGridRef<ProductMngResponseProductInfo>>(null);

  /** 검색 필터 */
  const [filtersForProdInfoByCategory, onChangeFiltersForProdInfoByCategory] = useFilters<ProductMngRequestCategoryProductInfoFilter>({
    categoryId: undefined,
  });
  const [filtersForProdInfoList, onChangeFiltersForProdInfoList] = useFilters<ProductMngRequestProductInfoFilter>({
    prodNm: undefined,
  });

  /** 컬럼 설정 */
  const columnDefsOnLeft = useMemo<ColDef<ProductMngResponseCategoryProductInfo>[]>(
    () => [
      {
        field: 'no',
        headerName: 'NO',
        minWidth: 40,
        maxWidth: 60,
        valueGetter: (params) => (params.node ? (params.node.rowIndex ?? 0) + 1 : ''),
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'prodNm',
        headerName: '상품명',
        minWidth: 80,
        maxWidth: 100,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'prodSizes',
        headerName: '크기',
        minWidth: 120,
        maxWidth: 140,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'prodColors',
        headerName: '색상',
        minWidth: 140,
        maxWidth: 160,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
    ],
    [],
  );

  const columnDefsOnRight = useMemo<ColDef<ProductMngResponseProductInfo>[]>(
    () => [
      {
        field: 'no',
        headerName: 'NO',
        minWidth: 40,
        maxWidth: 60,
        valueGetter: (params) => (params.node ? (params.node.rowIndex ?? 0) + 1 : ''),
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'prodNm',
        headerName: '상품명',
        minWidth: 80,
        maxWidth: 100,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'prodSizes',
        headerName: '크기',
        minWidth: 120,
        maxWidth: 140,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'prodColors',
        headerName: '색상',
        minWidth: 140,
        maxWidth: 160,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
    ],
    [],
  );

  /** 하위코드 목록 조회 */
  const {
    data: categories,
    isSuccess: isCategoriesSuccess,
    refetch: categoriesRefetch,
  } = useQuery({
    queryFn: () => selectLowerPartnerCodeByCodeUpper(PARTNER_CODE.categories.code),
    enabled: true,
  });

  useEffect(() => {
    if (isCategoriesSuccess) {
      const { resultCode, body, resultMessage } = categories.data;
      if (resultCode == 200) {
        setLowerPartnerCodeList(body || []);
      } else {
        toastError(resultMessage);
      }
    }
  }, [categories, isCategoriesSuccess]);

  /** 카테고리 연결상품정보 목록 조회 */
  const {
    data: productInfosByCategory,
    isSuccess: isProductInfosByCategorySuccess,
    isLoading: isProductInfosByCategoryLoading,
    refetch: productInfosByCategoryRefetch,
  } = useQuery({
    queryKey: ['/productMng/categoryProductInfoList', filtersForProdInfoByCategory.categoryId],
    queryFn: () =>
      authApi.get('/productMng/categoryProductInfoList', {
        params: {
          ...filtersForProdInfoByCategory,
        },
      }),
    refetchOnMount: 'always',
    enabled: open,
  });

  useEffect(() => {
    if (isProductInfosByCategorySuccess) {
      const { resultCode, body, resultMessage } = productInfosByCategory.data;
      if (resultCode === 200) {
        setProductInfoListByCategory(body || []);
      } else {
        toastError(resultMessage);
      }
    }
  }, [productInfosByCategory, isProductInfosByCategorySuccess]);

  /** 전체상품정보 */
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
          ...filtersForProdInfoList,
        },
      }),
    refetchOnMount: 'always',
    enabled: open,
  });

  useEffect(() => {
    if (isProductInfosSuccess) {
      const { resultCode, body, resultMessage } = productInfos.data;
      if (resultCode === 200) {
        setProductInfoList(body || []);
      } else {
        toastError(resultMessage);
      }
    }
  }, [productInfos, isProductInfosSuccess]);

  const commonOnCloseCallback = () => {
    if (onClose) onClose();
  };

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    await onSearch();
  };

  const onSearch = () => {
    productInfosByCategoryRefetch();
    productInfosRefetch();
  };

  return (
    <div className="imgPopBox">
      <PopupLayout
        width={900}
        open={open}
        isEscClose={true}
        title={'키테고리별 상품'}
        onClose={commonOnCloseCallback}
        footer={
          <PopupFooter>
            <div className="btnArea between">
              <div className="left">
                <button
                  className={`btn ${selectedProductInfoByCategory != undefined && filtersForProdInfoByCategory.categoryId && 'btn_blue'}`}
                  disabled={selectedProductInfoByCategory == undefined || filtersForProdInfoByCategory.categoryId == undefined}
                  onClick={() => {
                    //openModal('PROD_DET_INFO');
                  }}
                >
                  {`${
                    selectedProductInfoByCategory != undefined && filtersForProdInfoByCategory.categoryId
                      ? (lowerPartnerCodeList.filter((lowerPartnerCode) => lowerPartnerCode.id == filtersForProdInfoByCategory.categoryId)[0]?.codeNm ||
                          '알수 없는 카테고리') +
                        ' 에 해당하는 ' +
                        selectedProductInfoByCategory.prodNm?.slice(0, 7) +
                        ((selectedProductInfoByCategory.prodNm || '').length > 7 ? '..' : '') +
                        ' 을 삭제'
                      : filtersForProdInfoByCategory.categoryId
                      ? (
                          lowerPartnerCodeList.filter((lowerPartnerCode) => lowerPartnerCode.id == filtersForProdInfoByCategory.categoryId)[0]?.codeNm ||
                          '알수 없음'
                        ).slice(0, 5) +
                        ((
                          lowerPartnerCodeList.filter((lowerPartnerCode) => lowerPartnerCode.id == filtersForProdInfoByCategory.categoryId)[0]?.codeNm ||
                          '알수 없는 카테고리'
                        ).length > 5
                          ? '..'
                          : '') +
                        ' 내에서 삭제할 상품 선택'
                      : '카테고리 선택'
                  }`}
                </button>
                <button
                  className={`btn ${selectedProductInfo != undefined && filtersForProdInfoByCategory.categoryId != undefined && 'btn_blue'}`}
                  disabled={selectedProductInfo == undefined || filtersForProdInfoByCategory.categoryId == undefined}
                  onClick={() => {
                    //openModal('PROD_DET_INFO');
                  }}
                >
                  {`${
                    selectedProductInfo != undefined && filtersForProdInfoByCategory.categoryId != undefined
                      ? selectedProductInfo.prodNm?.slice(0, 7) +
                        ((selectedProductInfo.prodNm || '').length > 7 ? '..' : '') +
                        '을(를)' +
                        (lowerPartnerCodeList.filter((lowerPartnerCode) => lowerPartnerCode.id == filtersForProdInfoByCategory.categoryId)[0]?.codeNm ||
                          '알수 없는 카테고리') +
                        ' 의 상품으로 추가 '
                      : '카테고리 추가'
                  }`}
                </button>
              </div>
              <div className="right">
                <button className="btn" onClick={commonOnCloseCallback}>
                  닫기
                </button>
              </div>
            </div>
          </PopupFooter>
        }
      >
        <PopupContent>
          <PopupSearchBox>
            <PopupSearchType className={'type_1'}>
              <Search.DropDown
                title={'카테고리'}
                name={'categoryId'}
                defaultOptions={lowerPartnerCodeList.map((lowerPartnerCode, index) => {
                  return {
                    key: index,
                    label: lowerPartnerCode.codeNm,
                    value: lowerPartnerCode.id, // 카테고리 연결상품 조회에서는 categoryId 를 사용하므로 이와 같이 할당한다.
                  };
                })}
                value={filtersForProdInfoByCategory.categoryId}
                onChange={onChangeFiltersForProdInfoByCategory}
                dropDownStyle={{ width: '280px' }}
              />
              <Search.Input
                title={'상품명'}
                name={'prodNm'}
                placeholder={'키워드 입력 후 엔터키 클릭'}
                value={filtersForProdInfoList.prodNm}
                onEnter={search}
                onChange={onChangeFiltersForProdInfoList}
                filters={filtersForProdInfoList}
              />
            </PopupSearchType>
          </PopupSearchBox>
          <div className="mt10">
            <div className="layoutBox">
              <div className={'layout50'}>
                <TunedGrid<ProductMngResponseProductDetInfo>
                  columnDefs={columnDefsOnLeft}
                  rowData={productInfoListByCategory}
                  loadingOverlayComponent={CustomGridLoading}
                  noRowsOverlayComponent={CustomNoRowsOverlay}
                  ref={RefForLeftGrid}
                  loading={isProductInfosByCategoryLoading}
                  rowSelection={{
                    mode: 'singleRow',
                    enableClickSelection: true,
                  }}
                  onSelectionChanged={(event) => {
                    const selectedRows = event.api.getSelectedRows();
                    setSelectedProductInfoByCategory(selectedRows.length > 0 ? selectedRows[0] : undefined);
                  }}
                />
              </div>
              <div className={'layout50'}>
                <TunedGrid<ProductMngResponseProductDetInfo>
                  columnDefs={columnDefsOnRight}
                  rowData={productInfoList}
                  loadingOverlayComponent={CustomGridLoading}
                  noRowsOverlayComponent={CustomNoRowsOverlay}
                  ref={RefForRightGrid}
                  loading={isProductInfosLoading}
                  rowSelection={{
                    mode: 'singleRow',
                    enableClickSelection: true,
                  }}
                  onSelectionChanged={(event) => {
                    const selectedRows = event.api.getSelectedRows();
                    setSelectedProductInfo(selectedRows.length > 0 ? selectedRows[0] : undefined);
                  }}
                />
              </div>
            </div>
          </div>
        </PopupContent>
      </PopupLayout>
    </div>
  );
};

export default ProductForEachCategoryPop;
