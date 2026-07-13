import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface Props {
  name: string;
  label?: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'email' | 'password';
  value?: string | number;
  readonly?: boolean;
  disable?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  style?: React.CSSProperties;
  maxLength?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  inputType?: string;
  /** antd 호환용. 현재 clear 버튼 UI는 미구현(레이아웃 보존). */
  allowClear?: boolean;
  ref?: React.Ref<HTMLInputElement>;
}

/**
 * antd Input 제거 → native input 으로 교체.
 * 기존 `.formBox input` scss 가 그대로 스타일링하므로 외형은 유지됨.
 */
export const BaseInputAtom = function BaseInputAtom({
  name,
  placeholder,
  type = 'text',
  value = '',
  readonly,
  disable,
  onChange,
  onKeyDown,
  style,
  maxLength,
  onFocus,
  onBlur,
  inputType,
  ref,
}: Props) {
  const [showPw, setShowPw] = useState(false);

  if (inputType === 'password') {
    return (
      <span style={{ position: 'relative', display: 'flex', flex: 1, alignItems: 'center' }}>
        <input
          type={showPw ? 'text' : 'password'}
          name={name}
          value={value}
          style={{ ...style, paddingRight: 30, width: '100%' }}
          placeholder={placeholder}
          onChange={onChange}
          onKeyDown={onKeyDown}
          readOnly={readonly}
          disabled={disable}
          autoComplete="off"
          maxLength={maxLength}
          ref={ref}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPw((v) => !v)}
          style={{
            position: 'absolute',
            right: 8,
            display: 'flex',
            alignItems: 'center',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
            color: 'var(--dark-text, #888)',
          }}
          aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 표시'}
        >
          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
    );
  }

  return (
    <input
      type={type}
      name={name}
      value={value}
      style={style}
      placeholder={placeholder}
      onChange={onChange}
      onKeyDown={onKeyDown}
      readOnly={readonly}
      disabled={disable}
      autoComplete="off"
      maxLength={maxLength}
      ref={ref}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
};
