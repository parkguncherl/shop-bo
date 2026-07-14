import React, { useEffect, useState } from 'react';
import { PopupFooter } from '../../PopupFooter';
import { PopupContent } from '../../PopupContent';
import { PopupLayout } from '../../PopupLayout';
import PopupFormBox from '../../content/PopupFormBox';
import PopupFormGroup from '../../content/PopupFormGroup';
import PopupFormType from '../../content/PopupFormType';
import FormInput from '../../../form/FormInput';
import FormDatePicker from '../../../form/FormDatePicker';
import FormDropDown from '../../../form/FormDropDown';
import { SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Table, toastError, toastSuccess } from '@/components';
import { ConfirmModal } from '../../../ConfirmModal';
import { useReceivingStore } from '@/stores/product/useReceivingStore';
import { authApi } from '@/libs';
import { ColDef } from 'ag-grid-community';
import TunedGrid from '../../../grid/TunedGrid';
import { defaultColDef, GridSetting } from '@/libs/ag-grid';
import { useAgGridApi } from '@/hooks';
import dayjs from 'dayjs';
import { ReceivingRequestInsertReceiving, ReceivingResponseProductDetSearchItem } from '@/generated';

interface ReceivingAddPopProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ReceivingAddPop = ({ open, onClose, onSuccess }: ReceivingAddPopProps) => {
  const { onGridReady } = useAgGridApi();
  const [insertReceiving] = useReceivingStore((s) => [s.insertReceiving]);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDet, setSelectedDet] = useState<ReceivingResponseProductDetSearchItem | null>(null);
  const [openAddConf, setOpenAddConf] = useState<{ open: boolean; stored?: ReceivingRequestInsertReceiving }>({ open: false });

  const { handleSubmit, control, reset, clearErrors } = useForm<ReceivingRequestInsertReceiving>({
    mode: 'onChange',
    defaultValues: {
      receivDate: dayjs().format('YYYY-MM-DD'),
      receivCnt: 1,
      plusMinus: 'P',
    },
  });

  /** 상품상세 검색 */
  const {
    data: searchData,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['/receiving/productDetSearchList', searchQuery, open, searchKeyword],
    queryFn: () => authApi.get('/receiving/productDetSearchList', { params: { prodNm: searchQuery } }),
    enabled: true,
  });
  const searchRows: ReceivingResponseProductDetSearchItem[] = searchData?.data?.body ?? [];

  const columnDefs: ColDef<ReceivingResponseProductDetSearchItem>[] = [
    {
      headerName: 'No',
      minWidth: 37,
      maxWidth: 37,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueGetter: (p) => (p.node?.rowIndex != null ? p.node.rowIndex + 1 : ''),
    },
    { field: 'prodNm', headerName: '상품명', minWidth: 160, maxWidth: 160, suppressHeaderMenuButton: true },
    {
      field: 'stock',
      headerName: '재고',
      minWidth: 50,
      maxWidth: 50,
      suppressHeaderMenuButton: true,
      cellRenderer: 'NUMBER_COMMA',
      cellStyle: GridSetting.CellStyle.RIGHT,
    },
    { field: 'productDetColor', headerName: '컬러', minWidth: 100, maxWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'productDetSize', headerName: '사이즈', minWidth: 90, maxWidth: 90, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ];

  const { mutate: insertMutate } = useMutation({
    mutationFn: insertReceiving,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          refetch();
          if (onSuccess) onSuccess();
        } else {
          toastError(`저장 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  useEffect(() => {
    if (!open) {
      reset({
        receivDate: dayjs().format('YYYY-MM-DD'),
        receivCnt: 1,
        plusMinus: 'P',
      });
      clearErrors();
      setSelectedDet(null);
      setSearchKeyword('');
      setSearchQuery('');
    }
  }, [open]);

  const onValid: SubmitHandler<ReceivingRequestInsertReceiving> = (data) => {
    if (!selectedDet) {
      toastError('상품상세를 선택해주세요.');
      return;
    }
    setOpenAddConf({
      open: true,
      stored: { ...data, productDetId: selectedDet.productDetId ?? 0 },
    });
  };

  const onInvalid: SubmitErrorHandler<ReceivingRequestInsertReceiving> = (errors) => {
    if (errors) {
      toastError('문제가 되는 영역 혹은 누락된 영역을 수정 및 추가한 후 재시도하십시요.');
    }
  };

  return (
    <>
      <PopupLayout
        width={900}
        open={open}
        isEscClose={true}
        title="입고/출고 등록"
        onClose={onClose}
        footer={
          <PopupFooter>
            <div className="btnArea between">
              <div className="left"></div>
              <div className="right">
                <button className="btn btn_blue" onClick={() => handleSubmit(onValid, onInvalid)()}>
                  저장
                </button>
                <button className="btn" onClick={onClose}>
                  닫기
                </button>
              </div>
            </div>
          </PopupFooter>
        }
      >
        <PopupContent>
          <div className="layoutBox">
            {/* 왼쪽: 상품상세 검색 */}
            <div className="layout70">
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, padding: '4px 0', borderBottom: '1px solid var(--dark-border, #ddd)' }}>
                상품상세 검색
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div className="formBox border" style={{ flex: 1 }}>
                  <input
                    placeholder="상품명 검색"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setSearchQuery(searchKeyword);
                    }}
                    style={{ border: 'none', width: '100%', outline: 'none', padding: '0 8px' }}
                  />
                </div>
                <button type="button" className="btn" onClick={() => setSearchQuery(searchKeyword)}>
                  검색
                </button>
              </div>
              <TunedGrid
                headerHeight={32}
                onGridReady={onGridReady}
                loading={isFetching}
                rowData={searchRows}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                rowSelection={{ mode: 'singleRow', enableClickSelection: true }}
                domLayout="normal"
                onRowClicked={(e) => setSelectedDet(e.data ?? null)}
                className={'default check'}
              />
            </div>

            {/* 오른쪽: 입출고 정보 */}
            <div className="layout30" style={{ borderLeft: '1px solid var(--dark-border, #e0e0e0)', paddingLeft: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, padding: '4px 0', borderBottom: '1px solid var(--dark-border, #ddd)' }}>
                입출고 정보
              </div>
              <PopupFormBox className="">
                <PopupFormGroup>
                  <PopupFormType className="type1">
                    <FormDatePicker<ReceivingRequestInsertReceiving> control={control} name="receivDate" title="입출고일" required />
                  </PopupFormType>
                  <PopupFormType className="type1">
                    <FormDropDown<ReceivingRequestInsertReceiving>
                      control={control}
                      name="plusMinus"
                      title="구분"
                      required
                      options={[
                        { key: 0, value: 'P', label: '+ 입고' },
                        { key: 1, value: 'M', label: '- 출고' },
                      ]}
                    />
                  </PopupFormType>
                  <PopupFormType className="type1">
                    <FormInput<ReceivingRequestInsertReceiving> control={control} name="receivCnt" label="수량" type="number" required placeholder="수량" />
                  </PopupFormType>
                  <PopupFormType className="type1">
                    <FormInput<ReceivingRequestInsertReceiving> control={control} name="etcCntn" label="비고" placeholder="메모 (선택)" />
                  </PopupFormType>
                </PopupFormGroup>
              </PopupFormBox>
            </div>
          </div>
        </PopupContent>
      </PopupLayout>

      <ConfirmModal
        open={openAddConf.open}
        title="저장 하시겠습니까?"
        confirmText="저장"
        onConfirm={() => {
          if (openAddConf.stored) {
            insertMutate(openAddConf.stored);
          } else {
            toastError('저장하고자 하는 입력 결과를 찾을 수 없습니다.');
          }
          setOpenAddConf({ open: false });
        }}
        onClose={() => setOpenAddConf({ open: false })}
      />
    </>
  );
};

export default ReceivingAddPop;
