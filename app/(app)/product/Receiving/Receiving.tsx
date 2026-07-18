'use client';

import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { Search, Table, TableHeader, Title, toastSuccess } from '@/components';
import { CellEditingStoppedEvent, ColDef } from 'ag-grid-community';
import { toastError } from '@/components';
import { useCommonStore } from '@/stores';
import { useMutation, useQuery } from '@tanstack/react-query';
import { defaultColDef, GridSetting } from '@/libs/ag-grid';
import { useAgGridApi } from '@/hooks';
import useFilters from '../../../../hooks/useFilters';
import CustomNoRowsOverlay from '../../../../components/CustomNoRowsOverlay';
import CustomGridLoading from '../../../../components/CustomGridLoading';
import TunedGrid, { TunedGridRef } from '../../../../components/grid/TunedGrid';
import { authApi } from '@/libs';
import dayjs from 'dayjs';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useReceivingStore } from '@/stores/product/useReceivingStore';
import ReceivingAddPop from '../../../../components/popup/product/receiving/ReceivingAddPop';
import ReceivingModPop from '../../../../components/popup/product/receiving/ReceivingModPop';
import { ReceivingResponseReceivingItem } from '@/generated';

type ListFilter = {
  fromDate: string;
  toDate: string;
  plusMinus: string;
  prodNm: string;
};

const INLINE_EDITABLE = new Set(['plusMinus', 'receivCnt', 'etcCntn']);

const PlusMinusCellEditor = forwardRef((props: any, ref) => {
  const [value, setValue] = useState<string>(props.value ?? 'P');
  const selectRef = useRef<HTMLSelectElement>(null);
  //useImperativeHandle(ref, () => ({ getValue: () => value }));

  // useEffect(() => {
  //   selectRef.current?.focus();
  // }, []);

  return (
    <select
      ref={selectRef}
      value={value}
      onChange={(e) => {
        props.onValueChange?.(e.target.value, props); // 내부 onChange를 밖으로 전달
        setValue(e.target.value);
      }}
      style={{
        height: '100%',
        width: '100%',
        border: 'none',
        fontSize: 13,
        lineHeight: 'normal',
        padding: '0 6px',
        margin: 0,
        boxSizing: 'border-box',
        verticalAlign: 'middle',
        appearance: 'auto',
      }}
    >
      <option value="P">입고</option>
      <option value="M">출고</option>
    </select>
  );
});
PlusMinusCellEditor.displayName = 'PlusMinusCellEditor';

const threeMonthsAgo = dayjs().subtract(3, 'month').format('YYYY-MM-DD');
const today = dayjs().format('YYYY-MM-DD');

