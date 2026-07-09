import { useController, FieldValues } from 'react-hook-form';
import { DropDownOption } from '../../types/DropDownOptions';
import React from 'react';
import { TControl } from '../../types/Control';
import DatePickerAtom from '../atom/DatePickerAtom';
import dayjs from 'dayjs';

type TProps<T extends FieldValues> = TControl<T> & {
  title?: string;
  codeUpper?: string;
  options?: DropDownOption[];
  name: string;
  type?: 'single' | 'flex';
  required?: boolean;
  defaultOptions?: DropDownOption[];
  style?: React.CSSProperties;
  // onChange?: (name: string, value: string | number) => void;
  onPropsChange?: (e: React.ChangeEvent<any>) => void;
  year?: boolean;
  disabled?: boolean;
  format?: string;
  className?: string;
  ref?: React.Ref<HTMLInputElement>;
};

function FormDatePicker<T extends FieldValues>({ ref, ...props }: TProps<T>) {
  const {
    field: { name, onChange: controlChange, value },
    fieldState: { error },
  } = useController({
    name: props.name,
    rules: props.rules,
    control: props.control,
  });

  const handleChange = (dateString: string) => {
    controlChange(dateString);

    if (props.onPropsChange) {
      const event = {
        target: {
          name,
          value: dateString,
        },
      } as React.ChangeEvent<any>;
      props.onPropsChange(event);
    }
  };

  const currentYear = dayjs().year();
  const nextYear = currentYear + 1;

  return (
    <>
      {props.year ? (
        <>
          <dl className={props.className}>
            <dt>
              <label>{props.title}</label>
              {props.required && <span className={'req'}>*</span>}
            </dt>
            <dd>
              <div className={'formBox border'}>
                {/* antd YearPicker 제거 → native 연도 select (올해/내년만 노출) */}
                <select
                  name={name}
                  value={value ? String(dayjs(value).year()) : ''}
                  disabled={props.disabled}
                  onChange={(e) => handleChange(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="" disabled hidden>
                    연도 선택
                  </option>
                  {[currentYear, nextYear].map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              {error && (
                <span className={'error_txt'} style={{ marginTop: '5px' }}>
                  {error?.message}
                </span>
              )}
            </dd>
          </dl>
        </>
      ) : (
        <>
          {props.title && (
            <>
              <dl className={props.className}>
                <dt style={{ ...props.style }}>
                  <label>{props.title}</label>
                  {props.required && <span className={'req'}>*</span>}
                </dt>
                <dd>
                  <DatePickerAtom
                    name={name}
                    onChange={handleChange}
                    value={value ? dayjs(value).format(props.format || 'YYYY-MM-DD') : ''}
                    disable={props.disabled}
                    ref={ref}
                  />
                  {error && (
                    <span className={'error_txt'} style={{ marginTop: '5px' }}>
                      {error?.message}
                    </span>
                  )}
                </dd>
              </dl>
            </>
          )}
          {!props.title && (!props.type || props.type === 'single') && (
            <>
              <DatePickerAtom name={name} onChange={handleChange} value={value} disable={props.disabled} className={props.className} ref={ref} />
              {error && (
                <span className={'error_txt'} style={{ marginTop: '5px' }}>
                  {error?.message}
                </span>
              )}
            </>
          )}
          {!props.title && props.type === 'flex' && (
            <>
              <DatePickerAtom name={name} onChange={handleChange} value={value} disable={props.disabled} className={props.className} ref={ref} />
              {error && (
                <span className={'error_txt'} style={{ marginTop: '5px' }}>
                  {error?.message}
                </span>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}

export default FormDatePicker;
