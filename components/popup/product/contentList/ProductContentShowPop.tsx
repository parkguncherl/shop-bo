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
 * Date: 2026/02/24
 * Author: park junsung
 * */
const ProductContentShowPop = ({ open, productContentData, onClose }: ProductContentShowPopProps) => {
  /** 공통 스토어 - State */
  const [getFileUrl, selectFileList] = useCommonStore((s) => [s.getFileUrl, s.selectFileList]);

  /** 팝업 내부 local state */
  //const [managedContentState, setManagedContentState] = useState<ProductContentListResponseProductContent | undefined>(undefined);
  const [managedContentElements, setManagedContentElements] = useState<ContentElement[]>([]);
  const [managedFileDetState, setManagedFileDetState] = useState<extendedFileDet[]>([]);

  /** 출력을 위한 형식적 서식 */
  const { control, setValue } = useForm<ProductContentsFields>({
    mode: 'onBlur',
  });

  useEffect(() => {
    if (productContentData) {
      if (productContentData.fileId) {
        const splittedNewsContents = (productContentData.newsContents || '').split(RegExpression.ProductContent.carriageReturn).filter((value) => value != '');
        console.log('productContentData.newsContents: ', productContentData.newsContents);
        console.log('splitedNewsContents: ', splittedNewsContents);

        // const contentElements: ContentElement[] = splittedNewsContents.map((newsContent) => {
        //   const extractedImgToken = [...newsContent.matchAll(RegExpression.ProductContent.imgToken)]; //newsContent.match(RegExpression.ProductContent.imgToken);
        //   if (extractedImgToken.length > 0) {
        //     const fileNames = extractedImgToken.map((token) => token[1]);
        //     return {
        //       id: productContentData,
        //       partialContent: productContentData.newsContents,
        //       fileInfo: {
        //         file: {},
        //         fileSrcUrl:
        //       }
        //     };
        //   }
        // });
        selectFileList(productContentData.fileId).then((fileDetList) => {
          //const fileUrl = await getFileUrl(file.sysFileNm);
          // todo 이하 주석 해제하고 이어서 작성
          // const contentElements: ContentElement[] = splittedNewsContents.map(async (newsContent) => {
          //   const extractedImgToken = [...newsContent.matchAll(RegExpression.ProductContent.imgToken)]; //newsContent.match(RegExpression.ProductContent.imgToken);
          //   if (extractedImgToken.length > 0) {
          //     const fileNames = extractedImgToken.map((token) => token[1]);
          //     return {
          //       id: productContentData.id,
          //       partialContent: productContentData.newsContents,
          //       fileInfo: {
          //         file: {},
          //         fileSrcUrl: await getFileUrl(file.sysFileNm),
          //       },
          //     };
          //   }
          // });
        });
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
