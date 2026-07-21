'use client';

import React, { useEffect, useState } from 'react';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { Search, Table, Title } from '@/components';
import { toastError, toastSuccess } from '@/components/ToastMessage';
import { useCommonStore } from '@/stores';
import { defaultColDef, GridSetting } from '@/libs/ag-grid';
import { useAgGridApi } from '@/hooks';
import CustomNoRowsOverlay from '@/components/CustomNoRowsOverlay';
import CustomGridLoading from '@/components/CustomGridLoading';
import TunedGrid from '@/components/grid/TunedGrid';
import { authApi } from '@/libs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ConfirmModal } from '@/components/ConfirmModal';
import PopupNoticeMngAddPop from '@/components/popup/system/popupNotice/PopupNoticeMngAddPop';
import PopupNoticeMngModPop from '@/components/popup/system/popupNotice/PopupNoticeMngModPop';
import dayjs from 'dayjs';

export type PopupNoticeItem = {
  id: number;
  title: string;
  fileId?: number;
  moveUri?: string;
  gesiYn: string;
  creUser?: string;
  creTm?: string;
};

const PopupNoticeMng = () => {
  const { onGridReady } = useAgGridApi();
  const menuNm = useCommonStore((s) => s.menuNm);
  const getFileUrl = useCommonStore((s) => s.getFileUrl);

  const [rowData, setRowData] = useState<PopupNoticeItem[]>([]);
  const [selectedRow, setSelectedRow] = useState<PopupNoticeItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [modOpen, setModOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [imgUrls, setImgUrls] = useState<Record<number, string>>({});

  const queryClient = useQueryClient();

  const { isLoading, isSuccess, data: listData, refetch } = useQuery({
    queryKey: ['/popupNoticeMng/list'],
    queryFn: () => authApi.get('/popupNoticeMng/list'),
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

  // fileId → 이미지 URL 사전 로드
  useEffect(() => {
    rowData.forEach(async (row) => {
      if (!row.fileId || imgUrls[row.fileId]) return;
      try {
        const files = await authApi.get(`/common/file/${row.fileId}`);
        const fileList = files.data?.body ?? [];
        if (fileList.length > 0 && fileList[0].sysFileNm) {
          const url = await getFileUrl(fileList[0].sysFileNm);
          setImgUrls((prev) => ({ ...prev, [row.fileId!]: url }));
        }
      } catch { /* ignore */ }
    });
  }, [rowData]);

  const { mutate: toggleGesiYn } = useMutation({
    mutationFn: ({ id, gesiYn }: { id: number; gesiYn: string }) =>
      authApi.patch(`/popupNoticeMng/${id}/gesiYn`, { gesiYn }),
    onSuccess: (_, vars) => {
      setRowData((prev) =>
        prev.map((r) => (r.id === vars.id ? { ...r, gesiYn: vars.gesiYn } : r))
      );
    },
    onError: () => toastError('게시 여부 변경 중 오류가 발생했습니다.'),
  });

  const { mutate: deleteMutate } = useMutation({
    mutationFn: (id: number) => authApi.delete(`/popupNoticeMng/${id}`),
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('삭제되었습니다.');
        setDelOpen(false);
        setSelectedRow(null);
        await refetch();
      } else {
        toastError(e.data.resultMessage ?? '삭제 중 오류가 발생했습니다.');
      }
    },
  });

  const columnDefs: ColDef<PopupNoticeItem>[] = [
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
      minWidth: 200,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'fileId',
      headerName: '이미지',
      minWidth: 90, maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: (p: ICellRendererParams<PopupNoticeItem>) => {
        const url = p.data?.fileId ? imgUrls[p.data.fileId] : undefined;
        if (!url) return p.value ? '있음' : '-';
        return (
          <img src={url} alt="미리보기" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, margin: '2px 0' }} />
        );
      },
    },
    {
      field: 'moveUri',
      headerName: '이동 URL',
      minWidth: 160,
      suppressHeaderMenuButton: true,
      valueFormatter: (p) => p.value ?? '-',
    },
    {
      field: 'gesiYn',
      headerName: '게시',
      minWidth: 70, maxWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: (p: ICellRendererParams<PopupNoticeItem>) => {
        if (!p.data) return null;
        const on = p.data.gesiYn === 'Y';
        return (
          <input
            type="checkbox"
            checked={on}
            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#4f46e5' }}
            onChange={() => toggleGesiYn({ id: p.data!.id, gesiYn: on ? 'N' : 'Y' })}
          />
        );
      },
    },
    {
      field: 'creTm',
      headerName: '등록일',
      minWidth: 110, maxWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (p) => p.value ? dayjs(p.value).format('YYYY-MM-DD') : '',
    },
  ];

  const reset = () => {
    setRowData([]);
    setSelectedRow(null);
    refetch();
  };

  return (
    <div>
      <Title title={menuNm ?? '팝업 공지사항 관리'} reset={reset} search={refetch} />
      <Search className="type_1" />
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

      <PopupNoticeMngAddPop
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => { setAddOpen(false); refetch(); }}
      />

      {selectedRow && (
        <PopupNoticeMngModPop
          open={modOpen}
          item={selectedRow}
          onClose={() => setModOpen(false)}
          onSuccess={() => { setModOpen(false); refetch(); }}
        />
      )}

      <ConfirmModal
        open={delOpen}
        title="해당 팝업 공지사항을 삭제하시겠습니까?"
        warningMessage="삭제 후 복구할 수 없습니다."
        onConfirm={() => { if (selectedRow) deleteMutate(selectedRow.id); }}
        onClose={(_r) => setDelOpen(false)}
      />
    </div>
  );
};

export default PopupNoticeMng;
