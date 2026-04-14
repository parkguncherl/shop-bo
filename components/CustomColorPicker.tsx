import React, { useEffect, useMemo, useState } from 'react';
import { Input } from 'antd';
import { ChromePicker, ColorResult, Color } from 'react-color';
import { debounce } from 'lodash';
import { createPortal } from 'react-dom';

interface Props {
  title?: string;
  inputStyles?: React.CSSProperties;
  name: string;
  placeholder?: string;
  pickerRef?: React.RefObject<ChromePicker>;
  list?: string; // datalist 사용을 위한 속성
  keyDownEvent?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  required?: boolean;
  wrapperClassNames?: string;
  onColorChangeCompleted?: (name: string, color: ColorResult) => void;
  color?: Color;
}

export const CustomColorPicker = ({
  title,
  inputStyles,
  name,
  placeholder,
  pickerRef,
  list,
  required,
  wrapperClassNames,
  onColorChangeCompleted,
  color,
}: Props) => {
  const [displayColorPicker, setDisplayColorPicker] = useState<boolean>(false);
  const [selectedColor, setSelectedColor] = useState<Color | undefined>(undefined);

  // 디바운싱 처리한 외부 업데이트: 300ms 동안 입력이 멈추면 실행 (무거운 연산 방지)
  const debouncedOnChange = useMemo(
    () =>
      debounce((newColor: ColorResult) => {
        if (onColorChangeCompleted) onColorChangeCompleted(name, newColor);
      }, 300),
    [onColorChangeCompleted, name],
  );

  useEffect(() => {
    setSelectedColor(color); // 외부 상태 조작에 대한 동기화
  }, [color]);

  const handleClick = () => {
    setDisplayColorPicker((prev) => !prev);
  };

  const handleOnBlur = () => {
    setDisplayColorPicker(false);
  };

  const onChangeCompleteHandler = (color: ColorResult) => {
    setSelectedColor(color.hex);
    debouncedOnChange(color);
  };

  return (
    <div>
      {title ? (
        <dl className={wrapperClassNames}>
          <dt>
            <label>{title}</label>
            {required && <span className={'req'}>*</span>}
          </dt>
          <dd>
            <div className={`formBox border ${displayColorPicker ? 'focus' : ''}`}>
              <Input
                style={inputStyles}
                placeholder={placeholder}
                readOnly={true}
                type={'text'}
                value={typeof selectedColor == 'string' ? selectedColor : '기타'}
                name={name}
                autoComplete={'off'}
                list={list}
                onClick={handleClick}
                //onBlur={handleOnBlur}
                allowClear
              />
            </div>
          </dd>
        </dl>
      ) : (
        <Input
          style={inputStyles}
          placeholder={placeholder}
          readOnly={true}
          type={'text'}
          value={typeof selectedColor == 'string' ? selectedColor : '기타'}
          name={name}
          autoComplete={'off'}
          onClick={handleClick}
          //onBlur={handleOnBlur}
          allowClear
        />
      )}
      <div style={{ zIndex: 10000 }}>
        {displayColorPicker && <ChromePicker ref={pickerRef} color={selectedColor} onChangeComplete={onChangeCompleteHandler} />}
      </div>

      {/*{createPortal(*/}
      {/*  <div*/}
      {/*    style={{*/}
      {/*      position: 'absolute', // 부모 레이아웃에 영향을 주지 않음 (붕 뜸)*/}
      {/*      top: '100%', // 버튼 바로 아래서 시작*/}
      {/*      left: 0,*/}
      {/*      zIndex: 10000, // 다른 요소보다 위에 표시*/}
      {/*      marginTop: '5px', // 약간의 간격*/}
      {/*    }}*/}
      {/*  >*/}
      {/*    {displayColorPicker && <ChromePicker ref={pickerRef} color={selectedColor} onChangeComplete={onChangeCompleteHandler} />}*/}
      {/*  </div>,*/}
      {/*  document.getElementsByClassName('type_2')[0], // body가 아닌 부모 요소에 직접 삽입*/}
      {/*)}*/}
    </div>
  );
};
