import React, { useRef, useState } from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { PopupLayout } from '../PopupLayout';
import CanvasByKonva, { CanvasByKonvaRef, ImgProps } from '../../drawing/CanvasByKonva';
import { Search } from '../../content';

interface ImgEditPopProps {
  open: boolean;
  onClose: () => void;
  //onEditingEnded?: () => void; // 에디팅 완료 후 사용자가 저장(수정)을 희망할 시
  imgProps?: ImgProps;
}

const ImgEditPop = ({ open, onClose, imgProps }: ImgEditPopProps) => {
  const topWrapperRef = useRef<HTMLDivElement>(null);
  const canvasByKonvaRef = useRef<CanvasByKonvaRef>(null);

  const [preview, setPreview] = useState(false);
  const [textColor, setTextColor] = useState('');

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
                    canvasByKonvaRef.current?.addNewText();
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
          <Search className="type_1">
            <Search.Input title={'텍스트 색상'} name={'textColor'} value={textColor} onChange={(name, value) => setTextColor(value.toString())} />
          </Search>
          <div className={'imgEditPop'} ref={topWrapperRef}>
            <CanvasByKonva wrapperRef={topWrapperRef} imgProps={imgProps} ref={canvasByKonvaRef} preview={preview} textColor={textColor} />
          </div>
        </PopupContent>
      </PopupLayout>
    </div>
  );
};

export default ImgEditPop;
