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
import { useMutation } from '@tanstack/react-query';
import { toastError, toastSuccess } from '@/components';
import { ConfirmModal } from '../../../ConfirmModal';
import { useReceivingStore } from '@/stores/product/useReceivingStore';
import dayjs from 'dayjs';
import { ReceivingRequestUpdateReceiving, ReceivingResponseReceivingItem } from '@/generated';

interface ReceivingModPopProps {
  open: boolean;
  item: ReceivingResponseReceivingItem | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const ReceivingModPop = ({ open, item, onClose, onSuccess }: ReceivingModPopProps) => {
  const [updateReceiving] = useReceivingStore((s) => [s.updateReceiving]);
  const [openModConf, setOpenModConf] = useState<{ open: boolean; stored?: ReceivingRequestUpdateReceiving & { id: number } }>({ open: false });

  const { handleSubmit, control, setValue, reset } = useForm<ReceivingRequestUpdateReceiving>({
    mode: 'onChange',
  });

  useEffect(() => {
    if (item) {
      setValue('receivDate', item.receivDate ? dayjs(item.receivDate).format('YYYY-MM-DD') : '');
      setValue('receivCnt', item.receivCnt);
      setValue('plusMinus', item.plusMinus);
      setValue('etcCntn', item.etcCntn ?? '');
    } else {
      reset();
    }
  }, [item]);

  const { mutate: updateMutate } = useMutation({
    mutationFn: updateReceiving,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('수정되었습니다.');
          reset();
          if (onSuccess) onSuccess();
        } else {
          toastError(`수정 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const onValid: SubmitHandler<ReceivingRequestUpdateReceiving> = (data) => {
    if (!item?.id) {
      console.error('수정 대상 id를 찾을 수 없음');
      return;
    }
    setOpenModConf({
      open: true,
      stored: { id: item.id, ...data },
    });
  };

  const onInvalid: SubmitErrorHandler<ReceivingRequestUpdateReceiving> = (errors) => {
    if (errors) {
      toastError('문제가 되는 영역 혹은 누락된 영역을 수정 및 추가한 후 재시도하십시요.');
    }
  };

  return (
    <>
      <PopupLayout
        width={700}
        open={open}
        isEscClose={true}
        title={item ? `[${item.prodNm}] 입출고 수정` : '입고/출고 수정'}
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
        <PopupContent style={{ maxHeight: 'calc(85vh - 160px)', overflowY: 'auto' }}>
          <PopupFormBox className="">
            {item && (
              <PopupFormGroup title="상품정보">
                <PopupFormType className="type2">
                  <dl>
                    <dt>
                      <label>상품명</label>
                    </dt>
                    <dd>
                      <div className="formBox border disabled">
                        <span style={{ padding: '0 8px' }}>{item.prodNm}</span>
                      </div>
                    </dd>
                  </dl>
                  <dl>
                    <dt>
                      <label>컬러 / 사이즈</label>
                    </dt>
                    <dd>
                      <div className="formBox border disabled">
                        <span style={{ padding: '0 8px' }}>
                          {item.productDetColor} / {item.productDetSize}
                        </span>
                      </div>
                    </dd>
                  </dl>
                </PopupFormType>
              </PopupFormGroup>
            )}

            <PopupFormGroup title="입출고 정보">
              <PopupFormType className="type2">
                <FormDatePicker<ReceivingRequestUpdateReceiving> control={control} name="receivDate" title="입출고일" required />
                <FormDropDown<ReceivingRequestUpdateReceiving>
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
                <FormInput<ReceivingRequestUpdateReceiving> control={control} name="receivCnt" label="수량" type="number" required placeholder="수량" />
                <FormInput<ReceivingRequestUpdateReceiving> control={control} name="etcCntn" label="비고" placeholder="메모 (선택)" />
              </PopupFormType>
            </PopupFormGroup>
          </PopupFormBox>
        </PopupContent>
      </PopupLayout>

      <ConfirmModal
        open={openModConf.open}
        title="수정 내용을 저장하시겠습니까?"
        confirmText="저장"
        onConfirm={() => {
          if (openModConf.stored) {
            updateMutate(openModConf.stored);
          } else {
            toastError('저장하고자 하는 입력 결과를 찾을 수 없습니다.');
          }
          setOpenModConf({ open: false });
        }}
        onClose={() => setOpenModConf({ open: false })}
      />
    </>
  );
};

export default ReceivingModPop;
