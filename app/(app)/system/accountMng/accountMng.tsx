//C:\work\shop-frontend\pages\system\accountMng.tsx
'use client';

import React, { useEffect, useMemo } from 'react';
import { Search, Table, Title } from '../../../../components';
import { Pagination, TableHeader, toastError } from '../../../../components';
import { useAccountStore } from '../../../../stores';
import { UserResponsePaging, UserResponseSelectByLoginId } from '../../../../generated';
import { CellDoubleClickedEvent, ColDef } from 'ag-grid-community';
import { useQuery } from '@tanstack/react-query';
import { useAgGridApi } from '../../../../hooks';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import useFilters from '../../../../hooks/useFilters';
import { authApi } from '../../../../libs';
import { Placeholder } from '../../../../libs/const';
import { AccountAddPop, AccountModPop, AccountUnLockPop } from '../../../../components/popup/system/accountMng';
import { LockCellRender, LockCellRenderProps } from '../../../../components/cellRenderer/account/LockCellRender';
import { useCommonStore } from '../../../../stores';
import CustomGridLoading from '../../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../../components/CustomNoRowsOverlay';
import TunedGrid from '../../../../components/grid/TunedGrid';
import { AxiosResponse } from 'axios';

/** 응답 data(userByLoginId) 에서 사용하고자 하는 본문을 추출하는 순수함수 */
const targetedUserByLoginId = (userByLoginId: AxiosResponse | undefined) => {
  if (userByLoginId == undefined) {
    return undefined;
  }
  const { resultCode, body, resultMessage } = userByLoginId.data;
  if (resultCode === 200) {
    return body as UserResponseSelectByLoginId | undefined;
  } else {
    console.error(resultMessage);
  }
  return undefined;
};

