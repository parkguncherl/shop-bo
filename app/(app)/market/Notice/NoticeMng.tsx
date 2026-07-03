'use client';

import React, { useEffect, useState } from 'react';
import { ColDef } from 'ag-grid-community';
import { Search, Table, Title } from '../../../../components';
import { toastError, toastSuccess } from '../../../../components/ToastMessage';
import { useCommonStore } from '../../../../stores';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import { useAgGridApi } from '../../../../hooks';
import CustomNoRowsOverlay from '../../../../components/CustomNoRowsOverlay';
import CustomGridLoading from '../../../../components/CustomGridLoading';
import TunedGrid from '../../../../components/grid/TunedGrid';
import { authApi } from '../../../../libs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ConfirmModal } from '../../../../components/ConfirmModal';
import NoticeMngAddPop from '../../../../components/popup/market/notice/NoticeMngAddPop';
import NoticeMngModPop from '../../../../components/popup/market/notice/NoticeMngModPop';
import dayjs from 'dayjs';
import useFilters from '../../../../hooks/useFilters';

export type NoticeItem = {
  id: number;
  noticeCd?: string;
  title: string;
  moveUri?: string;
  gesiYn?: string;
  creUser?: string;
  creTm?: string;
  updUser?: string;
  updTm?: string;
};

type NoticeFilter = {
  title: string;
};

const NoticeMng = () => {
  const { onGridReady } = useAgGridApi();
  const menuNm = useCommonStore((s) => s.menuNm);

  const [rowData, setRowData] = useState<NoticeItem[]>([]);
  const [selectedRow, setSelectedRow] = useState<NoticeItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [modOpen, setModOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);

  const queryClient = useQueryClient();

  const [filters, onChangeFilters, onFiltersReset] = useFilters<NoticeFilter>({ title: '' });

  const { isLoading, isSuccess, data: listData, refetch } = useQuery({
    queryKey: ['/noticeMng/list', filters.title],
    queryFn: () => authApi.get('/noticeMng/list', {
      params: { pageRowCount: 1000, curPage: 1, 'filter.title': filters.title || undefined },
    }),
  });

  useEffect(() => {
    if (!isSuccess) return;
    const { resultCode, body, resultMessage } = listData.data;
    if (resultCode === 200) {
      setRowData(body?.list ?? []);
    } else {
      toastError(resultMessage ?? '조회 중 오류가 발생했습니다.');
    }
  }, [listData, isSuccess]);

  const { mutate: deleteMutate } = useMutation({
    mutationFn: (id: number) => authApi.delete(`/noticeMng/${id}`),
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('삭제되었습니다.');
        setDelOpen(false);
        setSelectedRow(null);
        await queryClient.invalidateQueries({ queryKey: ['/noticeMng/list'] });
      } else {
        toastError(e.data.resultMessage ?? '삭제 중 오류가 발생했습니다.');
      }
    },
  });

  const columnDefs: ColDef<NoticeItem>[] = [
    {
      headerName: 'No',
      minWidth: 55, maxWidth: 55,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueGetter: (p) => (p.node?.rowIndex != null ? p.node.rowIndex + 1 : ''),
    },
    {
      field: 'title',
      headerName: '제목',
      minWidth: 250,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'creUser',
      headerName: '등록자',
      minWidth: 100, maxWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'creTm',
      headerName: '등록일',
      minWidth: 110, maxWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (p) => p.value ? dayjs(p.value).format('YYYY-MM-DD') : '',
    },
    {
      field: 'updTm',
      headerName: '수정일',
      minWidth: 110, maxWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (p) => p.value ? dayjs(p.value).format('YYYY-MM-DD') : '',
    },
  ];

  const reset = () => {
    onFiltersReset();
    setSelectedRow(null);
    queryClient.invalidateQueries({ queryKey: ['/noticeMng/list'] });
  };

  return (
    <div>
      <Title title={menuNm ?? '공지사항 관리'} reset={reset} search={refetch} />
      <Search className="type_1">
        <div className="searchBox">
          <label className="searchLabel">제목</label>
          <input
            className="inputBox"
            value={filters.title}
            onChange={(e) => onChangeFilters('title', e.target.value)}
            placeholder="제목 검색"
            onKeyDown={(e) => e.key === 'Enter' && refetch()}
          />
        </div>
      </Search>
      <Table>
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
          onRowClicked={(e) => setSelectedRow(e.data ?? null)}
        />
      </Table>
      <div className="btnBox">
        <div className="right">
          <button className="btn btn_primary" onClick={() => setAddOpen(true)}>등록</button>
          {selectedRow && (
            <>
              <button className="btn btn_default" onClick={() => setModOpen(true)}>수정</button>
              <button className="btn btn_danger" onClick={() => setDelOpen(true)}>삭제</button>
            </>
          )}
        </div>
      </div>

      <NoticeMngAddPop
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => {
          setAddOpen(false);
          queryClient.invalidateQueries({ queryKey: ['/noticeMng/list'] });
        }}
      />

      {selectedRow && (
        <NoticeMngModPop
          open={modOpen}
          item={selectedRow}
          onClose={() => setModOpen(false)}
          onSuccess={() => {
            setModOpen(false);
            queryClient.invalidateQueries({ queryKey: ['/noticeMng/list'] });
          }}
        />
      )}

      <ConfirmModal
        open={delOpen}
        title="해당 공지사항을 삭제하시겠습니까?"
        warningMessage="삭제 후 복구할 수 없습니다."
        onConfirm={() => { if (selectedRow) deleteMutate(selectedRow.id); }}
        onClose={(_r) => setDelOpen(false)}
      />
    </div>
  );
};

export default NoticeMng;
