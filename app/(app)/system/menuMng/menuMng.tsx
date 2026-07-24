'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Table, Title } from '@/components';
import { Menu, ApiResponseListMenu, MenuResponsePaging } from '@/generated';
import { CellClickedEvent, ColDef, RowDoubleClickedEvent } from 'ag-grid-community';
import { Pagination, TableHeader, toastError } from '@/components';
import { useCommonStore, useMenuStore } from '@/stores';
import { useQuery } from '@tanstack/react-query';
import { defaultColDef, GridSetting } from '@/libs/ag-grid';
import { useAgGridApi } from '@/hooks';
import { MenuAddPop, MenuAuthPop, MenuModPop, MenuExcelUploadPop } from '@/components/popup/system/menuMng';
import { authApi } from '@/libs';
import { DropDownOption } from '@/types/DropDownOptions';
import { AuthsCellRenderer } from '@/components/cellRenderer/menu/AuthsCellRender';
import TunedGrid from '@/components/grid/TunedGrid';

/** 시스템 - 메뉴접근 권한관리 페이지 */
const MenuMng = () => {
  /** Grid Api */
  const { gridApi, onGridReady } = useAgGridApi();

  /** 공통 스토어 - State */
  const upMenuNm = useCommonStore((s) => s.upMenuNm);
  const menuNm = useCommonStore((s) => s.menuNm);

  /** 공통 스토어 - State */
  const menuUpdYn = useCommonStore((s) => s.menuUpdYn);

  /** 코드관리 스토어 - State */
  const modalType = useMenuStore((s) => s.modalType);
  const openModal = useMenuStore((s) => s.openModal);
  const paging = useMenuStore((s) => s.paging);
  const filter = useMenuStore((s) => s.filter);
  const selectedMenu = useMenuStore((s) => s.selectedMenu);
  const setSelectedMenu = useMenuStore((s) => s.setSelectedMenu);
  const setPaging = useMenuStore((s) => s.setPaging);
  const setFilter = useMenuStore((s) => s.setFilter);
  const excelDown = useMenuStore((s) => s.excelDown);
  const onClear = useMenuStore((s) => s.onClear);

  /** 메뉴관리 페이징 목록 조회 */
  const {
    data: menu,
    isSuccess: isMenuListSuccess,
    isLoading,
    refetch: MenuRefetch,
  } = useQuery({
    queryKey: ['/menu/paging', paging.curPage, filter],
    queryFn: () =>
      authApi.get('/menu/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filter,
        },
      }),
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (isMenuListSuccess) {
      const { resultCode, body, resultMessage } = menu.data;
      if (resultCode === 200) {
        setPaging(body?.paging);
      } else {
        toastError(resultMessage);
      }
    }
  }, [menu, isMenuListSuccess]);

  /** 드롭다운 옵션 */
  const { data: dropdownOptions } = useQuery({
    queryKey: ['/menu/top'],
    queryFn: () => authApi.get<ApiResponseListMenu>('/menu/top'),
    select: (e) => {
      const { body, resultCode } = e.data;
      if (resultCode === 200) {
        const fetchedOptions = body?.map((d) => {
          return {
            key: d.menuCd,
            value: d.menuCd,
            label: d.menuNm,
          };
        }) as DropDownOption[];
        return [{ key: 'TOP', value: 'TOP', label: '선택' } as DropDownOption].concat(fetchedOptions);
      }
      return undefined;
    },
  });

  /** 컬럼 설정 - 권한 컬럼 포함 */
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([
    { field: 'no', headerName: 'NO', minWidth: 70, maxWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'menuCd', headerName: '코드', minWidth: 150, suppressHeaderMenuButton: true },
    { field: 'menuNm', headerName: '이름', minWidth: 150, suppressHeaderMenuButton: true },
    { field: 'menuEngNm', headerName: '영문명', minWidth: 150, suppressHeaderMenuButton: true },
    { field: 'menuUri', headerName: filter?.upMenuCd === 'TOP' ? 'ICO' : 'URI', minWidth: 150, suppressHeaderMenuButton: true },
    { field: 'menuOrder', headerName: '순서', minWidth: 60, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: 'auths',
      headerName: '권한',
      tooltipField: 'auths',
      minWidth: 100,
      suppressHeaderMenuButton: true,
      onCellClicked: useCallback((e: CellClickedEvent) => {
        setSelectedMenu(e.data);
      }, []),
      cellRenderer: AuthsCellRenderer,
      cellRendererParams: {
        title: '권한 수정',
      },
    },
    { field: 'createDateTime', headerName: '등록일시', minWidth: 150, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ]);

  const excelUploadFn = () => {
    openModal('EXCEL');
  };

  const excelDownFn = () => {
    excelDown();
  };

  const onRowClicked = useCallback((e: RowDoubleClickedEvent) => {
    setSelectedMenu(e.data as Menu);
    if (e.api.getFocusedCell()?.column.getColId() !== 'auths') {
      openModal('MOD');
    }
  }, []);

  const onChangeOptions = useCallback((name: string, value: string | number) => {
    setFilter({ ...filter, upMenuCd: value as unknown as string });
    setColumnDefs(
      columnDefs.map((def) => {
        if (def.field === 'menuUri') {
          def.headerName = value === 'TOP' ? 'ICO' : 'URI';
        }
        return def;
      }),
    );
    gridApi?.refreshHeader();
  }, []);

  useEffect(() => {
    onClear();
  }, []);

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    await onSearch();
  };

  const onSearch = async () => {
    await MenuRefetch();
  };

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''}>
        <Title.Category
          name={'upMenuCd'}
          value={filter.upMenuCd}
          options={dropdownOptions}
          onChangeOptions={onChangeOptions}
          onReset={async () => {
            await setFilter({ ...filter, upMenuCd: 'TOP' });
            await onSearch();
          }}
        />
      </Title>
      <Table>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={search}></TableHeader>
        <TunedGrid
          headerHeight={35}
          onGridReady={onGridReady}
          loading={isLoading}
          rowData={(menu?.data?.body?.rows as MenuResponsePaging[]) || []}
          gridOptions={{ rowHeight: 28 }}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          paginationPageSize={paging.pageRowCount}
          rowSelection={{
            mode: 'singleRow',
            enableClickSelection: false,
          }}
          onRowDoubleClicked={onRowClicked}
          className={'wmsDefault'}
        />
        <div className={'btnArea'}>
          <button className={'btn '} onClick={() => openModal('ADD')}>
            {'등록'}
          </button>
        </div>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>
      {menuUpdYn && modalType.type === 'AUTH_MOD' && modalType.active && <MenuAuthPop data={selectedMenu || {}} />}
      {menuUpdYn && modalType.type === 'ADD' && modalType.active && (
        <MenuAddPop data={{ upMenuCd: filter.upMenuCd, upMenuNm: dropdownOptions?.find((o) => o.key === filter.upMenuCd)?.label }} />
      )}
      {modalType.type === 'MOD' && modalType.active && <MenuModPop data={selectedMenu || {}} />}
      {menuUpdYn && modalType.type === 'EXCEL' && modalType.active && <MenuExcelUploadPop />}
    </div>
  );
};

export default MenuMng;
