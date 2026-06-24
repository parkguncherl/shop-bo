'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ColDef, RowClickedEvent } from 'ag-grid-community';
import { Search, Title } from '../../../../components';
import { useQuery } from '@tanstack/react-query';
import { toastError } from '../../../../components';
import { useCommonStore } from '../../../../stores';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import { useAgGridApi } from '../../../../hooks';
import useFilters from '../../../../hooks/useFilters';
import CustomNoRowsOverlay from '../../../../components/CustomNoRowsOverlay';
import CustomGridLoading from '../../../../components/CustomGridLoading';
import TunedGrid from '../../../../components/grid/TunedGrid';
import CustomNewDatePicker from '../../../../components/CustomNewDatePicker';
import { authApi } from '../../../../libs';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';

type ViewType = 'monthly' | 'weekly';

type SalesStatFilter = {
  viewType: ViewType;
  fromDate: string;
  toDate: string;
};

type SalesStatItem = {
  period: string;
  totalPaymentAmt: number;
  purchaseCnt: number;
};

type ProductViewItem = {
  prodId: number;
  prodNm: string;
  repFileId?: number;
  totalPaymentAmt: number;
  purchaseCnt: number;
  cartCnt: number;
  pageViewCnt: number;
  totalScore: number;
};

const today = dayjs().format('YYYY-MM-DD');
const yearStart = dayjs().startOf('year').format('YYYY-MM-DD');

const VIEW_TYPE_OPTIONS: { label: string; value: ViewType }[] = [
  { label: '월별', value: 'monthly' },
  { label: '주차별', value: 'weekly' },
];

