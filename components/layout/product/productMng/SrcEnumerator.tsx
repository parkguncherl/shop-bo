import React, { useRef } from 'react';

export interface SrcElement {
  fileSeq?: number;
  fileSrc?: string;
}

export interface SrcEnumeratorProps {
  srcInfo?: {
    fileId: number;
    srcElements: SrcElement[];
  };
  title?: {
    left?: string;
    right?: string;
  };
}
interface EnumElementProps {
  srcElement?: SrcElement;
  toUpperReqHandler?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

interface ToUpperReqEvent extends React.MouseEvent<HTMLButtonElement, MouseEvent> {}

const EnumElement = ({ srcElement, toUpperReqHandler }: EnumElementProps) => {
  return (
    <div className={'enumElement'}>
      <div className={'element_container'}>
        <div className={'element_wrapper'}>
          {srcElement?.fileSrc ? (
            <div className={'img_wrapper'}>
              <img src={srcElement.fileSrc} />
            </div>
          ) : (
            <div className={'unknown_messaging_wrapper'}>
              <p>알수 없음!</p>
            </div>
          )}
        </div>
        <div className={'btn_wrapper'}>
          {toUpperReqHandler && (
            <div className={'btnArea between'}>
              <div className={'left'}>
                <button className={'btn btn_blue'} onClick={toUpperReqHandler}>
                  맨 위로
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SrcEnumerator = ({ srcInfo, title }: SrcEnumeratorProps) => {
  const onToUpperReqEmerged = (event: ToUpperReqEvent) => {
    // 최상단 이동 요청 처리(fileSeq 업데이트 동작)
  };

  return (
    <div className={'srcEnumerator'}>
      <div className={'upper'}>
        <div className={'header'}>
          <div className={'gridBoxInfo'}>
            {title?.left && (
              <div className={'left'}>
                <ul>
                  <li>
                    <strong>{title.left}</strong>
                  </li>
                </ul>
              </div>
            )}
            {title?.right && (
              <div className={'right'}>
                <ul>
                  <li>
                    <strong>{title.right}</strong>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className={'main'}>
          {srcInfo &&
            srcInfo.srcElements.map((srcElement, index) => (
              <EnumElement
                key={index}
                srcElement={srcElement}
                toUpperReqHandler={srcElement.fileSeq != undefined && srcElement.fileSeq != 1 ? (event) => onToUpperReqEmerged(event) : undefined}
              />
            ))}
        </div>
      </div>
      <div className={'bottom'}>
        <div className="btnArea between">
          <div className="left"></div>
          <div className="right">
            <button
              className={'btn btn_blue'}
              onClick={() => {
                // todo
              }}
            >
              {'업로드'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SrcEnumerator;
