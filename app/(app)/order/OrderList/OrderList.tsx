'use client';

import React, { useMemo, useState } from 'react';
import { ColDef } from 'ag-grid-community';
import { Search, Table, Title } from '../../../../components';
import { useQuery } from '@tanstack/react-query';
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
import { ApiResponse, OrderMngResponseBoListItem } from '../../../../generated';
import { AxiosResponse } from 'axios';

type OrderFilter = {
  fromDate: string;
  toDate: string;
};

const today = dayjs().format('YYYY-MM-DD');
const startOfWeek = dayjs()
  .subtract((dayjs().day() + 6) % 7, 'day')
  .format('YYYY-MM-DD');

/** BO 주문 목록 */
const OrderList = () => {
  const { onGridReady } = useAgGridApi();
  const menuNm = useCommonStore((s) => s.menuNm);

  const [filters, onChangeFilters, onFiltersReset] = useFilters<OrderFilter>({
    fromDate: startOfWeek,
    toDate: today,
  });

  // const [boListAsOrderList, setBoListAsOrderList] = useState<OrderMngResponseBoListItem[]>([]); // todo, 추후 그리드 내에서 수정 동작이 요구되어 별도 상태 관리가 필요하지 않은 이상 불필요
  // const [pinnedBottomRow, setPinnedBottomRow] = useState<any[]>([]); // todo 추후 그리드 bottom 내에서 수정 동작이 요구되어 별도 상태 관리가 필요하지 않은 이상 불필요
  const [selectedOrderId, setSelectedOrderId] = useState<number | undefined>(undefined);
  const [detailOpen, setDetailOpen] = useState(false);

  const columnDefs: ColDef<OrderMngResponseBoListItem>[] = [
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
      field: 'orderStatusNm',
      headerName: '주문상태',
      minWidth: 100,
      maxWidth: 110,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'paymentStatusNm',
      headerName: '결제상태',
      minWidth: 100,
      maxWidth: 110,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'productAmount',
      headerName: '상품금액',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      cellRenderer: 'NUMBER_COMMA',
    },
    {
      field: 'usedPoint',
      headerName: '포인트사용',
      minWidth: 110,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      cellRenderer: 'NUMBER_COMMA',
    },
    {
      field: 'paymentAmount',
      headerName: '실결제금액',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      cellRenderer: 'NUMBER_COMMA',
    },
  ];

  const {
    data: orderListData,
    isLoading: isOrderListDataLoading,
    //isSuccess: isOrderListDataSuccess,
    refetch: orderListDataRefetch,
  } = useQuery<AxiosResponse<ApiResponse>>({
    queryKey: ['/orderMng/list', filters],
    queryFn: () => authApi.get('/orderMng/list', { params: filters }),
    enabled: !!(filters.fromDate && filters.toDate),
  });

  /** useQuery에 캐시된 응답 기반 메모이징 처리, useQuery의 견고한 참조 유지 메커니즘의 이점을 이용하여 함수를 통해 가공된 응답값을 렌더 사이클 독립적인 값으로 유지한다 */
  const cachedOrderListInfo = useMemo(() => {
    const boListAsOrderList = (orderListData?.data.body || []) as OrderMngResponseBoListItem[];
    return {
      rowData: [...boListAsOrderList], // 불변성 유지
      pinnedBottomRowData:
        boListAsOrderList.length > 0
          ? [
              {
                orderNo: `합계 (${boListAsOrderList.length}건)`,
                productAmount: boListAsOrderList.reduce((acc, r) => acc + (r.productAmount ?? 0), 0),
                usedPoint: boListAsOrderList.reduce((acc, r) => acc + (r.usedPoint ?? 0), 0),
                paymentAmount: boListAsOrderList.reduce((acc, r) => acc + (r.paymentAmount ?? 0), 0),
              },
            ]
          : undefined,
    };
  }, [orderListData]);

  // useEffect(() => {
  //   if (isOrderListDataSuccess) {
  //     const { resultCode, body, resultMessage } = orderListData.data;
  //     if (resultCode === 200) {
  //       const rows: OrderMngResponseBoListItem[] = body ?? [];
  //       //setBoListAsOrderList(rows);
  //       if (rows.length > 0) {
  //         setPinnedBottomRow([
  //           {
  //             orderNo: `합계 (${rows.length}건)`,
  //             productAmount: rows.reduce((acc, r) => acc + (r.productAmount ?? 0), 0),
  //             usedPoint: rows.reduce((acc, r) => acc + (r.usedPoint ?? 0), 0),
  //             paymentAmount: rows.reduce((acc, r) => acc + (r.paymentAmount ?? 0), 0),
  //           },
  //         ]);
  //       } else {
  //         setPinnedBottomRow([]);
  //       }
  //     } else {
  //       toastError(resultMessage ?? '조회 중 오류가 발생했습니다.');
  //     }
  //   }
  // }, [orderListData, isOrderListDataSuccess]);

  const reset = () => {
    onFiltersReset();

    // setBoListAsOrderList([]);
    // setPinnedBottomRow([]);
  };

  return (
    <div>
      <Title title={menuNm ?? '주문 목록'} reset={reset} search={orderListDataRefetch} />
      <Search className={'type_1'}>
        <CustomNewDatePicker
          title={'조회기간'}
          type={'range'}
          defaultType={'week'}
          startName={'fromDate'}
          endName={'toDate'}
          onChange={onChangeFilters}
          value={[filters.fromDate, filters.toDate]}
        />
      </Search>
      <Table>
        <TunedGrid<OrderMngResponseBoListItem>
          headerHeight={35}
          onGridReady={onGridReady}
          loading={isOrderListDataLoading}
          {...cachedOrderListInfo}
          //rowData={boListAsOrderList}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          //pinnedBottomRowData={pinnedBottomRow}
          rowSelection={{ mode: 'singleRow', enableClickSelection: false }}
          onRowClicked={(e) => {
            if (e.node.isRowPinned()) return;
            setSelectedOrderId(e.data?.orderId);
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
            orderListDataRefetch();
          }}
        />
      )}
    </div>
  );
};

export default OrderList;
