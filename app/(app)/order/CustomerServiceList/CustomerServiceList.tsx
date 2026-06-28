'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColDef } from 'ag-grid-community';
import { Search, Table, Title } from '../../../../components';
import { toastError } from '../../../../components';
import { useCommonStore } from '../../../../stores';
import { defaultColDef, GridSetting, formatDateWithDay, formatDateWithMinute } from '../../../../libs/ag-grid';
import { useAgGridApi } from '../../../../hooks';
import { authApi } from '../../../../libs';
import useFilters from '../../../../hooks/useFilters';
import CustomNoRowsOverlay from '../../../../components/CustomNoRowsOverlay';
import CustomGridLoading from '../../../../components/CustomGridLoading';
import TunedGrid from '../../../../components/grid/TunedGrid';
import CustomNewDatePicker from '../../../../components/CustomNewDatePicker';
import dayjs from 'dayjs';
import { Utils } from '../../../../libs/utils';
import { ComuResponseBoListItem, ComuResponseMessage, ComuResponseThread } from '../../../../generated';
import { PartnerCodePop } from '../../../../components/popup/system/PartnerCodePop';
import { PARTNER_CODE } from '../../../../libs/const';
import { usePartnerCodeStore } from '../../../../stores/usePartnerCodeStore';

// ─── 타입 ─────────────────────────────────────────────────────────────────────

type FilterType = {
  comuType: string;
  paymentStatus: string;
  productName: string;
  fromDate: string;
  toDate: string;
};

