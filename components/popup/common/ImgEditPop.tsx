import React, { useRef } from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { PopupLayout } from '../PopupLayout';
import CanvasByKonva, { ImgProps } from '../../drawing/CanvasByKonva';

interface ImgEditPopProps {
  open: boolean;
  onClose: () => void;
  //onEditingEnded?: () => void; // 에디팅 완료 후 사용자가 저장(수정)을 희망할 시
  imgProps?: ImgProps;
}

const ImgEditPop = ({ open, onClose, imgProps }: ImgEditPopProps) => {
  const topWrapperRef = useRef<HTMLDivElement>(null);

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
            <button className="btn" onClick={onCloseCommon}>
              닫기
            </button>
          </PopupFooter>
        }
      >
        <PopupContent>
          <div className={'imgEditPop'} ref={topWrapperRef}>
            <CanvasByKonva wrapperRef={topWrapperRef} imgProps={imgProps} />
          </div>
        </PopupContent>
      </PopupLayout>
    </div>
  );
};

export default ImgEditPop;
