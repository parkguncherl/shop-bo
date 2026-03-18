import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PopupFooter } from '../../PopupFooter';
import { PopupContent } from '../../PopupContent';
import { PopupLayout } from '../../PopupLayout';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../../../../libs';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { ConfirmModal } from '../../../ConfirmModal';
import {
  ProductMngRequestProductDetInfoFilter,
  ProductMngRequestUpdateProduct,
  ProductMngResponseProductDetInfo,
  ProductMngResponseProductInfo,
} from '../../../../generated';
import { useProductMngStore } from '../../../../stores/product/useProductMngStore';
import TunedGrid, { TunedGridRef } from '../../../grid/TunedGrid';
import { PopupSearchBox, PopupSearchType } from '../../content';
import useFilters from '../../../../hooks/useFilters';
import CustomGridLoading from '../../../CustomGridLoading';
import CustomNoRowsOverlay from '../../../CustomNoRowsOverlay';
import { GridSetting } from '../../../../libs/ag-grid';
import { ColDef } from 'ag-grid-community';

/** form 영역 입력 인터페이스 */
export interface ProductModFields {
  prodNm: string;
  prodTp: string;
  prodDetTp: string;
  composition: string;
  // repFileId?: number;
  // detailFileId?: number;
  // sizeFileId?: number;
  // etcFileId?: number;
  makeYmd: string;
  orgAmt: number;
  sellAmt: number;
  discountRate?: number;
  weather: 'spring' | 'summer' | 'autumn' | 'winter';
  // isSpring?: string;
  // isSummer?: string;
  // isAutumn?: string;
  // isWinter?: string;
}

interface ProductContentShowPopProps {
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
  productInfo?: ProductMngResponseProductInfo;
}

/**
 * components/popup/product/productMng/ProductModPop.tsx
 * desc: 상품정보 수정 팝업
 * Date: 2026/03/18
 * Author: park junsung
 * */
const ProductModPop = ({ open, onClose, onUpdated, productInfo }: ProductContentShowPopProps) => {
  /** 공통 스토어 - State */
  const [updateProduct] = useProductMngStore((s) => [s.updateProduct]);

  /** 검색 필터 */
  const [filters, onChangeFilters] = useFilters<ProductMngRequestProductDetInfoFilter>({
    prodId: undefined,
  });

  /** 팝업 내부 local state */
  const [openModConf, setOpenAddConf] = useState<{ open: boolean; stored?: ProductMngRequestUpdateProduct }>({ open: false });
  const [productDetInfoList, setProductDetInfoList] = useState<ProductMngResponseProductDetInfo[]>([]);

  const RefForGrid = useRef<TunedGridRef<ProductMngResponseProductDetInfo>>(null);

  /** 컬럼 설정 */
  const columnDefs = useMemo<ColDef<ProductMngResponseProductDetInfo>[]>(
    () => [
      {
        field: 'no',
        headerName: 'NO',
        minWidth: 70,
        maxWidth: 80,
        valueGetter: (params) => (params.node ? (params.node.rowIndex ?? 0) + 1 : ''),
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      { field: 'productDetColor', headerName: '컬러', minWidth: 140, suppressHeaderMenuButton: true },
      { field: 'productDetSize', headerName: '사이즈', minWidth: 140, suppressHeaderMenuButton: true },
      {
        field: 'skuDiscountRate',
        headerName: '스큐단위 할인율',
        minWidth: 120,
        maxWidth: 120,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
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
    queryKey: ['/productMng/productDetInfoList'],
    queryFn: () =>
      authApi.get('/productMng/productDetInfoList', {
        params: {
          ...filters,
        },
      }),
    refetchOnMount: 'always',
    enabled: open && filters.prodId != undefined,
  });

  useEffect(() => {
    if (isProductDetInfosSuccess) {
      const { resultCode, body, resultMessage } = productDetInfos.data;
      if (resultCode === 200) {
        setProductDetInfoList(body);
      } else {
        toastError(resultMessage);
      }
    }
  }, [productDetInfos, isProductDetInfosSuccess]);

  useEffect(() => {
    onChangeFilters('prodId', productInfo?.id);
  }, [productInfo]);

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
        width={650}
        open={open}
        isEscClose={true}
        title={productInfo?.prodNm + ' 의 상품상세 목록'}
        onClose={onClose}
        footer={
          <PopupFooter>
            <div className="btnArea between">
              <div className="left"></div>
              <div className="right">
                <button
                  className="btn"
                  onClick={() => {
                    onClose();
                  }}
                >
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
              {/*<Search.Input*/}
              {/*  title={'상품명'}*/}
              {/*  name={'skuNm'}*/}
              {/*  placeholder={'키워드 입력 후 엔터키 클릭'}*/}
              {/*  value={filters.skuNm}*/}
              {/*  onEnter={search}*/}
              {/*  onChange={onChangeFilters}*/}
              {/*  filters={filters}*/}
              {/*/>*/}
            </PopupSearchType>
          </PopupSearchBox>
          <div className="mt10">
            <TunedGrid<ProductMngResponseProductDetInfo>
              columnDefs={columnDefs}
              rowData={productDetInfoList}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              ref={RefForGrid}
              loading={isProductDetInfosLoading}
            />
          </div>
        </PopupContent>
      </PopupLayout>
      <ConfirmModal
        open={openModConf.open}
        title={'저장 하시겠습니까?'}
        confirmText={'저장'}
        onConfirm={() => {
          if (openModConf.stored) {
            console.log('openModConf.stored: ', openModConf.stored);
            // todo
          } else {
            toastError('저장하고자 하는 입력 결과를 찾을 수 없습니다.');
            console.error('저장하고자 하는 입력 결과를 찾을 수 없습니다.');
          }
        }}
        onClose={() => {
          setOpenAddConf({
            open: false,
          });
        }}
      />
    </div>
  );
};

export default ProductModPop;