// ─── 메시지 버블 ──────────────────────────────────────────────────────────────
function MessageBubble({
  msg,
  getFileUrl,
  onDelete,
}: {
  msg: ComuResponseMessage;
  getFileUrl: (name: string) => Promise<string>;
  onDelete?: (msgId: number) => void;
}) {
  const isAdmin = msg.reqYn === 'N'; // 관리자가 보낸 메시지 → 오른쪽
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const { selectFileList } = useCommonStore();
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!msg.fileId) return;
    (async () => {
      const files = await selectFileList(msg.fileId!);
      const urls = await Promise.all(files.map((f) => (f.sysFileNm ? getFileUrl(f.sysFileNm) : Promise.resolve(''))));
      setImageUrls(urls.filter(Boolean));
    })();
  }, [msg.fileId]);

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start', marginBottom: 12 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!isAdmin && <span style={{ fontSize: 11, color: '#888', marginBottom: 2, marginLeft: 4 }}>{msg.creUser}</span>}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: isAdmin ? 'row-reverse' : 'row' }}>
        {!isAdmin && <div style={avatarStyle}>{msg.creUser?.slice(0, 1) ?? 'U'}</div>}
        <div style={{ maxWidth: 260 }}>
          {msg.comuCntn && (
            <div style={{ ...bubbleStyle, background: isAdmin ? '#1a6ef5' : '#f0f0f0', color: isAdmin ? '#fff' : '#222' }}>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{msg.comuCntn}</p>
            </div>
          )}
          {imageUrls.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: msg.comuCntn ? 4 : 0 }}>
              {imageUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`첨부 ${i + 1}`}
                  style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }}
                  onClick={() => setLightbox(url)}
                />
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start', gap: 2, alignSelf: 'flex-end' }}>
          {isAdmin && onDelete && (
            <button
              onClick={() => onDelete(msg.id!)}
              style={{
                display: hovered ? 'flex' : 'none',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.18)',
                border: 'none',
                borderRadius: 4,
                color: '#fff',
                fontSize: 11,
                padding: '2px 6px',
                cursor: 'pointer',
                marginBottom: 2,
              }}
            >
              삭제
            </button>
          )}
          {isAdmin && <span style={{ fontSize: 10, color: msg.readYn === 'Y' ? '#333' : '#bbb' }}>{msg.readYn === 'Y' ? '읽음' : '안읽음'}</span>}
          <span style={{ fontSize: 10, color: '#aaa' }}>{Utils.formatMonthDayTime(msg.creTm)}</span>
        </div>
      </div>

      {lightbox && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="확대" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

// 0=일, 1=월 ... 6=토 → ISO 기준 이번 주 월요일 계산
const startOfWeek = dayjs()
  .subtract((dayjs().day() + 6) % 7, 'day')
  .format('YYYY-MM-DD');
const today = dayjs().format('YYYY-MM-DD');

const CustomerServiceList = () => {
  const { onGridReady } = useAgGridApi();
  const menuNm = useCommonStore((s) => s.menuNm);
  const getFileUrl = useCommonStore((s) => s.getFileUrl);
  const [partnerCodeModals, partnerCodeOpenModal, partnerCodeCloseModal] = usePartnerCodeStore((s) => [s.modals, s.openModal, s.closeModal]);
  const [filters, onChangeFilters, onFiltersReset] = useFilters<FilterType>({
    comuType: '',
    paymentStatus: '',
    productName: '',
    fromDate: startOfWeek,
    toDate: today,
  });

  const { data: comuTypesData } = useQuery({
    queryKey: ['/code/lower/10130'],
    queryFn: () => authApi.get('/code/lower/10130'),
    staleTime: 1000 * 60 * 10,
  });
  const comuTypes: { codeCd: string; codeNm: string }[] = (comuTypesData?.data?.body ?? []).filter((c: { codeCd: string; codeNm: string }) =>
    String(c.codeCd ?? '').startsWith('A'),
  );

  const { data: paymentStatusData } = useQuery({
    queryKey: ['/code/lower/10070'],
    queryFn: () => authApi.get('/code/lower/10070'),
    staleTime: 1000 * 60 * 10,
  });

  const [rowData, setRowData] = useState<ComuResponseBoListItem[]>([]);
  const [selectedThread, setSelectedThread] = useState<ComuResponseThread | null>(null);
  const [selectedItem, setSelectedItem] = useState<ComuResponseBoListItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const columnDefs: ColDef<ComuResponseBoListItem>[] = [
    {
      headerName: 'NO',
      minWidth: 55,
      maxWidth: 65,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueGetter: (params) => (params.node ? (params.node.rowIndex ?? 0) + 1 : ''),
    },
    {
      field: 'comuTypeName',
      headerName: '문의종류',
      minWidth: 90,
      maxWidth: 110,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'orderDate',
      headerName: '구매일',
      minWidth: 130,
      maxWidth: 150,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: formatDateWithDay,
    },
    {
      field: 'topProductName',
      headerName: '상품명',
      minWidth: 160,
      suppressHeaderMenuButton: true,
      valueFormatter: (p) => p.value ?? '-',
    },
    {
      field: 'orderNo',
      headerName: '주문번호',
      minWidth: 160,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'paymentStatusName',
      headerName: '결제상태',
      minWidth: 85,
      maxWidth: 95,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'cntCntn',
      headerName: '메시지',
      minWidth: 60,
      maxWidth: 70,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'lastMessage',
      headerName: '마지막 메시지',
      minWidth: 180,
      suppressHeaderMenuButton: true,
      valueFormatter: (p) => p.value ?? '-',
      hide: true,
    },
    {
      field: 'lastMessageTm',
      headerName: '메시지 시간',
      minWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: formatDateWithMinute,
    },
  ];

  const {
    data: listData,
    isSuccess,
    refetch,
  } = useQuery({
    queryKey: ['/comuMng/list', filters],
    queryFn: () => authApi.get('/comuMng/list', { params: filters }),
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

  const loadThread = async (item: ComuResponseBoListItem) => {
    setSelectedItem(item);
    setSelectedThread(null);
    const { data } = await authApi.get(`/comuMng/${item.comuId}/thread`);
    if (data?.resultCode === 200) {
      setSelectedThread(data.body);
      // 그리드 unreadCount 업데이트
      setRowData((prev) => prev.map((r) => (r.comuId === item.comuId ? { ...r, unreadCount: 0 } : r)));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }), 50);
    }
  };

  const handleSend = async () => {
    if (!selectedThread || (!replyText.trim() && imageFiles.length === 0)) return;
    setIsSending(true);
    try {
      let fileId: number | undefined;
      if (imageFiles.length > 0) {
        const form = new FormData();
        form.append('fileId', '0');
        imageFiles.forEach((f) => form.append('uploadFiles', f));
        const up = await authApi.post('/common/imgfile/uploads', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (up.data?.resultCode !== 200) throw new Error(up.data?.resultMessage ?? '파일 업로드 오류');
        fileId = up.data?.body?.[0]?.fileId;
      }

      const { data } = await authApi.post(`/comuMng/${selectedThread.id}/reply`, {
        content: replyText.trim() || null,
        fileId,
      });
      if (data?.resultCode === 200) {
        setSelectedThread(data.body);
        setReplyText('');
        setImageFiles([]);
        previewUrls.forEach((u) => URL.revokeObjectURL(u));
        setPreviewUrls([]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
      } else {
        toastError(data?.resultMessage ?? '전송 실패');
      }
    } catch (e: any) {
      toastError(e?.message ?? '전송 중 오류가 발생했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (msgId: number) => {
    if (!confirm('이 메시지를 삭제하시겠습니까?')) return;
    try {
      const { data } = await authApi.delete(`/comuMng/message/${msgId}`);
      if (data?.resultCode === 200) {
        // 스레드 새로고침
        if (selectedItem) await loadThread(selectedItem);
      } else {
        toastError(data?.resultMessage ?? '삭제 실패');
      }
    } catch (e: any) {
      toastError(e?.message ?? '삭제 중 오류가 발생했습니다.');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - imageFiles.length);
    setImageFiles((prev) => [...prev, ...files]);
    setPreviewUrls((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeImage = (i: number) => {
    URL.revokeObjectURL(previewUrls[i]);
    setImageFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviewUrls((prev) => prev.filter((_, idx) => idx !== i));
  };

  const reset = () => {
    onFiltersReset();
    setRowData([]);
    setSelectedThread(null);
    setSelectedItem(null);
  };

  useEffect(() => {
    return () => previewUrls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  // ── 렌더 ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title title={menuNm ?? '고객 문의 관리'} reset={reset} search={refetch} />

      {/* 검색 영역 */}
      <Search className={'type_1'}>
        <CustomNewDatePicker
          title={'구매일'}
          type={'range'}
          defaultType={'week'}
          startName={'fromDate'}
          endName={'toDate'}
          onChange={onChangeFilters as any}
          value={[filters.fromDate, filters.toDate]}
        />
        <Search.Input
          title={'상품명'}
          name={'productName'}
          value={filters.productName}
          onChange={onChangeFilters}
          placeholder={'상품명 검색'}
          onEnter={() => refetch()}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, whiteSpace: 'nowrap', fontWeight: 600, color: '#555' }}>문의종류</label>
          <select value={filters.comuType} onChange={(e) => onChangeFilters('comuType', e.target.value)} style={selectStyle}>
            <option value="">전체</option>
            {comuTypes.map((t) => (
              <option key={t.codeCd} value={t.codeCd}>
                {t.codeNm}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, whiteSpace: 'nowrap', fontWeight: 600, color: '#555' }}>결제상태</label>
          <select value={filters.paymentStatus} onChange={(e) => onChangeFilters('paymentStatus', e.target.value)} style={selectStyle}>
            <option value="">전체</option>
            {(paymentStatusData?.data?.body ?? []).map((c: { codeCd: string; codeNm: string }) => (
              <option key={c.codeCd} value={c.codeCd}>
                {c.codeNm}
              </option>
            ))}
          </select>
        </div>
      </Search>

      {/* 본문 — 좌(그리드) / 우(채팅) 분할 */}
      <div style={{ display: 'flex', flex: 1, gap: 12, overflow: 'hidden', padding: '0 0 0' }}>
        {/* 좌: 그리드 + 버튼 */}
        <div style={{ flex: '0 0 70%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <Table>
              <TunedGrid
                headerHeight={35}
                onGridReady={onGridReady}
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
                className={'wmsDefault'}
                rowSelection={{ mode: 'singleRow', enableClickSelection: false }}
                onRowClicked={(e) => {
                  if (e.data) loadThread(e.data);
                }}
              />
            </Table>
          </div>
          <div className={'btnBox'}>
            <div className={'left'}>
              <button className={'btn btnGray'} onClick={() => partnerCodeOpenModal('PARTNER_CODE_OPEN')}>
                질의응답
              </button>
            </div>
          </div>
        </div>

        {/* 우: 채팅 패널 */}
        <div
          style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden', background: '#fff' }}
        >
          {!selectedItem ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 14 }}>
              문의를 선택하면 대화 내용이 표시됩니다.
            </div>
          ) : (
            <>
              {/* 채팅 헤더 */}
              <div style={{ padding: '10px 16px', borderBottom: '1px solid #e8e8e8', background: '#fafafa' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#222' }}>
                  [{selectedItem.comuTypeName}] {selectedItem.topProductName ?? '-'}
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  {selectedItem.orderNo} · {selectedItem.paymentStatusName} · 구매일{' '}
                  {selectedItem.orderDate ? dayjs(selectedItem.orderDate).format('YYYY-MM-DD') : '-'}
                </div>
              </div>

              {/* 메시지 목록 */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
                {!selectedThread ? (
                  <div style={{ textAlign: 'center', color: '#bbb', paddingTop: 40 }}>로딩 중...</div>
                ) : (selectedThread.messages ?? []).length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#bbb', paddingTop: 40 }}>메시지가 없습니다.</div>
                ) : (
                  (selectedThread.messages ?? []).map((msg) => <MessageBubble key={msg.id} msg={msg} getFileUrl={getFileUrl} onDelete={handleDeleteMessage} />)
                )}
                <div ref={bottomRef} />
              </div>

              {/* 답변 입력 */}
              <div style={{ borderTop: '1px solid #e8e8e8', padding: '10px 12px', background: '#fafafa' }}>
                {previewUrls.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {previewUrls.map((url, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img src={url} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                        <button
                          onClick={() => removeImage(i)}
                          style={{
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            background: '#333',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: 16,
                            height: 16,
                            fontSize: 10,
                            cursor: 'pointer',
                            lineHeight: '16px',
                            textAlign: 'center',
                            padding: 0,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <button onClick={() => fileInputRef.current?.click()} disabled={imageFiles.length >= 5} style={iconBtnStyle} title="이미지 첨부">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                      <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="7" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M2 14l4-4 3 3 3-3 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImageChange} />
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="답변을 입력하세요"
                    rows={2}
                    style={textareaStyle}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={isSending || (!replyText.trim() && imageFiles.length === 0)}
                    style={{
                      ...sendBtnStyle,
                      background: replyText.trim() || imageFiles.length > 0 ? '#1a6ef5' : '#ccc',
                    }}
                  >
                    전송
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <PartnerCodePop
        partnerCodeUpper={PARTNER_CODE.orderQuestion.code}
        title={'질의등답 코드관리'}
        activated={partnerCodeModals?.type === 'PARTNER_CODE_OPEN' && partnerCodeModals.active}
        codeName={PARTNER_CODE.orderQuestion.name}
        onCloseRequestEmerged={() => partnerCodeCloseModal('PARTNER_CODE_OPEN')}
      />
    </div>
  );
};

export default CustomerServiceList;

// ─── 스타일 상수 ──────────────────────────────────────────────────────────────

const avatarStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  background: '#e0e0e0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 13,
  fontWeight: 700,
  color: '#555',
  flexShrink: 0,
};

const bubbleStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 12,
  display: 'inline-block',
  maxWidth: '100%',
  wordBreak: 'break-word',
};

const selectStyle: React.CSSProperties = {
  height: 32,
  padding: '0 8px',
  fontSize: 13,
  border: '1px solid #d0d0d0',
  borderRadius: 6,
  background: '#fff',
  color: '#333',
  minWidth: 110,
};

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid #d0d0d0',
  borderRadius: 6,
  padding: '5px 8px',
  cursor: 'pointer',
  color: '#555',
  flexShrink: 0,
};

const textareaStyle: React.CSSProperties = {
  flex: 1,
  resize: 'none',
  border: '1px solid #d0d0d0',
  borderRadius: 8,
  padding: '8px 10px',
  fontSize: 13,
  fontFamily: 'inherit',
  lineHeight: 1.5,
  outline: 'none',
};

const sendBtnStyle: React.CSSProperties = {
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '0 16px',
  height: 60,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  flexShrink: 0,
  transition: 'background 0.15s',
};
