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
  toUpperReqHandler?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

interface ToUpperReqEvent extends React.MouseEvent<HTMLButtonElement, MouseEvent> {
  srcElement: SrcElement;
}

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

const SrcEnumerator = ({ srcInfo, title, callBack, children }: SrcEnumeratorProps) => {
  const [rearrangeFilesBySeqToSeq] = useCommonStore((s) => [s.rearrangeFilesBySeqToSeq]);

  const onToUpperReqEmerged = (event: ToUpperReqEvent) => {
    // 최상단 이동 요청 처리(fileSeq 업데이트 동작)
    rearrangeFilesBySeqToSeq({
      fileId: srcInfo?.fileId,
      fromSeq: event.srcElement.fileSeq,
      toSeq: 1, // 최상단 영역으로 이동하고자 하므로
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
                        onToUpperReqEmerged({
                          ...event,
                          srcElement: srcElement,
                        });
                      }
                    : undefined
                }
              />
            ))}
        </div>
      </div>
      <div className={'bottom'}>{children}</div>
    </div>
  );
};

export default SrcEnumerator;
