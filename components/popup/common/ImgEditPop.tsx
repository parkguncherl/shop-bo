import React, { useRef, useState } from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { PopupLayout } from '../PopupLayout';
import CanvasByKonva, { CanvasByKonvaRef } from '../../drawing/CanvasByKonva';
import useFilters from '../../../hooks/useFilters';
import { CustomColorPicker } from '../../CustomColorPicker';
import { toastError } from '../../ToastMessage';

export interface ImgPropsOnEditPop {
  imgFileName?: string;
  imgSrc?: string;
  seq?: number;
}
interface ImgEditPopProps {
  open: boolean;
  onClose: () => void;
  imgProps?: ImgPropsOnEditPop;
}

/** konva 기반 컴포넌트를 통한 이미지 편집 팝업 */
const ImgEditPop = ({ open, onClose, imgProps }: ImgEditPopProps) => {
  const topWrapperRef = useRef<HTMLDivElement>(null);
  const canvasByKonvaRef = useRef<CanvasByKonvaRef>(null);
  const topSearchWrapperRef = useRef<HTMLDivElement>(null);

  const [preview, setPreview] = useState(false);
  const [colorPickerOpened, setColorPickerOpened] = useState(false);

  const [filters, onChangeFilters] = useFilters({
    textColor: undefined,
    lineColor: undefined,
    lineWidth: undefined,
  });

  const onCloseCommon = () => {
    if (onClose) onClose();
  };

  return (
    <div className="imgPopBox">
      <PopupLayout
        width={900}
        open={open}
        isEscClose={true}
        title={'이미지 수정'}
        onClose={onCloseCommon}
        footer={
          <PopupFooter>
            <div className="btnArea between">
              <div className="left">
                <button
                  className="btn btnBlue"
                  onClick={() => {
                    canvasByKonvaRef.current?.customs.api.addNewText();
                  }}
                >
                  새로운 글 추가
                </button>

                <button
                  className={'btn ' + (!preview ? 'btnBlue' : '')}
                  onClick={() => {
                    setPreview(!preview);
                  }}
                >
                  {!preview ? '미리보기' : '편집'}
                </button>
                <button
                  className="btn btnBlue"
                  onClick={() => {
                    canvasByKonvaRef.current.customs.api.exportAsFile().then((file: File | null) => {
                      if (file == null) {
                        toastError('어떠한 수정사항도 없이 저장할 수 없습니다');
                        return;
                      }

                      console.log('file: ', file);
                    });
                  }}
                >
                  저장
                </button>
              </div>
              <div className="right">
                <button className="btn" onClick={onCloseCommon}>
                  닫기
                </button>
              </div>
            </div>
          </PopupFooter>
        }
      >
        <PopupContent>
          <div className="searchBox" ref={topSearchWrapperRef}>
            <div className="searchArea">
              <div className={'type_2'}>
                <CustomColorPicker
                  title={'텍스트 색상'}
                  name={'textColor'}
                  color={filters.textColor}
                  onColorChangeCompleted={(name, color) => {
                    onChangeFilters(name, color.hex);
                  }}
                  wrapperRef={topSearchWrapperRef}
                  onColorPickerOpened={() => setColorPickerOpened(true)}
                  onColorPickerClosed={() => setColorPickerOpened(false)}
                />
                <CustomColorPicker
                  title={'줄(라인) 색상'}
                  name={'lineColor'}
                  color={filters.lineColor}
                  onColorChangeCompleted={(name, color) => {
                    onChangeFilters(name, color.hex);
                  }}
                  colorPickerCoordinates={{
                    left: 360,
                  }}
                  wrapperRef={topSearchWrapperRef}
                />
              </div>
            </div>
          </div>
          <div className={'imgEditPop'} ref={topWrapperRef}>
            <CanvasByKonva
              wrapperRef={topWrapperRef}
              img={imgProps}
              ref={canvasByKonvaRef}
              preview={preview}
              textConfig={{
                color: filters.textColor,
              }}
              lineConfig={{
                color: filters.lineColor,
                width: filters.lineWidth,
              }}
              preventDrawing={colorPickerOpened}
            />
          </div>
        </PopupContent>
      </PopupLayout>
    </div>
  );
};

export default ImgEditPop;
