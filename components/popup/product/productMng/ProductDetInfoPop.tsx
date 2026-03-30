import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PopupFooter } from '../../PopupFooter';
import { PopupContent } from '../../PopupContent';
import { PopupLayout } from '../../PopupLayout';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi, YupSchema } from '../../../../libs';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { ConfirmModal } from '../../../ConfirmModal';
import {
  ProductMngRequestDeleteProductDet,
  ProductMngRequestInsertProductDet,
  ProductMngResponseProductDetInfo,
  ProductMngResponseProductInfo,
} from '../../../../generated';
import { useProductMngStore } from '../../../../stores/product/useProductMngStore';
import TunedGrid, { TunedGridRef } from '../../../grid/TunedGrid';
import { PopupSearchBox, PopupSearchType } from '../../content';
import CustomGridLoading from '../../../CustomGridLoading';
import CustomNoRowsOverlay from '../../../CustomNoRowsOverlay';
import { GridSetting } from '../../../../libs/ag-grid';
import { ColDef } from 'ag-grid-community';
import { GlobalError, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

export interface ProductDetInsertFields extends ProductMngRequestInsertProductDet {
  // productDetSeq: number;
  // productDetSize: string;
  // productDetColor: string;
  // skuDiscountRate: number;
  // //fileId?: number;
  // sleepYn: string;
}

interface ProductContentShowPopProps {
  open: boolean;
  onClose: (updated: boolean) => void;
  productInfo?: ProductMngResponseProductInfo;
}

/**
 * components/popup/product/productMng/ProductModPop.tsx
 * desc: 상품정보 수정 팝업
 * Date: 2026/03/18
 * Author: park junsung
 * */
const ProductDetInfoPop = ({ open, onClose, productInfo }: ProductContentShowPopProps) => {
  /** 공통 스토어 - State */
  const [updateProductDet, deleteProductDet] = useProductMngStore((s) => [s.updateProductDet, s.deleteProductDet]);

  /** 팝업 내부 local state */
  const [productDetInfoList, setProductDetInfoList] = useState<ProductMngResponseProductDetInfo[]>([]);
  const [selectedRowsData, setSelectedRowsData] = useState<ProductMngResponseProductDetInfo | undefined>(undefined);
  const [openModConf, setOpenAddConf] = useState<{ open: boolean; stored?: ProductMngRequestDeleteProductDet }>({ open: false });

  const RefForGrid = useRef<TunedGridRef<ProductMngResponseProductDetInfo>>(null);
  const flagAboutUpdatedOrNot = useRef(false);
  const flagAboutIsOnWritingOrNot = useRef(false); // 신규 작성중 여부

  const tunedGridWrapperRef = useRef(null);

  // handleSubmit(onValid, onInvalid)(); // 함수를 반환하므로 다음과 같이, 호출하여야
  /** 품목 내용 입력 서식 */
  const {
    handleSubmit,
    reset,
    clearErrors,
    setValue,
    formState: { errors },
  } = useForm<ProductDetInsertFields>({
    resolver: yupResolver(YupSchema.InsertProductDetRequest()),
    mode: 'onChange',
    defaultValues: {
      skuDiscountRate: 0,
      sleepYn: 'N',
    },
  });

  /** 입력 시점 적절치 못한 값이 전달된 경우 사용자에게 에러를 출력하는 영역 */
  useEffect(() => {
    const fieldsRelatedWithErr = Object.keys(errors);
    if (fieldsRelatedWithErr.length > 0) {
      // @ts-ignore
      const targetErr = errors[fieldsRelatedWithErr[0]] as GlobalError;
      toastError(targetErr.message);
    }
  }, [errors]);

  const { mutate: updateProductDetMutate } = useMutation(updateProductDet, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('수정되었습니다.');
          await productDetInfosRefetch();
          flagAboutUpdatedOrNot.current = true;
        } else {
          toastError(`컨텐츠 저장 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const { mutate: deleteProductDetMutate } = useMutation(deleteProductDet, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('삭제되었습니다.');
          await productDetInfosRefetch();
          flagAboutUpdatedOrNot.current = true;
        } else {
          toastError(`컨텐츠 저장 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

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
      {
        field: 'productDetColor',
        headerName: '컬러',
        minWidth: 80,
        maxWidth: 100,
        suppressHeaderMenuButton: true,
        editable: (params) => (flagAboutIsOnWritingOrNot.current ? params.data?.id == undefined : true),
        onCellValueChanged: (event) => {
          if (event.data.id) {
            updateProductDetMutate({
              id: event.data.id,
              productDetColor: event.newValue,
            });
          } else {
            // 신규 작성 영역
            setValue('productDetColor', event.newValue, { shouldValidate: true });
          }
        },
      },
      {
        field: 'productDetSize',
        headerName: '사이즈',
        minWidth: 80,
        maxWidth: 100,
        suppressHeaderMenuButton: true,
        editable: (params) => (flagAboutIsOnWritingOrNot.current ? params.data?.id == undefined : true),
        onCellValueChanged: (event) => {
          if (event.data.id) {
            updateProductDetMutate({
              id: event.data.id,
              productDetSize: event.newValue,
            });
          } else {
            // 신규 작성 영역
            setValue('productDetSize', event.newValue, { shouldValidate: true });
          }
        },
      },
      {
        field: 'skuDiscountRate',
        headerName: '할인율',
        minWidth: 50,
        maxWidth: 70,
        suppressHeaderMenuButton: true,
        editable: (params) => (flagAboutIsOnWritingOrNot.current ? params.data?.id == undefined : true),
        cellStyle: GridSetting.CellStyle.CENTER,
        onCellValueChanged: (event) => {
          if (isNaN(Number(event.newValue)) || Number(event.newValue) < 0 || Number(event.newValue) > 100) {
            toastError('유효한 값을 입력하십시요.');
            return;
          }
          if (event.data.id) {
            updateProductDetMutate({
              id: event.data.id,
              skuDiscountRate: event.newValue,
            });
          } else {
            // 신규 작성 영역
            setValue('skuDiscountRate', event.newValue, { shouldValidate: true });
          }
        },
      },
      {
        field: 'productDetCntn',
        headerName: '상세내용',
        minWidth: 180,
        maxWidth: 200,
        suppressHeaderMenuButton: true,
        editable: (params) => (flagAboutIsOnWritingOrNot.current ? params.data?.id == undefined : true),
        cellStyle: GridSetting.CellStyle.LEFT,
        onCellValueChanged: (event) => {
          if (event.data.id) {
            updateProductDetMutate({
              id: event.data.id,
              productDetCntn: event.newValue,
            });
          } else {
            // 신규 작성 영역
            console.log('productDetCntn', event.newValue);
            setValue('productDetCntn', event.newValue, { shouldValidate: true });
          }
        },
      },
      {
        field: 'sleepYn',
        headerName: '휴면여부',
        minWidth: 70,
        maxWidth: 90,
        suppressHeaderMenuButton: true,
        editable: (params) => (flagAboutIsOnWritingOrNot.current ? params.data?.id == undefined : true),
        cellStyle: GridSetting.CellStyle.CENTER,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: ['Y', 'N'],
        },
        onCellValueChanged: (event) => {
          if (event.data.id) {
            updateProductDetMutate({
              id: event.data.id,
              sleepYn: event.newValue,
            });
          } else {
            // 신규 작성 영역
            setValue('sleepYn', event.newValue, { shouldValidate: true });
          }
        },
      },
    ],
    [updateProductDetMutate, setValue],
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

  const commonOnCloseCallback = () => {
    if (onClose) onClose(flagAboutUpdatedOrNot.current);

    // 닫힘 시점 초기화 동작
    RefForGrid.current?.api.deselectAll(); // 셀렉션 초기화
    flagAboutUpdatedOrNot.current = false; // 업데이트 여부 플래그 초기화
    flagAboutIsOnWritingOrNot.current = false; // 작성 중 여부 플래그 초기화

    // rhf
    reset();
    clearErrors();
  };

  return (
    <div className="imgPopBox">
      <PopupLayout
        width={620}
        open={open}
        isEscClose={true}
        title={productInfo?.prodNm + ' 의 상품상세 목록'}
        onClose={commonOnCloseCallback}
        footer={
          <PopupFooter>
            <div className="btnArea between">
              <div className="left">
                <button
                  className={`btn ${productDetInfoList.filter((productDetInfo) => productDetInfo.id == undefined).length == 0 ? 'btn_blue' : ''}`}
                  disabled={productDetInfoList.filter((productDetInfo) => productDetInfo.id == undefined).length != 0}
                  onClick={() => {
                    if (productDetInfoList.filter((productDetInfo) => productDetInfo.id == undefined).length == 0) {
                      flagAboutIsOnWritingOrNot.current = true; // 플래그 동기화
                      setProductDetInfoList((prevState) => [...prevState, {}]); // 신규 행 추가(이후부터는 rhf 관할)
                    } else {
                      console.log('비정상 콜백 호출!');
                    }
                  }}
                >
                  {productDetInfoList.filter((productDetInfo) => productDetInfo.id == undefined).length == 0 ? '신규 작성' : '작성중..'}
                </button>
                <button
                  className={`btn ${productInfo != undefined && selectedRowsData != undefined && 'btn_blue'}`}
                  disabled={productInfo == undefined || selectedRowsData == undefined}
                  onClick={() => {
                    if (selectedRowsData?.id) {
                      setOpenAddConf({
                        open: true,
                        stored: {
                          id: selectedRowsData?.id,
                        },
                      });
                    } else {
                      console.error('삭제하고자 하는 상품상세의 식별자를 찾을 수 없음');
                    }
                  }}
                >
                  {`${
                    productInfo == undefined || selectedRowsData == undefined
                      ? '삭제할 상세정보 선택'
                      : (productInfo?.prodNm || '') + ' ' + selectedRowsData?.productDetColor + ' 을(를) 삭제'
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
          <div
            className="mt10"
            style={{ position: 'relative' }} // relative 설정 필수
            ref={tunedGridWrapperRef}
          >
            <TunedGrid<ProductMngResponseProductDetInfo>
              columnDefs={columnDefs}
              rowData={productDetInfoList}
              popupParent={tunedGridWrapperRef.current}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              ref={RefForGrid}
              loading={isProductDetInfosLoading}
              rowSelection={{
                mode: 'singleRow',
                isRowSelectable: (rowNode) => !flagAboutIsOnWritingOrNot.current, // 신규 작성 시점에는 행 선택 제한
                enableClickSelection: true,
              }}
              onSelectionChanged={(event) => {
                const selectedRows = event.api.getSelectedRows();
                setSelectedRowsData(selectedRows.length > 0 ? selectedRows[0] : undefined);
              }}
            />
          </div>
        </PopupContent>
      </PopupLayout>
      <ConfirmModal
        open={openModConf.open}
        title={(productInfo?.prodNm || '') + ' ' + selectedRowsData?.productDetColor + ' 을(를) 삭제 하시겠습니까?'}
        confirmText={'저장'}
        onConfirm={() => {
          if (openModConf.stored) {
            deleteProductDetMutate(openModConf.stored);
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

export default ProductDetInfoPop;
