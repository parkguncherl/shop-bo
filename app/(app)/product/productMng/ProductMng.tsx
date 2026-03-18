'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Search, Table, Title } from '../../../../components';
import {
  ProductMngRequestProductDetInfoFilter,
  ProductMngRequestProductInfoFilter,
  ProductMngResponseProductDetInfo,
  ProductMngResponseProductInfo,
} from '../../../../generated';
import { CellClickedEvent, ColDef, ICellEditorParams } from 'ag-grid-community';
import { TableHeader, toastError } from '../../../../components';
import { useCommonStore } from '../../../../stores';
import { useQuery } from '@tanstack/react-query';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import { useAgGridApi } from '../../../../hooks';
import { authApi } from '../../../../libs';
import TunedGrid from '../../../../components/grid/TunedGrid';
import useFilters from '../../../../hooks/useFilters';
import { useProductMngStore } from '../../../../stores/product/useProductMngStore';
import {PARTNER_CODE, Placeholder} from '../../../../libs/const';
import { Utils } from '../../../../libs/utils';
import SrcEnumerator, { SrcElement, SrcEnumeratorProps } from '../../../../components/layout/product/productMng/SrcEnumerator';
import { FileUploadPop } from '../../../../components/popup/common';
import ProductInfoAddPop from '../../../../components/popup/product/productMng/ProductInfoAddPop';
import ProductModPop from '../../../../components/popup/product/productMng/ProductModPop';
import ProductDetInfoPop from '../../../../components/popup/product/productMng/ProductDetInfoPop';
import {usePartnerCodeStore} from "../../../../stores/usePartnerCodeStore";
import {PartnerCodePop} from "../../../../components/popup/system/PartnerCodePop";

type targetedFileTypes = 'rep' | 'detail' | 'size' | 'etc';

interface targetedFileSetsElementInfo extends SrcElement {
  //fileSeq?: number;
  //fileSrc?: string;
}
interface targetedFileSetInfo extends Omit<SrcEnumeratorProps, 'title' | 'srcInfo'> {
  type?: targetedFileTypes; // 색상 등의 경우 undefined
  rowData: ProductMngResponseProductInfo; // file 호출을 요청하게끔 한 상호작용이 발생한 행의 data
  fileId: number;
  fileInfos: targetedFileSetsElementInfo[];
}

// interface MngProductInfo extends ProductMngResponseProductInfo {
//   representedProdColor?: string;
// }

