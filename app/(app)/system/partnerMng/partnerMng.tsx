'use client';
/**
 화주정보
 /wms/system/partnerMng
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAgGridApi, useDidMountEffect } from '../../../../hooks';
import { useCommonStore } from '../../../../stores';
import useFilters from '../../../../hooks/useFilters';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../../libs';
import { PartnerResponsePaging } from '../../../../generated';
import { Pagination, Search, Table, TableHeader, Title, toastError } from '../../../../components';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import { PartnerPagingFilter, usePartnerStore } from '../../../../stores/usePartnerStore';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import PartnerAddPop from '../../../../components/popup/partner/PartnerAddPop';
import PartnerModPop from '../../../../components/popup/partner/PartnerModPop';
import TunedGrid from '../../../../components/grid/TunedGrid';
import CustomNewDatePicker from '../../../../components/CustomNewDatePicker';

const PartnerMng = () => {
  /** Grid Api */
  const { onGridReady } = useAgGridApi();
  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);
  /** 스토어 */
  const [paging, setPaging, selectedPartner, setSelectedPartner, modalType, openModal] = usePartnerStore((s) => [
    s.paging,
    s.setPaging,
    s.selectedPartner,
    s.setSelectedPartner,
    s.modalType,
    s.openModal,
  ]);
  /** 필터 */
  const [filters, onChangeFilters, onFiltersReset, dispatch] = useFilters<PartnerPagingFilter>({
    startDate: '2026-01-01',
    endDate: new Date().toISOString().slice(0, 10),
  });
  const columnDefs = useMemo<ColDef<PartnerResponsePaging>[]>(
    () => [
      { field: 'no', headerName: 'No', minWidth: 36, maxWidth: 36, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
      { field: 'partnerTypeNm', headerName: '파트너타입', minWidth: 150, maxWidth: 150, suppressHeaderMenuButton: true },
      { field: 'partnerNm', headerName: '파트너명', minWidth: 150, maxWidth: 150, suppressHeaderMenuButton: true },
      {
        field: 'phoneNo',
        headerName: '전화번호',
        minWidth: 100,
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        valueFormatter: (params) => {
          const value = params.value;
          if (value && typeof value === 'string') {
            return value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
          }
          return value;
        },
        suppressHeaderMenuButton: true,
      },
      { field: 'repNm', headerName: '대표자명', minWidth: 120, maxWidth: 120, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
      { field: 'email', headerName: '회사이메일', minWidth: 150, maxWidth: 150, cellStyle: GridSetting.CellStyle.LEFT, suppressHeaderMenuButton: true },
    ],
    [],
  );

  /** 검색 */
  const onSearch = async () => {
    setPaging({
      curPage: 1,
    });
    await partnersRefetch();
  };

  /** 화주관리 페이징 목록 조회 */
  const {
    data: partners,
    isLoading,
    isSuccess: isListSuccess,
    refetch: partnersRefetch,
  } = useQuery({
    queryKey: ['/partner/paging', paging.curPage],
    queryFn: () =>
      authApi.get('/partner/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filters,
        },
      }),
  });

  useEffect(() => {
    if (isListSuccess) {
      const { resultCode, body, resultMessage } = partners.data;
      if (resultCode === 200) {
        setPaging(body?.paging);
      } else {
        toastError(resultMessage);
      }
    }
  }, [partners, isListSuccess, setPaging]);

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    await onSearch();
  };
  useEffect(() => {
    // 검색 조건 또는 페이지가 변경될 때마다 검색 수행
    onSearch();
  }, []);

  /** 드롭다운 옵션 */
  const dropdownOptions = [
    { key: 'SL', value: 'select', label: '선택' },
    { key: 'HW', value: '0', label: '화주' },
    { key: 'DM', value: 'any', label: '도매' },
  ];
  /** 드롭다운 변경 시 */
  const onChangeOptions = useCallback(async (name: string, value: string | number) => {
    dispatch({ name: name, value: value });
  }, []);
  useDidMountEffect(() => {
    // 드롭다운 변경시
    onSearch();
  }, [filters.upperPartnerId]);

  /** 셀 클릭 이벤트 */
  const onCellClicked = async (cellClickedEvent: CellClickedEvent) => {
    const { colDef, data } = cellClickedEvent;
    // 버튼 셀 제외
    if (colDef.field === 'action') {
      return;
    }
    openModal('MOD');
  };

  return (
    <div>
      <Title title={menuNm ? `${menuNm}` : ''} filters={filters} search={search} />

      <Search className="type_2 full">
        <Search.Input
          title={'검색'}
          name={'partnerNm'}
          placeholder={'소매처 입력'}
          value={filters.partnerNm}
          onEnter={search}
          onChange={onChangeFilters}
          filters={filters}
        />
        <CustomNewDatePicker
          title={'기간'}
          type={'range'}
          defaultType={'today'}
          startName={'startDate'}
          endName={'endDate'}
          value={[filters.startDate, filters.endDate]}
          onEnter={search}
          onChange={onChangeFilters}
        />
        <Search.DropDown
          title={'구분'}
          name={'upperPartnerId'}
          defaultOptions={dropdownOptions}
          placeholder={'파트너 구분'}
          onChange={onChangeOptions}
          // onEnter={onEnter}
        />
      </Search>

      <Table>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={search}></TableHeader>
        <div className={'ag-theme-alpine wmsDefault'}>
          <TunedGrid
            headerHeight={35}
            onGridReady={onGridReady}
            loading={isLoading}
            rowData={(partners?.data?.body?.rows as PartnerResponsePaging[]) || []}
            gridOptions={{ rowHeight: 28 }}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            paginationPageSize={paging.pageRowCount}
            rowSelection={{
              mode: 'singleRow',
              enableClickSelection: true,
            }}
            onCellClicked={onCellClicked}
            onRowClicked={(e) => {
              setSelectedPartner(e.data as PartnerResponsePaging);
              e.api.deselectAll();
            }}
          />
        </div>
        <div className={'btnArea'}>
          <button
            className={'btn btnBlue'}
            onClick={() => {
              setSelectedPartner({});
              openModal('ADD');
            }}
          >
            화주 신규추가
          </button>
        </div>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>
      {modalType.type === 'ADD' && modalType.active && <PartnerAddPop data={selectedPartner || {}} />}
      {modalType.type === 'MOD' && modalType.active && <PartnerModPop datas={selectedPartner || {}} />}
    </div>
  );
};

export default PartnerMng;
