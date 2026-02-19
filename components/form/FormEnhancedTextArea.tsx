import { BaseTextAreaAtom, BaseTextAreaAtomProps } from '../atom/BaseTextAreaAtom';
import { FieldError, FieldValues, useController } from 'react-hook-form';
import { TControl } from '../../types/Control';
import React, { useEffect, useRef, useState } from 'react';
import NativeInputAtom from '../atom/NativeInputAtom';
import { toastError } from '../ToastMessage';

export type EnhancedTextAreasMode = 'edit' | 'preview';
type FormEnhancedTextAreaProps<T extends FieldValues> = BaseTextAreaAtomProps &
  TControl<T> & {
    //ref?: React.Ref<HTMLTextAreaElement>;
    mode?: EnhancedTextAreasMode;
    attachOnlyImg?: boolean;
  };
export interface FileInfo {
  file: File;
  fileSrcUrl?: string; // 이미지 파일 출력을 위하여 브라우저에서 인스턴스화를 통해 생성한 url
  //fileTitle: string;
}
export interface ContentElement {
  id: number; // 기본 1부터 시작, 순차적일 필요는 없으나 후행하는 요소의 id는 선행 요소의 id보다 커야 함
  partialContent?: string; // 이미지인 경우 undefined
  fileInfo?: FileInfo;
}

interface ContentElementInfo extends ContentElement {
  init: boolean; // 추가(마운트) 이후 별도의 편집을 위한 상호작용이 부재한 경우 true
}

// react hook form 관련 커스텀 인터페이스
interface FieldErrorForContentElement {
  id?: FieldError | undefined;
  partialContent?: FieldError | undefined;
  fileInfo?: FieldErrorForFileInfo;
}
interface FieldErrorForFileInfo {
  //fileTitle: FieldError | undefined;
  fileSrcUrl: FieldError | undefined;
}

/**
 * stateFul 컴포넌트
 * 기존 textArea 와 달리 이미지 삽입 및 이에 따라 필요한 동작 지원
 * RHF 구독 하에서의 함수 컴포넌트 재평가에 따른 부수 효과 방지하도록 랜더링이 아닌 state, 이에 따른 hook trigger 에 의존토록 함
 * */
