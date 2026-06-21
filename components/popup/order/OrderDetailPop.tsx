'use client';

import React, { useState } from 'react';
import { ColDef } from 'ag-grid-community';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../../ToastMessage';
import { PopupLayout } from '../PopupLayout';
import { PopupFooter } from '../PopupFooter';
import { authApi } from '../../../libs';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import TunedGrid from '../../grid/TunedGrid';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import CustomGridLoading from '../../CustomGridLoading';
import type { OrderResponseInfo } from '../../../generated/src/model/order-response-info';
import type { OrderResponseItem } from '../../../generated/src/model/order-response-item';

interface Props {
  orderId: number;
  open: boolean;
  onClose: () => void;
}

type OrderDetail = OrderResponseInfo;

const formatWon = (params: any) => {
  if (params.value == null) return '-';
  return Number(params.value).toLocaleString() + '원';
};

/** BO 주문 상세 팝업 */
export const OrderDetailPop = ({ orderId, open, onClose }: Props) => {
  const columnDefs: ColDef<OrderResponseItem>[] = [
    {
      field: 'productName',
      headerName: '상품명',
      minWidth: 200,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'optionName',
      headerName: '옵션',
      minWidth: 120,
      suppressHeaderMenuButton: true,
      valueFormatter: (p) => p.value ?? '-',
    },
    {
      field: 'quantity',
      headerName: '수량',
      minWidth: 70,
      maxWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'unitPrice',
      headerName: '단가',
      minWidth: 110,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: formatWon,
    },
    {
      field: 'discountAmount',
      headerName: '할인',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: formatWon,
    },
    {
      field: 'paymentAmount',
      headerName: '결제금액',
      minWidth: 110,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: formatWon,
    },
  ];

  const { data: detail, isLoading } = useQuery<OrderDetail | null>({
    queryKey: ['/frontWeb/order', orderId],
    queryFn: async () => {
      const { data } = await authApi.get(`/orderMng/${orderId}`);
      if (data?.resultCode === 200) return data.body as OrderDetail;
      toastError(data?.resultMessage ?? '조회 실패');
      return null;
    },
    enabled: open && orderId != null,
  });

  const { mutate: cancelMutate, isPending: isCancelling } = useMutation({
    mutationFn: async () => {
      const { data } = await authApi.post(`/orderMng/payment/${detail?.paymentSeq}/cancel`, { reason: 'BO 관리자 취소' });
      return data;
    },
    onSuccess: (data) => {
      if (data?.resultCode === 200) {
        if (data.body?.alreadyCancelled) {
          toastSuccess('이미 취소된 결제입니다.');
        } else {
          toastSuccess('결제가 취소되었습니다.');
        }
        onClose();
      } else {
        toastError(data?.resultMessage ?? '취소 처리 중 오류가 발생했습니다.');
      }
    },
    onError: (err: any) => {
      toastError(err?.message ?? '취소 처리 중 오류가 발생했습니다.');
    },
  });

  const canCancel = detail?.paymentStatus === 'P' && detail?.orderStatus !== 'C';

  const handleCancel = () => {
    if (!confirm('결제를 취소하시겠습니까?')) return;
    cancelMutate();
  };

  return (
    <PopupLayout
      width={900}
      isEscClose={true}
      open={open}
      title={`주문 상세 ${detail ? `- ${detail.orderNo}` : ''}`}
      onClose={onClose}
      footer={
        <PopupFooter>
          <div className={'btnArea'}>
            {canCancel && detail?.paymentSeq && (
              <button className={'btn btnRed'} onClick={handleCancel} disabled={isCancelling}>
                결제취소
              </button>
            )}
            <button className={'btn'} onClick={onClose}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      {detail && (
        <div style={{ padding: '0 4px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 13 }}>
            <tbody>
              <tr>
                <th style={thStyle}>주문번호</th>
                <td style={tdStyle}>{detail.orderNo}</td>
                <th style={thStyle}>주문상태</th>
                <td style={tdStyle}>{detail.orderStatusNm ?? detail.orderStatus}</td>
              </tr>
              <tr>
                <th style={thStyle}>상품금액</th>
                <td style={tdStyle}>{detail.productAmount?.toLocaleString()}원</td>
                <th style={thStyle}>포인트사용</th>
                <td style={tdStyle}>{detail.usedPoint?.toLocaleString()}원</td>
              </tr>
              <tr>
                <th style={thStyle}>실결제금액</th>
                <td style={tdStyle}>{detail.paymentAmount?.toLocaleString()}원</td>
                <th style={thStyle}>결제상태</th>
                <td style={tdStyle}>{detail.paymentStatusNm ?? detail.paymentStatus ?? '-'}</td>
              </tr>
              {detail.delivery && (
                <tr>
                  <th style={thStyle}>수령인</th>
                  <td style={tdStyle}>
                    {detail.delivery.receiverName} ({detail.delivery.receiverPhone})
                  </td>
                  <th style={thStyle}>배송지</th>
                  <td style={tdStyle}>
                    {detail.delivery.address} {detail.delivery.addressDetail}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ height: 180 }}>
            <TunedGrid
              headerHeight={35}
              rowData={detail.items ?? []}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              loading={isLoading}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              className={'wmsDefault'}
            />
          </div>
        </div>
      )}
      {isLoading && <div style={{ textAlign: 'center', padding: 20 }}>로딩 중...</div>}
    </PopupLayout>
  );
};

const thStyle: React.CSSProperties = {
  background: '#f5f5f5',
  padding: '6px 10px',
  border: '1px solid #e0e0e0',
  fontWeight: 600,
  width: 100,
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #e0e0e0',
};
