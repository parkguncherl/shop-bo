'use client';

import React, { useState } from 'react';
import { Title, toastError } from '../../../../components';
import { useCommonStore } from '../../../../stores';
import { SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '../../../../libs';
import FormEnhancedTextArea, { ContentElement, EnhancedTextAreasMode } from '../../../../components/FormEnhancedTextArea';
import FormInput from '../../../../components/FormInput';
import { ConfirmModal } from '../../../../components/ConfirmModal';
import { SubmitErrorHandler } from 'react-hook-form/dist/types/form';

export interface ProductContentsFields {
  title: string;
  content: ContentElement[];
}

/** 상품관리 - 상품컨텐츠 페이지 */
const ProductContents = () => {
  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);

  /** 로컬 스토어 */
  const [displayMode, setDisplayMode] = useState<EnhancedTextAreasMode>('edit');
  const [openedModalType, setOpenedModalType] = useState<'SUBMIT' | null>(null);

  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    control._reset();
  };

  // 입력이 유효한 경우
  const onValid: SubmitHandler<ProductContentsFields> = (data, event) => {
    console.log('data: ', data);
  };

  // 유효하지 않은 경우
  const onInvalid: SubmitErrorHandler<ProductContentsFields> = (errors, event) => {
    if (errors.title) {
      toastError(errors.title.message);
    } else {
      toastError('본문에서 문제가 되는 영역을 수정한 후 재시도하십시요.');
    }
  };

  /** 상품 내용 입력 서식 */
  const {
    handleSubmit,
    control,
    getValues,
    formState: { errors, isValid },
  } = useForm<ProductContentsFields>({
    resolver: yupResolver(YupSchema.ProductContentsRequest()),
    mode: 'onChange',
  });

  return (
    <div className={'product_contents_root'}>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset}></Title>
      <div className={'product_contents'}>
        <div className={'left_side'}>
          <div className={'form_boxing'}>
            <div className={'headed'}>
              <div className={'title_boxing'}>
                <FormInput<ProductContentsFields> control={control} name={'title'} inputType={'label'} placeholder={'제목'} />
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
                    <button
                      className={'btn btn_blue'}
                      onClick={() => {
                        if (errors.content == undefined) {
                          setOpenedModalType('SUBMIT');
                        } else {
                          toastError('본문에서 문제가 되는 영역을 수정한 후 재시도하십시요.');
                        }
                      }}
                    >
                      저장
                    </button>
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
          </div>
        </div>
        <div className={'right_side'}></div>
      </div>

      <ConfirmModal
        open={openedModalType == 'SUBMIT'}
        title={'저장 하시겠습니까?'}
        confirmText={'저장'}
        onConfirm={() => {
          handleSubmit(onValid, onInvalid)(); // 함수를 반환하므로 다음과 같이, 호출하여야
        }}
        onClose={() => {
          setOpenedModalType(null);
        }}
      />
    </div>
  );
};

export default ProductContents;
