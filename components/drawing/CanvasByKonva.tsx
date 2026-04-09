import React, { useEffect, useRef, useState } from 'react';
import { Layer, Stage, Image, Line, Text, Transformer } from 'react-konva';
import Konva from 'konva';
import { Html } from 'react-konva-utils';
import { Box } from 'konva/lib/shapes/Transformer';

export interface ImgProps {
  imgSrc?: string;
  seq?: number; // file seq
}
interface CanvasByKonvaProps {
  imgProps?: ImgProps;
  wrapperRef: React.RefObject<HTMLDivElement>; // wrapper 태그의 너비, 높이를 통하여 캔버스 비율이 결정되므로 반드시 전달되어야 함
}

interface EditableTextProps {
  text: {
    textInfo: {
      content: string;
      position: {
        x: number;
        y: number;
      };
    };
    onMouseDown?: (evt: Konva.KonvaEventObject<MouseEvent>) => void;
    onDragEnd?: (evt: Konva.KonvaEventObject<DragEvent>) => void;
    onEditEnd?: () => void;
    onChangeByEditor?: (value: string) => void;
  };
  // editor: any;
  // transformer: any;
}
interface TextEditorProps {
  textRef: React.RefObject<any>;
  onClose?: () => void;
  onChange?: (value: string) => void;
}

// state's types
interface ImageRepInfo {
  image: HTMLImageElement;
  width: number;
  height: number;
  x: number;
  y: number;
}
interface TextInfo {
  content: string;
  position: {
    x: number;
    y: number;
  };
}

const URLImage = ({ ...rest }: Konva.ImageConfig) => {
  return <Image {...rest} />;
};

const TextArea = ({ textRef, onClose, onChange }: TextEditorProps) => {
  const [inputValue, setInputValue] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!textareaRef.current) return;
    if (!textRef.current) return;

    const textarea = textareaRef.current;
    const textPosition = textRef.current.position();
    const areaPosition = {
      x: textPosition.x,
      y: textPosition.y,
    };

    // Match styles with the text node
    textarea.value = textRef.current.text();
    textarea.style.position = 'absolute';
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.width = `${textRef.current.width() - textRef.current.padding() * 2}px`;
    textarea.style.height = `${textRef.current.height() - textRef.current.padding() * 2 + 5}px`;
    textarea.style.fontSize = `${textRef.current.fontSize()}px`;
    textarea.style.border = 'none';
    textarea.style.padding = '0px';
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'none';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.lineHeight = textRef.current.lineHeight();
    textarea.style.fontFamily = textRef.current.fontFamily();
    textarea.style.transformOrigin = 'left top';
    textarea.style.textAlign = textRef.current.align();
    textarea.style.color = textRef.current.fill();

    const rotation = textRef.current.rotation();
    let transform = '';
    if (rotation) {
      transform += `rotateZ(${rotation}deg)`;
    }
    textarea.style.transform = transform;

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight + 3}px`;

    textarea.focus();
  }, []);

  // Add event listeners
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (onChange) onChange(inputValue);
      if (onClose) onClose();
    }
    if (e.key === 'Escape') {
      if (onClose) onClose();
    }
  };

  const handleInput = () => {
    if (textareaRef.current) {
      const scale = textRef.current.getAbsoluteScale().x;
      textareaRef.current.style.width = `${textRef.current.width() * scale}px`;
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + textRef.current.fontSize()}px`;
    }
  };

  return (
    <textarea
      ref={textareaRef}
      style={{
        minHeight: '1em',
        position: 'absolute',
      }}
      onBlur={() => {
        if (onChange) onChange(inputValue);
        if (onClose) onClose();
      }}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onInput={handleInput}
    />
  );
};

const TextEditor = (props: TextEditorProps) => {
  // Konva stage 내에 DOM element를 랜더링하기 위해 react-konva-utils 의 Html 을 사용한다.
  return (
    <Html>
      <TextArea {...props} />
    </Html>
  );
};

const EditableText = ({ text: { textInfo, onMouseDown, onDragEnd, onEditEnd, onChangeByEditor } }: EditableTextProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const textRef = useRef(null);
  const trRef = useRef(null);

  useEffect(() => {
    if (trRef.current && textRef.current) {
      (trRef.current as any).nodes([textRef.current]);
    }
  }, [isEditing]);

  return (
    <>
      <Text
        text={textInfo.content}
        x={textInfo.position.x}
        y={textInfo.position.y}
        draggable
        onMouseDown={onMouseDown}
        onDragEnd={onDragEnd}
        visible={!isEditing}
        onDblClick={() => {
          setIsEditing(true);
        }}
        ref={textRef}
      />
      {isEditing && (
        <TextEditor
          textRef={textRef}
          onChange={onChangeByEditor}
          onClose={() => {
            setIsEditing(false);
            if (onEditEnd) onEditEnd();
          }}
        />
      )}
      {!isEditing && (
        <Transformer
          ref={trRef}
          enabledAnchors={['middle-left', 'middle-right']}
          boundBoxFunc={(oldBox: Box, newBox: Box) => ({
            ...newBox,
            width: Math.max(30, (newBox as any).width),
          })}
        />
      )}
    </>
  );
};

const CanvasByKonva = ({ imgProps, wrapperRef }: CanvasByKonvaProps) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [imageRepInfo, setImageRepInfo] = useState<ImageRepInfo | undefined>(undefined);
  const [textInfoList, setTextInfoList] = useState<TextInfo[]>([
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
          <EditableText
            key={index}
            text={{
              textInfo: textInfo,
              onMouseDown: () => {
                isDraggingText.current = true;
              },
              onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
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
              },
              onEditEnd: () => {
                isDraggingText.current = false;
              },
              onChangeByEditor: (value) => {
                setTextInfoList((prevState) => {
                  return prevState.map((prev, prevI) => {
                    if (prevI == index) {
                      return {
                        ...prev,
                        content: value,
                      };
                    } else {
                      return prev;
                    }
                  });
                });
              },
            }}
          />
        ))}
      </Layer>
    </Stage>
  );
};

export default CanvasByKonva;
