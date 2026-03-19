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
  const [updateProductDet] = useProductMngStore((s) => [s.updateProductDet]);

  /** 팝업 내부 local state */
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
      { field: 'productDetColor',
        headerName: '컬러',
        minWidth: 80,
        maxWidth: 100,
        suppressHeaderMenuButton: true,
        editable: true,
        onCellValueChanged: (event) => {
          if (event.data.id) {
            updateProductDetMutate({
              id: event.data.id,
              productDetColor: event.newValue,
            })
          } else {
            console.error('상품상세정보 식별자를 확인할 수 없음')
          }
        }
      },
      { field: 'productDetSize',
        headerName: '사이즈',
        minWidth: 80,
        maxWidth: 100,
        suppressHeaderMenuButton: true,
        editable: true,
        onCellValueChanged: (event) => {
          if (event.data.id) {
            updateProductDetMutate({
              id: event.data.id,
              productDetSize: event.newValue,
            })
          } else {
            console.error('상품상세정보 식별자를 확인할 수 없음')
          }
        }
      },
      {
        field: 'skuDiscountRate',
        headerName: '할인율',
        minWidth: 50,
        maxWidth: 70,
        suppressHeaderMenuButton: true,
        editable: true,
        cellStyle: GridSetting.CellStyle.CENTER,
        onCellValueChanged: (event) => {
          if (event.data.id) {
            updateProductDetMutate({
              id: event.data.id,
              skuDiscountRate: event.newValue,
            })
          } else {
            console.error('상품상세정보 식별자를 확인할 수 없음')
          }
        }
      },
      {
        field: 'productDetCntn',
        headerName: '상세내용',
        minWidth: 230,
        maxWidth: 230,
        suppressHeaderMenuButton: true,
        editable: true,
        cellStyle: GridSetting.CellStyle.LEFT,
        onCellValueChanged: (event) => {
          if (event.data.id) {
            updateProductDetMutate({
              id: event.data.id,
              productDetCntn: event.newValue,
            })
          } else {
            console.error('상품상세정보 식별자를 확인할 수 없음')
          }
        }
      },
    ],
    [productInfo],
  );

  const { mutate: updateProductDetMutate } = useMutation(updateProductDet, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('수정되었습니다.');
          await productDetInfosRefetch();
          if (onUpdated) onUpdated();
        } else {
          toastError(`컨텐츠 저장 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

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
          prodId: productInfo?.id,
        },
      }),
    refetchOnMount: 'always',
    enabled: open && productInfo?.id != undefined,
  });

  useEffect(() => {
    if (isProductDetInfosSuccess) {
      const { resultCode, body, resultMessage } = productDetInfos.data;
      if (resultCode === 200) {
        setProductDetInfoList(body || []);
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
        width={600}
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
    </div>
  );
};

export default ProductModPop;
