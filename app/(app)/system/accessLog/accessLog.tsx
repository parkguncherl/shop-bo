'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, Table, Title } from '@/components';
import { Pagination, TableHeader, toastError } from '@/components';
import { ContactResponsePaging } from '@/generated';
import { ColDef, ColGroupDef, RowDoubleClickedEvent } from 'ag-grid-community';
import { useQuery } from '@tanstack/react-query';
import { useCommonStore, useContactState } from '@/stores';
import { defaultColDef, GridSetting } from '@/libs/ag-grid';
import { AccessLogDeatilPop } from '@/components/popup/system/accessLog';
import useFilters from '@/hooks/useFilters';
import { Placeholder } from '@/libs/const';
import { authApi } from '@/libs';
import TunedGrid, { TunedGridRef } from '@/components/grid/TunedGrid';
import CustomGridLoading from '@/components/CustomGridLoading';
import CustomNoRowsOverlay from '@/components/CustomNoRowsOverlay';

const AccessLog = () => {
  /** Grid Api */
  const nowPage = 'wms_accessLog'; // filter 저장 2025-01-21
  const gridRef = useRef<TunedGridRef<ContactResponsePaging>>(null);
  /** 공통 스토어 - State */
  const upMenuNm = useCommonStore((s) => s.upMenuNm);
  const menuNm = useCommonStore((s) => s.menuNm);

  /** 스토어 */
  const [modalType, openModal, paging, setSelectContact, setPaging] = useContactState((s) => [
    s.modalType,
    s.openModal,
    s.paging,
    s.setSelectContact,
    s.setPaging,
  ]);

  /** 필터 */
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    loginId: undefined,
    userNm: undefined,
    uriNm: undefined,
    uri: undefined,
    tranType: undefined,
    partnerId: undefined,
  });

  /** 초기화 버튼 클릭 시 */
  const reset = () => {
    onFiltersReset();
    setPaging({
      curPage: 1,
    });
  };

  /** 행 클릭 이벤트 */
  const onRowClicked = (e: RowDoubleClickedEvent) => {
    const selectedNodes = e.api.getSelectedNodes();
    const selectedData = selectedNodes.map((node) => node.data);

    setSelectContact(selectedData[0] as ContactResponsePaging);

    openModal('DETAIL');
    e.api.deselectAll();
  };

  /** 필드별 설정 */
  const [columnDefs] = useState<(ColDef | ColGroupDef)[]>([
    { field: 'no', headerName: 'NO', minWidth: 90, maxWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'loginId', headerName: 'ID(e-mail)', minWidth: 200, suppressHeaderMenuButton: true },
    { field: 'userNm', headerName: '이름', minWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'authNm', headerName: '권한', minWidth: 150, suppressHeaderMenuButton: true },
    {
      field: 'belongNm',
      headerName: '소속',
      minWidth: 100,
      valueFormatter: (params) => {
        return params.value == '' ? '-' : params.value;
      },
      suppressHeaderMenuButton: true,
    },
    {
      field: 'deptNm',
      headerName: '부서',
      minWidth: 100,
      valueFormatter: (params) => {
        return params.value == '' ? '-' : params.value;
      },
      suppressHeaderMenuButton: true,
    },
    { field: 'uri', headerName: 'URI', minWidth: 100, suppressHeaderMenuButton: true },
    {
      headerName: '거래',
      children: [
        { field: 'tranTypeNm', headerName: '종류', minWidth: 90, maxWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
        { field: 'uriNm', headerName: '내용', minWidth: 100, suppressHeaderMenuButton: true },
      ],
      suppressHeaderMenuButton: true,
    },
    { field: 'creTm', headerName: '거래일시', minWidth: 150, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ]);

  /** 서버접속로그 페이징 목록 조회 */
  const {
    data: response,
    isSuccess: isAccessLogSuccess,
    //isLoading,
    refetch: accessLogRefetch,
  } = useQuery({
    queryKey: ['/contact/paging', paging.curPage, filters.tranType],
    queryFn: () =>
      authApi.get('/contact/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filters,
        },
      }),
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (isAccessLogSuccess) {
      const { resultCode, body, resultMessage } = response.data;
      if (resultCode === 200) {
        setPaging(body?.paging);
      } else {
        toastError(resultMessage);
      }
    }
  }, [response, isAccessLogSuccess, setPaging]);

  const onEnter = () => {
    onSearch();
  };

  useEffect(() => {
    return () => {
      setPaging({
        curPage: 1,
        totalRowCount: 0,
      });
    };
  }, []);

  /** 검색 버튼 클릭 시 */
  const search = () => {
    onSearch();
  };

  const onSearch = () => {
    setPaging({
      curPage: 1,
    });
    accessLogRefetch();
  };

  const onReset = () => {
    reset();
    setPaging({
      curPage: 1,
    });
  };

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={onReset} search={onSearch} filters={filters} />
      <Search className={'type_4'}>
        <Search.Input
          title={'ID(e-mail)'}
          name={'loginId'}
          placeholder={Placeholder.Default}
          value={filters.loginId}
          onChange={onChangeFilters}
          onEnter={onEnter}
          filters={filters}
        />
        <Search.Input
          title={'사용자명'}
          name={'userNm'}
          placeholder={Placeholder.Default}
          value={filters.userNm}
          onChange={onChangeFilters}
          onEnter={onEnter}
          filters={filters}
        />
        {/*<Search.DropDown*/}
        {/*  title={'종류'}*/}
        {/*  name={'tranType'}*/}
        {/*  //defaultOptions={[...DefaultOptions.Select]}*/}
        {/*  // codeUpper={'50050'} // todo 백앤드 페이징 조회 영역에서는 분명히 50050 으로 명시되어 있으나 code 테이블 조회에서는 조회되지 아니함, 추후 적절한 상위코드 할당 후 역시 정의할 시 수정할 것*/}
        {/*  enumName={'TranType'}*/}
        {/*  value={filters.tranType || ''}*/}
        {/*  onChange={onChangeFilters}*/}
        {/*/>*/}
        <Search.Input
          title={'내용'}
          name={'uriNm'}
          placeholder={Placeholder.Default}
          value={filters.uriNm}
          onChange={onChangeFilters}
          onEnter={onEnter}
          filters={filters}
        />
        <Search.Input
          title={'uri'}
          name={'uri'}
          placeholder={'특정 uri를 통한 접속이력 검색...'}
          value={filters.uri}
          onChange={onChangeFilters}
          onEnter={onEnter}
          filters={filters}
        />
      </Search>
      <Table>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={search}></TableHeader>
        <TunedGrid
          ref={gridRef}
          rowSelection={{
            mode: 'singleRow',
            enableClickSelection: true,
          }}
          rowData={(response?.data?.body?.rows as ContactResponsePaging[]) || []}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          paginationPageSize={paging.pageRowCount}
          onRowDoubleClicked={onRowClicked}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
        />
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>
      {modalType.type === 'DETAIL' && modalType.active && <AccessLogDeatilPop />}
    </div>
  );
};

export default AccessLog;
