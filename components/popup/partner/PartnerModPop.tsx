import React, { useEffect, useState } from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { PopupLayout } from '../PopupLayout';
import { useCommonStore } from '../../../stores';
import { usePartnerStore } from '../../../stores/usePartnerStore';
import { PopupSearchBox, PopupSearchType } from '../content';
import FormInput from '../../form/FormInput';
import { Placeholder } from '../../../libs/const';
import { PartnerRequestDelete, PartnerRequestUpdate, PartnerResponsePaging } from '../../../generated';
import { yupResolver } from '@hookform/resolvers/yup';
import { authApi, YupSchema } from '../../../libs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../../ToastMessage';
import { DeleteConfirmModal } from '../../DeleteConfirmModal';
import { DropDownOption } from '../../../types/DropDownOptions';
import useAppStore from '../../../stores/useAppStore';
import { SubmitHandler, useForm } from 'react-hook-form';
interface Props {
  datas: PartnerRequestUpdate;
}

/** 화주관리 수정 팝업 */
const PartnerModPop = ({ datas }: Props) => {
  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);
  /** 스토어 */
  const [modalType, closeModal] = usePartnerStore((s) => [s.modalType, s.closeModal]);
  const [commonModalType, commonOpenModal, getFileUrl] = useCommonStore((s) => [s.modalType, s.openModal, s.getFileUrl]);
  /** 화주관리 스토어 - API */
  const [updatePartner, deletePartner, openModal] = usePartnerStore((s) => [s.updatePartner, s.deletePartner, s.openModal]);
  const [confirmModal, setConfirmModal] = useState<boolean>(false); // 삭제 모달
  const queryClient = useQueryClient();
  const [fileUrl, setFileUrl] = useState('');
  const [logisOptions, setLogisOptions] = useState<DropDownOption[]>([]);

  /** 화주 조회하기 */
  const { data: partner, isSuccess: isListSuccess } = useQuery({
    queryKey: ['/partner/detail', datas.id],
    queryFn: () => authApi.get(`/partner/detail/${datas.id}`),
    refetchOnMount: true, // 'always' 대신 true
    enabled: !!datas.id,
  });

  useEffect(() => {
    if (isListSuccess) {
      const { resultCode, body, resultMessage } = partner.data;
      console.log('partner.data==> ', partner.data);
      if (resultCode !== 200) {
        toastError(resultMessage);
      }
    }
  }, [partner, isListSuccess]);

  // 공통적으로 사용할 onChange 함수
  const handleInputChange = (regexPattern: RegExp, formatPattern: string) => (e: any) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 남기기
    const formattedValue = rawValue.replace(regexPattern, formatPattern); // 포맷에 맞게 변환
    // 입력 필드에 표시할 값은 하이픈 포함된 포맷된 값으로 설정
    e.target.value = formattedValue;
  };

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<PartnerRequestUpdate>({
    //resolver: yupResolver(YupSchema.PartnerRequestForUpdate()), // 완료
    defaultValues: {},
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (partner?.data) {
      const { body } = partner.data;
      reset({
        id: body.id,
        partnerNm: body.partnerNm,
        partnerSubNm: body.partnerSubNm,
        partnerTicker: body.partnerTicker,
        phoneNo: body.phoneNo.replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3'),
        domain: body.domain,
        creUser: body.creUser,
        updUser: body.updUser,
      });
    }
  }, [partner, reset]);

  /** 화주 수정하기 */
  const { mutate: updatePartnerMutate } = useMutation(updatePartner, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await queryClient.invalidateQueries({ queryKey: ['/partner/paging'] });
          closeModal('MOD');
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 화주 삭제하기 */
  const { mutate: deletePartnerMutate, isLoading: deleteCodeIsLoading } = useMutation(deletePartner, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('삭제되었습니다.');
          await queryClient.invalidateQueries({ queryKey: ['/partner/paging'] });
          closeModal('MOD');
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const onValid: SubmitHandler<PartnerRequestUpdate> = (data) => {
    // 번호 리플레이스
    data.phoneNo = (data.phoneNo || '').replace(/[^0-9]/g, '');

    updatePartnerMutate(data);
  };
  const deleteCodeFn = async () => {
    deletePartnerMutate({ id: partner?.data.body.id, upperPartnerId: partner?.data.body.upperPartnerId } as PartnerRequestDelete);
  };

  const { session } = useAppStore();

  return (
    <PopupLayout
      width={820}
      isEscClose={false}
      open={modalType.type === 'MOD'}
      title={'화주 수정하기'}
      onClose={() => {
        closeModal('MOD');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn" title="삭제" onClick={(e) => setConfirmModal(true)}>
              삭제
            </button>
            <button className="btn btnBlue" title="저장" onClick={handleSubmit(onValid)}>
              저장
            </button>
            <button className="btn" title="닫기" onClick={() => closeModal('MOD')}>
              닫기
            </button>
          </div>
          <DeleteConfirmModal
            dispTitle={'정말 삭제하시겠습니까?'}
            width={500}
            open={confirmModal}
            onConfirm={deleteCodeFn}
            onClose={() => setConfirmModal(false)}
          />
        </PopupFooter>
      }
    >
      <PopupContent>
        <PopupSearchBox>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestUpdate> control={control} name={'partnerNm'} label={'회사명'} placeholder={Placeholder.Input || ''} required={true} />
            <FormInput<PartnerRequestUpdate>
              control={control}
              name={'partnerTicker'}
              label={'회사티커'}
              placeholder={Placeholder.Input || ''}
              required={false}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestUpdate> control={control} name={'domain'} label={'도메인'} placeholder={Placeholder.Input || ''} required={true} />
            <FormInput<PartnerRequestUpdate> control={control} name={'partnerSubNm'} label={'도메인명'} placeholder={Placeholder.Input || ''} required={true} />
          </PopupSearchType>

          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestUpdate>
              control={control}
              onChange={handleInputChange(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3')}
              name={'phoneNo'}
              label={'회사전화번호'}
              placeholder={Placeholder.Input || ''}
              required={true}
            />
          </PopupSearchType>
        </PopupSearchBox>
      </PopupContent>
    </PopupLayout>
  );
};

export default PartnerModPop;
