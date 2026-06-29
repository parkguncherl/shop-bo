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
import { toastError, toastSuccess } from '../../../ToastMessage';
import { ConfirmModal } from '../../../ConfirmModal';
import { useReceivingStore } from '../../../../stores/product/useReceivingStore';
import { authApi } from '../../../../libs';
import { ColDef } from 'ag-grid-community';
import TunedGrid from '../../../grid/TunedGrid';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import { useAgGridApi } from '../../../../hooks';
import dayjs from 'dayjs';

interface ProductDetSearchItem {
  productDetId: number;
  prodId: number;
  prodNm: string;
  productDetSize: string;
  productDetColor: string;
}

export interface ReceivingAddFields {
  receivDate: string;
  receivCnt: number;
  plusMinus: string;
  etcCntn?: string;
}

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
  const [selectedDet, setSelectedDet] = useState<ProductDetSearchItem | null>(null);
  const [openAddConf, setOpenAddConf] = useState<{ open: boolean; stored?: ReceivingAddFields & { productDetId: number } }>({ open: false });

  const {
    handleSubmit,
    control,
    reset,
    clearErrors,
  } = useForm<ReceivingAddFields>({
    mode: 'onChange',
    defaultValues: {
      receivDate: dayjs().format('YYYY-MM-DD'),
      receivCnt: 1,
      plusMinus: 'P',
    },
  });

  /** 상품상세 검색 */
  const { data: searchData, isFetching } = useQuery({
    queryKey: ['/receiving/productDetSearchList', searchQuery],
    queryFn: () => authApi.get('/receiving/productDetSearchList', { params: { prodNm: searchQuery } }),
    enabled: true,
  });
  const searchRows: ProductDetSearchItem[] = searchData?.data?.body ?? [];

  const columnDefs: ColDef<ProductDetSearchItem>[] = [
    {
      headerName: 'No',
      minWidth: 50,
      maxWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueGetter: (p) => (p.node?.rowIndex != null ? p.node.rowIndex + 1 : ''),
    },
    { field: 'prodNm', headerName: '상품명', minWidth: 160, suppressHeaderMenuButton: true },
    { field: 'productDetColor', headerName: '컬러', minWidth: 80, maxWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'productDetSize', headerName: '사이즈', minWidth: 70, maxWidth: 90, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ];

  const { mutate: insertMutate } = useMutation({
    mutationFn: insertReceiving,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
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

  const onValid: SubmitHandler<ReceivingAddFields> = (data) => {
    if (!selectedDet) {
      toastError('상품상세를 선택해주세요.');
      return;
    }
    setOpenAddConf({
      open: true,
      stored: { ...data, productDetId: selectedDet.productDetId },
    });
  };

  const onInvalid: SubmitErrorHandler<ReceivingAddFields> = (errors) => {
    if (errors) {
      toastError('문제가 되는 영역 혹은 누락된 영역을 수정 및 추가한 후 재시도하십시요.');
    }
  };

  return (
    <div className="imgPopBox">
      <PopupLayout
        width={800}
        open={open}
        isEscClose={true}
        title="입고/출고 등록"
        onClose={onClose}
        footer={
          <PopupFooter>
            <div className="btnArea between">
              <div className="left">
                <button className="btn btn_blue" onClick={() => handleSubmit(onValid, onInvalid)()}>
                  저장
                </button>
              </div>
              <div className="right">
                <button className="btn" onClick={onClose}>
                  닫기
                </button>
              </div>
            </div>
          </PopupFooter>
        }
      >
        <PopupContent>
          <PopupFormBox className="">
            {/* 상품상세 검색 */}
            <PopupFormGroup title="상품상세 검색">
              <PopupFormType className="type1">
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <div className="formBox border" style={{ flex: 1 }}>
                    <input
                      className=""
                      placeholder="상품명 검색"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') setSearchQuery(searchKeyword); }}
                      style={{ border: 'none', width: '100%', outline: 'none', padding: '0 8px' }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setSearchQuery(searchKeyword)}
                  >
                    검색
                  </button>
                </div>
                <div style={{ height: 180 }}>
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
                    className="default"
                  />
                </div>
                {selectedDet && (
                  <div style={{ marginTop: 8, padding: '6px 12px', background: '#f0f7ff', border: '1px solid #91caff', borderRadius: 4, fontSize: 13 }}>
                    선택된 상품: <b>{selectedDet.prodNm}</b> &nbsp;/&nbsp; {selectedDet.productDetColor} &nbsp;/&nbsp; {selectedDet.productDetSize}
                  </div>
                )}
              </PopupFormType>
            </PopupFormGroup>

            {/* 입출고 정보 */}
            <PopupFormGroup title="입출고 정보">
              <PopupFormType className="type2">
                <FormDatePicker<ReceivingAddFields>
                  control={control}
                  name="receivDate"
                  title="입출고일"
                  required
                />
                <FormDropDown<ReceivingAddFields>
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
              <PopupFormType className="type2">
                <FormInput<ReceivingAddFields>
                  control={control}
                  name="receivCnt"
                  label="수량"
                  type="number"
                  required
                  placeholder="수량"
                />
                <FormInput<ReceivingAddFields>
                  control={control}
                  name="etcCntn"
                  label="비고"
                  placeholder="메모 (선택)"
                />
              </PopupFormType>
            </PopupFormGroup>
          </PopupFormBox>
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
    </div>
  );
};

export default ReceivingAddPop;
