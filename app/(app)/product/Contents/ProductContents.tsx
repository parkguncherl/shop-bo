'use client';

import React, { useState } from 'react';
import { Title, toastError, toastSuccess } from '../../../../components';
import { useCommonStore } from '../../../../stores';
import { SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '../../../../libs';
import FormEnhancedTextArea, { ContentElement, EnhancedTextAreasMode, FileInfo } from '../../../../components/form/FormEnhancedTextArea';
import FormInput from '../../../../components/form/FormInput';
import { ConfirmModal } from '../../../../components/ConfirmModal';
import { SubmitErrorHandler } from 'react-hook-form/dist/types/form';
import { useProductContentsStore } from '../../../../stores/product/useProductContentsStore';
import { useMutation } from '@tanstack/react-query';
import { Formatter } from '../../../../libs/const';

// todo export
interface ProductContentsFields {
  title: string;
  content: ContentElement[];
}

// todo 사용여부 확인
/** 상품관리 - 상품컨텐츠 페이지 */
const ProductContents = () => {
  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);
  const [modals, openModal, closeModal, insertProductContents] = useProductContentsStore((s) => [s.modals, s.openModal, s.closeModal, s.insertProductContents]);

  /** 로컬 스토어 */
  const [displayMode, setDisplayMode] = useState<EnhancedTextAreasMode>('edit');
  //const [openedModalType, setOpenedModalType] = useState<'SUBMIT' | null>(null);

  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    control._reset();
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

  /** 상품컨텐츠 추가 요청 처리 동작 캐싱 */
  const { mutate: insertProductContentsMutate } = useMutation({
    mutationFn: insertProductContents,
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
          return Formatter.ProductContent.ImgToken(content.fileInfo.file.name);
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
                <FormEnhancedTextArea<ProductContentsFields>
                  control={control}
                  name={'content'}
                  autoSize={{ minRows: 7, maxRows: 40 }}
                  mode={displayMode}
                  attachOnlyImg={true}
                />
              </div>
            </div>
            <div className={'bottom'}>
              <div className={'bottom_boxing'}>
                <div className={'btn-wrapper'}>
                  <div className={'btn-per-wrapper'}>
                    <button
                      className={'btn btnPurple'}
                      onClick={() => {
                        if (errors.content == undefined) {
                          openModal('ADD_CONF');
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
        open={modals.type == 'ADD_CONF' && modals.active}
        title={'저장 하시겠습니까?'}
        confirmText={'저장'}
        onConfirm={() => {
          handleSubmit(onValid, onInvalid)(); // 함수를 반환하므로 다음과 같이, 호출하여야
        }}
        onClose={() => {
          closeModal('ADD_CONF');
        }}
      />
    </div>
  );
};

export default ProductContents;
