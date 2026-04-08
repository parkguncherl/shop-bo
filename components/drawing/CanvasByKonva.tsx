import React, { useEffect, useRef, useState } from 'react';
import { Layer, Stage, Image, Line, Text } from 'react-konva';
import Konva from 'konva';

export interface ImgProps {
  imgSrc?: string;
  seq?: number; // file seq
}
interface CanvasByKonvaProps {
  imgProps?: ImgProps;
  wrapperRef: React.RefObject<HTMLDivElement>; // wrapper 태그의 너비, 높이를 통하여 캔버스 비율이 결정되므로 반드시 전달되어야 함
}

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

const CanvasByKonva = ({ imgProps, wrapperRef }: CanvasByKonvaProps) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [imageRepInfo, setImageRepInfo] = useState<ImageRepInfo | undefined>(undefined);
  const [textInfoList, setTextInfoList] = useState<
    {
      content: string;
      position: {
        x: number;
        y: number;
      };
    }[]
  >([
    {
      content: 'i disappointed on your behavior',
      position: {
        x: 50,
        y: 50,
      },
    },
    {
      content: 'i disappointed on your behavior',
      position: {
        x: 50,
        y: 60,
      },
    },
    {
      content: 'i disappointed on your behavior',
      position: {
        x: 50,
        y: 70,
      },
    },
  ]);

  const [tool, setTool] = React.useState('pen');
  const [lines, setLines] = useState<{ tool: string; points: number[] }[]>([]);

  const isDrawing = useRef(false);
  const isDraggingText = useRef(false);

  useEffect(() => {
    // 이미지 정보 변경 시점에 필요한 초기화(혹은 동기화) 동작
    if (imgProps && imgProps.imgSrc) {
      const image = new window.Image();
      image.src = imgProps.imgSrc;
      image.onload = () => {
        const stageWidth = wrapperRef.current?.offsetWidth || 0;
        const stageHeight = wrapperRef.current?.offsetHeight || 0;

        if (wrapperRef.current) {
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

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDraggingText.current) {
      // text 드래깅 시점에서 비활성
      isDrawing.current = true;
      const pos = e.target.getStage().getPointerPosition();
      setLines([...lines, { tool, points: [pos.x, pos.y] }]); // 최초 마우스 down 시점에
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // no drawing - skipping
    if (!isDrawing.current) {
      return;
    }
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = { ...lines[lines.length - 1] };

    // add point
    lastLine.points = lastLine.points.concat([point.x, point.y]); // 이동에 따른 신규 포인트 추가(concat 으로 병합)

    // replace last
    const splicedLines = [...lines];
    splicedLines.splice(splicedLines.length - 1, 1, lastLine);
    setLines(splicedLines.concat());
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  return (
    <Stage {...(dimensions as any)} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseup={handleMouseUp}>
      <Layer>
        <URLImage image={imageRepInfo?.image} width={imageRepInfo?.width} height={imageRepInfo?.height} x={imageRepInfo?.x} y={imageRepInfo?.y} />
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
        {textInfoList.map((textInfo, index) => (
          <Text
            key={index}
            text={textInfo.content}
            x={textInfo.position.x}
            y={textInfo.position.y}
            draggable
            onMouseDown={() => {
              isDraggingText.current = true;
            }}
            onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
              setTextInfoList((prevState) => {
                return prevState.map((prev, prevI) => {
                  if (prevI == index) {
                    return {
                      content: prev.content,
                      position: {
                        x: e.target.x(),
                        y: e.target.y(),
                      },
                    };
                  } else {
                    return prev;
                  }
                });
              });
              isDraggingText.current = false;
            }}
          />
        ))}
      </Layer>
    </Stage>
  );
};

export default CanvasByKonva;
