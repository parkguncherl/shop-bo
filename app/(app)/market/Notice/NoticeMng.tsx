'use client';

import React, { useEffect, useState } from 'react';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { Search, Table, Title } from '../../../../components';
import { toastError, toastSuccess } from '../../../../components';
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
  fileId?: number;
  fileCnt?: number;
  moveUri?: string;
  gesiYn?: string;
  creUser?: string;
  creTm?: string;
  updUser?: string;
  updTm?: string;
};

type NoticeFilter = {
  title: string;
  noticeCd: string;
};

const NoticeMng = () => {
  const { onGridReady } = useAgGridApi();
  const menuNm = useCommonStore((s) => s.menuNm);
  const getFileUrl = useCommonStore((s) => s.getFileUrl);

  const [rowData, setRowData] = useState<NoticeItem[]>([]);
  const [imgUrls, setImgUrls] = useState<Record<number, string>>({});
  const [selectedRow, setSelectedRow] = useState<NoticeItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [modOpen, setModOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);

  const queryClient = useQueryClient();

  const [filters, onChangeFilters, onFiltersReset] = useFilters<NoticeFilter>({ title: '', noticeCd: '' });

  const {
    isLoading,
    isSuccess,
    data: listData,
    refetch,
  } = useQuery({
    queryKey: ['/noticeMng/list', filters.title, filters.noticeCd],
    queryFn: () =>
      authApi.get('/noticeMng/list', {
        params: {
          pageRowCount: 1000,
          curPage: 1,
          'filter.title': filters.title || undefined,
          'filter.noticeCd': filters.noticeCd || undefined,
        },
      }),
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

  useEffect(() => {
    rowData.forEach(async (row) => {
      if (!row.fileId || imgUrls[row.fileId]) return;
      try {
        const { data } = await authApi.get(`/common/file/${row.fileId}`);
        const fileList = data?.body ?? [];
        if (fileList.length > 0 && fileList[0].sysFileNm) {
          const url = await getFileUrl(fileList[0].sysFileNm);
          setImgUrls((prev) => ({ ...prev, [row.fileId!]: url }));
        }
      } catch {
        /* ignore */
      }
    });
  }, [rowData]);

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
      minWidth: 55,
      maxWidth: 55,
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
      field: 'moveUri',
      headerName: '링크 URL',
      minWidth: 250,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'fileCnt',
      headerName: '첨부',
      minWidth: 55,
      maxWidth: 55,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'gesiYn',
      headerName: '게시여부',
      minWidth: 60,
      maxWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
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
      headerName: '등록일',
      minWidth: 110,
      maxWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: 'DATE',
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
    onFiltersReset();
    setSelectedRow(null);
    queryClient.invalidateQueries({ queryKey: ['/noticeMng/list'] });
  };

  return (
    <div>
      <Title title={menuNm ?? '공지사항 관리'} reset={reset} search={refetch} />
      <Search className="type_2">
        <Search.DropDown
          title="구분"
          name="noticeCd"
          value={filters.noticeCd}
          onChange={(name, value) => onChangeFilters(name as keyof NoticeFilter, value as string)}
          defaultOptions={[
            { label: '화면공지', value: '1' },
            { label: '기타', value: '2' },
          ]}
          showAll={true}
        />
        <Search.Input
          title="제목"
          name="title"
          placeholder="제목을 입력하세요"
          value={filters.title}
          onChange={(name, value) => onChangeFilters(name as keyof NoticeFilter, value as string)}
          onEnter={() => refetch()}
        />
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
      <div className="btnArea between">
        <div className="right">
          <button className="btn btn_primary" onClick={() => setAddOpen(true)}>
            등록
          </button>
          <button className="btn btn_default" onClick={() => setModOpen(true)} disabled={!selectedRow}>
            수정
          </button>
          <button className="btn btn_danger" onClick={() => setDelOpen(true)} disabled={!selectedRow}>
            삭제
          </button>
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
        onConfirm={() => {
          if (selectedRow) deleteMutate(selectedRow.id);
        }}
        onClose={(_r) => setDelOpen(false)}
      />
    </div>
  );
};

export default NoticeMng;
