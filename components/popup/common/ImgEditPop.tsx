import React, { useEffect, useRef, useState } from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { PopupLayout } from '../PopupLayout';
import { Layer, Stage, Image } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';

export interface ImgProps {
  imgSrc?: string;
  seq?: number; // file seq
}
interface ImgEditPopProps {
  open: boolean;
  onClose: () => void;
  onEditingEnded?: () => void; // 에디팅 완료 후 사용자가 저장(수정)을 희망할 시
  imgProps?: ImgProps;
}
interface URLImageProps extends Konva.ImageConfig {
  src: string;
  scale?: number;
}

interface ImageProps {
  width: number;
  height: number;
  x: number;
  y: number;
}

const URLImage = ({ src, scale, ...rest }: URLImageProps) => {
  const [image] = useImage(src, 'anonymous'); // cors 방지 차원에서 anonymous
  return <Image image={image} {...rest} scaleX={scale} scaleY={scale} />;
};

const ImgEditPop = ({ open, onClose, onEditingEnded, imgProps }: ImgEditPopProps) => {
  const topWrapperRef = useRef<HTMLDivElement>(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [imageProps, setImageProps] = useState<ImageProps | undefined>(undefined);

  useEffect(() => {
    // 이미지 정보 변경 시점에 필요한 초기화(혹은 동기화) 동작
    if (topWrapperRef.current) {
      setDimensions({
        width: topWrapperRef.current.offsetWidth,
        height: topWrapperRef.current.offsetHeight,
      });
    }

    if (imgProps && imgProps.imgSrc) {
      // const stageWidth = topWrapperRef.current?.offsetWidth || 0;
      // const stageHeight = topWrapperRef.current?.offsetHeight || 0;

      const image = new window.Image();
      image.src = imgProps.imgSrc;
      image.onload = () => {
        // 1. 비율 계산 (비교)
        const widthRatio = (topWrapperRef.current?.offsetWidth || 0) / image.width;
        const heightRatio = (topWrapperRef.current?.offsetHeight || 0) / image.height;

        // 2. contain 방식: 둘 중 더 작은 비율을 선택
        const newScale = Math.min(widthRatio, heightRatio);

        // // 3. 실질적인 너비와 높이 구하기
        // const finalWidth = image.width * newScale;
        // const finalHeight = image.height * newScale;
        //
        // // 4. 중앙 정렬을 위한 좌표(x, y) 구하기
        // const x = (stageWidth - finalWidth) / 2;
        // const y = (stageHeight - finalHeight) / 2;

        console.log('newScale: ', newScale);
        setScale(newScale); // 비율 동기화
        // setImageProps({
        //   width: finalWidth,
        //   height: finalHeight,
        //   x: x,
        //   y: y,
        // });
      };
    }
    console.log('imgProps: ', imgProps);
  }, [imgProps]);

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
            <Stage {...(dimensions as any)}>
              <Layer>{imgProps?.imgSrc ? <URLImage src={imgProps?.imgSrc} scale={scale} /> : <div>이미지 리소스를 찾을 수 없음</div>}</Layer>
            </Stage>
          </div>
        </PopupContent>
      </PopupLayout>
    </div>
  );
};

export default ImgEditPop;
