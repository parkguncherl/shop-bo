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

type ContactFilter = {
  fromDate: string;
  toDate: string;
  deviceType: string;
  refererUrl: string;
};

type ContactItem = {
  refererUrl: string;
  deviceType: string;
  cnt: number;
};

const today = dayjs().format('YYYY-MM-DD');
const monthAgo = dayjs().subtract(1, 'month').format('YYYY-MM-DD');

const DEVICE_OPTIONS = [
  { label: '전체', value: '' },
  { label: 'Mobile', value: 'mobile' },
  { label: 'Desktop', value: 'desktop' },
];

const ContactRoot = () => {
  const { onGridReady } = useAgGridApi();
  const menuNm = useCommonStore((s) => s.menuNm);
  const isDark = useDarkMode();
  const chartTextColor = isDark ? '#d0d0e0' : '#333';
  const chartAxisColor = isDark ? '#555570' : '#aaa';
  const splitLineColor = isDark ? '#2a2a3e' : '#eee';

  const [filters, onChangeFilters, onFiltersReset] = useFilters<ContactFilter>({
    fromDate: monthAgo,
    toDate: today,
    deviceType: 'mobile',
    refererUrl: '',
  });

  const [rowData, setRowData] = useState<ContactItem[]>([]);

  const top20 = useMemo(() => rowData.slice(0, 20), [rowData]);

  const chartOption = useMemo(() => {
    const labels = top20.map((d) => {
      const url = d.refererUrl || '(직접유입)';
      return url.length > 30 ? url.slice(0, 30) + '…' : url;
    });
    const mobileData = top20.map((d) => (d.deviceType === 'mobile' ? d.cnt : 0));
    const desktopData = top20.map((d) => (d.deviceType === 'desktop' ? d.cnt : 0));
    const otherData = top20.map((d) => (d.deviceType !== 'mobile' && d.deviceType !== 'desktop' ? d.cnt : 0));

    const showByDevice = filters.deviceType === '';

    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: showByDevice
        ? { bottom: 0, data: ['Mobile', 'Desktop', '기타'], textStyle: { color: chartTextColor } }
        : { show: false },
      grid: { left: 16, right: 16, top: 50, bottom: showByDevice ? 50 : 30, containLabel: true },
      xAxis: { type: 'category', data: labels, axisLabel: { rotate: 35, fontSize: 10, interval: 0, color: chartTextColor }, axisLine: { lineStyle: { color: chartAxisColor } } },
      yAxis: { type: 'value', name: '건수', nameTextStyle: { color: chartTextColor }, axisLabel: { color: chartTextColor }, splitLine: { lineStyle: { color: splitLineColor } } },
      series: showByDevice
        ? [
            { name: 'Mobile', type: 'bar', stack: 'total', data: mobileData, itemStyle: { color: '#5b8ff9' }, label: { show: false } },
            { name: 'Desktop', type: 'bar', stack: 'total', data: desktopData, itemStyle: { color: '#61ddaa' }, label: { show: false } },
            { name: '기타', type: 'bar', stack: 'total', data: otherData, itemStyle: { color: '#f6bd16' }, label: { show: false } },
          ]
        : [
            { name: '건수', type: 'bar', data: top20.map((d) => d.cnt), itemStyle: { color: filters.deviceType === 'mobile' ? '#5b8ff9' : '#61ddaa' }, label: { show: true, position: 'top', fontSize: 10, formatter: '{c}', color: chartTextColor } },
          ],
    };
  }, [top20, filters.deviceType, chartTextColor, chartAxisColor, splitLineColor]);

  const columnDefs: ColDef<ContactItem>[] = [
    {
      headerName: 'No',
      minWidth: 55,
      maxWidth: 55,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueGetter: (params) => (params.node?.rowIndex != null ? params.node.rowIndex + 1 : ''),
    },
    {
      field: 'refererUrl',
      headerName: '유입 URL',
      minWidth: 200,
      suppressHeaderMenuButton: true,
      valueFormatter: (p) => p.value || '(직접유입)',
    },
    {
      field: 'deviceType',
      headerName: '디바이스',
      minWidth: 90,
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'cnt',
      headerName: '건수',
      minWidth: 80,
      maxWidth: 100,
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
    queryKey: ['/mis/contactList', filters],
    queryFn: () => authApi.get('/mis/contactList', { params: filters }),
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
    <div className="imgPopBox">
      <Title title={menuNm ?? 'MIS 유입 경로 분석'} reset={reset} search={refetch} />
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
                  <button key={label} className="btn" onClick={fn} style={{ height: 28, padding: '0 10px', fontSize: 12 }}>{label}</button>
                ))}
              </div>
            </div>
          </dd>
        </dl>
        <dl>
          <dt>디바이스</dt>
          <dd>
            <div className="formBox">
              {DEVICE_OPTIONS.map((opt, i, arr) => (
                <button
                  key={opt.value}
                  type="button"
                  style={{
                    padding: '0 14px',
                    height: 32,
                    fontSize: 13,
                    fontWeight: 500,
                    border: `1px solid ${isDark ? '#333350' : '#d9d9d9'}`,
                    background: filters.deviceType === opt.value ? '#5b21b6' : isDark ? '#252538' : '#f3f4f6',
                    color: filters.deviceType === opt.value ? '#fff' : isDark ? '#d0d0e0' : '#6b7280',
                    cursor: 'pointer',
                    marginLeft: -1,
                    position: 'relative',
                    borderRadius: i === 0 ? '6px 0 0 6px' : i === arr.length - 1 ? '0 6px 6px 0' : 0,
                  }}
                  onClick={() => onChangeFilters('deviceType', opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </dd>
        </dl>
        <dl>
          <dt>URL</dt>
          <dd>
            <div className="formBox">
              <input
                className="inputBox"
                placeholder="유입 URL 검색"
                value={filters.refererUrl}
                onChange={(e) => onChangeFilters('refererUrl', e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') refetch(); }}
                style={{ height: 32, padding: '0 8px', border: '1px solid #d9d9d9', borderRadius: 4, minWidth: 220 }}
              />
            </div>
          </dd>
        </dl>
      </Search>

      <div style={{ display: 'flex', gap: 16, padding: '0 16px 16px', alignItems: 'flex-start' }}>
        {/* 왼쪽: ag-grid */}
        <div style={{ flex: '0 0 auto', width: 480 }}>
          <Table>
            <TunedGrid
              headerHeight={35}
              onGridReady={onGridReady}
              loading={isLoading}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              className={'default'}
            />
          </Table>
        </div>

        {/* 오른쪽: ECharts TOP 20 */}
        <div style={{ flex: 1, minWidth: 0, border: `1px solid ${isDark ? '#333350' : '#e8e8e8'}`, borderRadius: 4, background: isDark ? '#1e1e30' : '#fff', padding: '12px 8px' }}>
          <p style={{ margin: '0 0 8px 8px', fontSize: 13, fontWeight: 600, color: chartTextColor }}>
            유입 URL TOP 20 (건수 기준)
          </p>
          {top20.length > 0 ? (
            <ReactECharts option={chartOption} style={{ height: 420 }} />
          ) : (
            <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#555570' : '#aaa', fontSize: 13 }}>
              데이터가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactRoot;