/** 시스템 - 상품관리 페이지 */
const ProductMng = () => {
  /** Grid Api */
  const { onGridReady } = useAgGridApi();

  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);
  const [getFileUrl, selectFileList] = useCommonStore((s) => [s.getFileUrl, s.selectFileList]);

  /** 상품관리 스토어 - State */
  const [modals, openModal, closeModal] = useProductMngStore((s) => [s.modals, s.openModal, s.closeModal]);
  const [partnerCodeModals, partnerCodeOpenModal, partnerCodeCloseModal] = usePartnerCodeStore((s) => [s.modals, s.openModal, s.closeModal]);
  /** 검색 필터 */
  const [filters, onChangeFilters] = useFilters<ProductMngRequestProductInfoFilter>({
    prodNm: undefined,
  });
  const [detFilters, onChangeDetFilters, onDetFiltersReset] = useFilters<ProductMngRequestProductDetInfoFilter>({
    prodId: undefined,
    prodDetColor: undefined,
  });

  /** local states */
  const [productInfoList, setProductInfoList] = useState<ProductMngResponseProductInfo[]>([]);
  const [productDetInfo, setProductDetInfo] = useState<ProductMngResponseProductDetInfo | undefined>(undefined); // prodId + prodDetColor 조합으로 조회된 결과는 고유하리라 기대되니 배열이 아닌 단일 객체로 관리

  const [targetedFileSetInfo, setTargetedFileSetInfo] = useState<targetedFileSetInfo | undefined>(undefined);

  const [selectedRowsData, setSelectedRowsData] = useState<ProductMngResponseProductInfo | undefined>(undefined);

  /** 상품정보 목록 조회 */
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
        setProductInfoList(body || []);
      } else {
        toastError(resultMessage);
      }
    }
  }, [productInfos, isProductInfosSuccess]);

  /** 상품상세정보 목록 조회 */
  const {
    data: productDetInfos,
    isSuccess: isProductDetInfosSuccess,
    // isLoading: isProductDetInfosLoading,
    // refetch: productDetInfosRefetch,
  } = useQuery({
    queryKey: ['/productMng/productDetInfoList', detFilters.prodDetColor],
    queryFn: () =>
      authApi.get('/productMng/productDetInfoList', {
        params: {
          ...detFilters,
        },
      }),
    refetchOnMount: 'always',
    enabled: detFilters.prodId != undefined,
  });

  useEffect(() => {
    if (isProductDetInfosSuccess) {
      const { resultCode, body, resultMessage } = productDetInfos.data;
      if (resultCode === 200) {
        if (body.length > 1) {
          console.error('단일 반환을 기대하였으나 다수의 데이터 반환됨, 데이터 오염 여부 점검!');
          return;
        }
        setProductDetInfo(body[0]);
      } else {
        toastError(resultMessage);
      }
    }
  }, [productDetInfos, isProductDetInfosSuccess]);

  useEffect(() => {
    if (productDetInfo == undefined || !productDetInfo.fileId) {
      setTargetedFileSetInfo(undefined); // state 초기화
      return;
    }
    const targetedFileSetInfoRefreshFn = async (): Promise<targetedFileSetInfo | undefined> => {
      return {
        type: undefined, // 색상이므로
        rowData: productInfoList.filter((productInfo) => productInfo.id == productDetInfo.productId)[0],
        fileId: productDetInfo.fileId as number,
        fileInfos: await selectFileList(productDetInfo.fileId as number).then(async (fileDetList) => {
          console.log('fileDetList: ', fileDetList);
          const fileSetsElementInfos: targetedFileSetsElementInfo[] = [];
          for (let index = 0; index < fileDetList.length; index++) {
            fileSetsElementInfos.push({
              fileSeq: fileDetList[index].fileSeq,
              fileSrc: fileDetList[index].sysFileNm ? await getFileUrl(fileDetList[index].sysFileNm as string) : undefined,
            });
          }
          return fileSetsElementInfos;
        }),
      };
    };
    targetedFileSetInfoRefreshFn().then((updatedFileSetInfo) => {
      setTargetedFileSetInfo(updatedFileSetInfo);
    });
  }, [productDetInfo]);

  /** 컬럼 설정 */
  const columnDefs = useMemo<ColDef<ProductMngResponseProductInfo>[]>(
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
      { field: 'prodNm', headerName: '상품명', minWidth: 120, maxWidth: 120, suppressHeaderMenuButton: true },
      { field: 'prodTpNm', headerName: '상품대분류', minWidth: 120, maxWidth: 120, suppressHeaderMenuButton: true },
      { field: 'prodDetTpNm', headerName: '상품소분류', minWidth: 150, maxWidth: 150, suppressHeaderMenuButton: true },
      { field: 'prodSizes', headerName: '크기', minWidth: 130, maxWidth: 130, suppressHeaderMenuButton: true },
      {
        field: 'prodColors',
        headerName: '색상',
        minWidth: 130,
        maxWidth: 130,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: (params: ICellEditorParams) => {
          const splittedColors: string[] = params.value.split(',');
          return {
            values: splittedColors,
          };
        },
        // valueFormatter: (params) => {
        //   if (params.data?.representedProdColor) {
        //     return params.data?.representedProdColor; // representedProdColor 우선 출력
        //   }
        //   return params.value; // comma 단위로 쪼개어 나열된 기본 prodColors 반환
        // },
        valueSetter: (params) => {
          onChangeDetFilters('prodId', params.data.id);
          onChangeDetFilters('prodDetColor', params.newValue);

          setProductInfoList((prevState) =>
            prevState.map((prev) => {
              if (prev.id == params.data.id) {
                return {
                  ...prev,
                  representedProdColor: params.newValue,
                };
              }
              return prev;
            }),
          );

          // false를 반환하여 그리드 데이터 업데이트를 원천 차단
          return false;
        },
        suppressHeaderMenuButton: true,
      },
      { field: 'composition', headerName: '혼용율', minWidth: 120, maxWidth: 120, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      { field: 'makeYmd', headerName: '출시일', minWidth: 100, maxWidth: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      {
        field: 'orgAmt',
        headerName: '원가',
        minWidth: 80,
        maxWidth: 80,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => Utils.setComma(Math.round(params.value)),
      },
      {
        field: 'sellAmt',
        headerName: '판매가',
        minWidth: 80,
        maxWidth: 80,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => Utils.setComma(Math.round(params.value)),
      },
      { field: 'repFileIdCnt', headerName: '대표이미지', minWidth: 80, maxWidth: 80, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
      {
        field: 'detailFileIdCnt',
        headerName: '상세이미지',
        minWidth: 80,
        maxWidth: 80,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'sizeFileIdCnt',
        headerName: '사이즈이미지',
        minWidth: 80,
        maxWidth: 80,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      { field: 'etcFileIdCnt', headerName: '기타이미지', minWidth: 80, maxWidth: 80, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    ],
    [],
  );

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    await onSearch();
  };

  const onSearch = async () => {
    await productInfosRefetch();
  };

  const onCellClickedCallBack = async (event: CellClickedEvent<ProductMngResponseProductInfo>) => {
    const cellsColField = event.column.getColDef().field;

    // 대표이미지 이하 4개의 컬럼 중 하나를 클릭하는 경우 동작
    if (cellsColField && ['repFileIdCnt', 'detailFileIdCnt', 'sizeFileIdCnt', 'etcFileIdCnt'].includes(cellsColField)) {
      setProductInfoList(productInfos?.data.body || []); // query cached 된 값으로 초기화(색상 목록과의 상호작용으로 어떠한 색상이 선택되어 있는 경우에 대한 초기화 동작)
      onDetFiltersReset(); // 상세정보 필터 또한 초기화

      if (event.data && (event.data[cellsColField as keyof ProductMngResponseProductInfo] as number) == 0) {
        // 카운트된 이미지 개수가 0인경우 초기화 동작 이하가 무의미하므로 return
        setTargetedFileSetInfo(undefined);
        return;
      }
      if (cellsColField == 'repFileIdCnt') {
        if (!event.data?.repFileId) {
          toastError('file 식별자를 찾을 수 없음');
          return;
        }
        if (targetedFileSetInfo?.fileId == event.data?.repFileId) {
          return;
        }
        setTargetedFileSetInfo({
          type: 'rep',
          rowData: event.data,
          fileId: event.data.repFileId,
          fileInfos: await selectFileList(event.data.repFileId).then(async (fileDetList) => {
            const fileSetsElementInfos: targetedFileSetsElementInfo[] = [];
            for (let index = 0; index < fileDetList.length; index++) {
              fileSetsElementInfos.push({
                fileSeq: fileDetList[index].fileSeq,
                fileSrc: fileDetList[index].sysFileNm ? await getFileUrl(fileDetList[index].sysFileNm as string) : undefined,
              });
            }
            return fileSetsElementInfos;
          }),
        });
      } else if (cellsColField == 'detailFileIdCnt') {
        if (!event.data?.detailFileId) {
          toastError('file 식별자를 찾을 수 없음');
          return;
        }
        if (targetedFileSetInfo?.fileId == event.data?.detailFileId) {
          return;
        }
        setTargetedFileSetInfo({
          type: 'detail',
          rowData: event.data,
          fileId: event.data?.detailFileId,
          fileInfos: await selectFileList(event.data.detailFileId).then(async (fileDetList) => {
            const fileSetsElementInfos: targetedFileSetsElementInfo[] = [];
            for (let index = 0; index < fileDetList.length; index++) {
              fileSetsElementInfos.push({
                fileSeq: fileDetList[index].fileSeq,
                fileSrc: fileDetList[index].sysFileNm ? await getFileUrl(fileDetList[index].sysFileNm as string) : undefined,
              });
            }
            return fileSetsElementInfos;
          }),
        });
      } else if (cellsColField == 'sizeFileIdCnt') {
        if (!event.data?.sizeFileId) {
          toastError('file 식별자를 찾을 수 없음');
          return;
        }
        if (targetedFileSetInfo?.fileId == event.data?.sizeFileId) {
          return;
        }
        setTargetedFileSetInfo({
          type: 'size',
          rowData: event.data,
          fileId: event.data?.sizeFileId,
          fileInfos: await selectFileList(event.data.sizeFileId).then(async (fileDetList) => {
            const fileSetsElementInfos: targetedFileSetsElementInfo[] = [];
            for (let index = 0; index < fileDetList.length; index++) {
              fileSetsElementInfos.push({
                fileSeq: fileDetList[index].fileSeq,
                fileSrc: fileDetList[index].sysFileNm ? await getFileUrl(fileDetList[index].sysFileNm as string) : undefined,
              });
            }
            return fileSetsElementInfos;
          }),
        });
      } else if (cellsColField == 'etcFileIdCnt') {
        if (!event.data?.etcFileId) {
          toastError('file 식별자를 찾을 수 없음');
          return;
        }
        if (targetedFileSetInfo?.fileId == event.data?.etcFileId) {
          return;
        }
        setTargetedFileSetInfo({
          type: 'etc',
          rowData: event.data,
          fileId: event.data?.etcFileId,
          fileInfos: await selectFileList(event.data.etcFileId).then(async (fileDetList) => {
            const fileSetsElementInfos: targetedFileSetsElementInfo[] = [];
            for (let index = 0; index < fileDetList.length; index++) {
              fileSetsElementInfos.push({
                fileSeq: fileDetList[index].fileSeq,
                fileSrc: fileDetList[index].sysFileNm ? await getFileUrl(fileDetList[index].sysFileNm as string) : undefined,
              });
            }
            return fileSetsElementInfos;
          }),
        });
      }
    }
  };

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} />
      <Search className="type_2">
        <Search.Input title={'상품명'} name={'prodNm'} placeholder={Placeholder.Input} value={filters.prodNm} onChange={onChangeFilters} onEnter={onSearch} />
      </Search>
      <Table>
        <div className="tblPreview">
          <div className="layoutBox">
            <div className={'layout70'}>
              <TableHeader count={productInfoList.length} search={search}></TableHeader>
              <TunedGrid<ProductMngResponseProductInfo>
                headerHeight={35}
                onGridReady={onGridReady}
                loading={isProductInfosLoading}
                rowData={productInfoList}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                rowSelection={{
                  mode: 'singleRow',
                  enableClickSelection: true,
                }}
                onSelectionChanged={(event) => {
                  const selectedRows = event.api.getSelectedRows();
                  setSelectedRowsData(selectedRows.length > 0 ? selectedRows[0] : undefined);
                }}
                popupParent={typeof document !== 'undefined' ? document.body : undefined}// ag grid 내장 드롭다운 사용 시 그리드가 사라지는 현상을 방지하기 위하여 document.body 영역을 popup의 부모 요소로 명시
                onCellClicked={onCellClickedCallBack}
              />
              <div className="btnArea between">
                <div className="left">
                  <button
                    className={'btn btn_blue'}
                    onClick={() => {
                      partnerCodeOpenModal('PARTNER_CODE_OPEN');
                    }}
                  >
                    상품카테고리 추가
                  </button>
                </div>
                <div className="right">
                  <button
                    className={'btn btn_blue'}
                    onClick={() => {
                      openModal('PROD_INFO_ADD');
                    }}
                  >
                    상품추가
                  </button>
                  <button
                    className={`btn ${selectedRowsData != undefined && 'btn_blue'}`}
                    disabled={selectedRowsData == undefined}
                    onClick={() => {
                      openModal('PROD_DET_INFO_ADD');
                    }}
                  >
                    {`${selectedRowsData == undefined ? '상세정보 추가할 상품 선택' : selectedRowsData.prodNm + ' 이하 상세정보 추가'}`}
                  </button>
                  <button
                    className={`btn ${selectedRowsData != undefined && 'btn_blue'}`}
                    disabled={selectedRowsData == undefined}
                    onClick={() => {
                      openModal('PROD_MOD');
                    }}
                  >
                    {`${selectedRowsData == undefined ? '수정할 행 선택' : selectedRowsData.prodNm + ' 을 수정'}`}
                  </button>
                  <button
                    className={`btn ${selectedRowsData != undefined && 'btn_blue'}`}
                    disabled={selectedRowsData == undefined}
                    onClick={() => {
                      openModal('PROD_DET_INFO');
                    }}
                  >
                    {`${selectedRowsData == undefined ? '상품 데이터 선택..' : selectedRowsData.prodNm + ' 의 상품상세 목록 출력'}`}
                  </button>
                </div>
              </div>
            </div>
            <div className={'layout30'}>
              <SrcEnumerator
                title={{
                  left: !targetedFileSetInfo
                    ? ''
                    : `${targetedFileSetInfo?.rowData.prodNm ? '[' + targetedFileSetInfo?.rowData.prodNm + ']' : ''} ${
                        targetedFileSetInfo?.type == 'rep'
                          ? '대표이미지'
                          : targetedFileSetInfo?.type == 'detail'
                          ? '상세이미지'
                          : targetedFileSetInfo?.type == 'size'
                          ? '사이즈이미지'
                          : targetedFileSetInfo?.type == 'etc'
                          ? '기타이미지'
                          : detFilters.prodDetColor != undefined
                          ? detFilters.prodDetColor
                          : '알수 없음'
                      }`,
                }}
                srcInfo={
                  targetedFileSetInfo?.fileId != undefined
                    ? {
                        fileId: targetedFileSetInfo?.fileId,
                        srcElements: [...(targetedFileSetInfo?.fileInfos || [])],
                      }
                    : undefined
                }
                callBack={{
                  onToUpperReqSuccess: async () => {
                    const targetedFileSetInfoRefreshFn = async (prevState: targetedFileSetInfo | undefined) => {
                      return {
                        ...prevState,
                        fileInfos: !prevState?.fileId
                          ? undefined
                          : await selectFileList(prevState.fileId).then(async (fileDetList) => {
                              const fileSetsElementInfos: targetedFileSetsElementInfo[] = [];
                              for (let index = 0; index < fileDetList.length; index++) {
                                fileSetsElementInfos.push({
                                  fileSeq: fileDetList[index].fileSeq,
                                  fileSrc: fileDetList[index].sysFileNm ? await getFileUrl(fileDetList[index].sysFileNm as string) : undefined,
                                });
                              }
                              return fileSetsElementInfos;
                            }),
                      } as targetedFileSetInfo;
                    };

                    const refreshedTargetedFileSetInfo = await targetedFileSetInfoRefreshFn(targetedFileSetInfo);
                    setTargetedFileSetInfo(refreshedTargetedFileSetInfo);
                  },
                }}
              >
                <div className="btnArea between">
                  {targetedFileSetInfo?.fileId && (
                    <>
                      <div className="left"></div>
                      <div className="right">
                        <button
                          className={'btn btn_blue'}
                          onClick={() => {
                            openModal('IMG_UPLOAD');
                          }}
                        >
                          {'업로드'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </SrcEnumerator>
            </div>
          </div>
        </div>
      </Table>
      <FileUploadPop
        open={modals.type == 'IMG_UPLOAD' && modals.active}
        onClose={() => closeModal('IMG_UPLOAD')}
        onlyImg={true}
        fileId={targetedFileSetInfo?.fileId}
        onSuccess={async () => {
          const targetedFileSetInfoRefreshFn = async (prevState: targetedFileSetInfo | undefined) => {
            return {
              ...prevState,
              fileInfos: !prevState?.fileId
                ? undefined
                : await selectFileList(prevState.fileId).then(async (fileDetList) => {
                    const fileSetsElementInfos: targetedFileSetsElementInfo[] = [];
                    for (let index = 0; index < fileDetList.length; index++) {
                      fileSetsElementInfos.push({
                        fileSeq: fileDetList[index].fileSeq,
                        fileSrc: fileDetList[index].sysFileNm ? await getFileUrl(fileDetList[index].sysFileNm as string) : undefined,
                      });
                    }
                    return fileSetsElementInfos;
                  }),
            } as targetedFileSetInfo;
          };

          const refreshedTargetedFileSetInfo = await targetedFileSetInfoRefreshFn(targetedFileSetInfo);
          setTargetedFileSetInfo(refreshedTargetedFileSetInfo);
        }}
      />
      <ProductInfoAddPop
        open={modals.active && (modals.type == 'PROD_INFO_ADD' || modals.type == 'PROD_DET_INFO_ADD')}
        onClose={() => {
          closeModal(modals.type);
        }}
        onSuccess={() => {
          closeModal(modals.type);

          productInfosRefetch();
          onDetFiltersReset();
        }}
        productInfo={modals.type == 'PROD_DET_INFO_ADD' ? selectedRowsData : undefined}
      />
      <ProductModPop
        open={modals.active && modals.type == 'PROD_MOD'}
        onClose={() => {
          closeModal(modals.type);
        }}
        onSuccess={() => {
          closeModal(modals.type);

          productInfosRefetch();
          onDetFiltersReset();
        }}
        productInfo={selectedRowsData}
      />
      <ProductDetInfoPop
        open={modals.active && modals.type == 'PROD_DET_INFO'}
        onClose={() => {
          closeModal(modals.type);
        }}
        onUpdated={() => {
          closeModal(modals.type);

          productInfosRefetch();
          onDetFiltersReset();
        }}
        productInfo={selectedRowsData}
      />
      <PartnerCodePop
        partnerCodeUpper={PARTNER_CODE.categories.code}
        title={'상품카테고리관리'}
        activated={partnerCodeModals?.type === 'PARTNER_CODE_OPEN' && partnerCodeModals.active}
        codeName={PARTNER_CODE.categories.name}
        onCloseRequestEmerged={() => partnerCodeCloseModal('PARTNER_CODE_OPEN')}
      />
    </div>
  );
};

export default ProductMng;
