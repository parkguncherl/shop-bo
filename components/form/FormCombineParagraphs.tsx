import { BaseTextAreaAtom, BaseTextAreaAtomProps } from '../atom/BaseTextAreaAtom';
import { Control, FieldError, FieldPathByValue, FieldValues, PathValue, useController } from 'react-hook-form';
import React, { useEffect, useRef, useState } from 'react';
import { toastError } from '../ToastMessage';

export type EnhancedTextAreasMode = 'edit' | 'preview';
type FormEnhancedTextAreaProps<TForm extends FieldValues> = {
  control: Control<TForm>;
  name: FieldPathByValue<TForm, ContentElement[]>;
  label?: string;
  mode?: EnhancedTextAreasMode;
  attachOnlyImg?: boolean;
  inputType?: 'label' | 'single';
  dtWidth?: string;
  textAreaBoxHeight?: string;
};
export interface FileInfo {
  file?: File; // 단순 파일 출력을 위한 경우는 생략 가능(브라우저 paste 이벤트 등에 의하지 않고는 할당되지 않으리라 가정)
  fileSrcUrl?: string; // 이미지 파일 출력 혹은 버킷 참조를 위한 url
}
export interface ContentElement {
  id: number; // 기본 1부터 시작, 순차적일 필요는 없으나 후행하는 요소의 id는 선행 요소의 id보다 커야 함
  partialContent?: string; // 이미지인 경우 undefined
  fileInfo?: FileInfo;
}

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

/**
 * components/form/FormCombineParagraphs.tsx
 * 최종 수정일 및 수정자: 26-02-25, park junsung
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
  const [perContentStatusList, setPerContentStatusList] = useState<PerContentStatus[]>([{ id: 1, init: true }]); // 각 컨텐츠 요소에 일대일로 대응하는 상태 정보 목록
  const [unFrozenElementId, setUnFrozenElementId] = useState<number>(-1); // 최하단 영역 이외 편집 가능한 영역 지정(by Id), -1인 경우 최하단 영역 이외 frozen(편집 가능 속성을 회수)
  const [boxHeight, setBoxHeight] = useState(0); // textArea(div box 의 컨텐츠) 높이에 따라 동기화

  const [innerErrorState, setInnerErrorState] = useState<FieldErrorForContentElement[]>([]); // contentElements 의 순서와 대응되므로, 배열 index 기준으로 error가 발생한 contentElement 를 찾을 수 있음

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
    if (unFrozenElementId == -1) {
      // 최하단 영역 이외에 별도로 편집 가능 상태인 구획이 부재한 경우 한정 트리거
      bottomTextArea.current?.focus();
    }
  }, [unFrozenElementId, value]);

  useEffect(() => {
    setPerContentStatusList((prevState) => {
      return prevState.map((prevContentElement) => {
        if (prevContentElement.id == unFrozenElementId && prevContentElement.init) {
          return {
            ...prevContentElement,
            init: false, // 상호작용이 최초로 일어난 경우 init false, 이후 기존에 랜더링되어진 레거시 상태로 취급
          };
        }
        return prevContentElement;
      });
    });
  }, [unFrozenElementId]);

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
    /** rhf value 에 따라 각 content status 동기화 */
    if (!value || value.length === 0) {
      // rhf controlled value 초기값 할당
      controlChange([{ id: 1, partialContent: '', init: true }]);
    } else {
      if (value.length > perContentStatusList) {
        // 기존 State가 포함하지 않는 value 에 대응하는 state element 추가
        setPerContentStatusList((prevState) => {
          const notIncluded: ContentElement = value.filter((val: ContentElement) => !prevState.map((prev) => prev.id).includes(val.id))[0];
          return [
            ...prevState,
            {
              id: notIncluded.id,
              init: true, // 최초 정의 시 init true (상호작용 이전 상태)
            },
          ];
        });
      } else if (value.length < perContentStatusList) {
        // 제거된 content 제거
        setPerContentStatusList((prevState) => prevState.filter((prev) => value.filter((val: ContentElement) => val.id == prev.id).length == 1));
      }
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

  /** 주어진 id에 대응하는 init 상태를 false 로 변환 */
  const flipInitStatusToFalseById = (id: number) => {
    setPerContentStatusList((prevState) =>
      prevState.map((prev) => {
        if (prev.id == id) {
          return {
            ...prev,
            init: false,
          };
        } else {
          return prev;
        }
      }),
    );
  };

  const getPerContentStatusById = (id: number): { id: number; init: boolean } | undefined => {
    return perContentStatusList.filter((perContentStatus) => perContentStatus.id == id)[0];
  };

  const attachRequestInterruptCallBack = (files: File[], contentElementOnTriggeredArea: ContentElement) => {
    if (attachOnlyImg && files.filter((file) => !file.type.startsWith('image/')).length > 0) {
      toastError('이미지 파일이 아닌 경우 첨부할수 없습니다.');
      return;
    } else {
      const modifiedContentElements: ContentElement[] = [];
      for (let i = 0; i < value.length; i++) {
        if (contentElementOnTriggeredArea.id == value[i].id) {
          // 대상 영역
          files.forEach((file) => {
            modifiedContentElements.push({
              id: modifiedContentElements.length + 1,
              fileInfo: {
                file: file,
                fileSrcUrl: URL.createObjectURL(file),
              } as FileInfo,
            });
          });

          // 기존 상태 영속을 위한 추가 동작
          modifiedContentElements.push({
            ...value[i],
            id: modifiedContentElements.length + 1,
          });
          setUnFrozenElementId(i == value.length - 1 ? -1 : modifiedContentElements.length); // 최하단 영역에서의 이벤트인 경우(i == prevState.length - 1 이 true) -1, 이외 id에 해당하는 값(바로 위에서 push 동작이 이루어진 관계로 modifiedContentElements.length) 할당
        } else {
          // 이외의 경우에는 id 동기화
          modifiedContentElements.push({
            ...value[i],
            id: modifiedContentElements.length + 1,
          });
        }
      }
      controlChange(modifiedContentElements);
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
                              flipInitStatusToFalseById(contentElement.id);
                              changeContentElementByTargetValue(e.target, contentElement);
                            }}
                            onDrop={(e) => onDropEventHandler(e, contentElement)}
                            onPaste={(e) => onPasteEventHandler(e, contentElement)}
                            autoSize={autoSize}
                            onFocus={() => {
                              setUnFrozenElementId(-1);
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
                          <div className={'img_title_wrapper'}>{contentElement.fileInfo.file?.name && <p>{contentElement.fileInfo.file.name}</p>}</div>
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
                                  flipInitStatusToFalseById(contentElement.id);
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
                                setUnFrozenElementId(contentElement.id); // 해당 영역 unFrozen(편집 가능)
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
                                  flipInitStatusToFalseById(contentElement.id);
                                }}
                                onDrop={(e) => onDropEventHandler(e, contentElement)}
                                onPaste={(e) => onPasteEventHandler(e, contentElement)}
                                autoSize={autoSize}
                                onFocus={() => {
                                  setUnFrozenElementId(-1);
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
                              <div className={'img_title_wrapper'}>{contentElement.fileInfo.file?.name && <p>{contentElement.fileInfo.file.name}</p>}</div>
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
                                      flipInitStatusToFalseById(contentElement.id);
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
                                    setUnFrozenElementId(contentElement.id); // 해당 영역 unFrozen(편집 가능)
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
