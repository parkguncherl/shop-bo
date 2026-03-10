import React, { useEffect } from 'react';
import { PopupFooter } from '../../PopupFooter';
import { PopupContent } from '../../PopupContent';
import { PopupLayout } from '../../PopupLayout';
import { ProductContentListResponseProductContent } from '../../../../generated';
import { useCommonStore } from '../../../../stores';
import PopupFormGroup from '../../content/PopupFormGroup';
import PopupFormType from '../../content/PopupFormType';
import FormInput from '../../../form/FormInput';
import { ProductContentsFields } from '../../../../app/(app)/product/Contents/ProductContents';
import PopupFormBox from '../../content/PopupFormBox';
import { useForm } from 'react-hook-form';
import { RegExpression } from '../../../../libs/const';
import FormCombineParagraphs, { ContentElement } from '../../../form/FormCombineParagraphs';
import FormFileDropPlate from '../../../form/FormFileDropPlate';

interface ProductImgUploadPopProps {
  open: boolean;
  onClose: () => void;
}

/**
 * components/popup/product/productMng/ProductImgUploadPop.tsx
 * desc: 상품이미지 업로드 팝업
 * Date: 2026/03/10
 * Author: park junsung
 * */
const ProductImgUploadPop = ({ open, onClose }: ProductImgUploadPopProps) => {
  /** 공통 스토어 - State */
  const [getFileUrl, selectFileList] = useCommonStore((s) => [s.getFileUrl, s.selectFileList]);

  /** 출력을 위한 형식적 서식 */
  const { control, setValue } = useForm<ProductContentsFields>({
    mode: 'onBlur',
  });

  return (
    <div className="imgPopBox">
      <PopupLayout
        width={900}
        open={open}
        isEscClose={true}
        title={'신규 이미지 업로드'}
        onClose={onClose}
        footer={
          <PopupFooter>
            <button className="btn" onClick={onClose}>
              닫기
            </button>
          </PopupFooter>
        }
      >
        <PopupContent>
          <PopupFormBox className={''}>
            <PopupFormType className={'type1'}>
              <FormFileDropPlate<ProductContentsFields> control={control} name={'title'} label={'제목'} />
            </PopupFormType>
          </PopupFormBox>
        </PopupContent>
      </PopupLayout>
    </div>
  );
};

export default ProductImgUploadPop;
