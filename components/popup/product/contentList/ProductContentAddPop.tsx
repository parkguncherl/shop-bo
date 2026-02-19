import React, { useEffect, useState } from 'react';
import { PopupFooter } from '../../PopupFooter';
import { PopupContent } from '../../PopupContent';
import { PopupLayout } from '../../PopupLayout';
import { FileDet, ProductContentListResponseProductContent } from '../../../../generated';
import { useCommonStore } from '../../../../stores';
import PopupFormBox from '../../content/PopupFormBox';
import PopupFormGroup from '../../content/PopupFormGroup';
import PopupFormType from '../../content/PopupFormType';
import FormInput from '../../../FormInput';
import { ProductContentsFields } from '../../../../app/(app)/product/Contents/ProductContents';
import FormEnhancedTextArea, { EnhancedTextAreasMode, FileInfo } from '../../../FormEnhancedTextArea';
import { SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '../../../../libs';
import { useProductContentsStore } from '../../../../stores/product/useProductContentsStore';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { ImgToken } from '../../../../libs/const';

interface ProductContentShowPopProps {
  open: boolean;
  onClose: () => void;
}
interface extendedFileDet extends FileDet {
  fileUrl?: string;
}

/**
 * components/popup/product/contentList/ProductContentAddPop.tsx
 * desc: 상품컨텐츠 추가 팝업
 * Date: 2026/02/19
 * Author: park junsung
 * */
const ProductContentAddPop = ({ open, onClose }: ProductContentShowPopProps) => {
  /** 공통 스토어 - State */
  //const [getFileUrl, selectFileList] = useCommonStore((s) => [s.getFileUrl, s.selectFileList]);
  const [modals, openModal, closeModal, insertProductContents] = useProductContentsStore((s) => [s.modals, s.openModal, s.closeModal, s.insertProductContents]);

  /** 팝업 내부 local state */
  // const [managedDataState, setManagedDataState] = useState<ProductContentListResponseProductContent | undefined>(undefined);
  // const [managedFileDetState, setManagedFileDetState] = useState<extendedFileDet[]>([]);
  const [displayMode, setDisplayMode] = useState<EnhancedTextAreasMode>('edit');

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

  /** 상품컨텐츠 추가 요청 처리 동작 캐싱 */
  const { mutate: insertProductContentsMutate } = useMutation(insertProductContents, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          // todo 이후 필요한 동작 정의
        } else {
          toastError(`컨텐츠 저장 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  // 입력이 유효한 경우
  // 컨텐츠로서 저장하는 내용은 내용 영역에서 파일 제목, 문단 단위 절삭을 위한 정보를 포함하도록 한다.
  // 줄바꿈: \n, 파일(이미지)명: <<IMG|image_title>> --> 둘중 하나를 기준으로 문단 나눔
  const onValid: SubmitHandler<ProductContentsFields> = (data, event) => {
    const fileInfoList: FileInfo[] = [
      ...data.content.filter((content) => content.fileInfo && content.fileInfo.file).map((content) => content.fileInfo as FileInfo),
    ];
    const uniqueFileList: File[] = Array.from(new Map(fileInfoList.map((fileInfo) => [fileInfo.file.name, fileInfo.file])).values());
    const fileInfoIncludedContent = data.content
      .map((content) => {
        if (content.fileInfo && content.fileInfo.file.name) {
          // regex = /<<IMG\|([^>]+)>>/g;
          //return `<<IMG|${content.fileInfo.file.name}>>`; // <<IMG|image_title>>
          return ImgToken(content.fileInfo.file.name);
        } else {
          return content.partialContent + '\\n'; // 문단 구분을 위한 구분자 추가 ('\\n' → 문자열 \n)
        }
      })
      .join('');
    insertProductContentsMutate({
      newsTitle: data.title,
      newsSubTitle: data.title, // todo
      newsContents: fileInfoIncludedContent,
      commonRequestFileUploads: {
        uploadFiles: uniqueFileList,
      },
    });
    console.log(fileInfoIncludedContent);
    console.log(fileInfoIncludedContent.replace(/<<IMG\|[^>]+>>/g, '').replace(/\\n/g, '\n'));
    //console.log('fileInfoLists: ', uniqueFileList);
  };

  // 유효하지 않은 경우
  const onInvalid: SubmitErrorHandler<ProductContentsFields> = (errors, event) => {
    if (errors.title) {
      toastError(errors.title.message);
    } else {
      toastError('본문에서 문제가 되는 영역을 수정한 후 재시도하십시요.');
    }
  };

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
                <FormInput<ProductContentsFields> control={control} name={'title'} inputType={'label'} placeholder={'제목'} />
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <FormEnhancedTextArea<ProductContentsFields>
                  control={control}
                  name={'content'}
                  autoSize={{ minRows: 7, maxRows: 40 }}
                  mode={displayMode}
                  attachOnlyImg={true}
                />
              </PopupFormType>
            </PopupFormGroup>
          </PopupFormBox>
        </PopupContent>
      </PopupLayout>
    </div>
  );
};

export default ProductContentAddPop;
