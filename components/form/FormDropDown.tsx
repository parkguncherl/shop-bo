import { useController, FieldValues, Path, PathValue } from 'react-hook-form';
import { DropDownOption } from '@/types/DropDownOptions';
import React, { useRef, useState } from 'react';
import DropDownAtom from '@/components/atom/DropDownAtom';
import { authApi } from '@/libs';
import { ApiResponseListCodeDropDown } from '@/generated';
import { TControl } from '@/types/Control';
import { useQuery } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';

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
  placeholder?: string;
};

/** 불필요한 리 랜더링 방지 차원에서 컴포넌트 외부에 정의 */
const newDropDownData = (res: AxiosResponse<ApiResponseListCodeDropDown> | undefined) =>
  (res?.data.body || []).map(
    (v) =>
      ({
        key: v.codeCd,
        value: v.codeCd,
        label: v.codeNm,
      }) as DropDownOption,
  );
const valuesAsPureFn = <T extends FieldValues>(value: PathValue<T, Path<T> & string>, multiple?: boolean | undefined) => {
  return multiple ? (Array.isArray(value) ? value : []) : value;
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
  //const [dropDownData, setDropDownData] = useState<DropDownOption[]>(props.defaultOptions || []);
  //const params = { codeUpper: props.codeUpper };
  const [gbVal, setGbVal] = useState(props.title);

  // const getDropDownData = async () => {
  //   try {
  //     const apiUrl = props.isPartnerCode ? '/partnerCode/dropdown' : '/code/dropdown';
  //     const res = await authApi.get<ApiResponseListCodeDropDown>(apiUrl, {
  //       params: {
  //         ...params,
  //       },
  //     });
  //     const newDropDownData = (res.data.body || []).map(
  //       (v) =>
  //         ({
  //           key: v.codeCd,
  //           value: v.codeCd,
  //           label: v.codeNm,
  //         } as DropDownOption),
  //     );
  //     setDropDownData(newDropDownData);
  //   } catch (err) {
  //     console.log('실패');
  //   }
  // };
  //
  // useEffect(() => {
  //   if (props.codeUpper) {
  //     getDropDownData();
  //   }
  // }, [props.codeUpper]);

  const {
    data: dropDownDataRes,
    // isSuccess: isDropDownDataResSuccess,
    // isLoading: isDropDownDataResLoading,
    // refetch: dropDownDataResRefetch,
  } = useQuery({
    queryKey: ['dropDownData', props.isPartnerCode, props.codeUpper],
    queryFn: () => {
      const apiUrl = props.isPartnerCode ? '/partnerCode/dropdown' : '/code/dropdown';
      return authApi.get<ApiResponseListCodeDropDown>(apiUrl, {
        params: { codeUpper: props.codeUpper },
      });
    },
    refetchOnMount: 'always',
  });

  //const values = props.multiple ? (Array.isArray(value) ? value : []) : value;

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
            <div>
              <DropDownAtom
                name={name}
                values={valuesAsPureFn(value, props.multiple)}
                options={(props.codeUpper ? newDropDownData(dropDownDataRes) : props.options || []).filter(
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
                {props.gbCode ? <input onChange={(e) => setGbVal(e.target.value)} value={gbVal} autoComplete={'off'} /> : <label>{props.title}</label>}
                {props.required && <span className={'req'}>*</span>}
              </dt>
              <dd>
                <div className={`formBox ${props.disabled ? 'disabled' : ''} ${focusStates[name] ? 'focus' : ''} border`} style={{ ...props.style }}>
                  <DropDownAtom
                    name={name}
                    value={value || ''}
                    // options={(props.codeUpper ? dropDownData : props.options || []).filter(
                    //   (f) => !props.startWith || String(f.value).startsWith(String(props.startWith)),
                    // )}
                    options={(props.codeUpper ? newDropDownData(dropDownDataRes) : props.options || []).filter(
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
                    placeholder={props.placeholder}
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
                // options={(props.codeUpper ? dropDownData : props.options || []).filter(
                //   (f) => !props.startWith || String(f.value).startsWith(String(props.startWith)),
                // )}
                options={(props.codeUpper ? newDropDownData(dropDownDataRes) : props.options || []).filter(
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
                // options={props.codeUpper ? dropDownData : props.options || []}
                options={props.codeUpper ? newDropDownData(dropDownDataRes) : props.options || []}
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
