import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PopupFooter } from '../../PopupFooter';
import { PopupContent } from '../../PopupContent';
import { PopupLayout } from '../../PopupLayout';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../../../../libs';
import { toastError, toastSuccess } from '../../../ToastMessage';
import {
  PageObject,
  ProductContentListRequestProductInfoListFilter,
  ProductContentListResponseProductContent,
  ProductContentListResponseProductInfo,
  ProductMngResponseProductInfo,
} from '../../../../generated';
import TunedGrid, { AddPagingOptions, TunedGridRef } from '../../../grid/TunedGrid';
import { PopupSearchBox, PopupSearchType } from '../../content';
import CustomGridLoading from '../../../CustomGridLoading';
import CustomNoRowsOverlay from '../../../CustomNoRowsOverlay';
import { GridSetting } from '../../../../libs/ag-grid';
import { ColDef } from 'ag-grid-community';
import useFilters from '../../../../hooks/useFilters';
import { Search } from '../../../content';
import { AlertMessage } from '../../../../libs/const';
import { Utils } from '../../../../libs/utils';
import { useProductContentListStore } from '../../../../stores/product/useProductContentListStore';
import { ConfirmModal } from '../../../ConfirmModal';

interface ProductContentShowPopProps {
  open: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  selectedContent?: ProductContentListResponseProductContent;
}

/**
 * components/popup/product/contentList/ProductAddPop.tsx
 * desc: 상품추가 팝업
 * Date: 2026/03/24
 * Author: park junsung
 * */
const ProductAddPop = ({ open, onClose, onSuccess, selectedContent }: ProductContentShowPopProps) => {
  /** 공통 스토어 - State */
  const [insertContentsProductList] = useProductContentListStore((s) => [s.insertContentsProductList]);

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

  const [modalsStatus, setModalsStatus] = useState<{
    type: 'ADD_CONTENTS_PRODUCTS';
    active: boolean;
    stored_temporary?: Partial<ProductContentListResponseProductInfo>[];
  }>({
    type: 'ADD_CONTENTS_PRODUCTS',
    active: false,
    stored_temporary: undefined,
  });

  const [selectedRowsDataList, setSelectedRowsDataList] = useState<ProductContentListResponseProductInfo[]>([]);

  /** filters, lastInfo's filters*/
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters<ProductContentListRequestProductInfoListFilter>({
    prodNm: undefined,
    contentsId: undefined,
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
        minWidth: 100,
        maxWidth: 100,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
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
        field: 'sellAmt',
        headerName: '가격',
        minWidth: 120,
        maxWidth: 160,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
        valueFormatter: (params) => Utils.setComma(params.value),
      },
    ],
    [],
  );

  /** 닫힘 공통 핸들러 */
  const onCloseCommonCallBack = () => {
    if (onClose) {
      onClose();
    } else {
      console.error('닫힘 동작을 사용할 수 없음');
    }

    // 초기화 동작
    setProductInfoList([]);
    setLastProductInfo(undefined);
    setPaging({
      ...paging,
      curPage: 1,
    });
    onFiltersReset();
  };

  /** 인서트 성공 시점 공통 콜백 */
  const onSuccessCommonCallBack = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      console.error('성공 시점 콜백 호출을 행할 수 없음');
    }

    // 초기화 동작
    setProductInfoList([]);
    setLastProductInfo(undefined);
    setPaging({
      ...paging,
      curPage: 1,
    });
    onFiltersReset();
  };

  /** 연결상품 추가 요청 처리 동작 캐싱 */
  const { mutate: insertContentsProductListMutate } = useMutation(insertContentsProductList, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          onSuccessCommonCallBack();
        } else {
          toastError(`연결상품 저장 도중 문제 발생 (${e.data.resultMessage})`);
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
    queryKey: ['/productContentList/productInfoListPaging', filters.contentsId],
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
    enabled: open && filters.contentsId != undefined,
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

  useEffect(() => {
    if (open) {
      if (selectedContent == undefined) {
        toastError('대응되는 상품컨텐츠를 찾을 수 없습니다.');
        console.error('상품컨텐츠 정보 전달 여부 점검!');
      }
    }
  }, [open]);

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
        title={'신규 상품추가'}
        onClose={onCloseCommonCallBack}
        footer={
          <PopupFooter>
            <div className="btnArea between">
              <div>
                <button className="btn" onClick={onCloseCommonCallBack}>
                  닫기
                </button>
              </div>
              <div className="right">
                <button
                  className="btn btn_blue"
                  onClick={() => {
                    if (selectedRowsDataList.length == 0) {
                      toastError('추가하고자 하는 상품을 하나 이상 선택하십시요.');
                      return;
                    }

                    if (selectedContent == undefined) {
                      toastError('대응되는 상품컨텐츠를 선택 후 재시도하십시요.');
                      return;
                    }

                    setModalsStatus({
                      type: 'ADD_CONTENTS_PRODUCTS',
                      active: true,
                      stored_temporary: selectedRowsDataList,
                    });
                  }}
                >
                  추가
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
              onSelectionChanged={(event) => {
                const selectedRows = event.api.getSelectedRows();
                setSelectedRowsDataList(selectedRows);
              }}
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
          <ConfirmModal
            open={modalsStatus.active && modalsStatus.type == 'ADD_CONTENTS_PRODUCTS'}
            title={`${
              (modalsStatus.stored_temporary || []).length > 1
                ? (modalsStatus.stored_temporary || [])[0].prodNm + ' 이외 ' + ((modalsStatus.stored_temporary || []).length - 1).toString() + '개의 상품을'
                : (modalsStatus.stored_temporary || [])[0].prodNm + ' 을(를)'
            } 연결상품으로 추가 하시겠습니까?`}
            confirmText={'저장'}
            onConfirm={() => {
              if (!selectedContent?.id) {
                toastError('대응되는 상품컨텐츠를 찾을 수 없습니다.');
                console.error('상품컨텐츠 정보 전달 여부 점검!');
                return;
              }
              insertContentsProductListMutate(
                (modalsStatus.stored_temporary || []).map((productInfo) => {
                  return {
                    contentsId: selectedContent.id,
                    productId: productInfo.id,
                  };
                }),
              );
            }}
            onClose={() => {
              setModalsStatus((prevState) => {
                return {
                  ...prevState,
                  active: false,
                  stored_temporary: undefined,
                };
              });
            }}
          />
        </PopupContent>
      </PopupLayout>
    </div>
  );
};

export default ProductAddPop;