const FormEnhancedTextArea = <T extends FieldValues>({ control, rules, name, autoSize, mode, attachOnlyImg = true }: FormEnhancedTextAreaProps<T>) => {
  /** react hook form 의 controller 는 현재 영역에서는 수정 대상 영역의 값(contentElement)에 한정되어 적용함(전역 적용하지 아니함) */
  const {
    field: { value: value, onChange: controlChange },
    fieldState: { error },
  } = useController<T>({ name, rules, control });

  const boxRef = useRef<HTMLDivElement>(null);
  const bottomTextArea = useRef<HTMLTextAreaElement | null>(null);

  /** 해당 지역 상태는 반드시 배열의 불변성을 유지할 것 */
  const [contentElements, setContentElements] = useState<ContentElementInfo[]>([{ id: 1, partialContent: '', init: true }]);
  const [unFrozenElementId, setUnFrozenElementId] = useState<number>(-1); // 최하단 영역 이외 편집 가능한 영역 지정(by Id), -1인 경우 최하단 영역 이외 frozen(편집 가능 속성을 회수)
  const [boxHeight, setBoxHeight] = useState(0);

  const [innerErrorState, setInnerErrorState] = useState<FieldErrorForContentElement[]>([]); // contentElements 의 순서와 대응되므로, 배열 index 기준으로 error가 발생한 contentElement 를 찾을 수 있음

  useEffect(() => {
    // 컨텐츠 박스 높이에 따른 state 동기화를 위한 ResizeObserver 인스턴스 생성 및 등록, 추후 반환까지 생명주기 지정
    if (!boxRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      setBoxHeight(entry.contentRect.height);
    });
    observer.observe(boxRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (value == undefined) {
      setContentElements([{ id: 1, partialContent: '', init: true }]); // 외부 컨트롤 영역 초기화 동작에 대응
    }
  }, [value]);

  useEffect(() => {
    if (unFrozenElementId == -1) {
      // 최하단 영역 이외에 별도로 편집 가능 상태인 구획이 부재한 경우 한정 트리거
      bottomTextArea.current?.focus();
    }
  }, [unFrozenElementId, contentElements]);

  useEffect(() => {
    setContentElements((prevContentElements) => {
      return prevContentElements.map((prevContentElement) => {
        if (prevContentElement.id == unFrozenElementId && prevContentElement.init) {
          return {
            ...prevContentElement,
            init: false, // 상호작용이 최초로 일어난 경우 init false, 이후 기존에 랜더링되어진 레거시 상태로 취급
          };
        } else {
          return prevContentElement;
        }
      });
    });
  }, [unFrozenElementId]);

  useEffect(() => {
    controlChange(contentElements); // react hook form 과 동기화
  }, [contentElements]);

  useEffect(() => {
    if (Array.isArray(error)) {
      const errorStat = (error || []) as FieldErrorForContentElement[];
      const availableErrStat = [];
      for (let i = 0; i < errorStat.length; i++) {
        if (!(i in errorStat)) {
          availableErrStat.push({});
        } else {
          availableErrStat.push(errorStat[i]);
        }
      }
      setInnerErrorState(availableErrStat);
    } else {
      if (error?.message) {
        toastError(error?.message); // 주로 이미지명 중복 상황에서 트리거되리라 기대
      }
    }
  }, [error]);

  /** contentElement 정의(구성) 시점에서 필요한 기본값을 설정한 contentElementInfo 타입의 객체 반환, */
  const configForInitContent = (addedContentElement: ContentElement) => {
    return {
      ...addedContentElement,
      init: true, // 최초 정의 시 init true
    };
  };

  // 이미지 제목의 고유성을 보장하는 함수
  // const uniquenessEnsuredTitle = (passedTitle: string): string => {
  //   const duplicatedTitleExist = contentElements.filter((element) => element.fileInfo && element.fileInfo.fileTitle == passedTitle).length > 0;
  //   if (duplicatedTitleExist) {
  //     for (let i = 0; i < 100; i++) {
  //       const candidateTitle = `${passedTitle} (${i})`;
  //       const duplicatedTitleWithCandidateExist =
  //         contentElements.filter((element) => element.fileInfo && element.fileInfo.fileTitle == candidateTitle).length > 0;
  //       if (!duplicatedTitleWithCandidateExist) {
  //         return candidateTitle;
  //       }
  //     }
  //     return ''; // 비정상 상황
  //   } else {
  //     return passedTitle;
  //   }
  // };

  const attachRequestInterruptCallBack = (files: File[], contentElementOnTriggeredArea: ContentElement) => {
    if (attachOnlyImg && files.filter((file) => !file.type.startsWith('image/')).length > 0) {
      toastError('이미지 파일이 아닌 경우 첨부할수 없습니다.');
      return;
    } else {
      setContentElements((prevState) => {
        const modifiedContentElements: ContentElementInfo[] = [];
        for (let i = 0; i < prevState.length; i++) {
          if (contentElementOnTriggeredArea.id == prevState[i].id) {
            // 대상 영역
            files.forEach((file) => {
              modifiedContentElements.push(
                configForInitContent({
                  id: modifiedContentElements.length + 1,
                  fileInfo: {
                    file: file,
                    //fileTitle: uniquenessEnsuredTitle(file.name), // 최초로 할당되어지는 제목
                    fileSrcUrl: URL.createObjectURL(file),
                  } as FileInfo,
                }),
              );
            });

            // 기존 상태 영속을 위한 추가 동작
            modifiedContentElements.push({
              ...prevState[i],
              id: modifiedContentElements.length + 1,
            });
            setUnFrozenElementId(i == prevState.length - 1 ? -1 : modifiedContentElements.length); // 최하단 영역에서의 이벤트인 경우(i == prevState.length - 1 이 true) -1, 이외 id에 해당하는 값(바로 위에서 push 동작이 이루어진 관계로 modifiedContentElements.length) 할당
          } else {
            // 이외의 경우에는 id 동기화
            modifiedContentElements.push({
              ...prevState[i],
              id: modifiedContentElements.length + 1,
            });
          }
        }
        return modifiedContentElements;
      });
    }
  };

  // 드롭 이벤트
  const onDropEventHandler = (e: React.DragEvent<HTMLTextAreaElement>, contentElementOnTriggeredArea: ContentElement) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length != 0) {
      // 파일을 드롭한 경우 별도 콜백으로 처리하여 동작의 일관성 및 상태의 오염 방지
      e.preventDefault();
      e.stopPropagation();
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        attachRequestInterruptCallBack(droppedFiles, contentElementOnTriggeredArea);
      }
    }
  };

  // 붙여넣기 이벤트
  const onPasteEventHandler = (e: React.ClipboardEvent<HTMLTextAreaElement>, contentElementOnTriggeredArea: ContentElement) => {
    if (e.clipboardData.files && e.clipboardData.files.length != 0) {
      // 파일을 붙여넣기한 경우 별도 콜백으로 처리하여 동작의 일관성 및 상태의 오염 방지
      e.preventDefault();
      e.stopPropagation();
      const pastedFiles = Array.from(e.clipboardData.files);
      if (pastedFiles.length > 0) {
        attachRequestInterruptCallBack(pastedFiles, contentElementOnTriggeredArea);
      }
    }
  };

  /**
   * 이미지 붙여넣기, 드롭 동작 발생 시 기존 textArea freeze 및 상태 저장, 이미지 영역 하단에 이후 신규 textArea 활성화
   * */
  return (
    <div className={'enhanced_textArea'}>
      <div className={'enhanced_textArea_box'} ref={boxRef}>
        {!mode || mode == 'edit' ? (
          // 편집 모드
          contentElements.map((contentElement, index) => {
            const partialContentErrorExist = innerErrorState[index]?.partialContent != undefined;
            const fileErrorExist = innerErrorState[index]?.fileInfo != undefined;
            if (contentElements.length == index + 1) {
              // 편집 가능(최하단 영역, 이 경우는 입력 영역만이 존재할수 있음, 파일 정보는 존재할수 없음)
              if (contentElement.fileInfo != undefined) {
                console.error('최하단 요소에는 파일 정보가 존재할수 없음, 상태 오염 정정!');
              }
              const partialContentErrorExist = innerErrorState[index]?.partialContent != undefined;
              return (
                <div className={'per_content_element'} key={contentElement.id}>
                  <div className={'per_textArea_element'}>
                    <div className={'textArea_wrapper'}>
                      <BaseTextAreaAtom
                        value={contentElement.partialContent}
                        type={'text'}
                        onChange={(e) => {
                          setContentElements((prevState) => {
                            return prevState.map((prev) => {
                              if (prev.id == contentElement.id) {
                                return {
                                  ...prev,
                                  partialContent: e.target.value,
                                  init: prev.init ? false : prev.init, // 최초 상호작용이 발생한 경우 init 속성 무효화
                                };
                              } else {
                                return prev;
                              }
                            });
                          });
                        }}
                        onDrop={(e) => onDropEventHandler(e, contentElement)}
                        onPaste={(e) => onPasteEventHandler(e, contentElement)}
                        autoSize={autoSize}
                        onFocus={() => {
                          setUnFrozenElementId(-1);
                        }}
                        onKeyDown={(e) => {
                          if (e.key == 'Enter' && e.shiftKey) {
                            e.preventDefault();
                            if (contentElement.partialContent != undefined && contentElement.partialContent.trim() != '') {
                              // 값이 유효한 경우 한정으로만 정의된 동작 실행
                              setContentElements((prevState) => {
                                return [...prevState, configForInitContent({ id: contentElement.id + 1, partialContent: '' })];
                              });
                            }
                          }
                        }}
                        ref={bottomTextArea}
                      />
                    </div>
                    <div className={`err_msg_wrapper ${partialContentErrorExist ? 'error' : 'non'}`}>
                      <p>{innerErrorState[index]?.partialContent?.message}</p>
                    </div>
                  </div>
                </div>
              );
            } else if (contentElement.id == unFrozenElementId) {
              // 편집 가능 영역(상태로 관리되는 element id와 해당 content 의 id가 일치하는 경우)
              return (
                <div className={'per_content_element'} key={contentElement.id}>
                  {contentElement.fileInfo != undefined ? (
                    <div className={'per_img_element unFrozen'}>
                      {fileErrorExist && innerErrorState[index]?.fileInfo?.fileSrcUrl?.message ? (
                        <div className={'err_msg_wrapper'}>
                          <p>{innerErrorState[index]?.fileInfo?.fileSrcUrl?.message}</p>
                        </div>
                      ) : (
                        <div className={'img_wrapper'}>
                          <img src={contentElement.fileInfo.fileSrcUrl} />
                        </div>
                      )}
                      <div className={'img_title_wrapper'}>
                        <NativeInputAtom
                          value={contentElement.fileInfo.file.name}
                          readOnly={true}
                          // onChange={(event) => {
                          //   setContentElements((contentElements) => {
                          //     const modifiedContentElements: ContentElementInfo[] = []; // 배열 불변성 유지
                          //     for (let i = 0; i < contentElements.length; i++) {
                          //       if (contentElements[i].id == contentElement.id) {
                          //         modifiedContentElements.push({
                          //           ...contentElements[i],
                          //           fileInfo: contentElements[i].fileInfo
                          //             ? ({
                          //                 ...(contentElements[i].fileInfo as FileInfo),
                          //                 fileTitle: event.target.value || '', // fileTitle 동기화
                          //               } as FileInfo)
                          //             : undefined,
                          //         });
                          //       } else {
                          //         modifiedContentElements.push(contentElements[i]);
                          //       }
                          //     }
                          //     return modifiedContentElements;
                          //   });
                          // }}
                          // placeholder={fileErrorExist ? innerErrorState[index]?.fileInfo?.fileTitle?.message : undefined}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className={'per_textArea_element'}>
                      <div className={'textArea_wrapper'}>
                        <BaseTextAreaAtom
                          value={contentElement.partialContent}
                          type={'text'}
                          onChange={(e) => {
                            if (e.target.value.trim() == '') {
                              // 이 경우 해당 요소 del
                              setContentElements((prevState) => {
                                return [...prevState.filter((prev) => prev.id != contentElement.id)];
                              });
                              bottomTextArea.current?.focus(); // 최하단 영역으로 포커싱
                            } else {
                              setContentElements((prevState) => {
                                return prevState.map((prev) => {
                                  if (prev.id == contentElement.id) {
                                    return {
                                      ...prev,
                                      partialContent: e.target.value,
                                      init: prev.init ? false : prev.init, // 최초 상호작용이 발생한 경우 init 속성 무효화
                                    };
                                  } else {
                                    return prev;
                                  }
                                });
                              });
                            }
                          }}
                          onDrop={(e) => onDropEventHandler(e, contentElement)}
                          onPaste={(e) => onPasteEventHandler(e, contentElement)}
                          autoSize={autoSize}
                          onKeyDown={(e) => {
                            if (e.key == 'Enter' && e.shiftKey) {
                              e.preventDefault();
                              if (contentElement.partialContent != undefined && contentElement.partialContent != '') {
                                // 값이 유효한 경우 한정으로만 정의된 동작 실행
                                bottomTextArea.current?.focus(); // 최하단 영역으로 포커싱
                              }
                            }
                          }}
                          ref={(node) => {
                            node?.focus(); // unFrozenElementId 의 변경으로 인한 랜더링으로 간주함이 마땅하므로 focus
                          }}
                        />
                      </div>
                      <div className={`err_msg_wrapper ${partialContentErrorExist ? 'error' : 'non'}`}>
                        <p>{innerErrorState[index]?.partialContent?.message}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            } else {
              // 편집 제한
              return (
                <div className={'per_content_element'} key={contentElement.id}>
                  {contentElement.fileInfo != undefined ? (
                    <div
                      className={`per_img_element ${contentElement.init ? '' : 'frozen'}`}
                      onClick={() => {
                        setUnFrozenElementId(contentElement.id);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.classList.add('hovered');
                        e.currentTarget.classList.remove('leaved');
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.classList.remove('hovered');
                        e.currentTarget.classList.add('leaved');
                      }}
                    >
                      {fileErrorExist && innerErrorState[index]?.fileInfo?.fileSrcUrl?.message ? (
                        <div className={'err_msg_wrapper'}>
                          <p>{innerErrorState[index]?.fileInfo?.fileSrcUrl?.message}</p>
                        </div>
                      ) : (
                        <div className={'img_wrapper'}>
                          <img src={contentElement.fileInfo.fileSrcUrl} />
                        </div>
                      )}
                      <div className={'img_title_wrapper'}>
                        <NativeInputAtom
                          value={contentElement.fileInfo.file.name}
                          readOnly={true}
                          //placeholder={fileErrorExist ? innerErrorState[index]?.fileInfo?.fileTitle?.message : undefined}
                        />
                      </div>
                    </div>
                  ) : (
                    <BaseTextAreaAtom
                      value={contentElement.partialContent}
                      type={'text'}
                      readOnly={true}
                      onFocus={() => {
                        setUnFrozenElementId(contentElement.id); // 해당 영역 unFrozen(편집 가능)
                      }}
                      autoSize={autoSize}
                    />
                  )}
                </div>
              );
            }
          })
        ) : (
          // 미리보기
          <div
            className={'flex-preview-area'}
            style={{
              height: boxHeight,
            }}
          >
            {contentElements.map((contentElement) => {
              return (
                <div className={'per_preview_element'} key={contentElement.id}>
                  {contentElement.fileInfo != undefined ? (
                    <div className={'per_img_element'}>
                      <div className={'img_wrapper'}>
                        <img src={contentElement.fileInfo.fileSrcUrl} />
                      </div>
                      <div className={'img_title_wrapper'}>
                        <p>{contentElement.fileInfo.file.name}</p>
                      </div>
                    </div>
                  ) : (
                    <div className={'text_wrapper'}>
                      <p>{contentElement.partialContent}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormEnhancedTextArea;
