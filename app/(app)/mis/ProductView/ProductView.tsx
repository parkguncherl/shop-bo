'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ColDef, RowClickedEvent } from 'ag-grid-community';
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
import CustomNewDatePicker from '../../../../components/CustomNewDatePicker';
import { authApi } from '../../../../libs';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import ImgPreviewBox, { ImgPreviewFileDet } from '../../../../components/content/ImgPreviewBox';
import { CustomSwitch } from '../../../../components/CustomSwitch';
import SeasonButtonGroup from '../../../../components/SeasonButtonGroup';
import { FileDet } from '../../../../generated';
import CustomDatePickerAsPartiallyStateFulFn from '../../../../components/CustomDatePickerAsPartiallyStateFulFn';
import { useDarkMode } from '../../../../contexts/ThemeContext';

type ProductViewFilter = {
  fromDate: string;
  toDate: string;
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

const ProductView = () => {
  const { onGridReady } = useAgGridApi();
  const menuNm = useCommonStore((s) => s.menuNm);
  const isDark = useDarkMode();
  const chartTextColor = isDark ? '#d0d0e0' : '#333';
  const chartAxisColor = isDark ? '#555570' : '#aaa';
  const splitLineColor = isDark ? '#2a2a3e' : '#eee';
  const [getFileUrl, getFileList] = useCommonStore((s) => [s.getFileUrl, s.getFileList]);

  const [filters, onChangeFilters, onFiltersReset] = useFilters<ProductViewFilter>({
    fromDate: yearStart,
    toDate: today,
  });

  const [weather, setWeather] = useState<string[]>(['spring', 'summer', 'autumn', 'winter']);

  const [rowData, setRowData] = useState<ProductViewItem[]>([]);
  const [imgPreviewBoxOn, setImgPreviewBoxOn] = useState(true);
  const [resized, setResized] = useState(false);
  const [imgPreviewFileDetList, setImgPreviewFileDetList] = useState<ImgPreviewFileDet[]>([]);

  const top10 = useMemo(() => rowData.slice(0, 10), [rowData]);

  const chartOption = useMemo(() => {
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

  const columnDefs: ColDef<ProductViewItem>[] = [
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

  const onRowClicked = (e: RowClickedEvent<ProductViewItem>) => {
    const row = e.data;
    if (!row?.repFileId) {
      setImgPreviewFileDetList([]);
      return;
    }
    getFileList(row.repFileId).then(async (result) => {
      const { resultCode, body, resultMessage } = result.data;
      if (resultCode === 200 && body != undefined) {
        const fileDetList: ImgPreviewFileDet[] = [];
        await Promise.all(
          (body as FileDet[]).map(async (file: FileDet) => {
            if (!file.sysFileNm) return;
            fileDetList.push({ ...file, url: await getFileUrl(file.sysFileNm) });
          }),
        );
        setImgPreviewFileDetList(fileDetList);
      } else {
        toastError(`이미지 정보 조회 도중 문제가 발생하였습니다: ${resultMessage}`);
      }
    });
  };

  const {
    data: listData,
    isLoading,
    isSuccess,
    refetch,
  } = useQuery({
    queryKey: ['/mis/productViewList', filters, weather],
    queryFn: () => authApi.get('/mis/productViewList', { params: { ...filters, weather } }),
    enabled: !!(filters.fromDate && filters.toDate),
  });

  useEffect(() => {
    if (!isSuccess) return;
    const { resultCode, body, resultMessage } = listData.data;
    if (resultCode === 200) {
      setRowData(body ?? []);
      setImgPreviewFileDetList([]);
    } else {
      toastError(resultMessage ?? '조회 중 오류가 발생했습니다.');
    }
  }, [listData, isSuccess]);

  const reset = () => {
    onFiltersReset();
    setWeather(['spring', 'summer', 'autumn', 'winter']);
    setRowData([]);
    setImgPreviewFileDetList([]);
  };

  return (
    <div className="imgPopBox">
      <Title title={menuNm ?? 'MIS 상품 분석'} reset={reset} search={refetch} />
      <Search className={'type_1'}>
        {/*<CustomNewDatePicker*/}
        {/*  title={'조회기간'}*/}
        {/*  type={'range'}*/}
        {/*  startName={'fromDate'}*/}
        {/*  endName={'toDate'}*/}
        {/*  onChange={onChangeFilters}*/}
        {/*  value={[filters.fromDate, filters.toDate]}*/}
        {/*/>*/}
        <CustomDatePickerAsPartiallyStateFulFn
          title={'조회기간'}
          type={'range'}
          startName={'fromDate'}
          endName={'toDate'}
          onChange={onChangeFilters}
          value={[filters.fromDate, filters.toDate]}
        />
        <dl>
          <dd>
            <div className="formBox">
              {(
                [
                  { label: '1주일', days: 7 },
                  { label: '2주일', days: 14 },
                  { label: '1개월', days: 30 },
                ] as const
              ).map((item, i, arr) => (
                <button
                  key={item.label}
                  type="button"
                  style={{
                    padding: '0 12px',
                    height: 32,
                    fontSize: 13,
                    fontWeight: 500,
                    border: '1px solid #d9d9d9',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    cursor: 'pointer',
                    marginLeft: -1,
                    position: 'relative',
                    borderRadius: i === 0 ? '6px 0 0 6px' : i === arr.length - 1 ? '0 6px 6px 0' : 0,
                  }}
                  onClick={() => {
                    const from = dayjs().subtract(item.days, 'day').format('YYYY-MM-DD');
                    const to = today;
                    onChangeFilters('fromDate', from);
                    onChangeFilters('toDate', to);
                    refetch();
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </dd>
        </dl>
        <dl>
          <dd>
            <div className="formBox">
              <SeasonButtonGroup value={weather} onChange={setWeather} />
            </div>
          </dd>
        </dl>
        <CustomSwitch
          title={'이미지보기'}
          name={'imgShow'}
          checkedLabel={'ON'}
          uncheckedLabel={'OFF'}
          value={imgPreviewBoxOn}
          onChange={(_name, value) => setImgPreviewBoxOn(value)}
          wrapperClassNames={'imgToggle'}
        />
      </Search>

      <div style={{ display: 'flex', gap: 16, padding: '0 16px 16px', alignItems: 'flex-start' }}>
        {/* 왼쪽: ag-grid + 이미지 미리보기 */}
        <div style={{ flex: '0 0 auto', width: 680 }}>
          <Table>
            <TunedGrid
              headerHeight={35}
              onGridReady={onGridReady}
              loading={isLoading}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              rowSelection={{ mode: 'singleRow', enableClickSelection: true }}
              onRowClicked={onRowClicked}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              className={'default'}
            />
          </Table>
          <ImgPreviewBox open={imgPreviewBoxOn} resized={resized} onReSizeReq={() => setResized(!resized)} fileDetList={imgPreviewFileDetList} />
        </div>

        {/* 오른쪽: ECharts 상위 10개 */}
        <div style={{ flex: 1, minWidth: 0, border: `1px solid ${isDark ? '#333350' : '#e8e8e8'}`, borderRadius: 4, background: isDark ? '#1e1e30' : '#fff', padding: '12px 8px' }}>
          <p style={{ margin: '0 0 8px 8px', fontSize: 13, fontWeight: 600, color: chartTextColor }}>잘 팔리는 상품 TOP 10 (총점 기준)</p>
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

export default ProductView;
