import { BaseTextAreaAtom, BaseTextAreaAtomProps } from './atom/BaseTextAreaAtom';
import { FieldValues, useController } from 'react-hook-form';
import { TControl } from '../types/Control';
import mergeRefs from '../customFn/ref/mergeRefs';
import React, { useState } from 'react';

export interface UploadRequestInterruptEvent {
  files: File[];
}
type FormEnhancedTextAreaProps<T extends FieldValues> = BaseTextAreaAtomProps &
  TControl<T> & {
    ref?: React.Ref<HTMLTextAreaElement>;

    onUploadRequestInterruptOccurred?: (event: UploadRequestInterruptEvent) => Promise<void> | undefined;
  };
interface ContentElement {
  id: number; // 기본 1부터 시작
  partialContent?: string; // 이미지인 경우 undefined
  disable?: boolean; // 수동 통제, 기본적으로 최하단 요소 이외에는 true 이나 상호작용(수정을 위한 포커싱 등) 발생 시에는 예외적으로 조정 가능(다만 불변성 유지 차원에서 새 배열 생성 후 상태 최신화), 이미지인 경우 undefined
}

/**
 * stateFul 컴포넌트
 * 기존 textArea 와 달리 이미지 삽입 및 이에 따라 필요한 동작 지원
 * */
const FormEnhancedTextArea = <T extends FieldValues>({ control, rules, name, ref, ...props }: FormEnhancedTextAreaProps<T>) => {
  const {
    field: { value, onChange: controlChange, ref: refForUseController },
    fieldState: { isDirty, isTouched, error },
  } = useController({ name, rules, control });

  /** 해당 지역 상태는 반드시 배열의 불변성을 유지할 것 */
  const [contentElements, setContentElements] = useState<ContentElement[]>([{ id: 1, partialContent: '', disable: false }]);

  /** 기타 state */
  const [enableCompletionInterruptCallback, setEnableCompletionInterruptCallback] = useState(true); // 작성 완료 콜백의 무분별한 호출을 제한하는 상태

  // 업로드(파일, 이미지) 요청 동작 핸들링
  const uploadRequestInterruptCallBack = (files: File[]): Promise<void> | undefined => {
    setEnableCompletionInterruptCallback(false); // 중복 동작 차단
    if (props.onUploadRequestInterruptOccurred) {
      return props
        .onUploadRequestInterruptOccurred({ files: files })
        ?.then(() => {
          setEnableCompletionInterruptCallback(true); // 동작 차단 해제
        })
        .catch(() => {
          setEnableCompletionInterruptCallback(true); // 동작 차단 해제
        });
    }
  };

  // 드롭 이벤트
  const onDropEventHandler = (e: React.DragEvent<HTMLTextAreaElement>) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length != 0) {
      e.preventDefault();
      e.stopPropagation();
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        uploadRequestInterruptCallBack(droppedFiles);
      }
    }
  };

  // 붙여넣기 이벤트
  const onPasteEventHandler = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length != 0) {
      e.preventDefault();
      e.stopPropagation();
      const pastedFiles = Array.from(e.clipboardData.files);
      if (pastedFiles.length > 0) {
        uploadRequestInterruptCallBack(pastedFiles);
      }
    }
  };

  /**
   * 이미지 붙여넣기, 드롭 동작 발생 시 기존 textArea freeze 및 상태 저장, 이미지 영역 하단에 이후 신규 textArea 활성화
   * */
  return (
    <div className={'enhanced_textArea'}>
      <div className={'formBox'}>
        {contentElements.map((contentElement) => {
          return (
            <div className={'per_content_element'} key={contentElement.id}>
              <BaseTextAreaAtom
                {...props}
                value={value || ''}
                type={'text'}
                ref={mergeRefs<HTMLTextAreaElement>(ref, refForUseController)}
                onChange={controlChange}
                disabled={contentElement.disable}
                onDrop={(e) => onDropEventHandler(e)}
                onPaste={(e) => onPasteEventHandler(e)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FormEnhancedTextArea;
