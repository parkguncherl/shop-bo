import React, { useEffect, useRef, useState } from 'react';
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
  onColorPickerOpened?: () => void; // picker 열림 시점에 호출
  onColorPickerClosed?: () => void; // picker 닫힘 시점에 호출
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
  onColorPickerOpened,
  onColorPickerClosed,
}: Props) => {
  const [displayColorPicker, setDisplayColorPicker] = useState<boolean>(false);
  const [selectedColor, setSelectedColor] = useState<Color | undefined>(undefined);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  const pickerContainerRef = useRef<HTMLDivElement>(null);
  const colorDisplayedPlateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (wrapperRef?.current) {
      setPortalTarget(wrapperRef.current);
    }
  }, [wrapperRef]);

  useEffect(() => {
    setSelectedColor(color); // 외부 상태 조작에 대한 동기화
  }, [color]);

  const onChangeCompleteHandler = (color: ColorResult) => {
    setSelectedColor(color.hex);
    if (onColorChangeCompleted) {
      onColorChangeCompleted(name, color);
    }
  };

  useEffect(() => {
    const outerAreaClickHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (target) {
        if (!displayColorPicker && colorDisplayedPlateRef.current?.contains(target)) {
          // 열림(기존 닫힘 상태 and 컬러 출력 영역(colorDisplayedPlate) 영역을 클릭한 경우)
          setDisplayColorPicker(true);
          if (onColorPickerOpened) onColorPickerOpened();
        } else if (displayColorPicker && !pickerContainerRef.current?.contains(target)) {
          // 닫힘(기존 열림 상태 and picker 컨테이너 영역 이외 영역을 클릭한 경우)
          setDisplayColorPicker(false);
          if (onColorPickerClosed) onColorPickerClosed();
        }
      }
    };
    document.addEventListener('click', outerAreaClickHandler);

    return () => {
      document.removeEventListener('click', outerAreaClickHandler);
    };
  }, [displayColorPicker]);

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
              <div
                ref={colorDisplayedPlateRef}
                className={'color-displayed-plate'}
                style={{ width: 60, height: 30, padding: '3px', borderWidth: '5px', borderColor: 'black' }}
              >
                <div style={{ width: '100%', height: '100%', backgroundColor: typeof selectedColor == 'string' ? selectedColor : undefined }}></div>
              </div>
            </div>
          </dd>
        </dl>
      ) : (
        <div
          ref={colorDisplayedPlateRef}
          className={'color-displayed-plate'}
          style={{ width: 60, height: 30, padding: '3px', borderWidth: '5px', borderColor: 'black' }}
        >
          <div style={{ width: '100%', height: '100%', backgroundColor: typeof selectedColor == 'string' ? selectedColor : undefined }}></div>
        </div>
      )}
      {portalTarget &&
        createPortal(
          <div
            ref={pickerContainerRef}
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
