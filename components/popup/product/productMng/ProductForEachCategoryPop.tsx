import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PopupFooter } from '../../PopupFooter';
import { PopupContent } from '../../PopupContent';
import { PopupLayout } from '../../PopupLayout';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../../../../libs';
import { toastError, toastSuccess } from '../../../ToastMessage';
import {
  PartnerCodeResponseLowerSelect,
  ProductMngRequestCategoryProductInfoFilter,
  ProductMngResponseCategoryProductInfo,
  ProductMngResponseProductDetInfo,
  ProductMngResponseProductInfo,
  ProductMngRequestProductInfoWithExclusionFilter,
} from '../../../../generated';
import TunedGrid, { TunedGridRef } from '../../../grid/TunedGrid';
import { PopupSearchBox, PopupSearchType } from '../../content';
import CustomGridLoading from '../../../CustomGridLoading';
import CustomNoRowsOverlay from '../../../CustomNoRowsOverlay';
import { GridSetting } from '../../../../libs/ag-grid';
import { ColDef, RowDragEndEvent } from 'ag-grid-community';
import useFilters from '../../../../hooks/useFilters';
import { Search } from '../../../content';
import { PARTNER_CODE } from '../../../../libs/const';
import { usePartnerCodeStore } from '../../../../stores/usePartnerCodeStore';
import { ConfirmModal } from '../../../ConfirmModal';
import { useProductMngStore } from '../../../../stores/product/useProductMngStore';

interface ConfirmModalProps {
  type: 'ADD_TO_CATEGORY' | 'DEL_FROM_CATEGORY';
  active: boolean;
  stored_temporary?: unknown;
}

interface ConfForAddToCategory extends ConfirmModalProps {
  type: 'ADD_TO_CATEGORY';
  stored_temporary?: ProductMngResponseProductInfo & { categoryId: number };
}

interface ConfForDelFromCategory extends ConfirmModalProps {
  type: 'DEL_FROM_CATEGORY';
  stored_temporary?: ProductMngResponseCategoryProductInfo;
}

interface ProductContentShowPopProps {
  open: boolean;
  onClose: () => void;
}

/**
 * components/popup/product/productMng/ProductForEachCategoryPop.tsx
 * desc: 카테고리별 상품 팝업
 * Date: 2026/04/02
 * Author: park junsung
 * */
