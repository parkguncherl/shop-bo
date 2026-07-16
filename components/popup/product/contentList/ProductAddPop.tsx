import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PopupFooter } from '../../PopupFooter';
import { PopupContent } from '../../PopupContent';
import { PopupLayout } from '../../PopupLayout';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../../../../libs';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { FileDet, ProductContentListResponseProductContent, ProductContentListResponseProductInfo } from '../../../../generated';
import TunedGrid, { TunedGridRef } from '../../../grid/TunedGrid';
import { PopupSearchBox, PopupSearchType } from '../../content';
import CustomGridLoading from '../../../CustomGridLoading';
import CustomNoRowsOverlay from '../../../CustomNoRowsOverlay';
import { GridSetting } from '../../../../libs/ag-grid';
import { ColDef, SelectionChangedEvent } from 'ag-grid-community';
import useFilters from '../../../../hooks/useFilters';
import { Search } from '../../../content';
import { useProductContentListStore } from '../../../../stores/product/useProductContentListStore';
import { ConfirmModal } from '../../../ConfirmModal';
import { useCommonStore } from '../../../../stores';
import ImgPreviewBox, { ImgPreviewFileDet } from '../../../content/ImgPreviewBox';
import { CustomSwitch } from '../../../CustomSwitch';
import { usePartnerList } from '../../../../customHook/usePartnerList';

type ProductInfoListFilter = {
  prodNm?: string;
  partnerId?: number;
  contentsId?: number;
  lastId?: number;
};

interface ProductContentShowPopProps {
  open: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  selectedContent?: ProductContentListResponseProductContent;
}

/**
 * components/popup/product/contentList/ProductAddPop.tsx
 * desc: 품목추가 팝업
 * Date: 2026/03/25
 * Author: park junsung
 * */
