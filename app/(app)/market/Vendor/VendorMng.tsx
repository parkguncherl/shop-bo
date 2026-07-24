'use client';

import React, { useEffect, useState } from 'react';
import { ColDef } from 'ag-grid-community';
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
import VendorMngModPop from '@/components/popup/market/vendor/VendorMngModPop';

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
  const modOpen = useVendorStore((s) => s.modOpen);
  const delOpen = useVendorStore((s) => s.delOpen);
  const setAddOpen = useVendorStore((s) => s.setAddOpen);
  const setModOpen = useVendorStore((s) => s.setModOpen);
  const setDelOpen = useVendorStore((s) => s.setDelOpen);
  const fetchVendors = useVendorStore((s) => s.fetchVendors);
  const deleteVendor = useVendorStore((s) => s.deleteVendor);

  const [rowData, setRowData] = useState<VendorItem[]>([]);
  const queryClient = useQueryClient();

  const {
    isLoading,
    isSuccess,
    data: listData,
    refetch,
  } = useQuery({
    queryKey: ['/partnerVendorMng/list', filters.partnerNm, filters.phoneNo],
    queryFn: () => fetchVendors(filters),
  });

  useEffect(() => {
    if (!isSuccess) return;
    const { resultCode, body, resultMessage } = listData.data;
    if (resultCode === 200) {
      setRowData(body?.rows ?? []);
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
      field: 'partnerNm',
      headerName: '명칭',
      minWidth: 160,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'location',
      headerName: '위치',
      minWidth: 200,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'phoneNo',
      headerName: '연락처',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'phoneNo2',
      headerName: '연락처2',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'kakaoId',
      headerName: '카톡ID',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'etcInfo',
      headerName: '기타정보',
      minWidth: 200,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'creUser',
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
          name="partnerNm"
          placeholder="명칭을 입력하세요"
          value={filters.partnerNm}
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
          rowSelection={{ mode: 'singleRow', enableClickSelection: true }}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          className="default"
          onRowClicked={(e) => setSelectedVendor(e.data ?? null)}
        />
      </Table>
      <div className="btnArea between">
        <div className="right">
          <button className="btn btn_primary" onClick={() => setAddOpen(true)}>
            등록
          </button>
          <button className="btn btn_default" onClick={() => setModOpen(true)} disabled={!selectedVendor}>
            수정
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

      {selectedVendor && (
        <VendorMngModPop
          open={modOpen}
          item={selectedVendor}
          onClose={() => setModOpen(false)}
          onSuccess={() => {
            setModOpen(false);
            queryClient.invalidateQueries({ queryKey: ['/partnerVendorMng/list'] });
          }}
        />
      )}

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
