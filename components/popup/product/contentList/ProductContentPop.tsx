import React, { useEffect, useReducer, useState } from 'react';
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
import { toastError, toastSuccess } from '../../../ToastMessage';
import { Formatter, RegExpression } from '../../../../libs/const';
import { ConfirmModal } from '../../../ConfirmModal';
import FormCombineParagraphs, { ContentElement, EnhancedTextAreasMode, FileInfo } from '../../../form/FormCombineParagraphs';
import { useProductContentListStore } from '../../../../stores/product/useProductContentListStore';
import { ProductContentListResponseProductContent } from '../../../../generated';
import { useCommonStore } from '../../../../stores';

interface ProductContentShowPopProps {
  open: boolean;
  onClose: (closeRes?: 'success') => void;
  mode?: 'ADD' | 'MOD' | 'SHOW';
  productContentData?: ProductContentListResponseProductContent;
}

type FileInfoWithFileObj = FileInfo & Required<Pick<FileInfo, 'file'>>;
type FileInfoWithFileDetId = Omit<FileInfo & Required<Pick<FileInfo, 'detId'>>, 'file'>;

interface DisplayMode {
  holdByPreview: boolean;
  innerDisplayMode: EnhancedTextAreasMode;
}
type DisplayModeAction =
  | {
      type: 'sync_holdenByPreviewMod';
      payload: {
        holdByPreview: boolean;
      };
    }
  | {
      type: 'sync_onInnerDisplayMode';
      payload: {
        innerDisplayMode: EnhancedTextAreasMode;
      };
    };

function DisplayModeManagementReducerFn(state: DisplayMode, action: DisplayModeAction): DisplayMode {
  if (action.type == 'sync_holdenByPreviewMod') {
    return {
      ...state,
      holdByPreview: action.payload.holdByPreview,
      innerDisplayMode: action.payload.holdByPreview ? 'preview' : 'edit',
    };
  }

  if (action.type == 'sync_onInnerDisplayMode') {
    if (!state.holdByPreview) {
      // sync_holdByPreviewMod 에 의하여 잠기지 아니한 경우에만 디스패칭 유효
      return {
        ...state,
        innerDisplayMode: action.payload.innerDisplayMode,
      };
    }
    return state;
  }

  return state;
}

/**
 * components/popup/product/contentList/ProductContentPop.tsx
 * desc: 품목컨텐츠 관련 동작 수행 팝업
 * Date: 2026/05/07
 * Author: park junsung
 * */
