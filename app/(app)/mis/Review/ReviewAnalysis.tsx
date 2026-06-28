'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../../libs';
import { useCommonStore } from '../../../../stores';
import { Title } from '../../../../components';
import ReactECharts from 'echarts-for-react';

// ─── 코드 정의 ────────────────────────────────────────────────────────────────

const HEIGHT_CODES: Record<string, string> = {
  '1': '155이하',
  '3': '155~159',
  '5': '160~164',
  '7': '165이상',
};

const WEIGHT_CODES: Record<string, string> = {
  '1': '50이하',
  '3': '56~59',
  '5': '60~64',
  '7': '65이상',
};

const FIT_GROUP_ORDER = ['적당해요', '작아요', '커요'];

const HEIGHT_COLORS = ['#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe'];
const WEIGHT_COLORS = ['#0f766e', '#14b8a6', '#5eead4', '#99f6e4'];

// ─── 타입 ─────────────────────────────────────────────────────────────────────

type ReviewFitItem = {
  fitGroup: string;
  myHeight: string;
  myWeight: string;
  cnt: number;
};

// ─── 차트 옵션 빌더 ───────────────────────────────────────────────────────────

function buildChartOption(
  title: string,
  groups: string[],
  series: { name: string; data: { value: number; cnt: number }[]; color: string }[],
) {
  return {
    title: { text: title, left: 0, textStyle: { fontSize: 14, fontWeight: 600, color: '#333' } },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any[]) => {
        const lines = params
          .filter((p) => p.value > 0)
          .map((p) => `${p.marker}${p.seriesName}: <b>${p.value.toFixed(1)}%</b> (${p.data.cnt}건)`)
          .join('<br/>');
        return `<b>${params[0]?.axisValue}</b><br/>${lines}`;
      },
    },
    legend: { top: 28, type: 'scroll', textStyle: { fontSize: 12 } },
    grid: { left: 70, right: 24, top: 80, bottom: 16 },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
    },
    yAxis: {
      type: 'category',
      data: groups,
      axisLabel: { fontSize: 12, fontWeight: 600 },
      axisTick: { show: false },
    },
    series: series.map((s) => ({
      name: s.name,
      type: 'bar',
      stack: 'total',
      itemStyle: { color: s.color, borderRadius: 0 },
      label: {
        show: true,
        formatter: (p: any) => (p.value >= 5 ? `${p.value.toFixed(1)}%` : ''),
        fontSize: 11,
        color: '#fff',
        fontWeight: 600,
      },
      data: s.data,
      barMaxWidth: 40,
    })),
  };
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

const ReviewAnalysis = () => {
  const menuNm = useCommonStore((s) => s.menuNm);

  const { data, isLoading } = useQuery({
    queryKey: ['/mis/reviewFitAnalysis'],
    queryFn: () => authApi.get('/mis/reviewFitAnalysis'),
  });

  const items: ReviewFitItem[] = data?.data?.body ?? [];

  // 전체 건수
  const grandTotal = useMemo(() => items.reduce((sum, r) => sum + r.cnt, 0), [items]);

  // 그룹별 건수
  const groupTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of items) {
      map[item.fitGroup] = (map[item.fitGroup] ?? 0) + item.cnt;
    }
    return map;
  }, [items]);

  // ── 키 차트 데이터 ──────────────────────────────────────────────────────────
  const heightChartOption = useMemo(() => {
    const hCodes = Object.keys(HEIGHT_CODES);
    const series = hCodes.map((hCode, i) => ({
      name: `키 ${HEIGHT_CODES[hCode]}`,
      color: HEIGHT_COLORS[i],
      data: FIT_GROUP_ORDER.map((grp) => {
        const cnt = items
          .filter((r) => r.fitGroup === grp && r.myHeight === hCode)
          .reduce((s, r) => s + r.cnt, 0);
        const groupTotal = groupTotals[grp] ?? 0;
        const pct = groupTotal > 0 ? Math.round((cnt / groupTotal) * 1000) / 10 : 0;
        return { value: pct, cnt };
      }),
    }));
    return buildChartOption('키 분포 (그룹 내 %)', FIT_GROUP_ORDER, series.map((s, i) => ({ ...s, color: HEIGHT_COLORS[i] })));
  }, [items, groupTotals]);

  // ── 몸무게 차트 데이터 ──────────────────────────────────────────────────────
  const weightChartOption = useMemo(() => {
    const wCodes = Object.keys(WEIGHT_CODES);
    const series = wCodes.map((wCode, i) => ({
      name: `몸무게 ${WEIGHT_CODES[wCode]}kg`,
      color: WEIGHT_COLORS[i],
      data: FIT_GROUP_ORDER.map((grp) => {
        const cnt = items
          .filter((r) => r.fitGroup === grp && r.myWeight === wCode)
          .reduce((s, r) => s + r.cnt, 0);
        const groupTotal = groupTotals[grp] ?? 0;
        const pct = groupTotal > 0 ? Math.round((cnt / groupTotal) * 1000) / 10 : 0;
        return { value: pct, cnt };
      }),
    }));
    return buildChartOption('몸무게 분포 (그룹 내 %)', FIT_GROUP_ORDER, series.map((s, i) => ({ ...s, color: WEIGHT_COLORS[i] })));
  }, [items, groupTotals]);

  return (
    <div>
      <Title title={menuNm ?? '리뷰 분석'} />

      {/* 요약 카드 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <SummaryCard label="전체 리뷰" value={grandTotal} color="#6b21a8" />
        {FIT_GROUP_ORDER.map((grp) => (
          <SummaryCard
            key={grp}
            label={grp}
            value={groupTotals[grp] ?? 0}
            pct={grandTotal > 0 ? ((groupTotals[grp] ?? 0) / grandTotal) * 100 : 0}
            color={grp === '적당해요' ? '#0f766e' : grp === '작아요' ? '#c2410c' : '#b45309'}
          />
        ))}
      </div>

      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>데이터 로딩 중...</div>
      ) : grandTotal === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>리뷰 데이터가 없습니다.</div>
      ) : (
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={chartWrap}>
            <ReactECharts option={heightChartOption} style={{ height: 260 }} />
          </div>
          <div style={chartWrap}>
            <ReactECharts option={weightChartOption} style={{ height: 260 }} />
          </div>
        </div>
      )}
    </div>
  );
};

const chartWrap: React.CSSProperties = {
  flex: 1,
  background: '#fff',
  border: '1px solid #e8e8e8',
  borderRadius: 8,
  padding: '16px 12px 12px',
};

function SummaryCard({ label, value, pct, color }: { label: string; value: number; pct?: number; color: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: '#fff',
        border: '1px solid #e8e8e8',
        borderRadius: 8,
        padding: '14px 16px',
        borderTop: `3px solid ${color}`,
      }}
    >
      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#222' }}>
        {value.toLocaleString()}건
      </div>
      {pct !== undefined && (
        <div style={{ fontSize: 12, color, fontWeight: 600, marginTop: 2 }}>{pct.toFixed(1)}%</div>
      )}
    </div>
  );
}

export default ReviewAnalysis;
