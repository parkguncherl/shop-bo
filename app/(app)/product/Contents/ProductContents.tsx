'use client';

import React from 'react';
import { Title } from '../../../../components';
import { useCommonStore } from '../../../../stores';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '../../../../libs';
import FormInput from '../../../../components/FormInput';
import { LoginVerificationFields } from '../../../(auth)/login/LoginClient';

/** 상품관리 - 상품컨텐츠 페이지 */
const ProductContents = () => {
  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);

  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    // todo
  };

  /** 상품 내용 입력 서식 */
  const {
    handleSubmit,
    control,
    getValues,
    formState: { errors, isValid },
  } = useForm<any>({
    resolver: yupResolver(YupSchema.ProductContentsRequest()), // 완료
    mode: 'onSubmit',
  });

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset}></Title>
      <div className={'productContents'}>
        <div className={'headedArea'}></div>
        <div className={'contentArea'} style={{ height: '400px' }}>
          {/* todo 적절한 컴포넌트를 새로 만들기*/}
          <FormInput<LoginVerificationFields> control={control} style={{ height: '100%' }} name={'loginId'} onKeyDown={(e) => {}} inputType={'textarea'} />
        </div>
      </div>
    </div>
  );
};

export default ProductContents;