const ProductContentPop = ({ open, onClose, mode = 'ADD', productContentData }: ProductContentShowPopProps) => {
  /** 공통 스토어 - State */
  const [getFileUrl, selectFileList] = useCommonStore((s) => [s.getFileUrl, s.selectFileList]);
  const [insertProductContents, updateProductContents] = useProductContentListStore((s) => [s.insertProductContents, s.updateProductContents]);

  const [displayModeStatus, dispatchDisplayModeStatus] = useReducer(DisplayModeManagementReducerFn, {
    holdByPreview: false,
    innerDisplayMode: 'edit',
  });

  /** 팝업 내부 local state */
  const [openConf, setOpenConf] = useState(false);

  /** 품목 내용 입력 서식 */
  const {
    handleSubmit,
    control,
    getValues,
    setValue,
    reset,
    //formState: { errors, isValid },
  } = useForm<ProductContentsFields>({
    resolver: yupResolver(YupSchema.ProductContentsRequest()),
    mode: 'onChange',
  });

  /** 품목컨텐츠 추가 요청 처리 동작 캐싱 */
  const { mutate: insertProductContentsMutate } = useMutation({
    mutationFn: insertProductContents,
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

  /** 품목컨텐츠 수정 요청 처리 동작 캐싱 */
  const { mutate: updateProductContentsMutate } = useMutation({
    mutationFn: updateProductContents,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('수정되었습니다.');
          onClose('success');
        } else {
          toastError(`컨텐츠 수정 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  // productContentData 전달에 따른 form 동기화
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
                id: contentElements.length + 1,
                partialContent: newsContent, // 이미지 토큰(미포함 시 추후 업데이트 시점에 컨텐츠에 이미지 토큰이 부재하여 수정 결과에서 이미지가 랜더링되지 않음)
                fileInfo: {
                  detId: correspondedFileDet[0].id,
                  fileSrcUrl: await getFileUrl(correspondedFileDet[0].sysFileNm),
                },
              });

              if (index == splittedNewsContents.length - 1) {
                // editing 시점에 최하단 요소에 이미지가 등장하는 걸 방지
                contentElements.push({
                  id: contentElements.length + 1,
                  partialContent: '',
                  fileInfo: undefined,
                });
              }
            } else {
              contentElements.push({
                id: contentElements.length + 1,
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

  useEffect(() => {
    if (mode == 'SHOW') {
      dispatchDisplayModeStatus({
        type: 'sync_holdenByPreviewMod',
        payload: {
          holdByPreview: true,
        },
      });
    } else {
      if (displayModeStatus.holdByPreview) {
        dispatchDisplayModeStatus({
          type: 'sync_holdenByPreviewMod',
          payload: {
            holdByPreview: false, // unFreeze
          },
        });
      }
      dispatchDisplayModeStatus({
        type: 'sync_onInnerDisplayMode',
        payload: {
          innerDisplayMode: 'edit', // show 이외에는 편집 모드
        },
      });
    }
  }, [mode]);

  useEffect(() => {
    if (open) {
      // 열림 시점 초기화
    } else {
      // 정리 동작(초기화 등)
      reset(); // 닫힘 시점에 form 정리
    }
  }, [open]);

  // 입력이 유효한 경우
  // 컨텐츠로서 저장하는 내용은 내용 영역에서 파일 제목, 문단 단위 절삭을 위한 정보를 포함하도록 한다.
  // 줄바꿈(\n) 기준으로 문단 분기, 파일(이미지)명(<<IMG|image_title>>) 뒤에는 반드시 이를(캐리지 리턴) 첨부
  const onValid: SubmitHandler<ProductContentsFields> = (data, event) => {
    const fileInfoList: FileInfo[] = [...data.content.filter((content) => content.fileInfo != undefined).map((content) => content.fileInfo as FileInfo)]; // fileInfo 목록
    const fileInfoWithFileObjList: FileInfoWithFileObj[] = [...(fileInfoList.filter((content) => content.file != undefined) as FileInfoWithFileObj[])]; // file 객체가 존재하는 file 정보만을 추출
    const fileInfoWithFileDetIdList: FileInfoWithFileDetId[] = [...(fileInfoList.filter((content) => content.detId) as FileInfoWithFileDetId[])]; // detId가 존재하는(기존 파일) 객체만을 추출

    const uniqueFileList: File[] = Array.from(
      new Map(fileInfoWithFileObjList.map((fileInfo) => [(fileInfo.file as File).name, fileInfo.file as File])).values(),
    ); // fileInfoWithFileObjList 에서 이름 기준 고유한 요소들로 이루어진 배열
    const fileInfoIncludedContentList = data.content
      .map((content) => {
        if (content.fileInfo && content.fileInfo.file && content.fileInfo.file.name) {
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

    if (mode == 'ADD') {
      insertProductContentsMutate({
        newsTitle: data.title,
        newsSubTitle: data.title, // 현재는 newsTitle 과 동일한 값을 사용하나 추후 요청이 들어올 경우 수정
        newsContents: joinedFileInfoIncludedContent,
        commonRequestFileUploads:
          uniqueFileList.length == 0
            ? undefined
            : {
                uploadFiles: uniqueFileList,
              },
      });
    } else if (mode == 'MOD') {
      if (productContentData != undefined && productContentData.id) {
        updateProductContentsMutate({
          id: productContentData.id,
          newsTitle: data.title,
          newsSubTitle: data.title, // 현재는 newsTitle 과 동일한 값을 사용하나 추후 요청이 들어올 경우 수정
          newsContents: joinedFileInfoIncludedContent,
          updateProductContentsFileInfos: {
            fileId: productContentData.fileId,
            uploadFiles: uniqueFileList,
            preservedFileDetIdList: fileInfoWithFileDetIdList.map((fileInfoWithFileDetId) => fileInfoWithFileDetId.detId),
          },
        });

        // console.log('fileInfoWithFileObjList: ', fileInfoWithFileObjList);
        // console.log('fileInfoWithFileDetIdList: ', fileInfoWithFileDetIdList);

        // console.log({
        //   id: productContentData.id,
        //   newsTitle: data.title,
        //   newsSubTitle: data.title, // 현재는 newsTitle 과 동일한 값을 사용하나 추후 요청이 들어올 경우 수정
        //   newsContents: joinedFileInfoIncludedContent,
        //   updateProductContentsFileInfos: {
        //     fileId: productContentData.fileId,
        //     uploadFiles: uniqueFileList,
        //     preservedFileDetIdList: fileInfoWithFileDetIdList.map((fileInfoWithFileDetId) => fileInfoWithFileDetId.detId),
        //   },
        // });
      } else {
        console.error('유효한 상품컨텐츠 정보 혹은 식별자를 발견하지 못함');
      }
    }
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
        height={1000}
        open={open}
        isEscClose={true}
        title={mode == 'ADD' ? '품목컨텐츠 추가' : mode == 'MOD' ? '품목컨텐츠 수정' : '품목컨텐츠 미리보기'}
        onClose={onClose}
        footer={
          <PopupFooter>
            <div className="btnArea between">
              <div className="left">
                <button
                  className={mode == 'SHOW' ? 'btn' : 'btn btn_blue'}
                  onClick={() => {
                    const title = getValues('title');
                    const content = getValues('content');

                    if (title == '' || content[0].partialContent == '') {
                      toastError(title == '' ? '제목은 반드시 입력하셔야 합니다.' : '어떠한 내용도 없이 저장 혹은 수정할 수 없습니다.');
                      return;
                    }
                    setOpenConf(true);
                  }}
                  disabled={mode == 'SHOW'}
                >
                  {mode == 'ADD' ? '저장' : mode == 'MOD' ? '수정' : '미리보기'}
                </button>
                <button
                  type={'button'}
                  className={'btn'}
                  onClick={() => {
                    // if (displayMode != 'preview') {
                    //   //setDisplayMode('preview');
                    // } else {
                    //   //setDisplayMode('edit');
                    // }
                    dispatchDisplayModeStatus({
                      type: 'sync_onInnerDisplayMode',
                      payload: {
                        innerDisplayMode: displayModeStatus.innerDisplayMode != 'preview' ? 'preview' : 'edit',
                      },
                    });
                  }}
                >
                  {displayModeStatus.innerDisplayMode == 'edit' ? '미리보기' : '편집'}
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
                <FormInput<ProductContentsFields>
                  control={control}
                  name={'title'}
                  label={'제목'}
                  inputType={'label'}
                  placeholder={'제목'}
                  disable={mode == 'SHOW'}
                />
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <FormCombineParagraphs<ProductContentsFields>
                  control={control}
                  name={'content'}
                  autoSize={{ minRows: 7, maxRows: 40 }}
                  mode={displayModeStatus.innerDisplayMode}
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
        open={openConf}
        title={mode == 'ADD' ? '저장 하시겠습니까?' : '수정 하시겠습니까?'}
        confirmText={mode == 'ADD' ? '저장' : '수정'}
        onConfirm={() => {
          handleSubmit(onValid, onInvalid)(); // 함수를 반환하므로 다음과 같이, 호출하여야
        }}
        onClose={() => {
          setOpenConf(false);
        }}
      />
    </div>
  );
};

export default ProductContentPop;
