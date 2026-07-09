import { DropDownOption } from '../../types/DropDownOptions';
import React from 'react';

interface Props {
  value?: string | number;
  values?: string[];
  options?: DropDownOption[];
  name: string;
  placeholder?: string;
  onChangeOptions?: (name: string, value: string | number, defaultValue?: string | number) => void;
  onChangeControl?: (e: any) => void;
  placement?: string;
  readonly?: boolean;
  disabledOptionValues?: (string | number | undefined)[];
  style?: React.CSSProperties;
  defaultValue?: string;
  defaultValues?: DropDownOption[];
  selectorShowAction?: ('focus' | 'click')[] | undefined;
  multiple?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLSelectElement>) => void;
  optionClass?: string; // 옵션class
  dropDownStyle?: React.CSSProperties;
  virtual?: boolean;
  className?: string;
  onFocus?: (e: React.FocusEvent<HTMLElement, Element>) => void;
  onBlur?: () => void;
  disabled?: boolean;
  ref?: React.Ref<HTMLSelectElement>;
}

/**
 * antd Select 제거 → native <select> 로 교체.
 * 기존 `.formBox select` scss(다크모드 포함)가 그대로 스타일링하므로 외형이 유지됨.
 * 빈 값('전체' 등)과 multiple 모두 native 로 지원.
 * (antd 고유 기능인 옵션 검색/가상스크롤/커스텀 옵션 렌더링은 미지원)
 */
const DropDownAtom = function DropDownAtom({
  value,
  values,
  options,
  name,
  placeholder,
  onChangeOptions,
  onChangeControl,
  readonly = false,
  disabledOptionValues = [],
  style,
  defaultValue,
  onKeyDown,
  dropDownStyle,
  className,
  onFocus,
  onBlur,
  disabled,
  multiple,
  ref,
}: Props) {
  const visibleOptions = (options ?? []).filter((f) => !disabledOptionValues?.includes(f.value));
  const hasEmptyOption = visibleOptions.some((o) => String(o.value) === '');

  const renderLabel = (label?: string) => (label ? label.replace('shopNewSeller', ' 신규') : label);

  if (multiple) {
    const handleMultiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
      onChangeOptions?.(name, selected as unknown as string);
      onChangeControl?.(selected);
    };
    return (
      <select
        multiple
        name={name}
        value={values ?? []}
        onChange={handleMultiChange}
        onKeyDown={onKeyDown}
        disabled={disabled || readonly}
        className={className}
        style={{ width: '100%', ...(dropDownStyle ?? style) }}
        ref={ref}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        {visibleOptions.map((o, index) => (
          <option key={`${o.key}${index}`} value={String(o.value)}>
            {renderLabel(o.label)}
          </option>
        ))}
      </select>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    const defOption = options?.find((o) => String(o.value) === v);
    onChangeOptions?.(name, v, defOption?.defaultValue);
    onChangeControl?.(v);
  };

  return (
    <select
      name={name}
      value={String(value ?? defaultValue ?? '')}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      disabled={disabled || readonly}
      className={className}
      style={{ width: '100%', ...(dropDownStyle ?? style) }}
      ref={ref}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {placeholder && !hasEmptyOption && (
        <option value="" disabled hidden>
          {placeholder}
        </option>
      )}
      {visibleOptions.map((o, index) => (
        <option key={`${o.key}${index}${o.value}`} value={String(o.value)}>
          {renderLabel(o.label)}
        </option>
      ))}
    </select>
  );
};

export default DropDownAtom;
