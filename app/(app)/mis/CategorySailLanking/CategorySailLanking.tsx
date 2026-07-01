'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ColDef } from 'ag-grid-community';
import { Search, Table, Title } from '../../../../components';
import { useQuery } from '@tanstack/react-query';
import { toastError } from '../../../../components';
import { useCommonStore } from '../../../../stores';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import { useAgGridApi } from '../../../../hooks';
import useFilters from '../../../../hooks/useFilters';
import CustomNoRowsOverlay from '../../../../components/CustomNoRowsOverlay';
import CustomGridLoading from '../../../../components/CustomGridLoading';
import TunedGrid from '../../../../components/grid/TunedGrid';
import { authApi } from '../../../../libs';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { useDarkMode } from '../../../../contexts/ThemeContext';

type CategoryViewFilter = {
  fromDate: string;
  toDate: string;
};

type CategoryViewItem = {
  categoryId: number;
  categoryNm: string;
  totalPaymentAmt: number;
  purchaseCnt: number;
  cartCnt: number;
  pageViewCnt: number;
  totalScore: number;
};

const today = dayjs().format('YYYY-MM-DD');
const yearStart = dayjs().startOf('year').format('YYYY-MM-DD');

const CategorySailLanking = () => {
  const { onGridReady } = useAgGridApi();
  const menuNm = useCommonStore((s) => s.menuNm);
  const isDark = useDarkMode();
  const chartTextColor = isDark ? '#d0d0e0' : '#333';
  const chartAxisColor = isDark ? '#555570' : '#aaa';
  const splitLineColor = isDark ? '#2a2a3e' : '#eee';

  const [filters, onChangeFilters, onFiltersReset] = useFilters<CategoryViewFilter>({
    fromDate: yearStart,
    toDate: today,
  });

  const [rowData, setRowData] = useState<CategoryViewItem[]>([]);

  const top10 = useMemo(() => rowData.slice(0, 10), [rowData]);

  const chartOption = useMemo(() => {
    const names = top10.map((d) => (d.categoryNm.length > 8 ? d.categoryNm.slice(0, 8) + '…' : d.categoryNm));
    const maxPageView = Math.max(0, ...top10.map((d) => d.pageViewCnt));
    const useRightAxis = maxPageView > 1000;
    const rightAxisMax = useRightAxis ? Math.ceil(maxPageView / 10000) * 10000 : undefined;
    const rightAxisInterval = useRightAxis ? 1000 : undefined;

    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { bottom: 0, data: ['구매건수', '장바구니건수', '페이지뷰', '총점'], textStyle: { color: chartTextColor } },
      grid: { left: 16, right: 60, top: 50, bottom: 50, containLabel: true },
      xAxis: { type: 'category', data: names, axisLabel: { rotate: 30, fontSize: 11, color: chartTextColor }, axisLine: { lineStyle: { color: chartAxisColor } } },
      yAxis: [
        { type: 'value', name: '건수', nameTextStyle: { fontSize: 11, color: chartTextColor }, axisLabel: { color: chartTextColor }, splitLine: { lineStyle: { color: splitLineColor } } },
        { type: 'value', name: '페이지뷰', nameTextStyle: { fontSize: 11, color: chartTextColor }, axisLabel: { color: chartTextColor }, ...(useRightAxis ? { max: rightAxisMax, interval: rightAxisInterval } : {}), splitLine: { show: false } },
      ],
      series: [
        { name: '구매건수', type: 'bar', yAxisIndex: 0, data: top10.map((d) => d.purchaseCnt), itemStyle: { color: '#5b8ff9' }, label: { show: true, position: 'top', fontSize: 10, formatter: '{c}', color: chartTextColor } },
        { name: '장바구니건수', type: 'bar', yAxisIndex: 0, data: top10.map((d) => d.cartCnt), itemStyle: { color: '#61ddaa' }, label: { show: true, position: 'top', fontSize: 10, formatter: '{c}', color: chartTextColor } },
        { name: '페이지뷰', type: 'bar', yAxisIndex: 1, data: top10.map((d) => d.pageViewCnt), itemStyle: { color: '#f6bd16' }, label: { show: true, position: 'top', fontSize: 10, formatter: '{c}', color: chartTextColor } },
        { name: '총점', type: 'bar', yAxisIndex: 0, data: top10.map((d) => d.totalScore), itemStyle: { color: '#e86452' }, label: { show: true, position: 'top', fontSize: 10, formatter: '{c}', color: chartTextColor } },
      ],
    };
  }, [top10, chartTextColor, chartAxisColor, splitLineColor]);

  const columnDefs: ColDef<CategoryViewItem>[] = [
    {
      headerName: 'no',
      minWidth: 55,
      maxWidth: 55,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueGetter: (params) => (params.node?.rowIndex != null ? params.node.rowIndex + 1 : ''),
    },
    {
      field: 'categoryNm',
      headerName: '카테고리',
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
      cellRenderer: 'NUMBER_COMMA',
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

  const {
    data: listData,
    isLoading,
    isSuccess,
    refetch,
  } = useQuery({
    queryKey: ['/mis/categoryViewList', filters],
    queryFn: () => authApi.get('/mis/categoryViewList', { params: filters }),
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

  const reset = () => {
    onFiltersReset();
    setRowData([]);
  };

  return (
    <div>
      <Title title={menuNm ?? 'MIS 카테고리 분석'} reset={reset} search={refetch} />
      <Search className={'type_1'}>
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
                {([
                  { label: '당일', fn: () => { const d = dayjs().format('YYYY-MM-DD'); onChangeFilters('fromDate', d); onChangeFilters('toDate', d); } },
                  { label: '1주일', fn: () => { onChangeFilters('fromDate', dayjs().subtract(6, 'day').format('YYYY-MM-DD')); onChangeFilters('toDate', dayjs().format('YYYY-MM-DD')); } },
                  { label: '1개월', fn: () => { onChangeFilters('fromDate', dayjs().subtract(1, 'month').format('YYYY-MM-DD')); onChangeFilters('toDate', dayjs().format('YYYY-MM-DD')); } },
                ] as { label: string; fn: () => void }[]).map(({ label, fn }) => (
                  <button key={label} className="btn" onClick={fn} style={{ height: 28, padding: '0 10px', fontSize: 12, whiteSpace: 'nowrap' }}>{label}</button>
                ))}
              </div>
            </div>
          </dd>
        </dl>
      </Search>

      <div style={{ display: 'flex', gap: 16, padding: '0 16px 16px', alignItems: 'flex-start' }}>
        {/* 왼쪽: ag-grid */}
        <div style={{ flex: '0 0 auto', width: 640 }}>
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
              className={'default'}
            />
          </Table>
        </div>

        {/* 오른쪽: ECharts 상위 10개 */}
        <div style={{ flex: 1, minWidth: 0, border: `1px solid ${isDark ? '#333350' : '#e8e8e8'}`, borderRadius: 4, background: isDark ? '#1e1e30' : '#fff', padding: '12px 8px' }}>
          <p style={{ margin: '0 0 8px 8px', fontSize: 13, fontWeight: 600, color: chartTextColor }}>카테고리별 판매 TOP 10 (총점 기준)</p>
          {top10.length > 0 ? (
            <ReactECharts option={chartOption} style={{ height: 400 }} />
          ) : (
            <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#555570' : '#aaa', fontSize: 13 }}>데이터가 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategorySailLanking;
