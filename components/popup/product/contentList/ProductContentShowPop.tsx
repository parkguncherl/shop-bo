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

interface ProductContentShowPopProps {
  open: boolean;
  productContentData?: ProductContentListResponseProductContent;
  onClose: () => void;
}

/**
 * components/popup/product/contentList/ProductContentShowPop.tsx
 * desc: 품목컨텐츠 출력 팝업
 * Date: 2026/02/24
 * Author: park junsung
 * */
const ProductContentShowPop = ({ open, productContentData, onClose }: ProductContentShowPopProps) => {
  /** 공통 스토어 - State */
  const [getFileUrl, selectFileList] = useCommonStore((s) => [s.getFileUrl, s.selectFileList]);

  /** 출력을 위한 형식적 서식 */
  const { control, setValue } = useForm<ProductContentsFields>({
    mode: 'onBlur',
  });

  useEffect(() => {
    if (productContentData) {
      const contentElements: ContentElement[] = [];
      const splittedNewsContents = (productContentData.newsContents || '').split(RegExpression.ProductContent.carriageReturn).filter((value) => value != '');
      setValue('title', productContentData.newsTitle || '제목을 찾을 수 없음');

      /** 파일 정보 존재 여부에 따라 분기 */
      if (productContentData.fileId) {
        selectFileList(productContentData.fileId).then(async (fileDetList) => {
          for (let index = 0; index < splittedNewsContents.length; index++) {
            const newsContent = splittedNewsContents[index];
            const extractedImgToken = [...newsContent.matchAll(RegExpression.ProductContent.imgToken)]; //newsContent.match(RegExpression.ProductContent.imgToken);
            if (extractedImgToken.length > 0) {
              const fileNames = extractedImgToken.map((token) => token[1]);
              if (fileNames.length != 1) {
                console.error('단일 파일명을 기대하는 영역에 파일명이 부재하거나 혹은 다수의 파일명이 추출됨, 데이터 오염 여부 점검!');
                return Promise.reject('improperData');
              }
              const correspondedFileDet = fileDetList.filter((fileDet) => fileDet.fileNm == fileNames[0]);

              if (correspondedFileDet.length != 1 || !correspondedFileDet[0].sysFileNm) {
                console.error();
                return Promise.reject('failed to the corresponded fileDet');
              }
              contentElements.push({
                id: index + 1,
                partialContent: undefined,
                fileInfo: {
                  fileSrcUrl: await getFileUrl(correspondedFileDet[0].sysFileNm),
                },
              });
            } else {
              contentElements.push({
                id: index + 1,
                partialContent: newsContent,
                fileInfo: undefined,
              });
            }
          }
          setValue('content', contentElements);
        });
      } else {
        splittedNewsContents.forEach((newsContent, index) => {
          contentElements.push({
            id: index + 1,
            partialContent: newsContent,
          });
        });
        setValue('content', contentElements);
      }
    }
  }, [productContentData]);

  return (
    <div className="imgPopBox">
      <PopupLayout
        width={900}
        open={open}
        isEscClose={true}
        title={'품목컨텐츠 미리보기'}
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
                <FormCombineParagraphs<ProductContentsFields>
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
