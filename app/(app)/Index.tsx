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

type ReviewFitItem = {
  fitGroup: string;
  myHeightWeightNm: string;
  cnt: number;
};

type ContactItem = {
  refererUrl: string;
  deviceType: string;
  cnt: number;
};

const today = dayjs().format('YYYY-MM-DD');
const yearStart = dayjs().startOf('year').format('YYYY-MM-DD');
const sixMonthsAgo = dayjs().subtract(5, 'month').startOf('month').format('YYYY-MM-DD');
const oneMonthAgo = dayjs().subtract(1, 'month').format('YYYY-MM-DD');

const fmt = (v: number) =>
  v >= 100000000 ? (v / 100000000).toFixed(1) + '억' : v >= 10000 ? Math.floor(v / 10000).toLocaleString() + '만' : v.toLocaleString();

const REVIEW_COLORS = [
  '#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe',
  '#0f766e', '#14b8a6', '#5eead4', '#99f6e4',
  '#b45309', '#fbbf24', '#fde68a',
  '#be123c', '#fb7185', '#fecdd3',
];

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

  /* ── 리뷰 분석 최근 1개월 ── */
  const { data: reviewData } = useQuery({
    queryKey: ['/mis/reviewFitAnalysis/dashboard', oneMonthAgo, today],
    queryFn: () => authApi.get('/mis/reviewFitAnalysis', { params: { fromDate: oneMonthAgo, toDate: today } }),
  });
  const reviewItems: ReviewFitItem[] = reviewData?.data?.body ?? [];

  const fitGroups = useMemo(() => {
    const seen = new Set<string>();
    reviewItems.forEach((r) => seen.add(r.fitGroup));
    return [...seen];
  }, [reviewItems]);

  /* ── 접속경로 최근 1개월 ── */
  const { data: contactData } = useQuery({
    queryKey: ['/mis/contactList/dashboard', oneMonthAgo, today],
    queryFn: () => authApi.get('/mis/contactList', { params: { fromDate: oneMonthAgo, toDate: today, deviceType: '' } }),
  });
  const [contactRows, setContactRows] = useState<ContactItem[]>([]);
  useEffect(() => {
    const body = contactData?.data?.body;
    if (body) setContactRows(body);
  }, [contactData]);
  const top10Contact = useMemo(() => contactRows.slice(0, 10), [contactRows]);

  /* ── 공통 차트 색상 ── */
  const chartTextColor = isDark ? '#d0d0e0' : '#333';
  const chartAxisColor = isDark ? '#555570' : '#aaa';
  const splitLineColor = isDark ? '#2a2a3e' : '#eee';

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
        { type: 'value', name: '건수', nameTextStyle: { fontSize: 11, color: chartTextColor }, axisLabel: { color: chartTextColor }, splitLine: { lineStyle: { color: splitLineColor } } },
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
        { name: '구매건수', type: 'bar', yAxisIndex: 0, data: top10.map((d) => d.purchaseCnt), itemStyle: { color: '#5b8ff9' }, label: { show: true, position: 'top', fontSize: 10, formatter: '{c}', color: chartTextColor } },
        { name: '장바구니건수', type: 'bar', yAxisIndex: 0, data: top10.map((d) => d.cartCnt), itemStyle: { color: '#61ddaa' }, label: { show: true, position: 'top', fontSize: 10, formatter: '{c}', color: chartTextColor } },
        { name: '페이지뷰', type: 'bar', yAxisIndex: 1, data: top10.map((d) => d.pageViewCnt), itemStyle: { color: '#f6bd16' }, label: { show: true, position: 'top', fontSize: 10, formatter: '{c}', color: chartTextColor } },
        { name: '총점', type: 'bar', yAxisIndex: 0, data: top10.map((d) => d.totalScore), itemStyle: { color: '#e86452' }, label: { show: true, position: 'top', fontSize: 10, formatter: '{c}', color: chartTextColor } },
      ],
    };
  }, [top10, chartTextColor, chartAxisColor, splitLineColor]);

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
        { type: 'value', name: '총구매금액', nameTextStyle: { fontSize: 11, color: chartTextColor }, axisLabel: { color: chartTextColor, formatter: (v: number) => (v >= 10000 ? Math.floor(v / 10000) + '만' : v.toLocaleString()) }, splitLine: { lineStyle: { color: splitLineColor } } },
      ],
      series: [
        { name: '총구매금액', type: 'bar', yAxisIndex: 1, data: amtData, itemStyle: { color: '#5b8ff9' }, label: { show: true, position: 'top', fontSize: 10, color: chartTextColor, formatter: (p: any) => (p.value >= 10000 ? Math.floor(p.value / 10000) + '만' : p.value.toLocaleString()) } },
        { name: '구매건수', type: 'line', yAxisIndex: 0, data: cntData, itemStyle: { color: '#e86452' }, lineStyle: { width: 2 }, symbol: 'circle', symbolSize: 6, label: { show: true, position: 'top', fontSize: 10, color: chartTextColor, formatter: '{c}건' } },
      ],
    };
  }, [statRows, chartTextColor, chartAxisColor, splitLineColor]);

  /* ── 리뷰 분석 차트 옵션 (가로 스택 바) ── */
  const reviewChartOption = useMemo(() => {
    const comboMap = new Map<string, number>();
    reviewItems.forEach((r) => { comboMap.set(r.myHeightWeightNm, (comboMap.get(r.myHeightWeightNm) ?? 0) + r.cnt); });
    const combos = [...comboMap.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);

    const series = combos.map((combo, i) => ({
      name: combo,
      type: 'bar',
      stack: 'total',
      label: { show: true, formatter: (p: any) => p.value > 0 ? combo : '', fontSize: 10, color: '#fff', fontWeight: 600 },
      emphasis: { focus: 'series' },
      itemStyle: { color: REVIEW_COLORS[i % REVIEW_COLORS.length] },
      data: fitGroups.map((grp) =>
        reviewItems.filter((r) => r.fitGroup === grp && r.myHeightWeightNm === combo).reduce((s, r) => s + r.cnt, 0)
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
      yAxis: { type: 'category', data: fitGroups, axisLabel: { fontSize: 12, fontWeight: 'bold', color: chartTextColor }, axisTick: { show: false }, axisLine: { lineStyle: { color: chartAxisColor } } },
      series,
    };
  }, [reviewItems, fitGroups, chartTextColor, chartAxisColor, splitLineColor]);

  /* ── 접속경로 차트 옵션 (가로 바 — Mobile/Desktop 스택) ── */
  const contactChartOption = useMemo(() => {
    const labels = top10Contact.map((d) => {
      const url = d.refererUrl || '(직접유입)';
      return url.length > 28 ? url.slice(0, 28) + '…' : url;
    });

    // 유입 URL별로 mobile/desktop/기타 합산
    const urlMap = new Map<string, { mobile: number; desktop: number; other: number }>();
    contactRows.forEach((d) => {
      const url = d.refererUrl || '(직접유입)';
      if (!urlMap.has(url)) urlMap.set(url, { mobile: 0, desktop: 0, other: 0 });
      const entry = urlMap.get(url)!;
      if (d.deviceType === 'mobile') entry.mobile += d.cnt;
      else if (d.deviceType === 'desktop') entry.desktop += d.cnt;
      else entry.other += d.cnt;
    });

    const sortedUrls = [...urlMap.entries()].sort((a, b) => (b[1].mobile + b[1].desktop + b[1].other) - (a[1].mobile + a[1].desktop + a[1].other)).slice(0, 10);
    const urlLabels = sortedUrls.map(([url]) => url.length > 28 ? url.slice(0, 28) + '…' : url);
    const mobileData = sortedUrls.map(([, v]) => v.mobile);
    const desktopData = sortedUrls.map(([, v]) => v.desktop);
    const otherData = sortedUrls.map(([, v]) => v.other);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any[]) => {
          const total = params.reduce((s: number, p: any) => s + (p.value as number), 0);
          const lines = params.filter((p) => p.value > 0).map((p) => `${p.marker}${p.seriesName}: <b>${p.value.toLocaleString()}건</b>`).join('<br/>');
          return `<b>${params[0]?.axisValue}</b> 합계 ${total.toLocaleString()}건<br/>${lines}`;
        },
      },
      legend: { bottom: 0, data: ['Mobile', 'Desktop', '기타'], textStyle: { color: chartTextColor } },
      grid: { left: 16, right: 24, top: 16, bottom: 50, containLabel: true },
      xAxis: { type: 'value', axisLabel: { fontSize: 11, color: chartTextColor }, splitLine: { lineStyle: { color: splitLineColor } } },
      yAxis: { type: 'category', data: urlLabels, axisLabel: { fontSize: 10, color: chartTextColor }, axisTick: { show: false }, axisLine: { lineStyle: { color: chartAxisColor } } },
      series: [
        { name: 'Mobile', type: 'bar', stack: 'total', data: mobileData, itemStyle: { color: '#5b8ff9' } },
        { name: 'Desktop', type: 'bar', stack: 'total', data: desktopData, itemStyle: { color: '#61ddaa' } },
        { name: '기타', type: 'bar', stack: 'total', data: otherData, itemStyle: { color: '#f6bd16' } },
      ],
    };
  }, [contactRows, top10Contact, chartTextColor, chartAxisColor, splitLineColor]);

  /* ── 스타일 변수 ── */
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

      {/* ── 1행: 상품 TOP 10 / 월별 판매 ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1, background: chartBg, border: `1px solid ${chartBorderColor}`, borderRadius: 8, padding: '16px 12px' }}>
          <p style={{ margin: '0 0 8px 4px', fontSize: 13, fontWeight: 600, color: chartTitleColor }}>잘 팔리는 상품 TOP 10 (총점 기준)</p>
          {top10.length > 0 ? <ReactECharts option={top10ChartOption} style={{ height: 340 }} /> : <EmptyChart isDark={isDark} />}
        </div>
        <div style={{ flex: 1, background: chartBg, border: `1px solid ${chartBorderColor}`, borderRadius: 8, padding: '16px 12px' }}>
          <p style={{ margin: '0 0 8px 4px', fontSize: 13, fontWeight: 600, color: chartTitleColor }}>월별 판매 실적 차트</p>
          {statRows.length > 0 ? <ReactECharts option={monthlyChartOption} style={{ height: 340 }} /> : <EmptyChart isDark={isDark} />}
        </div>
      </div>

      {/* ── 2행: 셀러 리뷰 분석 / 접속경로 (최근 1개월) ── */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, background: chartBg, border: `1px solid ${chartBorderColor}`, borderRadius: 8, padding: '16px 12px' }}>
          <p style={{ margin: '0 0 4px 4px', fontSize: 13, fontWeight: 600, color: chartTitleColor }}>셀러 리뷰 분석 <span style={{ fontSize: 11, color: textMuted, fontWeight: 400 }}>(최근 1개월)</span></p>
          {reviewItems.length > 0 ? <ReactECharts option={reviewChartOption} style={{ height: 340 }} /> : <EmptyChart isDark={isDark} />}
        </div>
        <div style={{ flex: 1, background: chartBg, border: `1px solid ${chartBorderColor}`, borderRadius: 8, padding: '16px 12px' }}>
          <p style={{ margin: '0 0 4px 4px', fontSize: 13, fontWeight: 600, color: chartTitleColor }}>접속경로 TOP 10 <span style={{ fontSize: 11, color: textMuted, fontWeight: 400 }}>(최근 1개월)</span></p>
          {contactRows.length > 0 ? <ReactECharts option={contactChartOption} style={{ height: 340 }} /> : <EmptyChart isDark={isDark} />}
        </div>
      </div>
    </div>
  );
};

const EmptyChart = ({ isDark }: { isDark: boolean }) => (
  <div style={{ height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#555570' : '#bbb', fontSize: 13 }}>데이터가 없습니다.</div>
);

export default Dashboard;
