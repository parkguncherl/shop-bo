import { useController, FieldValues } from 'react-hook-form';
import { DropDownOption } from '../../types/DropDownOptions';
import React, { useEffect, useRef, useState } from 'react';
import DropDownAtom from '../atom/DropDownAtom';
import { authApi } from '../../libs';
import { ApiResponseListCodeDropDown } from '../../generated';
import { TControl } from '../../types/Control';
import { Input } from 'antd';

type TProps<T extends FieldValues> = TControl<T> & {
  title?: string;
  codeUpper?: string;
  options?: DropDownOption[];
  name: string;
  type?: 'single' | 'flex';
  required?: boolean;
  defaultOptions?: DropDownOption[];
  style?: React.CSSProperties;
  onChange?: (name: string, value: string | number) => void;
  readonly?: boolean;
  disabledOptionValues?: string[];
  multiple?: boolean;
  multipleDefaultValues?: DropDownOption[];
  virtual?: boolean;
  isPartnerCode?: boolean;
  disabled?: boolean;
  gbCode?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  defaultValue?: string;
  startWith?: string;
};

const FormDropDown = <T extends FieldValues>({ ...props }: TProps<T>) => {
  const {
    field: { name, onChange: controlChange, value },
    fieldState: { error },
  } = useController({
    name: props.name,
    rules: props.rules,
    control: props.control,
  });
  const el = useRef<HTMLDListElement | null>(null);
  const [dropDownData, setDropDownData] = useState<DropDownOption[]>(props.defaultOptions || []);
  const params = { codeUpper: props.codeUpper };
  const [gbVal, setGbVal] = useState(props.title);

  const getDropDownData = async () => {
    try {
      const apiUrl = props.isPartnerCode ? '/partnerCode/dropdown' : '/code/dropdown';
      const res = await authApi.get<ApiResponseListCodeDropDown>(apiUrl, {
        params: {
          ...params,
        },
      });
      const newDropDownData = (res.data.body || []).map(
        (v) =>
          ({
            key: v.codeCd,
            value: v.codeCd,
            label: v.codeNm,
          } as DropDownOption),
      );
      setDropDownData(newDropDownData);
    } catch (err) {
      console.log('실패');
    }
  };

  useEffect(() => {
    if (props.codeUpper) {
      getDropDownData();
    }
  }, [props.codeUpper]);

  const values = props.multiple ? (Array.isArray(value) ? value : []) : value;

  const [focusStates, setFocusStates] = useState<{ [key: string]: boolean }>({});
  const handleFocus = (name: string) => {
    setFocusStates((prev) => ({ ...prev, [name]: true }));
  };
  const handleBlur = (name: string) => {
    setFocusStates((prev) => ({ ...prev, [name]: false }));
  };

  return (
    <>
      {props.multiple ? (
        <dl>
          <dt>
            <label>{props.title}</label>
            {props.required && <span className={'req'}>*</span>}
          </dt>
          <dd>
            <div className={`formBox ${props.disabled ? 'disabled' : ''} ${focusStates[name] ? 'focus' : ''} border`}>
              <DropDownAtom
                name={name}
                values={values}
                options={(props.codeUpper ? dropDownData : props.options || []).filter(
                  (f) => !props.startWith || String(f.value).startsWith(String(props.startWith)),
                )}
                onChangeOptions={props.onChange}
                onChangeControl={controlChange}
                defaultValues={props.defaultOptions || []}
                readonly={props.readonly}
                multiple={props.multiple}
                virtual={props.virtual}
                onFocus={() => {
                  handleFocus(name);
                }}
                onBlur={() => {
                  handleBlur(name);
                }}
                disabled={props.disabled}
                onKeyDown={props.onKeyDown}
              />
            </div>
            {error && (
              <span className={'error_txt'} style={{ marginTop: '5px' }}>
                {error?.message}
              </span>
            )}
          </dd>
        </dl>
      ) : (
        <>
          {props.title && (
            <dl ref={el} className={props.className}>
              <dt>
                {props.gbCode ? <Input onChange={(e) => setGbVal(e.target.value)} value={gbVal} /> : <label>{props.title}</label>}
                {props.required && <span className={'req'}>*</span>}
              </dt>
              <dd>
                <div className={`formBox ${props.disabled ? 'disabled' : ''} ${focusStates[name] ? 'focus' : ''} border`} style={{ ...props.style }}>
                  <DropDownAtom
                    name={name}
                    value={value || ''}
                    options={(props.codeUpper ? dropDownData : props.options || []).filter(
                      (f) => !props.startWith || String(f.value).startsWith(String(props.startWith)),
                    )}
                    onChangeOptions={props.onChange}
                    onChangeControl={controlChange}
                    readonly={props.readonly}
                    virtual={props.virtual}
                    onFocus={() => {
                      handleFocus(name);
                    }}
                    onBlur={() => {
                      handleBlur(name);
                    }}
                    onKeyDown={props.onKeyDown}
                    disabled={props.disabled}
                    defaultValue={props.defaultValue || ''}
                  />
                </div>
                {error && (
                  <span className={'error_txt'} style={{ marginTop: '5px' }}>
                    {error?.message}
                  </span>
                )}
              </dd>
            </dl>
          )}
          {!props.title && (!props.type || props.type === 'single') && (
            <div className={`formBox ${props.disabled ? 'disabled' : ''} ${focusStates[name] ? 'focus' : ''} border ${props.className}`}>
              <DropDownAtom
                name={name}
                value={value}
                options={(props.codeUpper ? dropDownData : props.options || []).filter(
                  (f) => !props.startWith || String(f.value).startsWith(String(props.startWith)),
                )}
                onChangeOptions={props.onChange}
                onChangeControl={controlChange}
                readonly={props.readonly}
                disabledOptionValues={props.disabledOptionValues}
                virtual={props.virtual}
                style={props.style}
                onFocus={() => {
                  handleFocus(name);
                }}
                onBlur={() => {
                  handleBlur(name);
                }}
                onKeyDown={props.onKeyDown}
                disabled={props.disabled}
              />
              {error && <span className={'error_txt'}>{error?.message}</span>}
            </div>
          )}
          {!props.title && props.type === 'flex' && (
            <>
              <DropDownAtom
                name={name}
                value={value}
                options={props.codeUpper ? dropDownData : props.options || []}
                onChangeOptions={props.onChange}
                onChangeControl={controlChange}
                readonly={props.readonly}
                virtual={props.virtual}
                onFocus={() => {
                  handleFocus(name);
                }}
                onBlur={() => {
                  handleBlur(name);
                }}
                onKeyDown={props.onKeyDown}
                disabled={props.disabled}
              />
              {error && (
                <span className={'error_txt'} style={{ marginTop: 5 }}>
                  {error?.message}
                </span>
              )}
            </>
          )}
        </>
      )}
    </>
  );
};

export default FormDropDown;