const MonthlyView = () => {
  const { onGridReady: onTopGridReady } = useAgGridApi();
  const { onGridReady: onBottomGridReady } = useAgGridApi();
  const menuNm = useCommonStore((s) => s.menuNm);

  const [filters, onChangeFilters, onFiltersReset] = useFilters<SalesStatFilter>({
    viewType: 'monthly',
    fromDate: yearStart,
    toDate: today,
  });

  const [statData, setStatData] = useState<SalesStatItem[]>([]);
  const [detailData, setDetailData] = useState<ProductViewItem[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  // 판매 실적 목록 조회
  const {
    data: statListData,
    isLoading: isStatLoading,
    isSuccess: isStatSuccess,
    refetch,
  } = useQuery({
    queryKey: ['/mis/salesStatList', filters],
    queryFn: () =>
      authApi.get('/mis/salesStatList', {
        params: { viewType: filters.viewType, fromDate: filters.fromDate, toDate: filters.toDate },
      }),
    enabled: !!(filters.fromDate && filters.toDate),
  });

  // 판매 실적 상세 조회
  const {
    data: detailListData,
    isLoading: isDetailLoading,
    isSuccess: isDetailSuccess,
  } = useQuery({
    queryKey: ['/mis/salesStatDetailList', filters.viewType, selectedPeriod],
    queryFn: () =>
      authApi.get('/mis/salesStatDetailList', {
        params: { viewType: filters.viewType, period: selectedPeriod },
      }),
    enabled: !!selectedPeriod,
  });

  useEffect(() => {
    if (!isStatSuccess) return;
    const { resultCode, body, resultMessage } = statListData.data;
    if (resultCode === 200) {
      setStatData(body ?? []);
      setSelectedPeriod(null);
      setDetailData([]);
    } else {
      toastError(resultMessage ?? '조회 중 오류가 발생했습니다.');
    }
  }, [statListData, isStatSuccess]);

  useEffect(() => {
    if (!isDetailSuccess) return;
    const { resultCode, body, resultMessage } = detailListData.data;
    if (resultCode === 200) {
      setDetailData(body ?? []);
    } else {
      toastError(resultMessage ?? '상세 조회 중 오류가 발생했습니다.');
    }
  }, [detailListData, isDetailSuccess]);

  const reset = () => {
    onFiltersReset();
    setStatData([]);
    setDetailData([]);
    setSelectedPeriod(null);
  };

  // 상단 실적 그리드 컬럼
  const statColumnDefs: ColDef<SalesStatItem>[] = [
    {
      headerName: 'no',
      minWidth: 55,
      maxWidth: 55,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueGetter: (params) => (params.node?.rowIndex != null ? params.node.rowIndex + 1 : ''),
    },
    {
      field: 'period',
      headerName: filters.viewType === 'monthly' ? '월' : '주차',
      minWidth: 110,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'totalPaymentAmt',
      headerName: '총구매금액',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (p) => (p.value != null ? p.value.toLocaleString() + '원' : '0원'),
    },
    {
      field: 'purchaseCnt',
      headerName: '구매건수',
      minWidth: 90,
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
  ];

  // 하단 상세 그리드 컬럼 (ProductView 동일)
  const detailColumnDefs: ColDef<ProductViewItem>[] = [
    {
      headerName: 'no',
      minWidth: 55,
      maxWidth: 55,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueGetter: (params) => (params.node?.rowIndex != null ? params.node.rowIndex + 1 : ''),
    },
    {
      field: 'prodNm',
      headerName: '상품명',
      minWidth: 160,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'totalPaymentAmt',
      headerName: '총구매금액',
      minWidth: 110,
      maxWidth: 130,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (p) => (p.value != null ? p.value.toLocaleString() + '원' : '0원'),
    },
    {
      field: 'purchaseCnt',
      headerName: '구매건수',
      minWidth: 90,
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'cartCnt',
      headerName: '장바구니',
      minWidth: 90,
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'pageViewCnt',
      headerName: '페이지뷰',
      minWidth: 90,
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'totalScore',
      headerName: '총점',
      minWidth: 80,
      maxWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
  ];

  const onStatRowClicked = (e: RowClickedEvent<SalesStatItem>) => {
    if (e.data?.period) {
      setSelectedPeriod(e.data.period);
    }
  };

  // 차트 옵션
  const chartOption = useMemo(() => {
    const periods = statData.map((d) => d.period);
    const amtData = statData.map((d) => d.totalPaymentAmt);
    const cntData = statData.map((d) => d.purchaseCnt);
    const maxAmt = Math.max(0, ...amtData);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any[]) => {
          if (!params?.length) return '';
          const period = params[0].axisValue;
          return params
            .map((p) => {
              const val =
                p.seriesName === '총구매금액'
                  ? p.value.toLocaleString() + '원'
                  : p.value.toLocaleString() + '건';
              return `${p.marker}${p.seriesName}: <b>${val}</b>`;
            })
            .join('<br/>')
            .replace(/^/, `<b>${period}</b><br/>`);
        },
      },
      legend: {
        bottom: 0,
        data: ['총구매금액', '구매건수'],
      },
      grid: { left: 16, right: 60, top: 50, bottom: 50, containLabel: true },
      xAxis: {
        type: 'category',
        data: periods,
        axisLabel: { rotate: periods.length > 8 ? 30 : 0, fontSize: 11 },
      },
      yAxis: [
        {
          type: 'value',
          name: '구매건수',
          nameTextStyle: { fontSize: 11 },
          splitLine: { show: false },
        },
        {
          type: 'value',
          name: '총구매금액',
          nameTextStyle: { fontSize: 11 },
          axisLabel: {
            formatter: (v: number) =>
              v >= 10000 ? Math.floor(v / 10000) + '만' : v.toLocaleString(),
          },
        },
      ],
      series: [
        {
          name: '총구매금액',
          type: 'bar',
          yAxisIndex: 1,
          data: amtData,
          itemStyle: { color: '#5b8ff9' },
          label: {
            show: true,
            position: 'top',
            fontSize: 10,
            formatter: (p: any) =>
              p.value >= 10000
                ? Math.floor(p.value / 10000) + '만'
                : p.value.toLocaleString(),
          },
        },
        {
          name: '구매건수',
          type: 'line',
          yAxisIndex: 0,
          data: cntData,
          itemStyle: { color: '#e86452' },
          lineStyle: { width: 2 },
          symbol: 'circle',
          symbolSize: 6,
          label: { show: true, position: 'top', fontSize: 10, formatter: '{c}건' },
        },
      ],
    };
  }, [statData]);

  const periodLabel = filters.viewType === 'monthly' ? '월' : '주차';

  return (
    <div className="imgPopBox">
      <Title title={menuNm ?? 'MIS 판매 실적'} reset={reset} search={refetch} />
      <Search className={'type_1'}>
        {/* 월별/주차별 콤보 */}
        <dl>
          <dt>조회 유형</dt>
          <dd>
            <div className="formBox">
              <select
                value={filters.viewType}
                onChange={(e) => {
                  onChangeFilters('viewType', e.target.value as ViewType);
                  setStatData([]);
                  setDetailData([]);
                  setSelectedPeriod(null);
                }}
                style={{
                  height: 32,
                  padding: '0 8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: 6,
                  fontSize: 13,
                  background: '#fff',
                  cursor: 'pointer',
                  minWidth: 100,
                }}
              >
                {VIEW_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </dd>
        </dl>
        <CustomNewDatePicker
          title={'조회기간'}
          type={'range'}
          startName={'fromDate'}
          endName={'toDate'}
          onChange={onChangeFilters}
          value={[filters.fromDate, filters.toDate]}
        />
      </Search>

      <div style={{ display: 'flex', gap: 16, padding: '0 16px 16px', alignItems: 'flex-start' }}>
        {/* 왼쪽: 실적 그리드 (상단) + 상세 그리드 (하단) */}
        <div style={{ flex: '0 0 auto', width: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 상단: 실적 요약 */}
          <div>
            <p style={{ margin: '0 0 6px 2px', fontSize: 13, fontWeight: 600, color: '#333' }}>
              {periodLabel}별 판매 실적
              {selectedPeriod && (
                <span style={{ marginLeft: 8, fontWeight: 400, color: '#888', fontSize: 12 }}>
                  (클릭한 행: {selectedPeriod})
                </span>
              )}
            </p>
            <TunedGrid
              headerHeight={35}
              onGridReady={onTopGridReady}
              loading={isStatLoading}
              rowData={statData}
              columnDefs={statColumnDefs}
              defaultColDef={defaultColDef}
              rowSelection={{ mode: 'singleRow', enableClickSelection: true }}
              onRowClicked={onStatRowClicked}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              className={'default'}
              domLayout={'autoHeight'}
            />
          </div>

          {/* 하단: 상품 상세 (ProductView 동일 컬럼) */}
          <div>
            <p style={{ margin: '0 0 6px 2px', fontSize: 13, fontWeight: 600, color: '#333' }}>
              상품별 상세 실적
              {selectedPeriod
                ? ` — ${selectedPeriod}`
                : (
                  <span style={{ fontWeight: 400, color: '#aaa', fontSize: 12, marginLeft: 6 }}>
                    위 표에서 행을 클릭하세요
                  </span>
                )}
            </p>
            <TunedGrid
              headerHeight={35}
              onGridReady={onBottomGridReady}
              loading={isDetailLoading}
              rowData={detailData}
              columnDefs={detailColumnDefs}
              defaultColDef={defaultColDef}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              className={'default'}
              domLayout={'autoHeight'}
            />
          </div>
        </div>

        {/* 오른쪽: 차트 */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            border: '1px solid #e8e8e8',
            borderRadius: 4,
            background: '#fff',
            padding: '12px 8px',
          }}
        >
          <p style={{ margin: '0 0 8px 8px', fontSize: 13, fontWeight: 600, color: '#333' }}>
            {periodLabel}별 판매 실적 차트
          </p>
          {statData.length > 0 ? (
            <ReactECharts option={chartOption} style={{ height: 500 }} />
          ) : (
            <div
              style={{
                height: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#aaa',
                fontSize: 13,
              }}
            >
              데이터가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyView;
