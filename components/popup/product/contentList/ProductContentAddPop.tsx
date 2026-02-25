import React, { useState } from 'react';
import { PopupFooter } from '../../PopupFooter';
import { PopupContent } from '../../PopupContent';
import { PopupLayout } from '../../PopupLayout';
import PopupFormBox from '../../content/PopupFormBox';
import PopupFormGroup from '../../content/PopupFormGroup';
import PopupFormType from '../../content/PopupFormType';
import FormInput from '../../../form/FormInput';
import { ProductContentsFields } from '../../../../app/(app)/product/Contents/ProductContents';
import { SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '../../../../libs';
import { useProductContentsStore } from '../../../../stores/product/useProductContentsStore';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { Formatter, RegExpression } from '../../../../libs/const';
import { ConfirmModal } from '../../../ConfirmModal';
import FormCombineParagraphs, { EnhancedTextAreasMode, FileInfo } from '../../../form/FormCombineParagraphs';

interface ProductContentShowPopProps {
  open: boolean;
  onClose: (closeRes?: 'success') => void;
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
  const [insertProductContents] = useProductContentsStore((s) => [s.insertProductContents]);

  /** 팝업 내부 local state */
  const [displayMode, setDisplayMode] = useState<EnhancedTextAreasMode>('edit');
  const [openAddConf, setOpenAddConf] = useState(false);

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
          onClose('success');
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
  // 줄바꿈(\n) 기준으로 문단 분기, 파일(이미지)명(<<IMG|image_title>>) 뒤에는 반드시 이를(캐리지 리턴) 첨부
  const onValid: SubmitHandler<ProductContentsFields> = (data, event) => {
    const fileInfoList: FileInfo[] = [
      ...data.content.filter((content) => content.fileInfo && content.fileInfo.file).map((content) => content.fileInfo as FileInfo),
    ];
    const uniqueFileList: File[] = Array.from(new Map(fileInfoList.map((fileInfo) => [fileInfo.file.name, fileInfo.file])).values());
    const fileInfoIncludedContentList = data.content
      .map((content) => {
        if (content.fileInfo && content.fileInfo.file.name) {
          // regex = /<<IMG\|([^>]+)>>/g;
          //return `<<IMG|${content.fileInfo.file.name}>>`; // <<IMG|image_title>>
          //return ImgToken(content.fileInfo.file.name);

          return Formatter.ProductContent.CarriageReturn(Formatter.ProductContent.ImgToken(content.fileInfo.file.name));
        } else {
          //return content.partialContent + '\\n'; // 문단 구분을 위한 구분자 추가 ('\\n' → 문자열 \n)
          return content.partialContent && content.partialContent != '' ? Formatter.ProductContent.CarriageReturn(content.partialContent) : '';
        }
      })
      .filter((value) => value != undefined && value != ''); // 빈 문단의 경우 저장 이전에 제거

    const joinedFileInfoIncludedContent = fileInfoIncludedContentList.join('');
    insertProductContentsMutate({
      newsTitle: data.title,
      newsSubTitle: data.title, // 현재는 newsTitle 과 동일한 값을 사용하나 추후 요청이 들어올 경우 수정
      newsContents: joinedFileInfoIncludedContent,
      commonRequestFileUploads: {
        uploadFiles: uniqueFileList,
      },
    });

    // console.log(fileInfoIncludedContentList);
    //console.log(joinedFileInfoIncludedContent);

    //const combinedRegex = new RegExp(`${RegExpression.ProductContent.imgToken.source}|${RegExpression.ProductContent.carriageReturn.source}`, 'g');

    // const contentElements = joinedFileInfoIncludedContent.split(RegExpression.ProductContent.carriageReturn).filter((value) => value != '');
    // console.log('contentElements: ', contentElements);

    // console.log(fileInfoIncludedContent.replace(/<<IMG\|[^>]+>>/g, '').replace(/\\n/g, '\n'));
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
            <div className="btnArea between">
              <div className="left">
                <button
                  className="btn btn_blue"
                  onClick={() => {
                    const title = getValues('title');
                    const content = getValues('content');

                    if (title == '' || content[0].partialContent == '') {
                      toastError(title == '' ? '제목은 반드시 입력하셔야 합니다.' : '어떠한 내용도 없이 저장할 수 없습니다.');
                      return;
                    }
                    setOpenAddConf(true);
                  }}
                >
                  저장
                </button>
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
              <div className="right">
                <button
                  className="btn"
                  onClick={() => {
                    onClose();
                  }}
                >
                  닫기
                </button>
              </div>
            </div>
          </PopupFooter>
        }
      >
        <PopupContent>
          <PopupFormBox className={''}>
            <PopupFormGroup>
              <PopupFormType className={'type1'}>
                <FormInput<ProductContentsFields> control={control} name={'title'} label={'제목'} inputType={'label'} placeholder={'제목'} />
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <FormCombineParagraphs<ProductContentsFields>
                  control={control}
                  name={'content'}
                  autoSize={{ minRows: 7, maxRows: 40 }}
                  mode={displayMode}
                  inputType={'label'}
                  label={'본문'}
                  attachOnlyImg={true}
                  textAreaBoxHeight={'600px'}
                />
              </PopupFormType>
            </PopupFormGroup>
          </PopupFormBox>
        </PopupContent>
      </PopupLayout>
      <ConfirmModal
        open={openAddConf}
        title={'저장 하시겠습니까?'}
        confirmText={'저장'}
        onConfirm={() => {
          handleSubmit(onValid, onInvalid)(); // 함수를 반환하므로 다음과 같이, 호출하여야
        }}
        onClose={() => {
          setOpenAddConf(false);
        }}
      />
    </div>
  );
};

export default ProductContentAddPop;
