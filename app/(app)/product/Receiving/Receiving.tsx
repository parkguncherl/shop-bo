'use client';

import React, { useEffect, useState } from 'react';
import { Search, Title, toastSuccess } from '../../../../components';
import { ColDef } from 'ag-grid-community';
import { toastError } from '../../../../components';
import { useCommonStore } from '../../../../stores';
import { useMutation, useQuery } from '@tanstack/react-query';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import { useAgGridApi } from '../../../../hooks';
import useFilters from '../../../../hooks/useFilters';
import CustomNoRowsOverlay from '../../../../components/CustomNoRowsOverlay';
import CustomGridLoading from '../../../../components/CustomGridLoading';
import TunedGrid from '../../../../components/grid/TunedGrid';
import { authApi } from '../../../../libs';
import dayjs from 'dayjs';
import CustomDatePickerAsPartiallyStateFulFn from '../../../../components/CustomDatePickerAsPartiallyStateFulFn';
import { ConfirmModal } from '../../../../components/ConfirmModal';
import { useReceivingStore } from '../../../../stores/product/useReceivingStore';
import ReceivingAddPop from '../../../../components/popup/product/receiving/ReceivingAddPop';
import ReceivingModPop from '../../../../components/popup/product/receiving/ReceivingModPop';
import type { ReceivingItem } from '../../../../components/popup/product/receiving/ReceivingModPop';

type ListFilter = {
  fromDate: string;
  toDate: string;
  plusMinus: string;
  prodNm: string;
};

const today = dayjs().format('YYYY-MM-DD');
const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
const threeMonthsLater = dayjs().add(3, 'month').format('YYYY-MM-DD');

