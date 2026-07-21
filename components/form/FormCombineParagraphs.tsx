import { BaseTextAreaAtom, BaseTextAreaAtomProps } from '@/components/atom/BaseTextAreaAtom';
import { Control, FieldError, FieldPathByValue, FieldValues, PathValue, useController } from 'react-hook-form';
import React, { useEffect, useReducer, useRef, useState } from 'react';
import { toastError } from '@/components';
import { EnhancedTextAreasMode, FileInfo, ContentElement } from './formContentTypes';
export type { EnhancedTextAreasMode, FileInfo, ContentElement };

type FormEnhancedTextAreaProps<TForm extends FieldValues> = {
  control: Control<TForm>;
  name: FieldPathByValue<TForm, ContentElement[]>;
  label?: string;
  mode?: EnhancedTextAreasMode;
  attachOnlyImg?: boolean;
  inputType?: 'label' | 'single';
  dtWidth?: string;
  textAreaBoxHeight?: string;
  autoSize?: unknown;
};

interface PerContentStatus {
  id: number;
  init: boolean; // true 인 경우 최초 생성 후 상호작용 부재
}

// react hook form 관련 커스텀 인터페이스
interface FieldErrorForContentElement {
  id?: FieldError | undefined;
  partialContent?: FieldError | undefined;
  fileInfo?: FieldErrorForFileInfo;
}
interface FieldErrorForFileInfo {
  fileSrcUrl: FieldError | undefined;
}

// contentElementStatusReducer 내부 인터페이스
interface ContentElementStatusState {
  unFrozenElementId: number;
  perContentStatusList: PerContentStatus[];
}
interface ContentElementStatusAction {
  type: 'focus' | 'syncWithRhf' | 'flipInitToFalse'; // 각각 포커스 대상 변경, 추적 대상 rhf value 요소 동기화, init 상태 해제
  payload: {
    id?: number;
    value?: ContentElement[];
  }; // {key: value} 꼴로 요구되는 값 전달
}

/** 컨텐츠 요소 상태 관리 리듀서 */
function contentElementStatusReducer(state: ContentElementStatusState, action: ContentElementStatusAction): ContentElementStatusState {
  if (action.type == 'focus') {
    if (isNaN(Number(action.payload.id))) {
      console.error('dispatch 시점에 요청한 동작에서 요구하는 데이터가 적절히 전달되지 못함');
      return state; // default
    }

    const targetId = action.payload.id as number;

    return {
      ...state,
      unFrozenElementId: targetId,

      // 포커싱 동작에 따른 content status(init) 동기화
      perContentStatusList: state.perContentStatusList.map((prevContentElement) => {
        if (prevContentElement.id == targetId && prevContentElement.init) {
          return {
            ...prevContentElement,
            init: false, // 상호작용이 최초로 일어난 경우 init false, 이후 기존에 랜더링되어진 레거시 상태로 취급
          };
        }
        return prevContentElement;
      }),
    };
  } else if (action.type == 'syncWithRhf') {
    if (!Array.isArray(action.payload.value)) {
      console.error('dispatch 시점에 요청한 동작에서 요구하는 데이터가 적절히 전달되지 못함');
      return state; // default
    }

    const contentValues = action.payload.value as ContentElement[];

    if (contentValues.length > state.perContentStatusList.length) {
      // 기존 State가 포함하지 않는 value 에 대응하는 state element 추가
      const notIncluded: ContentElement = contentValues.filter((val: ContentElement) => !state.perContentStatusList.map((prev) => prev.id).includes(val.id))[0];
      return {
        ...state,
        perContentStatusList: [
          ...state.perContentStatusList,
          {
            id: notIncluded.id,
            init: true, // 최초 정의 시 init true (상호작용 이전 상태)
          },
        ],
      };
    } else if (contentValues.length < state.perContentStatusList.length) {
      // 제거된 value 에 대응하는 state element 제거
      return {
        ...state,
        perContentStatusList: state.perContentStatusList.filter((prev) => contentValues.filter((val: ContentElement) => val.id == prev.id).length == 1),
      };
    } else {
      return state; // default
    }
  } else if (action.type == 'flipInitToFalse') {
    if (isNaN(Number(action.payload.id))) {
      console.error('dispatch 시점에 요청한 동작에서 요구하는 데이터가 적절히 전달되지 못함');
      return state; // default
    }

    const targetId = action.payload.id as number;

    return {
      ...state,
      perContentStatusList: state.perContentStatusList.map((prev) => {
        if (prev.id == targetId) {
          return {
            ...prev,
            init: false,
          };
        } else {
          return prev;
        }
      }),
    };
  } else {
    console.error('유효하지 않은 action type');
    return state; // default
  }
}

