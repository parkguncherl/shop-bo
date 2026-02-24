import React, { useEffect, useState } from 'react';
import { PopupFooter } from '../../PopupFooter';
import { PopupContent } from '../../PopupContent';
import { PopupLayout } from '../../PopupLayout';
import { FileDet, ProductContentListResponseProductContent } from '../../../../generated';
import { useCommonStore } from '../../../../stores';
import PopupFormGroup from '../../content/PopupFormGroup';
import PopupFormType from '../../content/PopupFormType';
import FormInput from '../../../form/FormInput';
import { ProductContentsFields } from '../../../../app/(app)/product/Contents/ProductContents';
import FormEnhancedTextArea, { ContentElement } from '../../../form/FormEnhancedTextArea';
import PopupFormBox from '../../content/PopupFormBox';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '../../../../libs';
import { RegExpression } from '../../../../libs/const';

interface ProductContentShowPopProps {
  open: boolean;
  productContentData?: ProductContentListResponseProductContent;
  onClose: () => void;
}
interface extendedFileDet extends FileDet {
  fileUrl?: string;
}

/**
 * components/popup/product/contentList/ProductContentShowPop.tsx
 * desc: 상품컨텐츠 출력 팝업
 * Date: 2026/02/13
 * Author: park junsung
 * */
const ProductContentShowPop = ({ open, productContentData, onClose }: ProductContentShowPopProps) => {
  /** 공통 스토어 - State */
  const [getFileUrl, selectFileList] = useCommonStore((s) => [s.getFileUrl, s.selectFileList]);

  /** 팝업 내부 local state */
  //const [managedContentState, setManagedContentState] = useState<ProductContentListResponseProductContent | undefined>(undefined);
  const [managedContentElements, setManagedContentElements] = useState<ContentElement[]>([]);
  const [managedFileDetState, setManagedFileDetState] = useState<extendedFileDet[]>([]);

  /** 상품 내용 입력 서식 */
  const {
    handleSubmit,
    control,
    getValues,
    setValue,
    formState: { errors, isValid },
  } = useForm<ProductContentsFields>({
    resolver: yupResolver(YupSchema.ProductContentsRequest()),
    mode: 'onChange',
  });

  useEffect(() => {
    if (productContentData) {
      if (productContentData.fileId) {
        const contentElements = (productContentData.newsContents || '').split(RegExpression.ProductContent.carriageReturn).filter((value) => value != '');
        console.log('productContentData.newsContents: ', productContentData.newsContents);
        console.log('contentElements: ', contentElements);
        // selectFileList(productContentData.fileId).then((fileDetList) => {
        //   const contentElements = (productContentData.newsContents || '').split(RegExpression.imgToken);
        //   // const updatedFileDetStateList = fileDetList.map(async (fileDet) => {
        //   //   return {
        //   //     ...fileDet,
        //   //     fileUrl: fileDet.sysFileNm ? await getFileUrl(fileDet.sysFileNm) : undefined,
        //   //   };
        //   // });
        //   // // todo 마저 진행
        //   // setManagedFileDetState(updatedFileDetStateList); // 저장 시점에 이미 중복 파일은 부재하리라 기대하며 이하 작성
        // });
      }
    }
  }, [productContentData]);

  useEffect(() => {
    if (managedFileDetState.length > 0) {
      // todo
    }
  }, [managedFileDetState]);

  return (
    <div className="imgPopBox">
      <PopupLayout
        width={900}
        open={open}
        isEscClose={true}
        title={'상품컨텐츠 미리보기'}
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
            <PopupFormGroup>
              <PopupFormType className={'type1'}>
                <FormInput<ProductContentsFields> control={control} name={'title'} label={'제목'} inputType={'single'} readOnly={true} />
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <FormEnhancedTextArea<ProductContentsFields>
                  control={control}
                  name={'content'}
                  autoSize={{ minRows: 7, maxRows: 40 }}
                  mode={'preview'}
                  inputType={'single'}
                  label={'본문'}
                  attachOnlyImg={true}
                  textAreaBoxHeight={'600px'}
                />
              </PopupFormType>
            </PopupFormGroup>
          </PopupFormBox>
        </PopupContent>
      </PopupLayout>
    </div>
  );
};

export default ProductContentShowPop;
