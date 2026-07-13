import React from 'react';
import dayjs from 'dayjs';

interface Props {
  name: string;
  type?: React.HTMLInputTypeAttribute;
  value?: string;
  disable?: boolean;
  onChange?: (e?: any) => void;
  onEnter?: () => void;
  placeholder?: string;
  required?: boolean;
  filters?: object;
  wrapperClassNames?: string;
  format?: string;
  dtWidth?: string;
  style?: React.CSSProperties;
  allowClear?: boolean;
  handleFocus?: (name: string) => void;
  handleBlur?: (name: string) => void;
  focusStates?: { [key: string]: boolean };
  className?: string;
  ref?: React.Ref<HTMLInputElement>;
}

/**
 * antd DatePicker 제거 → native <input type="date"> 로 교체.
 * 기존 `.formBox input` + `_dark.scss`의 input[type="date"] 스타일이 적용됨.
 * onChange 는 'YYYY-MM-DD' 문자열을 넘김(값 없으면 '').
 */
const DatePickerAtom = ({ name, placeholder, value, disable, onChange, style, className, ref }: Props) => {
  const dateVal = value && dayjs(value).isValid() ? dayjs(value).format('YYYY-MM-DD') : '';
  return (
    <div className={`formBox border ${className ?? ''}`}>
      <input
        type="date"
        name={name}
        value={dateVal}
        disabled={disable}
        placeholder={placeholder}
        style={{ minHeight: 28, cursor: 'pointer', ...style }}
        ref={ref}
        onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
};

export default DatePickerAtom;
