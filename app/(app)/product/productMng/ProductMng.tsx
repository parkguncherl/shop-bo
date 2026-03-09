'use client';

import React, { useEffect, useState } from 'react';
import { Search, Table, Title } from '../../../../components';
import { ProductMngRequestProductInfoFilter, ProductMngResponseProductInfo } from '../../../../generated';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { TableHeader, toastError } from '../../../../components';
import { useCommonStore, useMenuStore } from '../../../../stores';
import { useQuery } from '@tanstack/react-query';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import { useAgGridApi } from '../../../../hooks';
import { authApi } from '../../../../libs';
import TunedGrid from '../../../../components/grid/TunedGrid';
import useFilters from '../../../../hooks/useFilters';
import { useProductMngStore } from '../../../../stores/product/useProductMngStore';
import { Placeholder } from '../../../../libs/const';
import { Utils } from '../../../../libs/utils';
import { ContentElement } from '../../../../components/form/FormCombineParagraphs';

type targetedFileTypes = 'rep' | 'detail' | 'size' | 'etc';

interface targetedFileSetsElementInfo {
  fileSeq?: number;
  fileSrc?: string;
}
interface targetedFileSetInfo {
  type: targetedFileTypes;
  fileId: number;
  fileInfos: targetedFileSetsElementInfo[];
}

/** 시스템 - 상품관리 페이지 */
const ProductMng = () => {
  /** Grid Api */
  const { onGridReady } = useAgGridApi();

  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);
  const [getFileUrl, selectFileList] = useCommonStore((s) => [s.getFileUrl, s.selectFileList]);

  /** 상품관리 스토어 - State */
  const [modals, openModal, closeModal] = useProductMngStore((s) => [s.modals, s.openModal, s.closeModal]);

  /** 검색 필터 */
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters<ProductMngRequestProductInfoFilter>({
    prodNm: undefined,
  });

  /** local states */
  const [productInfoList, setproductInfoList] = useState<ProductMngResponseProductInfo[]>([]);

  const [targetedFileSetInfo, setTargetedFileSetInfo] = useState<targetedFileSetInfo | undefined>(undefined);

  useEffect(() => {
    console.log('targetedFileSetInfo: ', targetedFileSetInfo);
  }, [targetedFileSetInfo]);

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
    { field: 'prodNm', headerName: '상품명', minWidth: 120, maxWidth: 120, suppressHeaderMenuButton: true },
    { field: 'prodTpNm', headerName: '상품대분류', minWidth: 120, maxWidth: 120, suppressHeaderMenuButton: true },
    { field: 'prodDetTpNm', headerName: '상품소분류', minWidth: 150, maxWidth: 150, suppressHeaderMenuButton: true },
    { field: 'prodColors', headerName: '크기', minWidth: 130, maxWidth: 130, suppressHeaderMenuButton: true },
    { field: 'prodSizes', headerName: '색상', minWidth: 130, maxWidth: 130, suppressHeaderMenuButton: true },
    { field: 'composition', headerName: '혼용율', minWidth: 120, maxWidth: 120, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { field: 'makeYmd', headerName: '출시일', minWidth: 100, maxWidth: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    {
      field: 'orgAmt',
      headerName: '원가',
      minWidth: 80,
      maxWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.RIGHT,
      valueFormatter: (params: any) => {
        return Utils.setComma(Math.round(params.value));
      },
    },
    {
      field: 'sellAmt',
      headerName: '판매가',
      minWidth: 80,
      maxWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.RIGHT,
      valueFormatter: (params: any) => {
        return Utils.setComma(Math.round(params.value));
      },
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
  ]);

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    await onSearch();
  };

  const onSearch = async () => {
    await productInfosRefetch();
  };

  const onCellClickedCallBack = async (event: CellClickedEvent<ProductMngResponseProductInfo>) => {
    const cellsColField = event.column.getColDef().field;

    if (cellsColField && ['repFileIdCnt', 'detailFileIdCnt', 'sizeFileIdCnt', 'etcFileIdCnt'].includes(cellsColField)) {
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
        <Search.Input title={'미정'} name={'prodNm'} placeholder={Placeholder.Input} value={filters.prodNm} onChange={onChangeFilters} onEnter={onSearch} />
      </Search>
      <Table>
        <TableHeader count={0} search={search}></TableHeader>
        <div className="tblPreview">
          <div className="layoutBox">
            <div className={'layout70'}>
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
                onCellClicked={onCellClickedCallBack}
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
            <div className={'layout30'}></div>
          </div>
        </div>
      </Table>
    </div>
  );
};

export default ProductMng;
