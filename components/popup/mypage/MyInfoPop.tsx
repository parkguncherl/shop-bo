'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { toastError, toastSuccess } from '../../ToastMessage';
import { PopupLayout } from '../PopupLayout';
import { PopupContent } from '../PopupContent';
import { PopupFooter } from '../PopupFooter';
import PopupFormBox from '../content/PopupFormBox';
import PopupFormGroup from '../content/PopupFormGroup';
import PopupFormType from '../content/PopupFormType';
import FormInput from '../../form/FormInput';
import Loading from '../../Loading';
import { useController } from 'react-hook-form';

type MyInfoFields = {
  userNm: string;
  phoneNo?: string;
  belongNm: string;
  deptNm?: string;
  positionNm?: string;
  tema?: string;
};

const schema = yup.object({
  userNm: yup.string().required('이름은 필수입니다.'),
  phoneNo: yup.string().optional(),
  belongNm: yup.string().required('소속은 필수입니다.'),
  deptNm: yup.string().optional(),
  positionNm: yup.string().optional(),
  tema: yup.string().optional(),
});

const temaOptions = [
  { value: 'white', label: 'White' },
  { value: 'dark', label: 'Dark' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

const TemaRadio = ({ control }: { control: any }) => {
  const { field } = useController({ name: 'tema', control });
  return (
    <dl>
      <dt><label>테마</label></dt>
      <dd>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', height: '28px' }}>
          {temaOptions.map((opt) => (
            <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="radio"
                value={opt.value}
                checked={field.value === opt.value}
                onChange={() => field.onChange(opt.value)}
                style={{ cursor: 'pointer', accentColor: '#7c3aed' }}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </dd>
    </dl>
  );
};

export const MyInfoPop = ({ open, onClose }: Props) => {
  const { data: session, update } = useSession();
  const user = session?.user;

  const { handleSubmit, control } = useForm<MyInfoFields>({
    resolver: yupResolver(schema),
    values: {
      userNm: user?.userNm || '',
      phoneNo: user?.phoneNo || '',
      belongNm: user?.belongNm || '',
      deptNm: user?.deptNm || '',
      positionNm: user?.positionNm || '',
      tema: (user as any)?.tema || 'white',
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: MyInfoFields) =>
      authApi.put('/mypage', {
        id: user?.id,
        loginId: user?.loginId,
        ...data,
      }),
    onSuccess: async (res, variables) => {
      if (res.data.resultCode === 200) {
        toastSuccess('저장되었습니다.');
        onClose();
        update({ user: { ...user, ...variables } });
      } else {
        toastError(res.data.resultMessage);
      }
    },
    onError: () => toastError('저장 중 오류가 발생했습니다.'),
  });

  const onValid: SubmitHandler<MyInfoFields> = (data) => {
    onClose();
    mutate(data);
  };

  return (
    <PopupLayout
      width={560}
      height={420}
      open={open}
      title="내 정보 수정"
      onClose={onClose}
      isEscClose={true}
      footer={
        <PopupFooter>
          <div className="btnArea right">
            <button className="btn btnPurple" onClick={handleSubmit(onValid)} disabled={isPending}>
              저장
            </button>
            <button className="btn" onClick={onClose}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <PopupFormBox>
          <PopupFormGroup>
            <PopupFormType className="type1">
              <FormInput control={control} name="userNm" label="이름" required placeholder="이름을 입력하세요" />
            </PopupFormType>
            <PopupFormType className="type1">
              <FormInput control={control} name="phoneNo" label="휴대전화" placeholder="010-0000-0000" />
            </PopupFormType>
            <PopupFormType className="type1">
              <FormInput control={control} name="belongNm" label="소속" required placeholder="소속을 입력하세요" />
            </PopupFormType>
            <PopupFormType className="type1">
              <FormInput control={control} name="deptNm" label="부서" placeholder="부서를 입력하세요" />
            </PopupFormType>
            <PopupFormType className="type1">
              <FormInput control={control} name="positionNm" label="직책" placeholder="직책을 입력하세요" />
            </PopupFormType>
            <PopupFormType className="type1">
              <TemaRadio control={control} />
            </PopupFormType>
          </PopupFormGroup>
        </PopupFormBox>
      </PopupContent>
      {isPending && <Loading />}
    </PopupLayout>
  );
};
