'use client';

import React from 'react';
import { Title } from '../../../../components';
import { useCommonStore } from '../../../../stores';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '../../../../libs';
import FormEnhancedTextArea from '../../../../components/FormEnhancedTextArea';
import FormInput from '../../../../components/FormInput';

export interface ProductContentsFields {
  title: string;
  content: string;
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
        <div className={'left_side'}>
          <form>
            <div className={'headed'}>
              <div className={'title_boxing'}>
                <FormInput<ProductContentsFields> control={control} name={'title'} onKeyDown={(e) => {}} inputType={'single'} />
              </div>
            </div>
            <div className={'content'}>
              <div className={'content_boxing'}>
                <FormEnhancedTextArea<ProductContentsFields> control={control} name={'content'} autoSize={{ minRows: 7, maxRows: 40 }} />
              </div>
            </div>
            <div className={'bottom'}>
              <div className={'bottom_boxing'}></div>
            </div>
          </form>
        </div>
        <div className={'right_side'}></div>
      </div>
    </div>
  );
};

export default ProductContents;
