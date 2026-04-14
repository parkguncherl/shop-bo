import React, { useEffect, useState } from 'react';
import { Input } from 'antd';
import { ChromePicker, ColorResult, Color } from 'react-color';
import { createPortal } from 'react-dom';

interface Props {
  title?: string;
  inputStyles?: React.CSSProperties;
  name: string;
  placeholder?: string;
  pickerRef?: React.RefObject<ChromePicker>;
  wrapperRef?: React.RefObject<HTMLElement>; // react color 엘리먼트를 출력하기 위하여 필요한 상위 wrapper 참조
  list?: string; // datalist 사용을 위한 속성
  keyDownEvent?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  required?: boolean;
  wrapperClassNames?: string;
  onColorChangeCompleted?: (name: string, color: ColorResult) => void;
  color?: Color;
  colorPickerCoordinates?: {
    top?: number;
    left?: number;
  };
}

/** react color 기반으로 input 영역을 활용하여 정의 */
export const CustomColorPicker = ({
  title,
  inputStyles,
  name,
  placeholder,
  pickerRef,
  wrapperRef,
  list,
  required,
  wrapperClassNames,
  onColorChangeCompleted,
  color,
  colorPickerCoordinates,
}: Props) => {
  const [displayColorPicker, setDisplayColorPicker] = useState<boolean>(false);
  const [selectedColor, setSelectedColor] = useState<Color | undefined>(undefined);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (wrapperRef?.current) {
      setPortalTarget(wrapperRef.current);
    }
  }, [wrapperRef]);

  // 디바운싱 처리한 외부 업데이트: 300ms 동안 입력이 멈추면 실행 (무거운 연산 방지)
  // const debouncedOnChange = useMemo(
  //   () =>
  //     debounce((newColor: ColorResult) => {
  //       if (onColorChangeCompleted) onColorChangeCompleted(name, newColor);
  //     }, 0),
  //   [onColorChangeCompleted, name],
  // );

  useEffect(() => {
    setSelectedColor(color); // 외부 상태 조작에 대한 동기화
  }, [color]);

  const handleClick = () => {
    setDisplayColorPicker((prev) => !prev);
  };

  const onChangeCompleteHandler = (color: ColorResult) => {
    setSelectedColor(color.hex);
    //debouncedOnChange(color);
    if (onColorChangeCompleted) onColorChangeCompleted(name, color);
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
          allowClear
        />
      )}
      {portalTarget &&
        createPortal(
          <div
            style={{
              position: 'absolute', // 부모 레이아웃에 영향을 주지 않음 (붕 뜸)
              top: colorPickerCoordinates?.top ? colorPickerCoordinates.top : 160, // 버튼 바로 아래서 시작
              left: colorPickerCoordinates?.left ? colorPickerCoordinates.left : 80,
              zIndex: 10000, // 다른 요소보다 위에 표시
            }}
          >
            {displayColorPicker && <ChromePicker ref={pickerRef} color={selectedColor} onChangeComplete={onChangeCompleteHandler} />}
          </div>,
          portalTarget,
        )}
    </div>
  );
};
