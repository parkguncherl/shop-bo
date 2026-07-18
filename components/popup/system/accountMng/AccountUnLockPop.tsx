import { useAccountStore } from '@/stores';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useRef, useState } from 'react';
import { PopupContent } from '../../PopupContent';
import { PopupSearchBox, PopupSearchType } from '../../content';
import { PopupFooter } from '../../PopupFooter';
import { toastError, toastSuccess } from '@/components';
import { UserRequestUnLock, UserResponseSelectByLoginId } from '@/generated';
import { Placeholder } from '@/libs/const';
import { SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '@/libs';
import FormInput from '../../../form/FormInput';
import { Label } from '@/components';
import styles from '../../../../styles/popup/popup.module.scss';
import Loading from '../../../Loading';
import { PopupLayout } from '../../PopupLayout';

interface Props {
  data: UserResponseSelectByLoginId;
}

/** 시스템 - 계정관리 - 잠금해제 팝업 */
export const AccountUnLockPop = ({ data }: Props) => {
  const el = useRef<HTMLDListElement | null>(null);
  const {
    watch,
    handleSubmit,
    control,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<UserRequestUnLock>({
    resolver: yupResolver(YupSchema.AccountUnLockRequest()), // 완료
    defaultValues: {
      id: data.id,
      loginId: data.loginId,
      userNm: data.userNm,
      phoneNo: data.phoneNo,
    },
    mode: 'onSubmit',
  });

  /** 계정관리 스토어 - State */
  const [modalType, closeModal] = useAccountStore((s) => [s.modalType, s.closeModal]);

  /** 계정관리 양식 관리 스토어 - API */
  const [updateUserUnLock] = useAccountStore((s) => [s.updateUserUnLock]);

  const queryClient = useQueryClient();

  const [isPassVisible, setIsPassVisible] = useState(true);

  /** 계정 잠금해제 */
  const { mutate: updateUserUnLockMutate, isPending } = useMutation({
    mutationFn: updateUserUnLock,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('잠금해제 되었습니다.');
          await queryClient.invalidateQueries({ queryKey: ['/user/paging'] });
          closeModal('UNLOCK');
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const guideText = `선택한 계정의 잠금상태를 해제하려면,
관리자 인증을 위하여 현재 로그인 중인 계정의 비밀번호를 입력 후 "저장" 버튼을 클릭하세요.`;

  const onValid: SubmitHandler<UserRequestUnLock> = (data) => {
    updateUserUnLockMutate(data);
  };

  return (
    <dl ref={el}>
      <form>
        <PopupLayout
          width={620}
          isEscClose={false}
          open={modalType.type === 'UNLOCK' && modalType.active}
          title={'계정잠금 해제'}
          onClose={() => closeModal('UNLOCK')}
          footer={
            <PopupFooter>
              <div className={'btnArea'}>
                <button className={'btn btn_primary'} onClick={handleSubmit(onValid)}>
                  {'저장'}
                </button>
              </div>
            </PopupFooter>
          }
        >
          <PopupContent>
            <PopupSearchBox>
              <PopupSearchType className={'type_1'}>
                <Label title={'ID(e-mail)'} value={watch('loginId')} />
              </PopupSearchType>
              <PopupSearchType className={'type_1'}>
                <Label title={'이름'} value={watch('userNm')} />
              </PopupSearchType>
            </PopupSearchBox>
            <p className="mt10 mb10 etcTxt" style={{ textAlign: 'center', width: '72%', margin: '0 auto' }}>
              {guideText}
            </p>
            <PopupSearchBox>
              <div className={styles.inp_pw} style={{ display: 'block' }}>
                <FormInput<UserRequestUnLock>
                  control={control}
                  type={isPassVisible ? 'password' : 'text'}
                  name={'loginPass'}
                  label={'비밀번호 입력'}
                  placeholder={Placeholder.Input}
                  required={true}
                />
                <button
                  className={`${styles.ico_eye} ${!isPassVisible ? styles.on : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsPassVisible(!isPassVisible);
                  }}
                />
              </div>
            </PopupSearchBox>
          </PopupContent>
          {isPending && <Loading />}
        </PopupLayout>
      </form>
    </dl>
  );
};
