import { CodeRequestDelete, CodeRequestUpdate, CodeResponsePaging } from '@/generated';
import { useCodeStore, useCommonStore } from '@/stores';
import React, { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '@/components';
import { PopupContent } from '@/components/popup/PopupContent';
import { PopupSearchBox, PopupSearchType } from '@/components/popup/content';
import { Input } from '@/components';
import { PopupFooter } from '@/components/popup/PopupFooter';
import { Placeholder } from '@/libs/const';
import { SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '@/libs';
import FormInput from '@/components/form/FormInput';
import FormDropDown from '@/components/form/FormDropDown';
import Loading from '@/components/Loading';
import { PopupLayout } from '@/components/popup/PopupLayout';

interface Props {
  data: CodeResponsePaging;
}

/** 시스템 - 코드관리 - 수정 팝업 */
export const CodeModPop = ({ data }: Props) => {
  const el = useRef<HTMLDListElement | null>(null);
  const {
    watch,
    handleSubmit,
    control,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<CodeRequestUpdate>({
    resolver: yupResolver(YupSchema.CodeRequestForUpdate()), // 완료
    defaultValues: {
      id: data.id,
      codeUpper: data.codeUpper,
      codeCd: data.codeCd,
      codeNm: data.codeNm,
      codeDesc: data.codeDesc,
      codeEtc1: data.codeEtc1,
      codeEtc2: data.codeEtc2,
      codeOrder: data.codeOrder,
      delYn: data.delYn,
    },
    mode: 'onSubmit',
  });

  /** 코드관리 스토어 - State */
  const modalType = useCodeStore((s) => s.modalType);
  const closeModal = useCodeStore((s) => s.closeModal);

  /** 코드관리 스토어 - API */
  const updateCode = useCodeStore((s) => s.updateCode);
  const deleteCode = useCodeStore((s) => s.deleteCode);
  const updateCodeUseNotUse = useCodeStore((s) => s.updateCodeUseNotUse);

  /** 공통 스토어 - State */
  const menuUpdYn = useCommonStore((s) => s.menuUpdYn);
  const menuExcelYn = useCommonStore((s) => s.menuExcelYn);

  const queryClient = useQueryClient();

  /** 코드 수정 */
  const { mutate: updateCodeMutate, isPending: isCodePending } = useMutation({
    mutationFn: updateCode,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await queryClient.invalidateQueries({ queryKey: ['/code/paging'] });
          await queryClient.invalidateQueries({ queryKey: ['/code/dropdown/TOP'] });
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

  /* 코드 미사용 */
  const { mutate: updateCodeUseNotUseMutate, isPending: isUseNotUseLoading } = useMutation({
    mutationFn: updateCodeUseNotUse,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await queryClient.invalidateQueries({ queryKey: ['/code/paging'] });
          await queryClient.invalidateQueries({ queryKey: ['/code/dropdown/TOP'] });
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

  /** 코드 삭제 */
  const { mutate: deleteCodeMutate, isPending: deleteCodeIsLoading } = useMutation({
    mutationFn: deleteCode,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('삭제되었습니다.');
          await queryClient.invalidateQueries({ queryKey: ['/code/paging'] });
          await queryClient.invalidateQueries({ queryKey: ['/code/dropdown/TOP'] });
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

  /** 코드관리 수정, 삭제 버튼 클릭 시 */
  const deleteCodeFn = async () => {
    deleteCodeMutate({ id: data.id, codeUpper: data.codeUpper, codeCd: data.codeCd } as CodeRequestDelete);
  };

  const onValid: SubmitHandler<CodeRequestUpdate> = (formData) => {
    console.log('formData ==>', formData);
    updateCodeMutate(formData as CodeRequestUpdate);
  };

  return (
    <dl ref={el}>
      <form>
        <PopupLayout
          width={600}
          isEscClose={false}
          open={modalType.type === 'MOD' && modalType.active}
          title={menuUpdYn ? '코드 수정' : '코드 조회'}
          onClose={() => closeModal('MOD')}
          footer={
            data.codeUpperNm! === 'TOP'
              ? menuUpdYn && (
                  <PopupFooter>
                    <div className={'btnArea'}>
                      <button className={'btn btn_primary'} onClick={handleSubmit(onValid)}>
                        {'저장'}
                      </button>
                      <button className={'btn '} onClick={() => closeModal('MOD')}>
                        {'닫기'}
                      </button>
                    </div>
                  </PopupFooter>
                )
              : menuUpdYn && (
                  <PopupFooter>
                    <div className={'btnArea'}>
                      <button className={'btn btn_primary'} onClick={handleSubmit(onValid)}>
                        {'저장'}
                      </button>
                      <button className={'btn '} onClick={() => closeModal('MOD')}>
                        {'닫기'}
                      </button>
                    </div>
                  </PopupFooter>
                )
          }
        >
          <PopupContent>
            <PopupSearchBox>
              <PopupSearchType className={'type_1'}>
                <Input title={'상위코드명'} disable={true} value={data.codeUpperNm} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                {data.codeUpper == 'TOP' ? (
                  <Input title={'코드'} disable={true} value={data.codeCd} />
                ) : (
                  <FormInput<CodeRequestUpdate> control={control} name={'codeCd'} label={'코드'} placeholder={Placeholder.Input} required={true} />
                )}
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormInput<CodeRequestUpdate> control={control} name={'codeNm'} label={'이름'} placeholder={Placeholder.Input} required={true} />
              </PopupSearchType>
              {data.codeUpper === 'TOP' && (
                <PopupSearchType className={'type_1'}>
                  <Input title={'하위코드 수'} disable={true} value={data.lowerCodeCnt || '0'} />
                </PopupSearchType>
              )}
              <PopupSearchType className={'type_1'}>
                <FormInput<CodeRequestUpdate> control={control} name={'codeDesc'} label={'설명'} placeholder={Placeholder.Input} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormInput<CodeRequestUpdate> control={control} name={'codeEtc1'} label={'기타정보1'} placeholder={Placeholder.Input} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormInput<CodeRequestUpdate> control={control} name={'codeEtc2'} label={'기타정보2'} placeholder={Placeholder.Input} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormInput<CodeRequestUpdate> control={control} name={'codeOrder'} label={'순서'} placeholder={Placeholder.Input} required={true} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <FormDropDown<CodeRequestUpdate>
                  control={control}
                  name={'delYn'}
                  title={'사용여부'}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'N', label: '사용' },
                    { value: 'Y', label: '미사용' },
                  ]}
                />
              </PopupSearchType>
            </PopupSearchBox>
          </PopupContent>
          {isCodePending && <Loading />}
        </PopupLayout>
      </form>
    </dl>
  );
};
