import React, { useEffect, useState } from 'react';
import { ChromePicker, ColorResult, Color } from 'react-color';
import { createPortal } from 'react-dom';

interface Props {
  title?: string;
  name: string;
  pickerRef?: React.RefObject<ChromePicker>;
  wrapperRef?: React.RefObject<HTMLElement>; // react color 엘리먼트를 출력하기 위하여 필요한 상위 wrapper 참조
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
  name,
  pickerRef,
  wrapperRef,
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

  useEffect(() => {
    setSelectedColor(color); // 외부 상태 조작에 대한 동기화
  }, [color]);

  const handleClick = () => {
    setDisplayColorPicker((prev) => !prev);
  };

  const onChangeCompleteHandler = (color: ColorResult) => {
    setSelectedColor(color.hex);
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
            <div className={`formBox border`}>
              <div style={{ width: 100, height: 30, padding: '3px', borderWidth: '5px', borderColor: 'black' }} onClick={handleClick}>
                <div style={{ width: '100%', height: '100%', backgroundColor: typeof selectedColor == 'string' ? selectedColor : undefined }}></div>
              </div>
            </div>
          </dd>
        </dl>
      ) : (
        <div style={{ width: 100, height: 30, padding: '3px', borderWidth: '5px', borderColor: 'black' }} onClick={handleClick}>
          <div style={{ width: '100%', height: '100%', backgroundColor: typeof selectedColor == 'string' ? selectedColor : undefined }}></div>
        </div>
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