const Receiving = () => {
  const { onGridReady } = useAgGridApi();
  const gridRef = useRef<TunedGridRef<ReceivingResponseReceivingItem>>(null);
  const menuNm = useCommonStore((s) => s.menuNm);
  const [modals, openModal, closeModal, deleteReceiving, updateReceivingIfExist] = useReceivingStore((s) => [
    s.modals,
    s.openModal,
    s.closeModal,
    s.deleteReceiving,
    s.updateReceivingIfExist,
  ]);

  const [filters, onChangeFilters, onFiltersReset] = useFilters<ListFilter>({
    fromDate: threeMonthsAgo,
    toDate: today,
    plusMinus: '',
    prodNm: '',
  });

  const [rowData, setRowData] = useState<ReceivingResponseReceivingItem[]>([]);
  const [selectedRow, setSelectedRow] = useState<ReceivingResponseReceivingItem | null>(null);

  const columnDefs: ColDef<ReceivingResponseReceivingItem>[] = [
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
      headerName: '구분 ✎',
      minWidth: 80,
      maxWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      editable: true,
      cellEditor: PlusMinusCellEditor,
      cellRenderer: (p: any) => {
        const isIn = p.value === 'P';
        return <span style={{ color: isIn ? '#1677ff' : '#f56c6c', fontWeight: 600 }}>{isIn ? '입고' : '출고'}</span>;
      },
      // cellEditorParams: {
      // onValueChange: (newValue: any, params: any) => {
      //   console.log('newValue: ', newValue);
      // },
      // },
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
      headerName: '수량 ✎',
      minWidth: 80,
      maxWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      editable: true,
      cellEditor: 'agNumberCellEditor',
      cellEditorParams: { min: 1 },
    },
    {
      field: 'etcCntn',
      headerName: '비고 ✎',
      minWidth: 140,
      suppressHeaderMenuButton: true,
      editable: true,
    },
    { field: 'updUser', headerName: '처리자', minWidth: 90, maxWidth: 110, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: 'updTm',
      headerName: '수정일시',
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

  const { mutate: inlineMutate } = useMutation({
    mutationFn: updateReceivingIfExist,
    onSuccess: (e, variables) => {
      if (e.data.resultCode === 200) {
        toastSuccess('수정되었습니다.');
        // 로컬 rowData 즉시 반영
        setRowData((prev) => prev.map((row) => (row.id === variables.id ? { ...row, ...variables } : row)));
      } else {
        toastError(e.data.resultMessage ?? '수정 중 오류가 발생했습니다.');
        refetch();
      }
    },
    onError: () => {
      toastError('수정 중 오류가 발생했습니다.');
      refetch();
    },
  });

  const onCellEditingStopped = useCallback(
    (e: CellEditingStoppedEvent<ReceivingResponseReceivingItem>) => {
      const field = e.column.getColId();
      if (!INLINE_EDITABLE.has(field)) return;
      if (e.newValue === e.oldValue) return;
      if (e.newValue == null || e.newValue === '') return;

      const id = e.data?.id;
      if (!id) return;

      const payload: Record<string, any> = { id };
      if (field === 'plusMinus') payload.plusMinus = e.newValue;
      else if (field === 'receivCnt') payload.receivCnt = Number(e.newValue);
      else if (field === 'etcCntn') payload.etcCntn = e.newValue;

      inlineMutate(payload);
    },
    [inlineMutate],
  );

  const reset = () => {
    onFiltersReset();
    setRowData([]);
    setSelectedRow(null);
  };

  return (
    <div>
      <Title title={menuNm ?? '입고/출고 관리'} reset={reset} search={refetch} />

      <Search className="type_2">
        <dl>
          <dt>입출고일</dt>
          <dd>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="formBox" style={{ gap: 4 }}>
                <input type="date" value={filters.fromDate} onChange={(e) => onChangeFilters('fromDate', e.target.value)} className="dateInput" />
                <span style={{ padding: '0 2px' }}>~</span>
                <input type="date" value={filters.toDate} onChange={(e) => onChangeFilters('toDate', e.target.value)} className="dateInput" />
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {(
                  [
                    {
                      label: '당일',
                      fn: () => {
                        const d = dayjs().format('YYYY-MM-DD');
                        onChangeFilters('fromDate', d);
                        onChangeFilters('toDate', d);
                      },
                    },
                    {
                      label: '1주일',
                      fn: () => {
                        onChangeFilters('fromDate', dayjs().subtract(6, 'day').format('YYYY-MM-DD'));
                        onChangeFilters('toDate', dayjs().format('YYYY-MM-DD'));
                      },
                    },
                    {
                      label: '1개월',
                      fn: () => {
                        onChangeFilters('fromDate', dayjs().subtract(1, 'month').format('YYYY-MM-DD'));
                        onChangeFilters('toDate', dayjs().format('YYYY-MM-DD'));
                      },
                    },
                  ] as { label: string; fn: () => void }[]
                ).map(({ label, fn }) => (
                  <button key={label} className="btn" onClick={fn} style={{ height: 28, padding: '0 10px', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </dd>
        </dl>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') refetch();
                }}
                style={{ height: 32, padding: '0 8px', border: '1px solid #d9d9d9', borderRadius: 4, minWidth: 160 }}
              />
            </div>
          </dd>
        </dl>
      </Search>
      <Table>
        <TableHeader count={rowData.length} search={refetch}></TableHeader>
        <TunedGrid
          headerHeight={35}
          ref={gridRef}
          onGridReady={onGridReady}
          loading={isLoading}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection={{ mode: 'singleRow', enableClickSelection: true }}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          className="default"
          stopEditingWhenCellsLoseFocus
          onRowClicked={(e) => setSelectedRow(e.data ?? null)}
          onCellEditingStopped={onCellEditingStopped}
        />
      </Table>
      <div className="btnArea between">
        <div className="right">
          <button className="btn btn_primary" onClick={() => openModal('RECEIVING_ADD')}>
            입고/출고 등록
          </button>
          <button
            className="btn btn_primary"
            onClick={() => {
              const api = gridRef.current?.api;
              const selectedNode = api?.getSelectedNodes();
              if (api && selectedNode && selectedNode.length == 1) {
                openModal('RECEIVING_MOD', selectedRow);
              } else {
                toastError('수정하고자하는 건을 먼저 선택하세요');
              }
            }}
          >
            수정
          </button>
          <button
            className="btn btn_primary"
            onClick={() => {
              const api = gridRef.current?.api;
              const selectedNode = api?.getSelectedNodes();
              if (api && selectedNode && selectedNode.length == 1) {
                openModal('RECEIVING_DEL', selectedRow);
              } else {
                toastError('삭제 하고자 하는 건을 먼저 선택하세요');
              }
            }}
          >
            삭제
          </button>
        </div>
      </div>

      <ReceivingAddPop open={modals.active && modals.type === 'RECEIVING_ADD'} onClose={() => closeModal('RECEIVING_ADD')} onSuccess={refetch} />

      <ReceivingModPop
        open={modals.active && modals.type === 'RECEIVING_MOD'}
        item={(modals.stored_temporary as ReceivingResponseReceivingItem) ?? null}
        onClose={() => closeModal('RECEIVING_MOD')}
        onSuccess={refetch}
      />

      <ConfirmModal
        open={modals.active && modals.type === 'RECEIVING_DEL'}
        title="해당 입고/출고 내역을 삭제하시겠습니까?"
        warningMessage="삭제 후 복구할 수 없습니다."
        onConfirm={() => {
          const item = modals.stored_temporary as ReceivingResponseReceivingItem;
          if (item?.id) deleteMutate({ id: item.id });
        }}
        onClose={(_r) => closeModal('RECEIVING_DEL')}
      />
    </div>
  );
};

export default Receiving;