/** 시스템 - 계정관리 페이지 */
const AccountMng = () => {
  /** Grid Api */
  const { onGridReady } = useAgGridApi();

  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);

  /** 공통 스토어 - State */
  const [menuUpdYn] = useCommonStore((s) => [s.menuUpdYn]);

  /** 계정관리 스토어 - State */
  const [paging, setPaging, modalType, openModal] = useAccountStore((s) => [
    s.paging,
    s.setPaging,
    // s.selectedUser,
    // s.setSelectedUser,
    s.modalType,
    s.openModal,
  ]);

  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    loginId: undefined,
    userNm: undefined,
    authCd: undefined,
    phoneNo: undefined,
    compNm: undefined,
    omsWmsTp: undefined,
    belongNm: undefined,
    deptNm: undefined,
    positionNm: undefined,
    useYn: undefined,
    myAuthCd: undefined,
    partnerId: undefined,
  });

  //const [loginId, setLoginId] = useState<string | undefined>(undefined);

  /** 계정관리 페이징 목록 조회 */
  const {
    data: accounts,
    isSuccess: isAccountListSuccess,
    isLoading: accountListIsInLoading,
    refetch: accountsRefetch,
  } = useQuery({
    queryKey: ['/user/paging', paging.curPage, filters.phoneNo, filters.authCd, filters.useYn, filters.omsWmsTp],
    queryFn: (): any =>
      authApi.get('/user/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filters,
        },
      }),
  });

  useEffect(() => {
    if (isAccountListSuccess) {
      const { resultCode, body, resultMessage } = accounts.data;
      if (resultCode === 200) {
        setPaging(body?.paging);
      } else {
        toastError(resultMessage);
      }
    }
  }, [accounts, isAccountListSuccess, setPaging]);

  // useEffect(() => {
  //   search();
  // }, [filters]);

  /** 선택된 사용자 정보 조회 */
  const {
    data: userByLoginId,
    isLoading: userByLoginIdIsLoading,
    isSuccess: isUserByLoginIdSuccess,
    isFetching: userByLoginIdIsFetching,
    refetch: userByLoginIdRefetch,
  } = useQuery({
    queryKey: ['/user/' + filters.loginId],
    queryFn: () => authApi.get(`/user/${filters.loginId}`),
    enabled: !!filters.loginId,
    //staleTime: 0,
    // onSuccess: (e) => {
    //   const { resultCode, body, resultMessage } = e.data;
    //   if (resultCode === 200) {
    //     setSelectedUser(body);
    //   } else {
    //     toastError(resultMessage);
    //   }
    // },
  });

  // useEffect(() => {
  //   if (isUserByLoginIdSuccess) {
  //     const { resultCode, body, resultMessage } = userByLoginId.data;
  //     if (resultCode === 200) {
  //       // todo
  //       //setSelectedUser(body);
  //     } else {
  //       toastError(resultMessage);
  //     }
  //   }
  // }, [userByLoginId, isUserByLoginIdSuccess]);

  /** 계정관리 필드별 설정 */
  const columnDefs = useMemo<ColDef[]>(
    () => [
      { field: 'no', headerName: 'NO', minWidth: 60, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
      { field: 'loginId', headerName: 'ID(e-mail)', minWidth: 200, suppressHeaderMenuButton: true },
      { field: 'userNm', headerName: '이름', minWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
      { field: 'authNm', headerName: '권한[화주]', minWidth: 100, suppressHeaderMenuButton: true },
      {
        field: 'belongNm',
        headerName: '소속',
        minWidth: 100,
        valueFormatter: (params) => {
          return params.value == '' ? '-' : params.value;
        },
        suppressHeaderMenuButton: true,
      },
      { field: 'workLogisNm', headerName: '연결창고', minWidth: 100, maxWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
      { field: 'useYn', headerName: '사용여부', minWidth: 90, maxWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
      { field: 'lastLoginDateTime', headerName: '최근접속기록', minWidth: 150, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
      {
        field: 'unLock',
        headerName: '잠금해제',
        cellRenderer: LockCellRender,
        cellRendererParams: { data: targetedUserByLoginId(userByLoginId) } satisfies Partial<LockCellRenderProps>,
        minWidth: 100,
        maxWidth: 110,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
    ],
    [userByLoginId],
  );

  /** 검색 */
  const onSearch = async () => {
    setPaging({
      curPage: 1,
    });
    await accountsRefetch();
  };

  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    await onFiltersReset();
    await onSearch();
  };

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    /*if (Utils.isEmptyValues(filters)) {
      toastError('검색조건을 1개 이상 입력하세요.');
      return;
    }*/
    await onSearch();
  };

  /** 계정관리, 셀 클릭 이벤트 */
  const onCellDoubleClicked = async (cellDoubleClickedEvent: CellDoubleClickedEvent) => {
    if (cellDoubleClickedEvent.column.getColId() !== 'unLock') {
      openModal('MOD');
    }
  };

  useEffect(() => {
    return () => {
      setPaging({
        curPage: 1,
        totalRowCount: 0,
      });
    };
  }, []);

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset} search={search} />
      <Search className="type_2">
        <Search.Input
          title={'이름'}
          name={'userNm'}
          placeholder={Placeholder.Default}
          value={filters.userNm}
          onChange={onChangeFilters}
          onEnter={search}
          filters={filters}
        />
        <Search.Input
          title={'전화번호'}
          name={'phoneNo'}
          placeholder={Placeholder.Default}
          value={filters.phoneNo}
          onChange={onChangeFilters}
          onEnter={search}
          filters={filters}
        />
        <Search.DropDown
          title={'권한'}
          name={'authCd'}
          //defaultOptions={[...DefaultOptions.Select]}
          codeUpper={'10020'}
          value={filters.authCd || ''}
          onChange={onChangeFilters}
        />
        <Search.DropDown
          title={'상태'}
          name={'useYn'}
          //defaultOptions={[...DefaultOptions.Select]}
          codeUpper={'10030'}
          value={filters.useYn || ''}
          onChange={onChangeFilters}
        />
        <Search.DropDown
          title={'사용자구분'}
          name={'omsWmsTp'}
          defaultOptions={[
            { value: 'O', label: 'OMS 사용자' },
            { value: 'W', label: 'WMS 사용자' },
          ]}
          value={filters.omsWmsTp || ''}
          onChange={onChangeFilters}
        />
        {/*        <Search.Input
          title={'소속'}
          name={'belongNm'}
          placeholder={Placeholder.Default}
          value={filters.belongNm}
          onChange={onChangeFilters}
          onEnter={search}
          filters={filters}
        />
        <Search.Input
          title={'부서'}
          name={'deptNm'}
          placeholder={Placeholder.Default}
          value={filters.deptNm}
          onChange={onChangeFilters}
          onEnter={search}
          filters={filters}
        />
        <Search.Input
          title={'직책'}
          name={'positionNm'}
          placeholder={Placeholder.Default}
          value={filters.positionNm}
          onChange={onChangeFilters}
          onEnter={search}
          filters={filters}
        />*/}
      </Search>
      <Table>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={search}></TableHeader>
        <TunedGrid
          headerHeight={35}
          onGridReady={onGridReady}
          loading={accountListIsInLoading}
          rowData={(accounts?.data?.body?.rows as UserResponsePaging[]) || []}
          gridOptions={{ rowHeight: 28 }}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          paginationPageSize={paging.pageRowCount}
          //rowSelection={'single'}
          rowSelection={{
            mode: 'singleRow',
          }}
          onRowClicked={(e) => {
            //setLoginId(e.data.loginId);
            //gridUserRefetch();

            onChangeFilters('loginId', e.data.loginId);
          }}
          onCellDoubleClicked={onCellDoubleClicked}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
        />
        <div className={'btnArea'}>
          {menuUpdYn && (
            // 권한 존재하는 경우 랜더링
            <div className="btnArea">
              <button className="btn" onClick={() => openModal('ADD')}>
                등록
              </button>
              <button className="btn" onClick={() => openModal('MOD')}>
                수정
              </button>
            </div>
          )}
        </div>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>
      {menuUpdYn && modalType.type === 'ADD' && modalType.active && <AccountAddPop />}
      {!userByLoginIdIsFetching && !userByLoginIdIsLoading && modalType.type === 'MOD' && modalType.active && (
        <AccountModPop data={targetedUserByLoginId(userByLoginId) || {}} />
      )}
      {menuUpdYn && !userByLoginIdIsFetching && !userByLoginIdIsLoading && modalType.type === 'UNLOCK' && modalType.active && (
        <AccountUnLockPop data={targetedUserByLoginId(userByLoginId) || {}} />
      )}
    </div>
  );
};

export default AccountMng;