const ProductForEachCategoryPop = ({ open, onClose }: ProductContentShowPopProps) => {
  /** 공통 스토어 - State */
  const [insertCategoryProduct, updateCategoryProductSeq, deleteCategoryProduct] = useProductMngStore((s) => [
    s.insertCategoryProduct,
    s.updateCategoryProductSeq,
    s.deleteCategoryProduct,
  ]);
  const { selectLowerPartnerCodeByCodeUpper } = usePartnerCodeStore();

  /** 팝업 내부 local state */
  const [productInfoListByCategory, setProductInfoListByCategory] = useState<ProductMngResponseCategoryProductInfo[]>([]);
  const [productInfoList, setProductInfoList] = useState<ProductMngResponseProductInfo[]>([]);
  const [modalsStatus, setModalsStatus] = useState<ConfForAddToCategory | ConfForDelFromCategory>({
    type: 'ADD_TO_CATEGORY',
    active: false,
    stored_temporary: undefined,
  });

  // 각각 좌, 우측 선택된 행의 상태
  const [selectedProductInfoByCategory, setSelectedProductInfoByCategory] = useState<ProductMngResponseCategoryProductInfo | undefined>(undefined);
  const [selectedProductInfo, setSelectedProductInfo] = useState<ProductMngResponseProductInfo | undefined>(undefined);

  const [lowerPartnerCodeList, setLowerPartnerCodeList] = useState<PartnerCodeResponseLowerSelect[]>([]);

  /** 참조(ref) */
  const RefForLeftGrid = useRef<TunedGridRef<ProductMngResponseCategoryProductInfo>>(null);
  const RefForRightGrid = useRef<TunedGridRef<ProductMngResponseProductInfo>>(null);

  /** 검색 필터 */
  const [filtersForProdInfoByCategory, onChangeFiltersForProdInfoByCategory, filtersForProdInfoByCategoryReset] =
    useFilters<ProductMngRequestCategoryProductInfoFilter>({
      categoryId: undefined,
    });
  const [filtersForProdInfoListWithExclusion, onChangeFiltersForProdInfoListWithExclusion, filtersForProdInfoListWithExclusionReset] =
    useFilters<ProductMngRequestProductInfoWithExclusionFilter>({
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
        rowDrag: true,
      },
      {
        field: 'categoryNm',
        headerName: '카테고리',
        minWidth: 80,
        maxWidth: 100,
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
        cellStyle: GridSetting.CellStyle.LEFT,
      },
      {
        field: 'prodColors',
        headerName: '색상',
        minWidth: 140,
        maxWidth: 160,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.LEFT,
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

  const { mutate: insertCategoryProductMutate } = useMutation({
    mutationFn: insertCategoryProduct,
    onSuccess: (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('추가되었습니다.');
          setModalsStatus((prevState) => {
            return {
              ...prevState,
              active: false,
              stored_temporary: undefined,
            };
          });
          productInfosByCategoryRefetch();
          productInfosWithExclusionRefetch();
        } else {
          toastError(`컨텐츠 추가 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const { mutate: deleteCategoryProductMutate } = useMutation({
    mutationFn: deleteCategoryProduct,
    onSuccess: (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('삭제되었습니다.');
          setModalsStatus((prevState) => {
            return {
              ...prevState,
              active: false,
              stored_temporary: undefined,
            };
          });
          productInfosByCategoryRefetch();
          productInfosWithExclusionRefetch();
        } else {
          toastError(`컨텐츠 삭제 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 하위코드 목록 조회 */
  const { data: categories, isSuccess: isCategoriesSuccess } = useQuery({
    queryKey: [],
    queryFn: () => selectLowerPartnerCodeByCodeUpper(PARTNER_CODE.categories.code, 'PROD'),
    enabled: open,
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
    data: productInfosWithExclusion,
    isSuccess: isProductInfosWithExclusionSuccess,
    isLoading: isProductInfosWithExclusionLoading,
    refetch: productInfosWithExclusionRefetch,
  } = useQuery({
    queryKey: ['/productMng/prodInfoListWithExclusion', filtersForProdInfoByCategory.categoryId],
    queryFn: () =>
      authApi.get('/productMng/prodInfoListWithExclusion', {
        params: {
          ...filtersForProdInfoListWithExclusion,
          categoryId: filtersForProdInfoByCategory.categoryId,
        },
      }),
    refetchOnMount: 'always',
    enabled: open,
  });

  useEffect(() => {
    if (isProductInfosWithExclusionSuccess) {
      const { resultCode, body, resultMessage } = productInfosWithExclusion.data;
      if (resultCode === 200) {
        setProductInfoList(body || []);
      } else {
        toastError(resultMessage);
      }
    }
  }, [productInfosWithExclusion, isProductInfosWithExclusionSuccess]);

  const commonOnCloseCallback = () => {
    if (onClose) onClose();

    filtersForProdInfoByCategoryReset();
    filtersForProdInfoListWithExclusionReset();
  };

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    await onSearch();
  };

  const onSearch = () => {
    productInfosByCategoryRefetch();
    productInfosWithExclusionRefetch();
  };

  /** row 드래그 이벤트 */
  const onRowDragEndHandler = async (event: RowDragEndEvent) => {
    const movingNode = event.node;
    const overNode = event.overNode;

    if (movingNode.id && overNode?.id && movingNode.id != overNode?.id) {
      // 유의미한 드래깅이 발생한 경우
      const movingData = movingNode.data;
      const overData = overNode?.data;

      if (movingData && overData) {
        const fromIndex = productInfoListByCategory.indexOf(movingData);
        const toIndex = productInfoListByCategory.indexOf(overData);

        const fromSeq = productInfoListByCategory[fromIndex].seq;
        const toSeq = productInfoListByCategory[toIndex].seq;

        if (fromIndex == toIndex) {
          toastError('동일한 영역에 드래깅 할 수 없습니다.');
          return; // 이 경우 이후 동작이 무의미하므로
        }
        if (!filtersForProdInfoByCategory.categoryId) {
          toastError('카테고리 선택 후 다시 시도하십시요.');
          return;
        }
        const seqUpdReqsResult = await updateCategoryProductSeq({
          categoryId: filtersForProdInfoByCategory.categoryId,
          fromSeq: fromSeq,
          toSeq: toSeq,
        });

        const { resultCode, resultMessage } = seqUpdReqsResult.data;

        if (resultCode == 200) {
          productInfosByCategoryRefetch(); // refetch
        } else {
          console.error(resultMessage);
          toastError('재정렬 과정에서 문제가 발생하였습니다.');
        }
      }
    }
  };

  return (
    <div className="imgPopBox">
      <PopupLayout
        width={1000}
        open={open}
        isEscClose={!modalsStatus.active}
        title={'카테고리별 상품'}
        onClose={commonOnCloseCallback}
        footer={
          <PopupFooter>
            <div className="btnArea between">
              <div className="left">
                <button
                  className={`btn ${selectedProductInfoByCategory != undefined && filtersForProdInfoByCategory.categoryId && 'btnPurple'}`}
                  disabled={selectedProductInfoByCategory == undefined || !filtersForProdInfoByCategory.categoryId}
                  onClick={() => {
                    setModalsStatus({
                      type: 'DEL_FROM_CATEGORY',
                      active: true,
                      stored_temporary: selectedProductInfoByCategory,
                    });
                  }}
                >
                  {/*{`${*/}
                  {/*  selectedProductInfoByCategory != undefined && filtersForProdInfoByCategory.categoryId*/}
                  {/*    ? (lowerPartnerCodeList.filter((lowerPartnerCode) => lowerPartnerCode.id == filtersForProdInfoByCategory.categoryId)[0]?.codeNm ||*/}
                  {/*        '알수 없는 카테고리') +*/}
                  {/*      ' 에 해당하는 ' +*/}
                  {/*      selectedProductInfoByCategory.prodNm?.slice(0, 7) +*/}
                  {/*      ((selectedProductInfoByCategory.prodNm || '').length > 7 ? '..' : '') +*/}
                  {/*      ' 을 삭제'*/}
                  {/*    : filtersForProdInfoByCategory.categoryId*/}
                  {/*    ? (*/}
                  {/*        lowerPartnerCodeList.filter((lowerPartnerCode) => lowerPartnerCode.id == filtersForProdInfoByCategory.categoryId)[0]?.codeNm ||*/}
                  {/*        '알수 없음'*/}
                  {/*      ).slice(0, 5) +*/}
                  {/*      ((*/}
                  {/*        lowerPartnerCodeList.filter((lowerPartnerCode) => lowerPartnerCode.id == filtersForProdInfoByCategory.categoryId)[0]?.codeNm ||*/}
                  {/*        '알수 없는 카테고리'*/}
                  {/*      ).length > 5*/}
                  {/*        ? '..'*/}
                  {/*        : '') +*/}
                  {/*      ' 내에서 삭제할 상품 선택'*/}
                  {/*    : '카테고리 선택'*/}
                  {/*}`}*/}
                  {'카테고리에서 삭제'}
                </button>
                <button
                  className={`btn ${selectedProductInfo != undefined && filtersForProdInfoByCategory.categoryId && 'btnPurple'}`}
                  disabled={selectedProductInfo == undefined || !filtersForProdInfoByCategory.categoryId}
                  onClick={() => {
                    setModalsStatus({
                      type: 'ADD_TO_CATEGORY',
                      active: true,
                      stored_temporary: {
                        ...selectedProductInfo,
                        categoryId: filtersForProdInfoByCategory.categoryId,
                      },
                    } as ConfForAddToCategory);
                  }}
                >
                  {/*{`${*/}
                  {/*  selectedProductInfo != undefined && filtersForProdInfoByCategory.categoryId*/}
                  {/*    ? selectedProductInfo.prodNm?.slice(0, 7) +*/}
                  {/*      ((selectedProductInfo.prodNm || '').length > 7 ? '..' : '') +*/}
                  {/*      ' 을(를) ' +*/}
                  {/*      (lowerPartnerCodeList.filter((lowerPartnerCode) => lowerPartnerCode.id == filtersForProdInfoByCategory.categoryId)[0]?.codeNm ||*/}
                  {/*        '알수 없는 카테고리') +*/}
                  {/*      ' 의 상품으로 추가 '*/}
                  {/*    : '카테고리 선택 후 추가'*/}
                  {/*}`}*/}
                  {'카테고리에 추가'}
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
                value={filtersForProdInfoListWithExclusion.prodNm}
                onEnter={search}
                onChange={onChangeFiltersForProdInfoListWithExclusion}
                filters={filtersForProdInfoListWithExclusion}
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
                  onRowDragEnd={onRowDragEndHandler}
                />
              </div>
              <div className={'layout50'}>
                <TunedGrid<ProductMngResponseProductDetInfo>
                  columnDefs={columnDefsOnRight}
                  rowData={productInfoList}
                  loadingOverlayComponent={CustomGridLoading}
                  noRowsOverlayComponent={CustomNoRowsOverlay}
                  ref={RefForRightGrid}
                  loading={isProductInfosWithExclusionLoading}
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
      <ConfirmModal
        open={modalsStatus.active && (modalsStatus.type == 'ADD_TO_CATEGORY' || modalsStatus.type == 'DEL_FROM_CATEGORY')}
        title={
          modalsStatus.type == 'DEL_FROM_CATEGORY'
            ? modalsStatus.stored_temporary?.prodNm + ' 을 해당 카테고리의 상품 목록에서 삭제하시겠습니까?'
            : modalsStatus.stored_temporary?.prodNm + ' 을 해당 카테고리의 상품 목록으로 추가하시겠습니까?'
        }
        confirmText={'확인'}
        onConfirm={() => {
          if (modalsStatus.type == 'DEL_FROM_CATEGORY') {
            // 카테고리로부터 제거
            deleteCategoryProductMutate({
              id: modalsStatus.stored_temporary?.categoryProductId, // 이때의 id는 카테고리 연결상품정보 아이디(PK)
            });
          } else {
            // 카테고리로 추가
            insertCategoryProductMutate({
              categoryId: modalsStatus.stored_temporary?.categoryId,
              productId: modalsStatus.stored_temporary?.id,
            });
          }
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
    </div>
  );
};

export default ProductForEachCategoryPop;
