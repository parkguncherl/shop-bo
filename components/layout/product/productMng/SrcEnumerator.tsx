import React from 'react';
import { useCommonStore } from '../../../../stores';

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
  callBack?: {
    onToUpperReqSuccess?: (srcElement: SrcElement) => void;
    onToUpperReqFailure?: (srcElement: SrcElement, resultMessage?: string) => void;
  };

  children?: React.ReactNode;
}
interface EnumElementProps {
  srcElement?: SrcElement;
  toUpperReqHandler?: (event: ToUpperReqEvent) => void;
  oneStepMovementReqHandler?: (event: OneStepMovementReqEvent) => void;
}

interface ToUpperReqEvent extends React.MouseEvent<HTMLButtonElement, MouseEvent> {
  srcElement: SrcElement;
}
interface OneStepMovementReqEvent extends React.MouseEvent<HTMLButtonElement, MouseEvent> {
  srcElement: SrcElement;
  direction: 'up' | 'down';
}

const EnumElement = ({ srcElement, toUpperReqHandler, oneStepMovementReqHandler }: EnumElementProps) => {
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
          {(toUpperReqHandler || oneStepMovementReqHandler) && srcElement?.fileSrc && (
            <div className={'btnArea between'}>
              <div className={'left'}>
                {toUpperReqHandler && (
                  <button className={'btn btnBlue'} onClick={(e) => toUpperReqHandler({ ...e, srcElement: srcElement })}>
                    맨 위로
                  </button>
                )}
              </div>
              <div className={'right'}>
                {oneStepMovementReqHandler && (
                  <>
                    <button className={'btn btnBlue'} onClick={(e) => oneStepMovementReqHandler({ ...e, srcElement: srcElement, direction: 'up' })}>
                      위로
                    </button>
                    <button className={'btn'} onClick={(e) => oneStepMovementReqHandler({ ...e, srcElement: srcElement, direction: 'down' })}>
                      아래로
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SrcEnumerator = ({ srcInfo, title, callBack, children }: SrcEnumeratorProps) => {
  const [rearrangeFilesByStepsToMove] = useCommonStore((s) => [s.rearrangeFilesByStepsToMove]);

  const onToUpperReqEmerged = (event: ToUpperReqEvent) => {
    // 최상단 이동 요청 처리(fileSeq 업데이트 동작)

    if (event.srcElement.fileSeq) {
      rearrangeFilesByStepsToMove({
        fileId: srcInfo?.fileId,
        stepsToMove: -(event.srcElement.fileSeq - 1), // 최상단 영역으로 이동하고자 하므로 이동하고자 하는 step 또한 -(fileSeq - 1) 에 대응됨
      }).then((result) => {
        const { resultCode, body, resultMessage } = result.data;

        if (resultCode == 200) {
          if (callBack?.onToUpperReqSuccess) {
            callBack.onToUpperReqSuccess(event.srcElement);
          }
        } else {
          if (callBack?.onToUpperReqFailure) {
            callBack.onToUpperReqFailure(event.srcElement, resultMessage);
          }
        }
      });
    } else {
      console.error('fileSeq 를 찾을 수 없음');
    }
  };

  const oneStepMovementReqEmerged = (event: OneStepMovementReqEvent) => {
    // 한 단계의 seq 갱신을 통한 이동 요청 처리(fileSeq 업데이트 동작)

    if (event.srcElement.fileSeq) {
      rearrangeFilesByStepsToMove({
        fileId: srcInfo?.fileId,
        stepsToMove: event.direction == 'down' ? 1 : -1, // down 인 경우 각 요소들이 한 단계 뒤 seq에 대응되므로 움직일 step 은 1, 반대의 경우 -1
      }).then((result) => {
        const { resultCode, body, resultMessage } = result.data;

        if (resultCode == 200) {
          if (callBack?.onToUpperReqSuccess) {
            callBack.onToUpperReqSuccess(event.srcElement);
          }
        } else {
          if (callBack?.onToUpperReqFailure) {
            callBack.onToUpperReqFailure(event.srcElement, resultMessage);
          }
        }
      });
    } else {
      console.error('fileSeq 를 찾을 수 없음');
    }
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
                toUpperReqHandler={
                  srcElement.fileSeq != undefined && srcElement.fileSeq != 1
                    ? (event) => {
                        onToUpperReqEmerged(event);
                      }
                    : undefined
                }
                oneStepMovementReqHandler={oneStepMovementReqEmerged}
              />
            ))}
        </div>
      </div>
      <div className={'bottom'}>{children}</div>
    </div>
  );
};

export default SrcEnumerator;
