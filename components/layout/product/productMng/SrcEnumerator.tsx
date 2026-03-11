import React, { useEffect } from 'react';
import { useCommonStore } from '../../../../stores';
import { toastSuccess } from '../../../ToastMessage';

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
          {(toUpperReqHandler || oneStepMovementReqHandler) && srcElement && (
            <div className={'btnArea between'}>
              <div className={'left'}>
                {toUpperReqHandler && (
                  <button className={'btn btn_blue'} onClick={(e) => toUpperReqHandler({ ...e, srcElement: srcElement })}>
                    맨 위로
                  </button>
                )}
              </div>
              <div className={'right'}>
                {oneStepMovementReqHandler && (
                  <>
                    <button className={'btn btn_blue'} onClick={(e) => oneStepMovementReqHandler({ ...e, srcElement: srcElement, direction: 'up' })}>
                      위로
                    </button>
                    <button className={'btn btn_blue'} onClick={(e) => oneStepMovementReqHandler({ ...e, srcElement: srcElement, direction: 'down' })}>
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
  const [rearrangeFilesBySeqToSeq] = useCommonStore((s) => [s.rearrangeFilesBySeqToSeq]);

  const onToUpperReqEmerged = (event: ToUpperReqEvent) => {
    // 최상단 이동 요청 처리(fileSeq 업데이트 동작)

    if (event.srcElement.fileSeq) {
      rearrangeFilesBySeqToSeq({
        fileId: srcInfo?.fileId,
        fromSeq: event.srcElement.fileSeq,
        stepsToMove: -(event.srcElement.fileSeq - 1), // 최상단 영역으로 이동하고자 하므로 이동하고자 하는 step 또한 fileSeq - 1 에 대응됨
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
                // oneStepMovementReqHandler={(event) => {
                //   on(event);
                // }}
              />
            ))}
        </div>
      </div>
      <div className={'bottom'}>{children}</div>
    </div>
  );
};

export default SrcEnumerator;
