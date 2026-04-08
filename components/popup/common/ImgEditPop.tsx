import React, { useEffect, useRef, useState } from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { PopupLayout } from '../PopupLayout';
import { Layer, Stage, Image, Line } from 'react-konva';
import Konva from 'konva';

export interface ImgProps {
  imgSrc?: string;
  seq?: number; // file seq
}
interface ImgEditPopProps {
  open: boolean;
  onClose: () => void;
  //onEditingEnded?: () => void; // 에디팅 완료 후 사용자가 저장(수정)을 희망할 시
  imgProps?: ImgProps;
}
//interface URLImageProps extends Konva.ImageConfig {}

interface ImageRepInfo {
  image: HTMLImageElement;
  width: number;
  height: number;
  x: number;
  y: number;
}

const URLImage = ({ ...rest }: Konva.ImageConfig) => {
  return <Image {...rest} />;
};

const ImgEditPop = ({ open, onClose, imgProps }: ImgEditPopProps) => {
  const topWrapperRef = useRef<HTMLDivElement>(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [imageRepInfo, setImageRepInfo] = useState<ImageRepInfo | undefined>(undefined);

  useEffect(() => {
    // 이미지 정보 변경 시점에 필요한 초기화(혹은 동기화) 동작
    if (imgProps && imgProps.imgSrc) {
      const image = new window.Image();
      image.src = imgProps.imgSrc;
      image.onload = () => {
        const stageWidth = topWrapperRef.current?.offsetWidth || 0;
        const stageHeight = topWrapperRef.current?.offsetHeight || 0;

        if (topWrapperRef.current) {
          setDimensions({
            width: stageWidth,
            height: stageHeight,
          });
        }

        // 1. 비율 계산 (비교)
        const widthRatio = stageWidth / image.width;
        const heightRatio = stageHeight / image.height;

        // 2. contain 방식: 둘 중 더 작은 비율을 선택
        const newScale = Math.min(widthRatio, heightRatio); // 비율(scale)

        // 3. 실질적인 너비와 높이 구하기
        const finalWidth = image.width * newScale;
        const finalHeight = image.height * newScale;

        // 4. 중앙 정렬을 위한 좌표(x, y) 구하기
        const x = (stageWidth - finalWidth) / 2;
        const y = (stageHeight - finalHeight) / 2;

        setImageRepInfo({
          image: image,
          width: finalWidth,
          height: finalHeight,
          x: x,
          y: y,
        });
      };
    }
  }, [imgProps]);

  const onCloseCommon = () => {
    if (onClose) onClose();
  };

  const [tool, setTool] = React.useState('pen');
  const [lines, setLines] = useState<any[]>([]);
  const isDrawing = useRef(false);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { tool, points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // no drawing - skipping
    if (!isDrawing.current) {
      return;
    }
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];
    // add point
    lastLine.points = lastLine.points.concat([point.x, point.y]);

    // replace last
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
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
            <Stage
              {...(dimensions as any)}
              // width={dimensions.width}
              // height={dimensions.height}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseup={handleMouseUp}
            >
              <Layer>
                <URLImage
                  image={imageRepInfo?.image}
                  width={imageRepInfo?.width}
                  height={imageRepInfo?.height}
                  x={imageRepInfo?.x}
                  y={imageRepInfo?.y}
                  // filters={[Konva.Filters.Blur]}
                  // blurRadius={10}
                />
                {lines.map((line, i) => (
                  <Line
                    key={i}
                    points={line.points}
                    stroke="#df4b26"
                    strokeWidth={5}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
                  />
                ))}
              </Layer>
            </Stage>
          </div>
        </PopupContent>
      </PopupLayout>
    </div>
  );
};

export default ImgEditPop;
