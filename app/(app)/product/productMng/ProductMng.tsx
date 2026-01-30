'use client';

import React, { useEffect, useState } from 'react';
import { Search, Table, Title } from '../../../../components';
import { MenuResponsePaging } from '../../../../generated';
import { ColDef } from 'ag-grid-community';
import { TableHeader, toastError } from '../../../../components';
import { useCommonStore, useMenuStore } from '../../../../stores';
import { useQuery } from '@tanstack/react-query';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import { useAgGridApi } from '../../../../hooks';
import { authApi } from '../../../../libs';
import TunedGrid from '../../../../components/grid/TunedGrid';

/** 시스템 - 메뉴접근 권한관리 페이지 */
const ProductMng = () => {
  /** Grid Api */
  const { onGridReady } = useAgGridApi();

  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);

  /** 코드관리 스토어 - State */
  const [modalType, openModal, filter] = useMenuStore((s) => [s.modalType, s.openModal, s.filter]);

  /** 메뉴관리 페이징 목록 조회 */
  const {
    data: menu,
    isSuccess: isMenuListSuccess,
    isLoading,
    refetch: MenuRefetch,
  } = useQuery({
    queryKey: ['/menu/paging', filter],
    queryFn: () =>
      authApi.get('/menu/paging', {
        params: {
          ...filter,
        },
      }),
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (isMenuListSuccess) {
      const { resultCode, body, resultMessage } = menu.data;
      if (resultCode === 200) {
        // todo state 관리
      } else {
        toastError(resultMessage);
      }
    }
  }, [menu, isMenuListSuccess]);

  /** 컬럼 설정 - 권한 컬럼 포함 */
  const [columnDefs] = useState<ColDef[]>([
    { field: 'no', headerName: 'NO', minWidth: 70, maxWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'menuCd', headerName: '코드', minWidth: 150, suppressHeaderMenuButton: true },
    { field: 'menuNm', headerName: '이름', minWidth: 150, suppressHeaderMenuButton: true },
    { field: 'menuEngNm', headerName: '영문명', minWidth: 150, suppressHeaderMenuButton: true },
    { field: 'menuUri', headerName: filter?.upMenuCd === 'TOP' ? 'ICO' : 'URI' || '', minWidth: 150, suppressHeaderMenuButton: true },
    { field: 'menuOrder', headerName: '순서', minWidth: 60, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'createDateTime', headerName: '등록일시', minWidth: 150, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ]);

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    await onSearch();
  };

  const onSearch = async () => {
    await MenuRefetch();
  };

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} />
      <Search className="type_2">
        <Search.DropDown
          title={'미정'}
          name={'partnerId'}
          // placeholder={Placeholder.Select}
          // value={filters.partnerId}
          // onChange={onChangeFilters}
          // defaultOptions={partnerList}
          showAll={true}
          readonly={true}
        />
      </Search>
      <Table>
        <TableHeader count={0} search={search}></TableHeader>
        <div className="tblPreview">
          <div className="layoutBox">
            <div className={'layout60'}>
              <TunedGrid
                headerHeight={35}
                onGridReady={onGridReady}
                loading={isLoading}
                rowData={(menu?.data?.body?.rows as MenuResponsePaging[]) || []}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                rowSelection={{
                  mode: 'singleRow',
                  enableClickSelection: false,
                }}
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
            <div className={'layout40'}>
              <TunedGrid
                headerHeight={35}
                onGridReady={onGridReady}
                loading={isLoading}
                rowData={(menu?.data?.body?.rows as MenuResponsePaging[]) || []}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                rowSelection={{
                  mode: 'singleRow',
                  enableClickSelection: false,
                }}
                className={'wmsDefault'}
              />
              <div className="btnArea between">
                <div className="left">
                  <button className={'btn'} onClick={() => openModal('ADD')}>
                    {'행추가'}
                  </button>
                  <button className={'btn'} onClick={() => openModal('ADD')}>
                    {'행삭제'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Table>
    </div>
  );
};

export default ProductMng;
