'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColDef } from 'ag-grid-community';
import { Search, Table, Title } from '../../../../components';
import { useCommonStore } from '../../../../stores';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import { useAgGridApi } from '../../../../hooks';
import TunedGrid from '../../../../components/grid/TunedGrid';
import CustomNoRowsOverlay from '../../../../components/CustomNoRowsOverlay';
import CustomGridLoading from '../../../../components/CustomGridLoading';
import CustomNewDatePicker from '../../../../components/CustomNewDatePicker';
import useFilters from '../../../../hooks/useFilters';
import { authApi } from '../../../../libs';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { PartnerCodeControllerApi } from '../../../../generated';
import { useDarkMode } from '../../../../contexts/ThemeContext';

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const today = dayjs().format('YYYY-MM-DD');
const oneMonthAgo = dayjs().subtract(1, 'month').format('YYYY-MM-DD');

const FIT_PALETTE = ['#7c3aed', '#0f766e', '#b45309', '#be123c', '#1d4ed8', '#065f46'];

// fitGroup별 색상 — 안쪽 링에 칠하고, 바깥 자식은 같은 색 투명도 변형
const childColor = (hex: string, idx: number, total: number) => {
  // total 개수에 따라 opacity 0.35 ~ 0.9 사이로 분배
  const alpha = Math.round(((0.9 - 0.35) * (1 - idx / Math.max(total - 1, 1)) + 0.35) * 255)
    .toString(16)
    .padStart(2, '0');
  return hex + alpha;
};

const PERIOD_PRESETS = [
  { label: '3개월', months: 3 },
  { label: '6개월', months: 6 },
  { label: '1년', months: 12 },
];

// ─── 타입 ─────────────────────────────────────────────────────────────────────

type ReviewFitItem = {
  fitGroup: string;
  myHeightWeightNm: string;
  cnt: number;
};

type FilterType = { fromDate: string; toDate: string; categoryId: string };

type GridRow = {
  no: number;
  fitGroup: string;
  myHeightWeightNm: string;
  cnt: number;
  pct: string;
};

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

