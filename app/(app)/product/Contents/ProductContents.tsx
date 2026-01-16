'use client';

import React from 'react';
import { Title } from '../../../../components';
import { useCommonStore } from '../../../../stores';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '../../../../libs';
import FormEnhancedTextArea from '../../../../components/FormEnhancedTextArea';

export interface ProductContentsFields {
  title: string;
  password: string;
  isMobileLogin: string;
  otpNo?: string;
  countryCode?: string;
}

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
  } = useForm<ProductContentsFields>({
    resolver: yupResolver(YupSchema.ProductContentsRequest()),
    mode: 'onSubmit',
  });

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset}></Title>
      <div className={'productContents'}>
        <form>
          <div className={'headed'}></div>
          <div className={'content_boxing'}>
            {/* todo 적절한 컴포넌트를 새로 만들기*/}
            <FormEnhancedTextArea<ProductContentsFields> control={control} name={'unknown'} onKeyDown={(e) => {}} />
          </div>
          <div className={'bottom_boxing'}></div>
        </form>
      </div>
    </div>
  );
};

export default ProductContents;
