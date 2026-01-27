'use client';

import React, { useState } from 'react';
import { Title } from '../../../../components';
import { useCommonStore } from '../../../../stores';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '../../../../libs';
import FormEnhancedTextArea, { EnhancedTextAreasMode } from '../../../../components/FormEnhancedTextArea';
import FormInput from '../../../../components/FormInput';

export interface ProductContentsFields {
  title: string;
  content: string;
}

/** 상품관리 - 상품컨텐츠 페이지 */
const ProductContents = () => {
  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);

  /** 로컬 스토어 */
  const [displayMode, setDisplayMode] = useState<EnhancedTextAreasMode>('edit');

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
    <div className={'product_contents_root'}>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset}></Title>
      <div className={'product_contents'}>
        <div className={'left_side'}>
          <form>
            <div className={'headed'}>
              <div className={'title_boxing'}>
                <FormInput<ProductContentsFields>
                  control={control}
                  name={'title'}
                  onKeyDown={(e) => {
                    // todo 제목 영역
                  }}
                  inputType={'single'}
                />
              </div>
            </div>
            <div className={'content'}>
              <div className={'content_boxing'}>
                <FormEnhancedTextArea<ProductContentsFields> control={control} name={'content'} autoSize={{ minRows: 7, maxRows: 40 }} mode={displayMode} />
              </div>
            </div>
            <div className={'bottom'}>
              <div className={'bottom_boxing'}>
                <div className={'btn-wrapper'}>
                  <div className={'btn-per-wrapper'}>
                    <button className={'btn btn_blue'}>저장</button>
                  </div>
                  <div className={'btn-per-wrapper'}>
                    <button
                      type={'button'}
                      className={'btn'}
                      onClick={() => {
                        if (displayMode != 'preview') {
                          setDisplayMode('preview');
                        } else {
                          setDisplayMode('edit');
                        }
                      }}
                    >
                      {displayMode == 'edit' ? '미리보기' : '편집'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className={'right_side'}></div>
      </div>
    </div>
  );
};

export default ProductContents;
