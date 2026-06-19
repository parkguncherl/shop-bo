'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ColDef } from 'ag-grid-community';
import { Search, Table, Title } from '../../../../components';
import { useQuery } from '@tanstack/react-query';
import { toastError } from '../../../../components';
import { useCommonStore } from '../../../../stores';
import { defaultColDef, GridSetting, formatDateWithDay } from '../../../../libs/ag-grid';
import { useAgGridApi } from '../../../../hooks';
import { authApi } from '../../../../libs';
import useFilters from '../../../../hooks/useFilters';
import CustomNoRowsOverlay from '../../../../components/CustomNoRowsOverlay';
import CustomGridLoading from '../../../../components/CustomGridLoading';
import TunedGrid from '../../../../components/grid/TunedGrid';
import { OrderDetailPop } from '../../../../components/popup/order/OrderDetailPop';
import dayjs from 'dayjs';
import CustomNewDatePicker from '../../../../components/CustomNewDatePicker';

interface OrderBoListItem {
  orderId: number;
  orderNo: string;
  orderStatus: string;
  productAmount: number;
  usedPoint: number;
  paymentAmount: number;
  creTm: string;
  paymentSeq: number;
  paymentStatus: string;
  itemCount: number;
  topProductName: string;
}

type OrderFilter = {
  fromDate: string;
  toDate: string;
};

const today = dayjs().format('YYYY-MM-DD');

const orderStatusLabel = (status: string) => {
  const map: Record<string, string> = { R: '주문접수', P: '결제완료', C: '취소', D: '배송중', F: '배송완료' };
  return map[status] ?? status;
};

const paymentStatusLabel = (status: string) => {
  const map: Record<string, string> = { P: '결제완료', C: '취소' };
  return map[status] ?? status ?? '-';
};

const formatWon = (params: any) => {
  if (params.value == null) return '-';
  return Number(params.value).toLocaleString() + '원';
};

/** BO 주문 목록 */
const OrderList = () => {
  const { onGridReady } = useAgGridApi();
  const menuNm = useCommonStore((s) => s.menuNm);

  const [filters, onChangeFilters, onFiltersReset] = useFilters<OrderFilter>({
    fromDate: today,
    toDate: today,
  });

  const isFirstRender = useRef(true);

  const [rowData, setRowData] = useState<OrderBoListItem[]>([]);
  const [pinnedBottomRow, setPinnedBottomRow] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const columnDefs: ColDef<OrderBoListItem>[] = [
    {
      field: 'creTm',
      headerName: '주문일시',
      minWidth: 140,
      maxWidth: 160,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: formatDateWithDay,
    },
    {
      field: 'orderNo',
      headerName: '주문번호',
      minWidth: 180,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'topProductName',
      headerName: '상품',
      minWidth: 200,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        if (!params.value) return '-';
        const cnt = params.data?.itemCount ?? 1;
        return cnt > 1 ? `${params.value} 외 ${cnt - 1}건` : params.value;
      },
    },
    {
      field: 'orderStatus',
      headerName: '주문상태',
      minWidth: 100,
      maxWidth: 110,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => orderStatusLabel(params.value),
    },
    {
      field: 'paymentStatus',
      headerName: '결제상태',
      minWidth: 100,
      maxWidth: 110,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => paymentStatusLabel(params.value),
    },
    {
      field: 'productAmount',
      headerName: '상품금액',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: formatWon,
    },
    {
      field: 'usedPoint',
      headerName: '포인트사용',
      minWidth: 110,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: formatWon,
    },
    {
      field: 'paymentAmount',
      headerName: '실결제금액',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: formatWon,
    },
  ];

  const { isLoading } = useQuery({
    queryKey: ['/orderMng/list', filters],
    queryFn: async () => {
      const { data } = await authApi.get('/orderMng/list', { params: filters });
      return data;
    },
    enabled: false,
    placeholderData: (prev: any) => prev,
  });

  const runSearch = async () => {
    const { data } = await authApi.get('/orderMng/list', { params: filters });
    if (data?.resultCode === 200) {
      const rows: OrderBoListItem[] = data.body ?? [];
      setRowData(rows);

      if (rows.length > 0) {
        const sumProductAmount = rows.reduce((acc, r) => acc + (r.productAmount ?? 0), 0);
        const sumUsedPoint = rows.reduce((acc, r) => acc + (r.usedPoint ?? 0), 0);
        const sumPaymentAmount = rows.reduce((acc, r) => acc + (r.paymentAmount ?? 0), 0);
        setPinnedBottomRow([
          {
            orderNo: `합계 (${rows.length}건)`,
            productAmount: sumProductAmount,
            usedPoint: sumUsedPoint,
            paymentAmount: sumPaymentAmount,
          },
        ]);
      } else {
        setPinnedBottomRow([]);
      }
    } else {
      toastError(data?.resultMessage ?? '조회 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (filters.fromDate && filters.toDate) {
      runSearch();
    }
  }, [filters.fromDate, filters.toDate]);

  const reset = () => {
    onFiltersReset();
    setRowData([]);
    setPinnedBottomRow([]);
  };

  return (
    <div>
      <Title title={menuNm ?? '주문 목록'} reset={reset} search={runSearch} />
      <Search className={'type_1'}>
        <CustomNewDatePicker
          title={''}
          type={'range'}
          defaultType={'today'}
          startName={'fromDate'}
          endName={'toDate'}
          onChange={onChangeFilters}
          value={[filters.fromDate, filters.toDate]}
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
          pinnedBottomRowData={pinnedBottomRow}
          rowSelection={{ mode: 'singleRow', enableClickSelection: false }}
          onRowClicked={(e) => {
            if (e.node.isRowPinned()) return;
            setSelectedOrderId(e.data.orderId);
            setDetailOpen(true);
          }}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          className={'wmsDefault'}
          getRowStyle={(params) => {
            if (params.node.isRowPinned()) {
              return { fontWeight: 'bold', background: '#f5f5f5' };
            }
          }}
        />
      </Table>
      {detailOpen && selectedOrderId != null && (
        <OrderDetailPop
          orderId={selectedOrderId}
          open={detailOpen}
          onClose={() => {
            setDetailOpen(false);
            runSearch();
          }}
        />
      )}
    </div>
  );
};

export default OrderList;
