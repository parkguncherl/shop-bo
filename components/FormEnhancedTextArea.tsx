import { BaseTextAreaAtom, BaseTextAreaAtomProps } from './atom/BaseTextAreaAtom';
import { FieldValues, useController } from 'react-hook-form';
import { TControl } from '../types/Control';
import mergeRefs from '../customFn/ref/mergeRefs';
import React from 'react';

type FormEnhancedTextAreaProps<T extends FieldValues> = BaseTextAreaAtomProps &
  TControl<T> & {
    ref?: React.Ref<HTMLTextAreaElement>;
  };

/**
 * 채팅 입력 영역 기본 구성단위(atom)
 * 조건부 랜더링 이외 별도 동작 로직 없이 철저히 무상태 기본 요소로서 구현
 * */
const FormEnhancedTextArea = <T extends FieldValues>({ control, rules, name, ref, ...props }: FormEnhancedTextAreaProps<T>) => {
  const {
    field: { value, onChange: controlChange, ref: refForUseController },
    fieldState: { isDirty, isTouched, error },
  } = useController({ name, rules, control });

  return (
    <div className="formBox">
      <BaseTextAreaAtom {...props} autoSize type={'text'} ref={mergeRefs<HTMLTextAreaElement>(ref, refForUseController)}></BaseTextAreaAtom>
    </div>
  );
};

export default FormEnhancedTextArea;