/**
 * components/form/FormCombineParagraphs.tsx
 * 최종 수정일 및 수정자: 26-03-20, park junsung
 * */
const FormCombineParagraphs = <TForm extends FieldValues>({
  control,
  name,
  autoSize,
  mode,
  inputType,
  dtWidth,
  textAreaBoxHeight,
  label = '',
  attachOnlyImg = true,
}: FormEnhancedTextAreaProps<TForm> & BaseTextAreaAtomProps) => {
  /** react hook form 의 controller 는 현재 영역에서는 수정 대상 영역의 값(contentElement)에 한정되어 적용함(전역 적용하지 아니함) */
  const {
    field: { value: value, onChange: controlChange },
    fieldState: { error },
  } = useController<TForm, FieldPathByValue<TForm, ContentElement[]>>({
    control,
    name,
    defaultValue: [] as PathValue<TForm, FieldPathByValue<TForm, ContentElement[]>>,
  });

  const boxRef = useRef<HTMLDivElement>(null);
  const bottomTextArea = useRef<HTMLTextAreaElement | null>(null);

  /** 이하 지역 상태는 반드시 배열의 불변성을 유지할 것 */
  const [contentElementStatus, dispatchContentElementStatus] = useReducer(contentElementStatusReducer, {
    unFrozenElementId: -1,
    perContentStatusList: [{ id: 1, init: true }],
  });

  const [boxHeight, setBoxHeight] = useState(0); // textArea(div box 의 컨텐츠) 높이에 따라 동기화

  const [innerErrorState, setInnerErrorState] = useState<FieldErrorForContentElement[]>([]); // contentElements 의 순서와 대응되므로, 배열 index 기준으로 error가 발생한 contentElement 를 찾을 수 있음 todo 내부 함수로 직접 대응시킴으로서 state 제거하기

  /** 랜더링 시점 초기화 동작 */
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
    if (contentElementStatus.unFrozenElementId == -1) {
      // 최하단 영역 이외에 별도로 편집 가능 상태인 구획이 부재한 경우 한정 트리거
      bottomTextArea.current?.focus();
    }
  }, [contentElementStatus.unFrozenElementId, value]);

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

  useEffect(() => {
    if (!value || value.length === 0) {
      // rhf controlled value 초기값 할당
      controlChange([{ id: 1, partialContent: '', init: true }]);
    } else {
      dispatchContentElementStatus({ type: 'syncWithRhf', payload: { value: value } });
    }
  }, [value]);

  const changeContentElementByTargetValue = (target: EventTarget & HTMLTextAreaElement, targetContentElement: ContentElement) => {
    controlChange(
      value.map((prev: ContentElement) => {
        if (prev.id == targetContentElement.id) {
          return {
            ...prev,
            partialContent: target.value,
          };
        } else {
          return prev;
        }
      }),
    );
  };

  const getPerContentStatusById = (id: number): { id: number; init: boolean } | undefined => {
    return contentElementStatus.perContentStatusList.filter((perContentStatus) => perContentStatus.id == id)[0];
  };

  const attachRequestInterruptCallBack = (files: File[], contentElementOnTriggeredArea: ContentElement) => {
    if (attachOnlyImg && files.filter((file) => !file.type.startsWith('image/')).length > 0) {
      toastError('이미지 파일이 아닌 경우 첨부할수 없습니다.');
      return;
    } else {
      const modifiedContentElements: ContentElement[] = [];
      for (let i = 0; i < value.length; i++) {
        if (contentElementOnTriggeredArea.id == value[i].id) {
          /** 대상 영역(첨부 동작 촉발된 영역) */

          if (contentElementOnTriggeredArea.id == value.length) {
            /** 최하단 영역에서 첨부 발생한 경우 */
            if (contentElementOnTriggeredArea.partialContent == undefined || contentElementOnTriggeredArea.partialContent.trim() == '') {
              /** 내용 부재(입력 영역(공란 영역)을 하단으로 밀어냄) */

              // 파일 요소가 선행함
              files.forEach((file) => {
                modifiedContentElements.push({
                  id: modifiedContentElements.length + 1,
                  fileInfo: {
                    file: file,
                    fileSrcUrl: URL.createObjectURL(file),
                  } as FileInfo,
                });
              });

              // 기존 상태 영속을 위한 추가 동작(파일 첨부 영역 push 이후로 push)
              modifiedContentElements.push({
                ...value[i],
                id: modifiedContentElements.length + 1,
              });
            } else {
              /** 내용 잔존(첨부 영역(이미지가 첨부되어지는 영역)을 하단으로 밀어냄) */

              // 기존 상태 영속을 위한 추가 동작
              modifiedContentElements.push({
                ...value[i],
                id: modifiedContentElements.length + 1,
              });

              // 파일 요소가 이후 추가됨
              files.forEach((file) => {
                modifiedContentElements.push({
                  id: modifiedContentElements.length + 1,
                  fileInfo: {
                    file: file,
                    fileSrcUrl: URL.createObjectURL(file),
                  } as FileInfo,
                });
              });

              modifiedContentElements.push({ id: modifiedContentElements.length + 1, partialContent: '' }); // id를 최하단 영역에 맞추어 할당
            }
          } else {
            /** 최하단 이외 영역에서 첨부 발생한 경우, 최하단 영역에서 내용이 부재한 경우의 동작과 동일 */

            // 파일 요소가 선행함
            files.forEach((file) => {
              modifiedContentElements.push({
                id: modifiedContentElements.length + 1,
                fileInfo: {
                  file: file,
                  fileSrcUrl: URL.createObjectURL(file),
                } as FileInfo,
              });
            });

            // 기존 상태 영속을 위한 추가 동작(파일 첨부 영역 push 이후로 push)
            modifiedContentElements.push({
              ...value[i],
              id: modifiedContentElements.length + 1,
            });
          }
          dispatchContentElementStatus({
            type: 'focus',
            payload: {
              id: i == value.length - 1 ? -1 : modifiedContentElements.length, // 최하단 영역에서의 이벤트인 경우(i == prevState.length - 1 이 true) -1, 이외 id에 해당하는 값(바로 위에서 push 동작이 이루어진 관계로 modifiedContentElements.length) 할당
            },
          });
        } else {
          // 이외의 경우에는 id 동기화(파일 첨부 영역 이후부터는 기존의 value.length 와 불일치가 발생하니 이를 통해 자연스럽게 첨부된 길이만큼 하위 인덱스에 해당하는 배열 요소로 배치됨)
          modifiedContentElements.push({
            ...value[i],
            id: modifiedContentElements.length + 1,
          });
        }
      }
      controlChange(modifiedContentElements); // 동기화
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
    <>
      {(inputType === undefined || inputType === 'single') && (
        <div className={'enhanced_textArea'}>
          <div className={'enhanced_textArea_box'} style={{ height: textAreaBoxHeight ?? '' }} ref={boxRef}>
            {!mode || mode == 'edit' ? (
              // 편집 모드
              value.map((contentElement: ContentElement, index: number) => {
                const partialContentErrorExist = innerErrorState[index]?.partialContent != undefined;
                const fileErrorExist = innerErrorState[index]?.fileInfo != undefined;
                if (value.length == index + 1) {
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
                              //flipInitStatusToFalseById(contentElement.id);
                              dispatchContentElementStatus({
                                type: 'flipInitToFalse',
                                payload: {
                                  id: contentElement.id,
                                },
                              });
                              changeContentElementByTargetValue(e.target, contentElement);
                            }}
                            onDrop={(e) => onDropEventHandler(e, contentElement)}
                            onPaste={(e) => onPasteEventHandler(e, contentElement)}
                            autoSize={autoSize}
                            onFocus={() => {
                              //setUnFrozenElementId(-1);
                              dispatchContentElementStatus({
                                type: 'focus',
                                payload: {
                                  id: contentElement.id,
                                },
                              });
                            }}
                            onKeyDown={(e) => {
                              if (e.nativeEvent.isComposing) return; // IME 조합 중인 경우 무동작 처리하여 이벤트가 제차 호출되는 걸 방지

                              if (e.key == 'Enter' && e.shiftKey) {
                                e.preventDefault();
                                if (contentElement.partialContent != undefined && contentElement.partialContent.trim() != '') {
                                  // 값이 유효한 경우 한정으로만 정의된 동작 실행
                                  controlChange([...value, { id: contentElement.id + 1, partialContent: '' }]); // 입력 완료 후 다음 문단 생성 동작
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
                } else if (contentElement.id == contentElementStatus.unFrozenElementId) {
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
                            <div className={'btnArea between'}>
                              {contentElement.fileInfo.file?.name && <p>{contentElement.fileInfo.file.name}</p>}
                              <button
                                className="btn btn_primary"
                                onClick={() => {
                                  controlChange([...value.filter((prev: ContentElement) => prev.id != contentElement.id)]); // 지움 동작
                                }}
                              >
                                {'지움'}
                              </button>
                            </div>
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
                                  controlChange([...value.filter((prev: ContentElement) => prev.id != contentElement.id)]);
                                  bottomTextArea.current?.focus(); // 최하단 영역으로 포커싱
                                } else {
                                  changeContentElementByTargetValue(e.target, contentElement);
                                  dispatchContentElementStatus({
                                    type: 'flipInitToFalse',
                                    payload: {
                                      id: contentElement.id,
                                    },
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
                          className={`per_img_element ${getPerContentStatusById(contentElement.id)?.init ? '' : 'frozen'}`}
                          onClick={() => {
                            dispatchContentElementStatus({
                              type: 'focus',
                              payload: {
                                id: contentElement.id,
                              },
                            });
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
                          <div className={'img_title_wrapper'}>{contentElement.fileInfo.file?.name && <p>{contentElement.fileInfo.file.name}</p>}</div>
                        </div>
                      ) : (
                        <div className={'per_textArea_element'}>
                          <div className={'textArea_wrapper'}>
                            <BaseTextAreaAtom
                              value={contentElement.partialContent}
                              type={'text'}
                              readOnly={true}
                              onFocus={() => {
                                dispatchContentElementStatus({
                                  type: 'focus',
                                  payload: {
                                    id: contentElement.id,
                                  },
                                });
                              }}
                              autoSize={autoSize}
                            />
                          </div>
                          <div className={`err_msg_wrapper ${partialContentErrorExist ? 'error' : 'non'}`}>
                            <p>{innerErrorState[index]?.partialContent?.message}</p>
                          </div>
                        </div>
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
                {value.map((contentElement: ContentElement) => {
                  return (
                    <div className={'per_preview_element'} key={contentElement.id}>
                      {contentElement.fileInfo != undefined ? (
                        <div className={'per_img_element'}>
                          <div className={'img_wrapper'}>
                            <img src={contentElement.fileInfo.fileSrcUrl} />
                          </div>
                          <div className={'img_title_wrapper'}>{contentElement.fileInfo.file?.name && <p>{contentElement.fileInfo.file.name}</p>}</div>
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
      )}
      {inputType === 'label' && (
        <dl>
          <dt style={{ width: dtWidth ?? '' }}>{label}</dt>
          <dd>
            <div className={'enhanced_textArea'}>
              <div className={'enhanced_textArea_box'} style={{ height: textAreaBoxHeight ?? '' }} ref={boxRef}>
                {!mode || mode == 'edit' ? (
                  // 편집 모드
                  value.map((contentElement: ContentElement, index: number) => {
                    const partialContentErrorExist = innerErrorState[index]?.partialContent != undefined;
                    const fileErrorExist = innerErrorState[index]?.fileInfo != undefined;
                    if (value.length == index + 1) {
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
                                  changeContentElementByTargetValue(e.target, contentElement);
                                  dispatchContentElementStatus({
                                    type: 'flipInitToFalse',
                                    payload: {
                                      id: contentElement.id,
                                    },
                                  });
                                }}
                                onDrop={(e) => onDropEventHandler(e, contentElement)}
                                onPaste={(e) => onPasteEventHandler(e, contentElement)}
                                autoSize={autoSize}
                                onFocus={() => {
                                  dispatchContentElementStatus({
                                    type: 'focus',
                                    payload: {
                                      id: -1,
                                    },
                                  });
                                }}
                                onKeyDown={(e) => {
                                  if (e.nativeEvent.isComposing) return; // IME 조합 중인 경우 무동작 처리하여 이벤트가 제차 호출되는 걸 방지

                                  if (e.key == 'Enter' && e.shiftKey) {
                                    e.preventDefault();
                                    if (contentElement.partialContent != undefined && contentElement.partialContent.trim() != '') {
                                      // 값이 유효한 경우 한정으로만 정의된 동작 실행
                                      controlChange([...value, { id: contentElement.id + 1, partialContent: '' }]); // 입력 완료 후 다음 문단 생성 동작
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
                    } else if (contentElement.id == contentElementStatus.unFrozenElementId) {
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
                                <div className={'btnArea between'}>
                                  {contentElement.fileInfo.file?.name && <p>{contentElement.fileInfo.file.name}</p>}
                                  <button
                                    className="btn btn_primary"
                                    onClick={() => {
                                      controlChange([...value.filter((prev: ContentElement) => prev.id != contentElement.id)]); // 지움 동작
                                    }}
                                  >
                                    {'지움'}
                                  </button>
                                </div>
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
                                      controlChange([...value.filter((prev: ContentElement) => prev.id != contentElement.id)]);
                                      bottomTextArea.current?.focus(); // 최하단 영역으로 포커싱
                                    } else {
                                      changeContentElementByTargetValue(e.target, contentElement);
                                      dispatchContentElementStatus({
                                        type: 'flipInitToFalse',
                                        payload: {
                                          id: contentElement.id,
                                        },
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
                              className={`per_img_element ${getPerContentStatusById(contentElement.id)?.init ? '' : 'frozen'}`}
                              onClick={() => {
                                dispatchContentElementStatus({
                                  type: 'focus',
                                  payload: {
                                    id: contentElement.id,
                                  },
                                });
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
                              <div className={'img_title_wrapper'}>{contentElement.fileInfo.file?.name && <p>{contentElement.fileInfo.file.name}</p>}</div>
                            </div>
                          ) : (
                            <div className={'per_textArea_element'}>
                              <div className={'textArea_wrapper'}>
                                <BaseTextAreaAtom
                                  value={contentElement.partialContent}
                                  type={'text'}
                                  readOnly={true}
                                  onFocus={() => {
                                    dispatchContentElementStatus({
                                      type: 'focus',
                                      payload: {
                                        id: contentElement.id,
                                      },
                                    });
                                  }}
                                  autoSize={autoSize}
                                />
                              </div>
                              <div className={`err_msg_wrapper ${partialContentErrorExist ? 'error' : 'non'}`}>
                                <p>{innerErrorState[index]?.partialContent?.message}</p>
                              </div>
                            </div>
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
                    {value.map((contentElement: ContentElement) => {
                      return (
                        <div className={'per_preview_element'} key={contentElement.id}>
                          {contentElement.fileInfo != undefined ? (
                            <div className={'per_img_element'}>
                              <div className={'img_wrapper'}>
                                <img src={contentElement.fileInfo.fileSrcUrl} />
                              </div>
                              <div className={'img_title_wrapper'}>{contentElement.fileInfo.file?.name && <p>{contentElement.fileInfo.file.name}</p>}</div>
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
          </dd>
        </dl>
      )}
    </>
  );
};

export default FormCombineParagraphs;
