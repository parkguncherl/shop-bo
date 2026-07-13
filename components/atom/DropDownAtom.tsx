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
    const checked = values ?? [];
    const toggle = (val: string) => {
      const next = checked.includes(val) ? checked.filter((v) => v !== val) : [...checked, val];
      onChangeOptions?.(name, next as unknown as string);
      onChangeControl?.(next);
    };
    return (
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', padding: '4px 2px' }}>
        {visibleOptions.map((o) => {
          const val = String(o.value);
          const isChecked = checked.includes(val);
          return (
            <label
              key={val}
              style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: disabled || readonly ? 'default' : 'pointer', userSelect: 'none' }}
            >
              <input
                type="checkbox"
                value={val}
                checked={isChecked}
                disabled={disabled || readonly}
                onChange={() => toggle(val)}
                style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#7c5cbf' }}
              />
              <span style={{ fontSize: 'var(--s-size)' }}>{renderLabel(o.label)}</span>
            </label>
          );
        })}
      </div>
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