const Receiving = () => {
  const { onGridReady } = useAgGridApi();
  const menuNm = useCommonStore((s) => s.menuNm);
  const [modals, openModal, closeModal, deleteReceiving] = useReceivingStore((s) => [
    s.modals,
    s.openModal,
    s.closeModal,
    s.deleteReceiving,
  ]);

  const [filters, onChangeFilters, onFiltersReset] = useFilters<ListFilter>({
    fromDate: monthStart,
    toDate: threeMonthsLater,
    plusMinus: '',
    prodNm: '',
  });

  const [rowData, setRowData] = useState<ReceivingItem[]>([]);
  const [selectedRow, setSelectedRow] = useState<ReceivingItem | null>(null);

  const columnDefs: ColDef<ReceivingItem>[] = [
    {
      headerName: 'No',
      minWidth: 55,
      maxWidth: 55,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueGetter: (p) => (p.node?.rowIndex != null ? p.node.rowIndex + 1 : ''),
    },
    {
      field: 'plusMinus',
      headerName: '구분',
      minWidth: 70,
      maxWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: (p: any) => {
        const isIn = p.value === 'P';
        return (
          <span style={{ color: isIn ? '#1677ff' : '#f56c6c', fontWeight: 600 }}>
            {isIn ? '입고' : '출고'}
          </span>
        );
      },
    },
    {
      field: 'receivDate',
      headerName: '입출고일',
      minWidth: 110,
      maxWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (p) => (p.value ? dayjs(p.value).format('YYYY-MM-DD') : ''),
    },
    { field: 'prodNm', headerName: '상품명', minWidth: 160, suppressHeaderMenuButton: true },
    {
      field: 'productDetColor',
      headerName: '컬러',
      minWidth: 80,
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'productDetSize',
      headerName: '사이즈',
      minWidth: 70,
      maxWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'receivCnt',
      headerName: '수량',
      minWidth: 70,
      maxWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    { field: 'etcCntn', headerName: '비고', minWidth: 120, suppressHeaderMenuButton: true },
    { field: 'creUser', headerName: '처리자', minWidth: 90, maxWidth: 110, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: 'creTm',
      headerName: '등록일시',
      minWidth: 150,
      maxWidth: 165,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (p) => (p.value ? dayjs(p.value).format('YYYY-MM-DD HH:mm') : ''),
    },
  ];

  const {
    data: listData,
    isLoading,
    isSuccess,
    refetch,
  } = useQuery({
    queryKey: ['/receiving/receivingList', filters],
    queryFn: () => authApi.get('/receiving/receivingList', { params: filters }),
    enabled: !!(filters.fromDate && filters.toDate),
  });

  useEffect(() => {
    if (!isSuccess) return;
    const { resultCode, body, resultMessage } = listData.data;
    if (resultCode === 200) {
      setRowData(body ?? []);
    } else {
      toastError(resultMessage ?? '조회 중 오류가 발생했습니다.');
    }
  }, [listData, isSuccess]);

  const { mutate: deleteMutate } = useMutation({
    mutationFn: deleteReceiving,
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('삭제되었습니다.');
        closeModal('RECEIVING_DEL');
        setSelectedRow(null);
        await refetch();
      } else {
        toastError(e.data.resultMessage ?? '삭제 중 오류가 발생했습니다.');
      }
    },
  });

  const reset = () => {
    onFiltersReset();
    setRowData([]);
    setSelectedRow(null);
  };

  return (
    <div>
      <Title title={menuNm ?? '입고/출고 관리'} reset={reset} search={refetch} />

      <Search className="type_1">
        <CustomDatePickerAsPartiallyStateFulFn
          title="입출고일"
          type="range"
          startName="fromDate"
          endName="toDate"
          onChange={onChangeFilters}
          value={[filters.fromDate, filters.toDate]}
        />
        <dl>
          <dt>구분</dt>
          <dd>
            <div className="formBox">
              <select
                value={filters.plusMinus}
                onChange={(e) => onChangeFilters('plusMinus', e.target.value)}
                style={{ height: 32, padding: '0 8px', border: '1px solid #d9d9d9', borderRadius: 4, minWidth: 100 }}
              >
                <option value="">전체</option>
                <option value="P">입고</option>
                <option value="M">출고</option>
              </select>
            </div>
          </dd>
        </dl>
        <dl>
          <dt>상품명</dt>
          <dd>
            <div className="formBox">
              <input
                className="inputBox"
                placeholder="상품명 검색"
                value={filters.prodNm}
                onChange={(e) => onChangeFilters('prodNm', e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') refetch(); }}
                style={{ height: 32, padding: '0 8px', border: '1px solid #d9d9d9', borderRadius: 4, minWidth: 160 }}
              />
            </div>
          </dd>
        </dl>
      </Search>

      <div style={{ padding: '0 16px 16px' }}>
        {/* 상단 버튼 영역 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn_primary" onClick={() => openModal('RECEIVING_ADD')}>
            입고/출고 등록
          </button>
          {selectedRow && (
            <>
              <button className="btn btn_default" onClick={() => openModal('RECEIVING_MOD', selectedRow)}>
                수정
              </button>
              <button className="btn btn_danger" onClick={() => openModal('RECEIVING_DEL', selectedRow)}>
                삭제
              </button>
            </>
          )}
        </div>

        <TunedGrid
          headerHeight={35}
          onGridReady={onGridReady}
          loading={isLoading}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection={{ mode: 'singleRow', enableClickSelection: true }}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          className="default"
          domLayout="autoHeight"
          onRowClicked={(e) => setSelectedRow(e.data ?? null)}
        />
      </div>

      {/* 등록 팝업 */}
      <ReceivingAddPop
        open={modals.active && modals.type === 'RECEIVING_ADD'}
        onClose={() => closeModal('RECEIVING_ADD')}
        onSuccess={refetch}
      />

      {/* 수정 팝업 */}
      <ReceivingModPop
        open={modals.active && modals.type === 'RECEIVING_MOD'}
        item={(modals.stored_temporary as ReceivingItem) ?? null}
        onClose={() => closeModal('RECEIVING_MOD')}
        onSuccess={refetch}
      />

      {/* 삭제 확인 */}
      <ConfirmModal
        open={modals.active && modals.type === 'RECEIVING_DEL'}
        title="해당 입고/출고 내역을 삭제하시겠습니까?"
        warningMessage="삭제 후 복구할 수 없습니다."
        onConfirm={() => {
          const item = modals.stored_temporary as ReceivingItem;
          if (item?.id) deleteMutate({ id: item.id });
        }}
        onClose={(_r) => closeModal('RECEIVING_DEL')}
      />
    </div>
  );
};

export default Receiving;
