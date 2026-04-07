import React, { useEffect, useState } from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { PopupLayout } from '../PopupLayout';
import { Layer, Stage, Image } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';

interface ImgEditPopProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  imgSrc?: string;
}
interface URlImageProps extends Konva.ImageConfig {
  src?: string;
}

const URLImage = ({ src, ...rest }: URlImageProps) => {
  const [image] = useImage(src, 'anonymous'); // cors 방지 차원에서 anonymous
  return <Image image={image} {...rest} />;
};

const ImgEditPop = ({ open, onClose, onSuccess, imgSrc }: ImgEditPopProps) => {
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
          <div className={'imgEditPop'}>
            <Stage>
              <Layer>
                <URLImage src={imgSrc} />
              </Layer>
            </Stage>
          </div>
        </PopupContent>
      </PopupLayout>
    </div>
  );
};

export default ImgEditPop;
