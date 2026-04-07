import React, { useEffect, useState } from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { PopupLayout } from '../PopupLayout';
import { usePartnerStore } from '../../../stores/usePartnerStore';
import { PopupSearchBox, PopupSearchType } from '../content';
import FormInput from '../../form/FormInput';
import { Placeholder } from '../../../libs/const';
import { SubmitHandler, useForm } from 'react-hook-form';
import { CommonResponseFileDown, PartnerRequestCreate, PartnerResponsePaging } from '../../../generated';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../../ToastMessage';
import { yupResolver } from '@hookform/resolvers/yup';
import { authApi, YupSchema } from '../../../libs';
import { FileUploadPop } from '../common';
import { useCommonStore } from '../../../stores';
import FormDropDown from '../../form/FormDropDown';

interface Props {
  data: PartnerResponsePaging;
}

/** 화주관리 신규 추가 팝업 */
const PartnerAddPop = ({ data }: Props) => {
  /** 스토어 */
  const [modalType, closeModal] = usePartnerStore((s) => [s.modalType, s.closeModal]);
  const [commonModalType, commonOpenModal, getFileUrl] = useCommonStore((s) => [s.modalType, s.openModal, s.getFileUrl]);
  const [fileUrl, setFileUrl] = useState('');

  /** 파일 조회하기 (by 변수) */
  const fetchData = async (fileId: number | undefined) => {
    if (!fileId) return;
    const { data: selectFile } = await authApi.get(`/common/file/${fileId}`, {});
    const { resultCode, body, resultMessage } = selectFile;
    if (resultCode === 200) {
      const url = await getFileUrl(body[0].sysFileNm);
      setFileUrl(url);
    } else {
      toastError(resultMessage);
    }
  };

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<PartnerRequestCreate>({
    //resolver: yupResolver(YupSchema.PartnerRequest()), // 완료
    defaultValues: {},
    mode: 'onSubmit',
  });
  /** 화주관리 스토어 - API */
  const [insertPartner] = usePartnerStore((s) => [s.insertPartner]);

  const queryClient = useQueryClient();

  /** 화주 등록 */
  const { mutate: insertPartnerMutate, isLoading } = useMutation(insertPartner, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await queryClient.invalidateQueries({ queryKey: ['/partner/paging'] });
          closeModal('ADD');
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });
  const onValid: SubmitHandler<PartnerRequestCreate> = (data) => {
    // 번호 리플레이스
    data.phoneNo = (data.phoneNo || '').replace(/[^0-9]/g, '');
    insertPartnerMutate(data);
  };

  // 공통적으로 사용할 onChange 함수
  const handleInputChange = (regexPattern: RegExp, formatPattern: string) => (e: any) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 남기기
    const formattedValue = rawValue.replace(regexPattern, formatPattern); // 포맷에 맞게 변환
    // 입력 필드에 표시할 값은 하이픈 포함된 포맷된 값으로 설정
    e.target.value = formattedValue;
  };

  // 파일업로드
  const handleChildValueChange = (fileInfo: CommonResponseFileDown) => {
    reset((prev) => ({
      ...prev,
      fileId: fileInfo.fileId,
    }));
    fetchData(fileInfo.fileId);
  };

  return (
    <PopupLayout
      width={820}
      isEscClose={false}
      open={modalType.type === 'ADD'}
      title={'화주 추가하기'}
      onClose={() => {
        closeModal('ADD');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn btnBlue" title="저장" onClick={handleSubmit(onValid)}>
              저장
            </button>
            <button
              className="btn"
              title="닫기"
              onClick={() => {
                closeModal('ADD');
              }}
            >
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <PopupSearchBox>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestCreate> control={control} name={'partnerNm'} label={'회사명'} placeholder={Placeholder.Input || ''} required={true} />
            <FormInput<PartnerRequestCreate>
              control={control}
              name={'partnerTicker'}
              label={'회사티커'}
              placeholder={Placeholder.Input || ''}
              required={false}
            />
          </PopupSearchType>
          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestCreate> control={control} name={'domain'} label={'도메인'} placeholder={Placeholder.Input || ''} required={true} />
            <FormInput<PartnerRequestCreate> control={control} name={'partnerSubNm'} label={'도메인명'} placeholder={Placeholder.Input || ''} required={true} />
          </PopupSearchType>

          <PopupSearchType className={'type_2'}>
            <FormInput<PartnerRequestCreate>
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

export default PartnerAddPop;
