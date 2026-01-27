import { BaseTextAreaAtom, BaseTextAreaAtomProps } from './atom/BaseTextAreaAtom';
import { FieldValues, useController } from 'react-hook-form';
import { TControl } from '../types/Control';
import React, { useEffect, useRef, useState } from 'react';
import { BaseInputAtom } from './atom/BaseInputAtom';
import NativeInputAtom from './atom/NativeInputAtom';

export type EnhancedTextAreasMode = 'edit' | 'preview';
type FormEnhancedTextAreaProps<T extends FieldValues> = BaseTextAreaAtomProps &
  TControl<T> & {
    //ref?: React.Ref<HTMLTextAreaElement>;
    //onUploadRequestInterruptOccurred?: (event: UploadRequestInterruptEvent) => Promise<void> | undefined;
    mode?: EnhancedTextAreasMode;
  };
interface ContentElement {
  id: number; // 기본 1부터 시작, 순차적일 필요는 없으나 후행하는 요소의 id는 선행 요소의 id보다 커야 함
  partialContent?: string; // 이미지인 경우 undefined
  fileInfo?: {
    // 이미지(혹은 파일) 한정으로 정의함, 현재는 실 동작 영역에서 이미지 이외 파일에 대하여는 첨부를 제한하는 중
    fileTitle: string;
    fileSrcUrl: string;
  };
}

interface ContentElementInfo extends ContentElement {
  init: boolean; // 추가(마운트) 이후 별도의 편집을 위한 상호작용이 부재한 경우 true
}

/**
 * stateFul 컴포넌트
 * 기존 textArea 와 달리 이미지 삽입 및 이에 따라 필요한 동작 지원
 * */
const FormEnhancedTextArea = <T extends FieldValues>({ control, rules, name, autoSize, mode }: FormEnhancedTextAreaProps<T>) => {
  /** react hook form 의 controller 는 현재 영역에서는 수정 대상 영역의 값(contentElement)에 한정되어 적용함(전역 적용하지 아니함) */
  const {
    field: { value, onChange: controlChange, ref: refForUseController },
    fieldState: { isDirty, isTouched, error },
  } = useController({ name, rules, control });

  const boxRef = useRef<HTMLDivElement>(null);

  /** 해당 지역 상태는 반드시 배열의 불변성을 유지할 것 */
  const [contentElements, setContentElements] = useState<ContentElementInfo[]>([{ id: 1, partialContent: '', init: true }]);
  const [unFrozenElementId, setUnFrozenElementId] = useState<number>(-1); // 최하단 영역 이외 편집 가능한 영역 지정(by Id), -1인 경우 최하단 영역 이외 frozen(편집 가능 속성을 회수)
  const [boxHeight, setBoxHeight] = useState(0);

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

  /** contentElement 정의(구성) 시점에서 필요한 기본값을 설정한 contentElementInfo 타입의 객체 반환  */
  const configAsRefreshedContent = (addedContentElement: ContentElement) => {
    return {
      ...addedContentElement,
      init: true, // 최초 정의 시 init true
    };
  };

  const attachRequestInterruptCallBack = (files: File[], contentElementOnTriggeredArea: ContentElement) => {
    setContentElements((prevState) => {
      const modifiedContentElements: ContentElementInfo[] = [];
      for (let i = 0; i < prevState.length; i++) {
        if (contentElementOnTriggeredArea.id == prevState[i].id) {
          // 대상 영역
          files.forEach((file, fileIndex) => {
            if (fileIndex + 1 == files.length) {
              setUnFrozenElementId(modifiedContentElements.length + 1); // 첨부된 이미지 중 마지막 이미지 unFrozen
            }
            modifiedContentElements.push(
              configAsRefreshedContent({
                id: modifiedContentElements.length + 1,
                fileInfo: {
                  fileTitle: file.name, // 최초로 할당되어지는 제목
                  fileSrcUrl: URL.createObjectURL(file),
                },
              }),
            );
          });

          // 기존 상태 영속을 위한 추가 동작
          modifiedContentElements.push(
            configAsRefreshedContent({
              ...prevState[i],
              id: modifiedContentElements.length + 1,
            }),
          );
        } else {
          // 이외의 경우에는 id 동기화
          modifiedContentElements.push(
            configAsRefreshedContent({
              ...prevState[i],
              id: modifiedContentElements.length + 1,
            }),
          );
        }
      }
      return modifiedContentElements;
    });
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
          contentElements.map((contentElement, index) => {
            if (contentElements.length == index + 1) {
              // 편집 가능(최하단 영역, 이 경우는 입력 영역만이 존재할수 있음, 파일 정보는 존재할수 없음)
              if (contentElement.fileInfo != undefined) {
                console.error('최하단 요소에는 파일 정보가 존재할수 없음, 상태 오염 정정!');
              }
              return (
                <div className={'per_content_element'} key={contentElement.id}>
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
                        if (contentElement.partialContent != undefined && contentElement.partialContent != '') {
                          // 값이 유효한 경우 한정으로만 정의된 동작 실행
                          setContentElements((prevState) => {
                            return [...prevState, configAsRefreshedContent({ id: contentElement.id + 1, partialContent: '' })];
                          });
                        }
                      }
                    }}
                    ref={(node) => {
                      if (unFrozenElementId == -1) {
                        // 최하단 영역 이외에 별도로 편집 가능 상태인 구획이 부재한 경우 한정 트리거
                        node?.focus();
                      }
                    }}
                  />
                </div>
              );
            } else if (contentElement.id == unFrozenElementId) {
              // 편집 가능 영역(상태로 관리되는 element id와 해당 content 의 id가 일치하는 경우)
              return (
                <div className={'per_content_element'} key={contentElement.id}>
                  {contentElement.fileInfo != undefined ? (
                    <div className={'per_img_element unFrozen'}>
                      <div className={'img_wrapper'}>
                        <img src={contentElement.fileInfo.fileSrcUrl} />
                      </div>
                      <div className={'img_title_wrapper'}>
                        <NativeInputAtom value={contentElement.fileInfo.fileTitle} onChange={() => {}} />
                      </div>
                    </div>
                  ) : (
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
                      onKeyDown={(e) => {
                        if (e.key == 'Enter' && e.shiftKey) {
                          e.preventDefault();
                          if (contentElement.partialContent != undefined && contentElement.partialContent != '') {
                            // 값이 유효한 경우 한정으로만 정의된 동작 실행
                            // todo bottomTextArea.current?.focus(); // 최하단 영역으로 포커싱
                          }
                        }
                      }}
                    />
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
                      <div className={'img_wrapper'}>
                        <img src={contentElement.fileInfo.fileSrcUrl} />
                      </div>
                      <div className={'img_title_wrapper'}>
                        <p>{contentElement.fileInfo.fileTitle}</p>
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
          <div
            className={'flex-preview-area'}
            style={{
              height: boxHeight,
            }}
          >
            {contentElements.map((contentElement, index) => {
              return (
                <div className={'per_preview_element'} key={contentElement.id}>
                  {contentElement.fileInfo != undefined ? (
                    <div className={'img_wrapper'}>
                      <img src={contentElement.fileInfo.fileSrcUrl} />
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
