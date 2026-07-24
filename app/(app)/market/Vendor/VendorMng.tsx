'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CellEditRequestEvent, ColDef } from 'ag-grid-community';
import { Search, Table, TableHeader, Title } from '@/components';
import { toastError, toastSuccess } from '@/components';
import { useCommonStore, useVendorStore } from '@/stores';
import type { VendorItem, VendorFilter } from '@/stores';
import { defaultColDef, GridSetting } from '@/libs/ag-grid';
import { useAgGridApi } from '@/hooks';
import CustomNoRowsOverlay from '@/components/CustomNoRowsOverlay';
import CustomGridLoading from '@/components/CustomGridLoading';
import TunedGrid from '@/components/grid/TunedGrid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ConfirmModal } from '@/components/ConfirmModal';
import VendorMngAddPop from '@/components/popup/market/vendor/VendorMngAddPop';

// 그리드에서 바로 수정 가능한 컬럼 (명칭 ~ 기타정보, 등록자 이전까지)
const INLINE_EDITABLE = new Set(['vendorNm', 'location', 'phoneNo', 'phoneNo2', 'kakaoId', 'etcInfo']);

const VendorMng = () => {
  const { onGridReady } = useAgGridApi();
  const menuNm = useCommonStore((s) => s.menuNm);

  // 스토어 값은 각각 개별 셀렉터로 분리하여 사용 (zustand v5)
  const filters = useVendorStore((s) => s.filters);
  const setFilters = useVendorStore((s) => s.setFilters);
  const resetFilters = useVendorStore((s) => s.resetFilters);
  const selectedVendor = useVendorStore((s) => s.selectedVendor);
  const setSelectedVendor = useVendorStore((s) => s.setSelectedVendor);
  const addOpen = useVendorStore((s) => s.addOpen);
  const delOpen = useVendorStore((s) => s.delOpen);
  const setAddOpen = useVendorStore((s) => s.setAddOpen);
  const setDelOpen = useVendorStore((s) => s.setDelOpen);
  const fetchVendors = useVendorStore((s) => s.fetchVendors);
  const updateVendor = useVendorStore((s) => s.updateVendor);
  const deleteVendor = useVendorStore((s) => s.deleteVendor);

  const [rowData, setRowData] = useState<VendorItem[]>([]);
  const queryClient = useQueryClient();

  const {
    isLoading,
    isSuccess,
    data: listData,
    refetch,
  } = useQuery({
    queryKey: ['/partnerVendorMng/list', filters.vendorNm, filters.phoneNo],
    queryFn: () => fetchVendors(filters),
  });

  useEffect(() => {
    if (!isSuccess) return;
    const { resultCode, body, resultMessage } = listData.data;
    if (resultCode === 200) {
      // 조회 결과 행이 읽기전용(frozen)일 수 있어 그리드 인라인 편집을 위해 mutable 복사본으로 저장
      setRowData((body?.rows ?? []).map((r: VendorItem) => ({ ...r })));
    } else {
      toastError(resultMessage ?? '조회 중 오류가 발생했습니다.');
    }
  }, [listData, isSuccess]);

  const { mutate: deleteMutate } = useMutation({
    mutationFn: (id: number) => deleteVendor(id),
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('삭제되었습니다.');
        setDelOpen(false);
        setSelectedVendor(null);
        await queryClient.invalidateQueries({ queryKey: ['/partnerVendorMng/list'] });
      } else {
        toastError(e.data.resultMessage ?? '삭제 중 오류가 발생했습니다.');
      }
    },
  });

  // 그리드 셀 인라인 수정 - id 와 변경된 필드만 전송
  const { mutate: updateVendorMutate } = useMutation({
    mutationFn: updateVendor,
    onSuccess: (e, variables) => {
      if (e.data.resultCode === 200) {
        toastSuccess('수정되었습니다.');
        refetch();
      } else {
        toastError(e.data.resultMessage ?? '수정 중 오류가 발생했습니다.');
      }
    },
    onError: () => {
      toastError('수정 중 오류가 발생했습니다.');
    },
  });

  // readOnlyEdit 모드: ag-grid가 행 객체(frozen)에 직접 대입하지 않고 요청만 발생 -> 우리가 직접 갱신
  const onCellEditRequest = useCallback(
    (event: CellEditRequestEvent<VendorItem>) => {
      const field = event.column.getColId();
      if (!INLINE_EDITABLE.has(field)) return;

      const id = event.data?.id;
      if (!id) return;

      const newValue = typeof event.newValue === 'string' ? event.newValue.trim() : event.newValue;

      // 명칭은 필수값 - 비우면 무시
      if (field === 'vendorNm' && (newValue == null || newValue === '')) {
        toastError('명칭은 필수 항목입니다.');
        return;
      }

      // 로컬 rowData 즉시 반영 (새 객체로 교체)
      setRowData((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: newValue } : row)));
      // id 와 변경된 필드만 전송
      updateVendorMutate({ id, [field]: newValue ?? '' });
    },
    [updateVendorMutate],
  );

  const columnDefs: ColDef<VendorItem>[] = [
    {
      headerName: 'No',
      minWidth: 55,
      maxWidth: 55,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueGetter: (p) => (p.node?.rowIndex != null ? p.node.rowIndex + 1 : ''),
    },
    {
      field: 'vendorNm',
      headerName: '명칭✎',
      minWidth: 160,
      editable: true,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'location',
      headerName: '위치✎',
      minWidth: 200,
      editable: true,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'phoneNo',
      headerName: '연락처✎',
      minWidth: 120,
      editable: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'phoneNo2',
      headerName: '연락처2✎',
      minWidth: 120,
      editable: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'kakaoId',
      headerName: '카톡ID✎',
      minWidth: 120,
      editable: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'etcInfo',
      headerName: '기타정보✎',
      minWidth: 200,
      editable: true,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'updUser',
      headerName: '등록자',
      minWidth: 100,
      maxWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'updTm',
      headerName: '수정일',
      minWidth: 110,
      maxWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: 'DATE',
    },
  ];

  const reset = () => {
    resetFilters();
    setSelectedVendor(null);
    queryClient.invalidateQueries({ queryKey: ['/partnerVendorMng/list'] });
  };

  return (
    <div>
      <Title title={menuNm ?? '협력업체 관리'} reset={reset} search={refetch} />
      <Search className="type_2">
        <Search.Input
          title="명칭"
          name="vendorNm"
          placeholder="명칭을 입력하세요"
          value={filters.vendorNm}
          onChange={(name, value) => setFilters(name as keyof VendorFilter, value as string)}
          onEnter={() => refetch()}
        />
        <Search.Input
          title="연락처"
          name="phoneNo"
          placeholder="연락처를 입력하세요"
          value={filters.phoneNo}
          onChange={(name, value) => setFilters(name as keyof VendorFilter, value as string)}
          onEnter={() => refetch()}
        />
      </Search>
      <Table>
        <TableHeader count={rowData.length} search={refetch}></TableHeader>
        <TunedGrid
          headerHeight={35}
          onGridReady={onGridReady}
          loading={isLoading}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          className="default check"
          rowSelection={{ mode: 'singleRow', enableClickSelection: true }}
          readOnlyEdit
          stopEditingWhenCellsLoseFocus
          onCellEditRequest={onCellEditRequest}
          onRowClicked={(e) => setSelectedVendor(e.data ?? null)}
        />
      </Table>
      <div className="btnArea between">
        <div className="right">
          <button className="btn btn_primary" onClick={() => setAddOpen(true)}>
            등록
          </button>
          <button className="btn btn_danger" onClick={() => setDelOpen(true)} disabled={!selectedVendor}>
            삭제
          </button>
        </div>
      </div>

      <VendorMngAddPop
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => {
          setAddOpen(false);
          queryClient.invalidateQueries({ queryKey: ['/partnerVendorMng/list'] });
        }}
      />

      <ConfirmModal
        open={delOpen}
        title="해당 협력업체를 삭제하시겠습니까?"
        warningMessage="삭제 후 복구할 수 없습니다."
        onConfirm={() => {
          if (selectedVendor) deleteMutate(selectedVendor.id);
        }}
        onClose={(_r) => setDelOpen(false)}
      />
    </div>
  );
};

export default VendorMng;
