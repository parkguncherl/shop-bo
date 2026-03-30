import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PopupFooter } from '../../PopupFooter';
import { PopupContent } from '../../PopupContent';
import { PopupLayout } from '../../PopupLayout';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../../libs';
import { toastError, toastSuccess } from '../../../ToastMessage';
import {
  PartnerCodeResponseLowerSelect,
  ProductMngRequestProductInfoFilter,
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
  const [productInfoListByCategory, setProductInfoListByCategory] = useState<ProductMngResponseProductInfo[]>([]);
  const [productInfoList, setProductInfoList] = useState<ProductMngResponseProductInfo[]>([]);

  const [lowerPartnerCodeList, setLowerPartnerCodeList] = useState<PartnerCodeResponseLowerSelect[]>([]);

  const RefForGrid = useRef<TunedGridRef<ProductMngResponseProductDetInfo>>(null);

  /** 검색 필터 */
  const [commonFilters, onChangeCommonFilters] = useFilters<ProductMngRequestProductInfoFilter>({
    prodNm: undefined,
  });

  /** 컬럼 설정 */
  const columnDefsOnLeft = useMemo<ColDef<ProductMngResponseProductInfo>[]>(
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

  /** 품목정보 목록 조회 */
  const {
    data: productInfosByCategory,
    isSuccess: isProductInfosByCategorySuccess,
    isLoading: isProductInfosByCategoryLoading,
    refetch: productInfosByCategoryRefetch,
  } = useQuery({
    queryKey: ['/productMng/productInfoList'],
    queryFn: () =>
      authApi.get('/productMng/productInfoList', {
        params: {
          ...commonFilters,
        },
      }),
    refetchOnMount: 'always',
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

  /** 품목정보 목록 조회 */
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
          ...commonFilters,
        },
      }),
    refetchOnMount: 'always',
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
              <div className="left"></div>
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
                name={'useYn'}
                defaultOptions={lowerPartnerCodeList.map((lowerPartnerCode, index) => {
                  return {
                    key: index,
                    label: lowerPartnerCode.codeNm,
                    value: lowerPartnerCode.codeCd,
                  };
                })}
                value={''}
                placeholder={'카테고리 선택'}
                onChange={() => {}}
              />
              <Search.Input
                title={'상품명'}
                name={'prodNm'}
                placeholder={'키워드 입력 후 엔터키 클릭'}
                value={commonFilters.prodNm}
                onEnter={search}
                onChange={onChangeCommonFilters}
                filters={commonFilters}
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
                  ref={RefForGrid}
                  loading={isProductInfosByCategoryLoading}
                  // rowSelection={{
                  //   mode: 'singleRow',
                  //   isRowSelectable: true,
                  //   enableClickSelection: true,
                  // }}
                />
              </div>
              <div className={'layout50'}>
                <TunedGrid<ProductMngResponseProductDetInfo>
                  columnDefs={columnDefsOnRight}
                  rowData={productInfoList}
                  loadingOverlayComponent={CustomGridLoading}
                  noRowsOverlayComponent={CustomNoRowsOverlay}
                  ref={RefForGrid}
                  loading={isProductInfosLoading}
                  // rowSelection={{
                  //   mode: 'singleRow',
                  //   isRowSelectable: true,
                  //   enableClickSelection: true,
                  // }}
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
