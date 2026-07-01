'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../libs';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { useDarkMode } from '../../contexts/ThemeContext';

type ProductViewItem = {
  prodId: number;
  prodNm: string;
  purchaseCnt: number;
  cartCnt: number;
  pageViewCnt: number;
  totalScore: number;
};

type SalesStatItem = {
  period: string;
  totalPaymentAmt: number;
  purchaseCnt: number;
};

type DailySalesStat = {
  todayPurchaseCnt: number;
  todayPaymentAmt: number;
  yesterdayPurchaseCnt: number;
  yesterdayPaymentAmt: number;
  todayCancelCnt: number;
  todayCancelAmt: number;
  yesterdayCancelCnt: number;
  yesterdayCancelAmt: number;
};

const today = dayjs().format('YYYY-MM-DD');
const yearStart = dayjs().startOf('year').format('YYYY-MM-DD');
const sixMonthsAgo = dayjs().subtract(5, 'month').startOf('month').format('YYYY-MM-DD');

const fmt = (v: number) =>
  v >= 100000000 ? (v / 100000000).toFixed(1) + '억' : v >= 10000 ? Math.floor(v / 10000).toLocaleString() + '만' : v.toLocaleString();

const Dashboard = () => {
  const session = useSession();
  const isDark = useDarkMode();

  /* ── 금일/어제 현황 ── */
  const { data: dailyData } = useQuery({
    queryKey: ['/mis/dailySalesStat'],
    queryFn: () => authApi.get('/mis/dailySalesStat'),
  });
  const daily: DailySalesStat = dailyData?.data?.body ?? {
    todayPurchaseCnt: 0,
    todayPaymentAmt: 0,
    yesterdayPurchaseCnt: 0,
    yesterdayPaymentAmt: 0,
    todayCancelCnt: 0,
    todayCancelAmt: 0,
    yesterdayCancelCnt: 0,
    yesterdayCancelAmt: 0,
  };

  /* ── ProductView TOP 10 ── */
  const { data: productData } = useQuery({
    queryKey: ['/mis/productViewList/dashboard', yearStart, today],
    queryFn: () => authApi.get('/mis/productViewList', { params: { fromDate: yearStart, toDate: today, orderStatus: 'P' } }),
  });
  const [productRows, setProductRows] = useState<ProductViewItem[]>([]);
  useEffect(() => {
    const body = productData?.data?.body;
    if (body) setProductRows(body);
  }, [productData]);
  const top10 = useMemo(() => productRows.slice(0, 10), [productRows]);

  /* ── MonthlyView 최근 6개월 ── */
  const { data: monthlyData } = useQuery({
    queryKey: ['/mis/salesStatList/dashboard', sixMonthsAgo, today],
    queryFn: () =>
      authApi.get('/mis/salesStatList', {
        params: { viewType: 'monthly', fromDate: sixMonthsAgo, toDate: today, orderStatus: 'P' },
      }),
  });
  const [statRows, setStatRows] = useState<SalesStatItem[]>([]);
  useEffect(() => {
    const body = monthlyData?.data?.body;
    if (body) setStatRows(body);
  }, [monthlyData]);

  const chartTextColor = isDark ? '#d0d0e0' : '#333';
  const chartAxisColor = isDark ? '#555570' : '#aaa';

  /* ── TOP 10 차트 옵션 ── */
  const top10ChartOption = useMemo(() => {
    const names = top10.map((d) => (d.prodNm.length > 8 ? d.prodNm.slice(0, 8) + '…' : d.prodNm));
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
        { type: 'value', name: '건수', nameTextStyle: { fontSize: 11, color: chartTextColor }, axisLabel: { color: chartTextColor }, splitLine: { lineStyle: { color: isDark ? '#2a2a3e' : '#eee' } } },
        {
          type: 'value',
          name: '페이지뷰',
          nameTextStyle: { fontSize: 11, color: chartTextColor },
          axisLabel: { color: chartTextColor },
          ...(useRightAxis ? { max: rightAxisMax, interval: rightAxisInterval } : {}),
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '구매건수',
          type: 'bar',
          yAxisIndex: 0,
          data: top10.map((d) => d.purchaseCnt),
          itemStyle: { color: '#5b8ff9' },
          label: { show: true, position: 'top', fontSize: 10, formatter: '{c}', color: chartTextColor },
        },
        {
          name: '장바구니건수',
          type: 'bar',
          yAxisIndex: 0,
          data: top10.map((d) => d.cartCnt),
          itemStyle: { color: '#61ddaa' },
          label: { show: true, position: 'top', fontSize: 10, formatter: '{c}', color: chartTextColor },
        },
        {
          name: '페이지뷰',
          type: 'bar',
          yAxisIndex: 1,
          data: top10.map((d) => d.pageViewCnt),
          itemStyle: { color: '#f6bd16' },
          label: { show: true, position: 'top', fontSize: 10, formatter: '{c}', color: chartTextColor },
        },
        {
          name: '총점',
          type: 'bar',
          yAxisIndex: 0,
          data: top10.map((d) => d.totalScore),
          itemStyle: { color: '#e86452' },
          label: { show: true, position: 'top', fontSize: 10, formatter: '{c}', color: chartTextColor },
        },
      ],
    };
  }, [top10, isDark, chartTextColor, chartAxisColor]);

  /* ── 월별 차트 옵션 ── */
  const monthlyChartOption = useMemo(() => {
    const periods = statRows.map((d) => d.period);
    const amtData = statRows.map((d) => d.totalPaymentAmt);
    const cntData = statRows.map((d) => d.purchaseCnt);
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any[]) => {
          if (!params?.length) return '';
          return params
            .map((p) => {
              const val = p.seriesName === '총구매금액' ? p.value.toLocaleString() + '원' : p.value.toLocaleString() + '건';
              return `${p.marker}${p.seriesName}: <b>${val}</b>`;
            })
            .join('<br/>')
            .replace(/^/, `<b>${params[0].axisValue}</b><br/>`);
        },
      },
      legend: { bottom: 0, data: ['총구매금액', '구매건수'], textStyle: { color: chartTextColor } },
      grid: { left: 16, right: 60, top: 50, bottom: 50, containLabel: true },
      xAxis: { type: 'category', data: periods, axisLabel: { fontSize: 11, color: chartTextColor }, axisLine: { lineStyle: { color: chartAxisColor } } },
      yAxis: [
        { type: 'value', name: '구매건수', nameTextStyle: { fontSize: 11, color: chartTextColor }, axisLabel: { color: chartTextColor }, splitLine: { show: false } },
        {
          type: 'value',
          name: '총구매금액',
          nameTextStyle: { fontSize: 11, color: chartTextColor },
          axisLabel: { color: chartTextColor, formatter: (v: number) => (v >= 10000 ? Math.floor(v / 10000) + '만' : v.toLocaleString()) },
          splitLine: { lineStyle: { color: isDark ? '#2a2a3e' : '#eee' } },
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
  }, [statRows, isDark, chartTextColor, chartAxisColor]);

  const bg = isDark ? '#141420' : '#f5f6fa';
  const cardBg = isDark ? '#1e1e30' : '#fff';
  const cardBorder = isDark ? '#333350' : '#e8e8e8';
  const textPrimary = isDark ? '#d0d0e0' : '#222';
  const textMuted = isDark ? '#888899' : '#888';
  const separatorColor = isDark ? '#555570' : '#aaa';
  const chartBg = isDark ? '#1e1e30' : '#fff';
  const chartBorderColor = isDark ? '#333350' : '#e8e8e8';
  const chartTitleColor = isDark ? '#d0d0e0' : '#333';

  return (
    <div style={{ padding: '20px 24px', background: bg, minHeight: '100%' }}>
      {/* ── 상단: 인사 ── */}
      <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700, color: textPrimary }}>{session?.data?.user.userNm ?? ''} 님 안녕하세요</h2>

      {/* ── 현황 카드 ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {/* 금일 판매 */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderLeft: '3px solid #5b8ff9', borderRadius: 8, padding: '10px 18px', minWidth: 200 }}>
            <div style={{ fontSize: 12, color: textMuted, marginBottom: 6 }}>오늘 판매 / 금액</div>
            <div style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ color: '#5b8ff9' }}>{daily.todayPurchaseCnt.toLocaleString()}</span>
              <span style={{ fontSize: 12, color: textMuted, marginLeft: 1 }}>건</span>
              <span style={{ color: separatorColor, margin: '0 6px' }}>/</span>
              <span style={{ color: '#e86452' }}>{fmt(daily.todayPaymentAmt)}</span>
              <span style={{ fontSize: 12, color: textMuted, marginLeft: 1 }}>원</span>
            </div>
          </div>
          {/* 어제 판매 */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 8, padding: '10px 18px', minWidth: 200 }}>
            <div style={{ fontSize: 12, color: textMuted, marginBottom: 6 }}>어제 판매 / 금액</div>
            <div style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ color: '#5b8ff9' }}>{daily.yesterdayPurchaseCnt.toLocaleString()}</span>
              <span style={{ fontSize: 12, color: textMuted, marginLeft: 1 }}>건</span>
              <span style={{ color: separatorColor, margin: '0 6px' }}>/</span>
              <span style={{ color: '#e86452' }}>{fmt(daily.yesterdayPaymentAmt)}</span>
              <span style={{ fontSize: 12, color: textMuted, marginLeft: 1 }}>원</span>
            </div>
          </div>
          {/* 금일 취소 */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderLeft: '3px solid #f56c6c', borderRadius: 8, padding: '10px 18px', minWidth: 200 }}>
            <div style={{ fontSize: 12, color: textMuted, marginBottom: 6 }}>금일 취소 / 금액</div>
            <div style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ color: '#f56c6c' }}>{daily.todayCancelCnt.toLocaleString()}</span>
              <span style={{ fontSize: 12, color: textMuted, marginLeft: 1 }}>건</span>
              <span style={{ color: separatorColor, margin: '0 6px' }}>/</span>
              <span style={{ color: '#f56c6c' }}>{fmt(daily.todayCancelAmt)}</span>
              <span style={{ fontSize: 12, color: textMuted, marginLeft: 1 }}>원</span>
            </div>
          </div>
          {/* 어제 취소 */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderLeft: '3px solid #f0a0a0', borderRadius: 8, padding: '10px 18px', minWidth: 200 }}>
            <div style={{ fontSize: 12, color: textMuted, marginBottom: 6 }}>어제 취소 / 금액</div>
            <div style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ color: '#f56c6c' }}>{daily.yesterdayCancelCnt.toLocaleString()}</span>
              <span style={{ fontSize: 12, color: textMuted, marginLeft: 1 }}>건</span>
              <span style={{ color: separatorColor, margin: '0 6px' }}>/</span>
              <span style={{ color: '#f56c6c' }}>{fmt(daily.yesterdayCancelAmt)}</span>
              <span style={{ fontSize: 12, color: textMuted, marginLeft: 1 }}>원</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 차트 2개 ── */}
      <div style={{ display: 'flex', gap: 16 }}>
        {/* 왼쪽: TOP 10 */}
        <div style={{ flex: 1, background: chartBg, border: `1px solid ${chartBorderColor}`, borderRadius: 8, padding: '16px 12px' }}>
          <p style={{ margin: '0 0 8px 4px', fontSize: 13, fontWeight: 600, color: chartTitleColor }}>잘 팔리는 상품 TOP 10 (총점 기준)</p>
          {top10.length > 0 ? <ReactECharts option={top10ChartOption} style={{ height: 380 }} /> : <EmptyChart isDark={isDark} />}
        </div>

        {/* 오른쪽: 월별 실적 */}
        <div style={{ flex: 1, background: chartBg, border: `1px solid ${chartBorderColor}`, borderRadius: 8, padding: '16px 12px' }}>
          <p style={{ margin: '0 0 8px 4px', fontSize: 13, fontWeight: 600, color: chartTitleColor }}>월별 판매 실적 차트</p>
          {statRows.length > 0 ? <ReactECharts option={monthlyChartOption} style={{ height: 380 }} /> : <EmptyChart isDark={isDark} />}
        </div>
      </div>
    </div>
  );
};

const EmptyChart = ({ isDark }: { isDark: boolean }) => (
  <div style={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#555570' : '#bbb', fontSize: 13 }}>데이터가 없습니다.</div>
);

export default Dashboard;