const ReviewAnalysis = () => {
  const { onGridReady } = useAgGridApi();
  const menuNm = useCommonStore((s) => s.menuNm);
  const isDark = useDarkMode();
  const chartTextColor = isDark ? '#d0d0e0' : '#333';
  const chartAxisColor = isDark ? '#555570' : '#aaa';
  const splitLineColor = isDark ? '#2a2a3e' : '#eee';
  const [filters, onChangeFilters] = useFilters<FilterType>({ fromDate: oneMonthAgo, toDate: today, categoryId: '' });
  const { data: categoryData } = useQuery({
    queryKey: ['partnerCode', 'P0001'],
    queryFn: async () => {
      const api = new PartnerCodeControllerApi();
      const res = await api.selectDropdownByPartnerCodeUpper(undefined, 'P0001');
      return (res.data.body ?? []).map((c) => ({ key: String(c.id), value: String(c.id), label: c.codeNm ?? '' }));
    },
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/mis/reviewFitAnalysis', filters],
    queryFn: () => authApi.get('/mis/reviewFitAnalysis', { params: filters }),
  });

  const items: ReviewFitItem[] = data?.data?.body ?? [];

  // ── 집계 ──────────────────────────────────────────────────────────────────
  const grandTotal = useMemo(() => items.reduce((s, r) => s + r.cnt, 0), [items]);

  // fitGroup 순서 (등장 순서 유지)
  const fitGroups = useMemo(() => {
    const seen = new Set<string>();
    items.forEach((r) => seen.add(r.fitGroup));
    return [...seen];
  }, [items]);

  const groupTotals = useMemo(() => {
    const m: Record<string, number> = {};
    items.forEach((r) => { m[r.fitGroup] = (m[r.fitGroup] ?? 0) + r.cnt; });
    return m;
  }, [items]);

  // ── 그리드 데이터 ──────────────────────────────────────────────────────────
  const rowData: GridRow[] = useMemo(() => {
    return items.map((r, i) => ({
      no: i + 1,
      fitGroup: r.fitGroup,
      myHeightWeightNm: r.myHeightWeightNm,
      cnt: r.cnt,
      pct: grandTotal > 0 ? `${((r.cnt / grandTotal) * 100).toFixed(1)}%` : '0.0%',
    }));
  }, [items, grandTotal]);

  const columnDefs: ColDef<GridRow>[] = [
    { headerName: 'NO', field: 'no', minWidth: 55, maxWidth: 65, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { headerName: '사이즈', field: 'fitGroup', minWidth: 100, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { headerName: '키 / 몸무게', field: 'myHeightWeightNm', minWidth: 160, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
    { headerName: '건수', field: 'cnt', minWidth: 80, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER, cellRenderer: 'NUMBER_COMMA' },
    { headerName: '비율', field: 'pct', minWidth: 80, suppressHeaderMenuButton: true, cellStyle: GridSetting.CellStyle.CENTER },
  ];

  // ── 차트: 가로 스택 바 (Y=사이즈 그룹, 시리즈=키/몸무게 조합) ──────────────
  const stackBarOption = useMemo(() => {
    // 키/몸무게 조합 목록 (cnt 내림차순 정렬)
    const comboMap = new Map<string, number>();
    items.forEach((r) => { comboMap.set(r.myHeightWeightNm, (comboMap.get(r.myHeightWeightNm) ?? 0) + r.cnt); });
    const combos = [...comboMap.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);

    const COLORS = [
      '#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe',
      '#0f766e', '#14b8a6', '#5eead4', '#99f6e4',
      '#b45309', '#fbbf24', '#fde68a',
      '#be123c', '#fb7185', '#fecdd3',
    ];

    const series = combos.map((combo, i) => ({
      name: combo,
      type: 'bar',
      stack: 'total',
      label: {
        show: true,
        formatter: (p: any) => p.value > 0 ? combo : '',
        fontSize: 11,
        color: '#fff',
        fontWeight: 600,
      },
      emphasis: { focus: 'series' },
      itemStyle: { color: COLORS[i % COLORS.length] },
      data: fitGroups.map((grp) =>
        items.filter((r) => r.fitGroup === grp && r.myHeightWeightNm === combo)
             .reduce((s, r) => s + r.cnt, 0)
      ),
    }));

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any[]) => {
          const total = params.reduce((s: number, p: any) => s + (p.value as number), 0);
          const lines = params
            .filter((p) => p.value > 0)
            .map((p) => {
              const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0.0';
              return `${p.marker}${p.seriesName}: <b>${p.value.toLocaleString()}건</b> (${pct}%)`;
            })
            .join('<br/>');
          return `<b>${params[0]?.axisValue}</b> 합계 ${total.toLocaleString()}건<br/>${lines}`;
        },
      },
      legend: { type: 'scroll', bottom: 0, textStyle: { fontSize: 11, color: chartTextColor } },
      grid: { left: 80, right: 24, top: 16, bottom: 60 },
      xAxis: { type: 'value', axisLabel: { formatter: (v: number) => v.toLocaleString(), fontSize: 11, color: chartTextColor }, splitLine: { lineStyle: { color: splitLineColor } } },
      yAxis: { type: 'category', data: fitGroups, axisLabel: { fontSize: 12, fontWeight: 'bold', color: chartTextColor }, axisLine: { lineStyle: { color: chartAxisColor } }, axisTick: { show: false } },
      series,
    };
  }, [items, fitGroups, chartTextColor, chartAxisColor, splitLineColor]);

  // ── 기간 프리셋 ────────────────────────────────────────────────────────────
  const applyPreset = (preset: (typeof PERIOD_PRESETS)[number]) => {
    const to = dayjs().format('YYYY-MM-DD');
    const from = dayjs().subtract(preset.months, 'month').format('YYYY-MM-DD');
    onChangeFilters('fromDate', from);
    onChangeFilters('toDate', to);
  };

  return (
    <div>
      <Title title={menuNm ?? '리뷰 분석'} reset={() => { onChangeFilters('fromDate', oneMonthAgo); onChangeFilters('toDate', today); }} search={refetch} />

      <Search className={'type_1'}>
        <CustomNewDatePicker
          title={'조회기간'}
          type={'range'}
          defaultType={'month'}
          startName={'fromDate'}
          endName={'toDate'}
          onChange={onChangeFilters}
          value={[filters.fromDate, filters.toDate]}
        />
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 8 }}>
          {PERIOD_PRESETS.map((p) => (
            <button key={p.label} className={'btn btnGray'} style={{ height: 32, padding: '0 12px', fontSize: 12 }} onClick={() => applyPreset(p)}>
              {p.label}
            </button>
          ))}
        </div>
        <Search.DropDown
          title={'카테고리'}
          name={'categoryId'}
          value={filters.categoryId}
          onChange={onChangeFilters}
          defaultOptions={categoryData ?? []}
          showAll={true}
        />
      </Search>

      {!isLoading && grandTotal > 0 && (
        <div style={{ fontSize: 13, color: isDark ? '#888899' : '#555', marginBottom: 8 }}>
          검색 <b>{grandTotal.toLocaleString()}건</b>
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* 좌: 그리드 */}
        <div style={{ flex: '0 0 460px' }}>
          <Table>
            <TunedGrid<GridRow>
              headerHeight={35}
              onGridReady={onGridReady}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              loading={isLoading}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              className={'default'}
            />
          </Table>
        </div>

        {/* 우: 가로 스택 바 차트 */}
        <div style={{ flex: 1 }}>
          <div style={{ background: isDark ? '#1e1e30' : '#fff', border: `1px solid ${isDark ? '#333350' : '#e8e8e8'}`, borderRadius: 8, padding: '16px 12px 12px' }}>
            <ReactECharts option={stackBarOption} style={{ height: 480 }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewAnalysis;
