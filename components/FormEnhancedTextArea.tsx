import { BaseTextAreaAtom, BaseTextAreaAtomProps } from './atom/BaseTextAreaAtom';
import { FieldValues, useController } from 'react-hook-form';
import { TControl } from '../types/Control';
import React, { useEffect, useState } from 'react';

type FormEnhancedTextAreaProps<T extends FieldValues> = BaseTextAreaAtomProps &
  TControl<T> & {
    //ref?: React.Ref<HTMLTextAreaElement>;
    //onUploadRequestInterruptOccurred?: (event: UploadRequestInterruptEvent) => Promise<void> | undefined;
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
  mounted?: boolean; // 스타일, 특히나 마운팅 시점의 애니메이션 동작 통제를 위한 속성
}

interface ToNextParagraphReq {
  currentElementInfo: ContentElementInfo;
}

/**
 * stateFul 컴포넌트
 * 기존 textArea 와 달리 이미지 삽입 및 이에 따라 필요한 동작 지원
 * */
const FormEnhancedTextArea = <T extends FieldValues>({ control, rules, name, autoSize }: FormEnhancedTextAreaProps<T>) => {
  /** react hook form 의 controller 는 현재 영역에서는 수정 대상 영역의 값(contentElement)에 한정되어 적용함(전역 적용하지 아니함) */
  const {
    field: { value, onChange: controlChange, ref: refForUseController },
    fieldState: { isDirty, isTouched, error },
  } = useController({ name, rules, control });

  /** 해당 지역 상태는 반드시 배열의 불변성을 유지할 것 */
  const [contentElements, setContentElements] = useState<ContentElementInfo[]>([{ id: 1, partialContent: '' }]);
  const [unFrozenElementId, setUnFrozenElementId] = useState<number>(-1);

  const moveToNextParagraphReqCallback = (request: ToNextParagraphReq) => {
    setContentElements((prevState) => {
      return [...prevState, { id: request.currentElementInfo.id + 1, partialContent: '' }];
    });
  };

  const attachRequestInterruptCallBack = (files: File[], contentElementOnTriggeredArea: ContentElement) => {
    setContentElements((prevState) => {
      if (prevState[prevState.length - 1].id == contentElementOnTriggeredArea.id) {
        // 가장 마지막 입력 영역에서 첨부 동작 발생할 시
        const pushedContentElements = [...prevState];
        files.forEach((file, index) => {
          pushedContentElements[pushedContentElements.length - 1 + index] = {
            id: pushedContentElements[pushedContentElements.length - 1].id + index, // 최초 파일 한정 id 보존, 이후 순차 증가된 값 할당
            fileInfo: {
              fileTitle: file.name, // 최초로 할당되어지는 제목
              fileSrcUrl: URL.createObjectURL(file),
            },
          };
        });
        return [...pushedContentElements, { id: pushedContentElements[pushedContentElements.length - 1].id + 1, partialContent: '' }];
      } else {
        // 중간 영역에서 첨부 동작 발생한 경우
        const splicedContentElements = [...prevState];
        for (let i = 0; i < prevState.length; i++) {
          if (contentElementOnTriggeredArea.id == prevState[i].id) {
            // 대상 영역
            files.forEach((file, index) => {
              splicedContentElements.splice(i + index, 0, {
                id: contentElementOnTriggeredArea.id + (index + 1),
                fileInfo: {
                  fileTitle: `미정 ${contentElementOnTriggeredArea.id + (index + 1)}`,
                  fileSrcUrl: URL.createObjectURL(file),
                },
              });
            });
          } else if (prevState[i].id > contentElementOnTriggeredArea.id) {
            // 대상 영역 이후
            splicedContentElements[i + files.length] = {
              ...splicedContentElements[i + files.length],
              id: prevState[i].id + files.length,
            };
          }
        }
        return splicedContentElements;
      }
    });
  };

  // 드롭 이벤트
  const onDropEventHandler = (e: React.DragEvent<HTMLTextAreaElement>, contentElementOnTriggeredArea: ContentElement) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length != 0) {
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
      <div className={'formBox'}>
        {contentElements.map((contentElement, index) => {
          if (contentElements.length == index + 1 || contentElement.id == unFrozenElementId) {
            // 최하단 영역, 혹은 상태로 관리되는 element id와 해당 content 의 id가 일치하는 경우
            return (
              <div className={'per_content_element'} key={contentElement.id}>
                {contentElement.fileInfo != undefined ? (
                  <div className={'img_wrapper unFrozen'}>
                    <img src={contentElement.fileInfo.fileSrcUrl} />
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
                      if (e.key == 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (contentElement.partialContent != undefined && contentElement.partialContent != '') {
                          // 값이 유효한 경우 한정으로만 정의된 동작 실행
                          setContentElements((prevState) => {
                            return [...prevState, { id: contentElement.id + 1, partialContent: '' }];
                          });
                        }
                      }
                    }}
                    ref={(node) => {
                      if (contentElements.length == index + 1 && unFrozenElementId == -1) {
                        // 최하단 영역 마운트 한정 포커싱, 단 이 경우 해당 영역 이외 활성화된 요소가 부재하여야
                        node?.focus();
                      }
                    }}
                  />
                )}
              </div>
            );
          } else {
            // frozen(편집 제한)
            return (
              <div className={'per_content_element'} key={contentElement.id}>
                {contentElement.fileInfo != undefined ? (
                  <div
                    className={'img_wrapper frozen'}
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
                    {/*<p>{contentElement.fileInfo.fileTitle}</p>*/}
                    <img src={contentElement.fileInfo.fileSrcUrl} />
                  </div>
                ) : (
                  <BaseTextAreaAtom
                    value={contentElement.partialContent}
                    type={'text'}
                    readOnly={true}
                    onFocus={() => {
                      setUnFrozenElementId(contentElement.id);
                    }}
                  />
                )}
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};

export default FormEnhancedTextArea;