const ProductAddPop = ({ open, onClose, onSuccess, selectedContent }: ProductContentShowPopProps) => {
  /** 공통 스토어 - State */
  const [insertContentsProductList] = useProductContentListStore((s) => [s.insertContentsProductList]);
  const [getFileUrl, getFileList] = useCommonStore((s) => [s.getFileUrl, s.getFileList]);

  /** 팝업 내부 local state */
  const [productInfoList, setProductInfoList] = useState<ProductContentListResponseProductInfo[]>([]);
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
  const [imgPreviewBoxOn, setImgPreviewBoxOn] = useState(true);
  const [resized, setResized] = useState(false);
  const [imgPreviewFileDetList, setImgPreviewFileDetList] = useState<ImgPreviewFileDet[]>([]);

  /** filters, lastInfo's filters*/
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters<ProductInfoListFilter>({
    prodNm: undefined,
    partnerId: undefined,
  });

  const { data: partnerOptions = [] } = usePartnerList({ enabled: true });

  // todo 페이징 영역 한시적 비활성화
  // const [lastInfos, onChangelastInfos, onlastInfosReset] = useFilters<ProductContentListRequestProductInfoListFilter>({
  //   lastId: undefined,
  // });

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
        headerName: '매장명',
        minWidth: 100,
        maxWidth: 100,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.LEFT,
      },
      {
        field: 'prodNm',
        headerName: '품목명',
        minWidth: 160,
        maxWidth: 200,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.LEFT,
      },
      {
        field: 'prodTpNm',
        headerName: '분류',
        minWidth: 100,
        maxWidth: 100,
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
        headerName: '가격',
        minWidth: 120,
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

    // todo 페이징 영역 한시적 비활성화
    // setLastProductInfo(undefined);
    // setPaging({
    //   ...paging,
    //   curPage: 1,
    // });
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

    // todo 페이징 영역 한시적 비활성화
    // setLastProductInfo(undefined);
    // setPaging({
    //   ...paging,
    //   curPage: 1,
    // });

    onFiltersReset();
  };

  /** 연결품목 추가 요청 처리 동작 캐싱 */
  const { mutate: insertContentsProductListMutate } = useMutation({
    mutationFn: insertContentsProductList,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          onSuccessCommonCallBack();
        } else {
          toastError(`연결품목 저장 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 품목상세정보 목록 조회 */
  const {
    data: productDetInfos,
    isSuccess: isProductDetInfosSuccess,
    isLoading: isProductDetInfosLoading,
    refetch: productDetInfosRefetch,
  } = useQuery({
    queryKey: ['/productContentList/productInfoListPaging', { partnerId: filters.partnerId, contentsId: filters.contentsId }],
    queryFn: () =>
      authApi.get('/productContentList/productInfoListPaging', {
        params: {
          // todo 페이징 영역 한시적 비활성화
          //curPage: paging.curPage,
          // pageRowCount: paging.pageRowCount,
          pageRowCount: 1000,
          ...filters,
          contentsId: selectedContent?.id,
          //...lastInfos,
        },
      }),
    refetchOnMount: 'always',
    enabled: open && selectedContent?.id != undefined,
  });

  useEffect(() => {
    if (isProductDetInfosSuccess) {
      const { resultCode, body, resultMessage } = productDetInfos.data;
      if (resultCode === 200) {
        // todo 페이징 영역 한시적 비활성화
        // const perPagesRowCnt = paging.pageRowCount as number;
        // if (perPagesRowCnt) {
        //   setProductInfoList((body.rows || []).slice(0, perPagesRowCnt));
        //   setLastProductInfo((body.rows || [])[perPagesRowCnt]);
        // } else {
        //   console.error('pageRowCount 를 찾을 수 없음');
        // }

        setProductInfoList(body.rows || []);
      } else {
        toastError(resultMessage);
      }
    }
  }, [productDetInfos, isProductDetInfosSuccess]);

  useEffect(() => {
    if (open) {
      if (selectedContent == undefined) {
        toastError('대응되는 품목컨텐츠를 찾을 수 없습니다.');
        console.error('품목컨텐츠 정보 전달 여부 점검!');
      }
    }
  }, [open]);

  /** row 선택 시 이미지 미리보기 */
  const onSelectionChanged = (e: SelectionChangedEvent) => {
    const selectedRows: ProductContentListResponseProductInfo[] = e.api.getSelectedRows();
    setSelectedRowsDataList(selectedRows);
    if (selectedRows.length > 0) {
      const selectedRow = selectedRows[0];
      if (selectedRow.repFileId) {
        getFileList(selectedRow.repFileId).then(async (result) => {
          const { resultCode, body, resultMessage } = result.data;
          if (resultCode == 200 && body != undefined) {
            const fileDetList: ImgPreviewFileDet[] = [];
            await Promise.all(
              (body as FileDet[]).map(async (file: FileDet) => {
                if (!file.sysFileNm) return;
                fileDetList.push({ ...file, url: await getFileUrl(file.sysFileNm) });
              }),
            );
            setImgPreviewFileDetList(fileDetList);
          } else {
            toastError(`이미지 정보 조회 도중 문제가 발생하였습니다: ${resultMessage}`);
          }
        });
      } else {
        setImgPreviewFileDetList([]);
      }
    }
  };

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
        width={1000}
        open={open}
        isEscClose={!modalsStatus.active}
        title={'신규 품목추가'}
        onClose={onCloseCommonCallBack}
        footer={
          <PopupFooter>
            <div className="btnArea between">
              <div></div>
              <div className="right">
                <button
                  className="btn btnPurple"
                  onClick={() => {
                    if (selectedRowsDataList.length == 0) {
                      toastError('추가하고자 하는 품목을 하나 이상 선택하십시요.');
                      return;
                    }

                    if (selectedContent == undefined) {
                      toastError('대응되는 품목컨텐츠를 선택 후 재시도하십시요.');
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
                <button className="btn" onClick={onCloseCommonCallBack}>
                  닫기
                </button>
              </div>
            </div>
          </PopupFooter>
        }
      >
        <PopupContent>
          <PopupSearchBox>
            <PopupSearchType className={'type_3'}>
              <Search.DropDown
                title={'매장명'}
                name={'partnerId'}
                value={filters.partnerId}
                onChange={(_name, value) => onChangeFilters('partnerId', value ? Number(value) : undefined)}
                defaultOptions={partnerOptions}
                showAll={true}
                dropDownStyle={{ width: '120px' }}
              />
              <Search.Input
                title={'품목명'}
                name={'prodNm'}
                placeholder={'키워드 입력 후 엔터키 클릭'}
                value={filters.prodNm}
                onEnter={search}
                onChange={onChangeFilters}
                filters={filters}
              />
              <CustomSwitch
                title={'이미지보기'}
                name={'imgShow'}
                checkedLabel={'ON'}
                uncheckedLabel={'OFF'}
                value={imgPreviewBoxOn}
                onChange={(_name, value) => setImgPreviewBoxOn(value)}
                wrapperClassNames={'imgToggle'}
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
                mode: 'multiRow',
                enableClickSelection: true,
              }}
              onSelectionChanged={onSelectionChanged}
              // todo 페이징 영역 한시적 비활성화
              // pagingOptions={pagingOption}
              // pagingDeps={[filters]}
              // onTouchedByBottom={() => {
              //   if (pagingOption) {
              //     // 페이징 관련 동작 처리 영역
              //     if (lastProductInfo != undefined) {
              //       onChangelastInfos('lastId', lastProductInfo.id);
              //       setPaging({
              //         ...paging,
              //         curPage: paging.curPage ? paging.curPage + 1 : 1,
              //       });
              //     } else {
              //       if (paging.curPage != 1) {
              //         toastSuccess(AlertMessage.LastDataHasBeenReached);
              //       }
              //     }
              //   }
              //   return {
              //     pausedMilliseconds: 1000,
              //   };
              // }}
              // onInitializePaging={() => {
              //   setPaging({
              //     curPage: 1,
              //     pageRowCount: 50,
              //   });
              //   onlastInfosReset();
              // }}
              className={'default check'}
            />
            <ImgPreviewBox open={imgPreviewBoxOn} resized={resized} onReSizeReq={() => setResized(!resized)} fileDetList={imgPreviewFileDetList} />
          </div>
          <ConfirmModal
            open={modalsStatus.active && modalsStatus.type == 'ADD_CONTENTS_PRODUCTS'}
            title={`${
              (modalsStatus.stored_temporary || []).length > 1
                ? (modalsStatus.stored_temporary || [])[0]?.prodNm + ' 이외 ' + ((modalsStatus.stored_temporary || []).length - 1).toString() + '개의 품목을'
                : (modalsStatus.stored_temporary || [])[0]?.prodNm + ' 을(를)'
            } 연결품목으로 추가 하시겠습니까?`}
            confirmText={'저장'}
            onConfirm={() => {
              if (!selectedContent?.id) {
                toastError('대응되는 품목컨텐츠를 찾을 수 없습니다.');
                console.error('품목컨텐츠 정보 전달 여부 점검!');
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
