'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ColDef, RowClickedEvent } from 'ag-grid-community';
import { Search, Table, Title } from '@/components';
import { useQuery } from '@tanstack/react-query';
import { toastError } from '@/components';
import { useCommonStore } from '@/stores';
import { defaultColDef, GridSetting } from '@/libs/ag-grid';
import { useAgGridApi } from '@/hooks';
import useFilters from '@/hooks/useFilters';
import CustomNoRowsOverlay from '@/components/CustomNoRowsOverlay';
import CustomGridLoading from '@/components/CustomGridLoading';
import TunedGrid from '@/components/grid/TunedGrid';
import { authApi } from '@/libs';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { useDarkMode } from '@/contexts/ThemeContext';

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
  const isDark = useDarkMode();
  const chartTextColor = isDark ? '#d0d0e0' : '#333';
  const chartAxisColor = isDark ? '#555570' : '#aaa';
  const splitLineColor = isDark ? '#2a2a3e' : '#eee';

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
      minWidth: 37,
      maxWidth: 37,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueGetter: (params) => (params.node?.rowIndex != null ? params.node.rowIndex + 1 : ''),
    },
    {
      field: 'period',
      headerName: filters.viewType === 'monthly' ? '월' : '주차',
      minWidth: 75,
      maxWidth: 75,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'totalPaymentAmt',
      headerName: '금액',
      minWidth: 70,
      maxWidth: 70,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      cellRenderer: 'NUMBER_COMMA',
    },
    {
      field: 'purchaseCnt',
      headerName: '건수',
      minWidth: 50,
      maxWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
  ];

  // 하단 상세 그리드 컬럼 (ProductView 동일)
  const detailColumnDefs: ColDef<ProductViewItem>[] = [
    {
      headerName: 'no',
      minWidth: 37,
      maxWidth: 37,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueGetter: (params) => (params.node?.rowIndex != null ? params.node.rowIndex + 1 : ''),
    },
    {
      field: 'prodNm',
      headerName: '상품명',
      minWidth: 160,
      maxWidth: 160,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'totalPaymentAmt',
      headerName: '금액',
      minWidth: 60,
      maxWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      cellRenderer: 'NUMBER_COMMA',
    },
    {
      field: 'purchaseCnt',
      headerName: '건수',
      minWidth: 50,
      maxWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'cartCnt',
      headerName: '장바구니',
      minWidth: 60,
      maxWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'pageViewCnt',
      headerName: '페이지뷰',
      minWidth: 60,
      maxWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'totalScore',
      headerName: '총점',
      minWidth: 60,
      maxWidth: 60,
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

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any[]) => {
          if (!params?.length) return '';
          const period = params[0].axisValue;
          return params
            .map((p) => {
              const val = p.seriesName === '총구매금액' ? p.value.toLocaleString() + '원' : p.value.toLocaleString() + '건';
              return `${p.marker}${p.seriesName}: <b>${val}</b>`;
            })
            .join('<br/>')
            .replace(/^/, `<b>${period}</b><br/>`);
        },
      },
      legend: { bottom: 0, data: ['총구매금액', '구매건수'], textStyle: { color: chartTextColor } },
      grid: { left: 16, right: 60, top: 50, bottom: 50, containLabel: true },
      xAxis: {
        type: 'category',
        data: periods,
        axisLabel: { rotate: periods.length > 8 ? 30 : 0, fontSize: 11, color: chartTextColor },
        axisLine: { lineStyle: { color: chartAxisColor } },
      },
      yAxis: [
        {
          type: 'value',
          name: '구매건수',
          nameTextStyle: { fontSize: 11, color: chartTextColor },
          axisLabel: { color: chartTextColor },
          splitLine: { show: false },
        },
        {
          type: 'value',
          name: '총구매금액',
          nameTextStyle: { fontSize: 11, color: chartTextColor },
          axisLabel: { color: chartTextColor, formatter: (v: number) => (v >= 10000 ? Math.floor(v / 10000) + '만' : v.toLocaleString()) },
          splitLine: { lineStyle: { color: splitLineColor } },
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
            color: chartTextColor,
            formatter: (p: any) => (p.value >= 10000 ? Math.floor(p.value / 10000) + '만' : p.value.toLocaleString()),
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
          label: { show: true, position: 'top', fontSize: 10, color: chartTextColor, formatter: '{c}건' },
        },
      ],
    };
  }, [statData, chartTextColor, chartAxisColor, splitLineColor]);

  const periodLabel = filters.viewType === 'monthly' ? '월' : '주차';

  return (
    <div>
      <Title title={menuNm ?? 'MIS 판매 실적'} reset={reset} search={refetch} />
      <Search className={'type_1'}>
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
                  border: '1px solid var(--dark-border, #d9d9d9)',
                  borderRadius: 6,
                  fontSize: 13,
                  background: 'var(--dark-surface, #fff)',
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
        <dl>
          <dt>조회기간</dt>
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
      </Search>

      <div className="layoutBox">
        {/* 1열: 기간별 실적 요약 */}
        <div className="layout20">
          <p style={{ margin: '0 0 6px 2px', fontSize: 13, fontWeight: 600, color: chartTextColor }}>
            {periodLabel}별 판매 실적
            {selectedPeriod && <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--dark-text, #888)', fontSize: 12 }}>({selectedPeriod})</span>}
          </p>
          <Table>
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
            />
          </Table>
        </div>

        {/* 2열: 상품별 상세 실적 */}
        <div className="layout40">
          <p style={{ margin: '0 0 6px 2px', fontSize: 13, fontWeight: 600, color: chartTextColor }}>
            상품별 상세 실적
            {selectedPeriod ? (
              <span style={{ marginLeft: 6, fontWeight: 400, color: 'var(--dark-text, #555)', fontSize: 12 }}> {selectedPeriod}</span>
            ) : (
              <span style={{ fontWeight: 400, color: 'var(--dark-text, #aaa)', fontSize: 12, marginLeft: 6 }}>행을 클릭하세요</span>
            )}
          </p>
          <Table>
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
            />
          </Table>
        </div>

        {/* 3열: 차트 */}
        <div className="layout40">
          <p style={{ margin: '0 0 6px 2px', fontSize: 13, fontWeight: 600, color: chartTextColor }}>{periodLabel}별 판매 실적 차트</p>
          <div style={{ border: `1px solid ${isDark ? '#333350' : '#e8e8e8'}`, borderRadius: 4, background: isDark ? '#1e1e30' : '#fff', padding: '8px' }}>
            {statData.length > 0 ? (
              <ReactECharts option={chartOption} style={{ height: 460 }} />
            ) : (
              <div style={{ height: 460, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#555570' : '#aaa', fontSize: 13 }}>
                데이터가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyView;
