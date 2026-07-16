import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCommonStore } from '../../../../stores';

export interface SrcElement {
  fileNm?: string;
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
    onImgDoubleClick?: (event: onImgDoubleClickEvent) => void;
    delReqHandler?: (event: DelReqHandlerEvent) => void;
  };

  children?: React.ReactNode;
}
interface EnumElementProps {
  srcElement?: SrcElement;
  isFirst?: boolean;
  isLast?: boolean;
  toUpperReqHandler?: (event: ToUpperReqEvent) => void;
  oneStepMovementReqHandler?: (event: OneStepMovementReqEvent) => void;
  onImgDoubleClick?: (event: onImgDoubleClickEvent) => void;
  delReqHandler?: (event: DelReqHandlerEvent) => void;
}

interface ToUpperReqEvent extends React.MouseEvent<HTMLButtonElement, MouseEvent> {
  srcElement: SrcElement;
}
interface OneStepMovementReqEvent extends React.MouseEvent<HTMLButtonElement, MouseEvent> {
  srcElement: SrcElement;
  direction: 'up' | 'down';
}
interface onImgDoubleClickEvent extends React.MouseEvent<HTMLDivElement, MouseEvent> {
  srcElement: SrcElement;
}
interface DelReqHandlerEvent extends React.MouseEvent<HTMLButtonElement, MouseEvent> {
  srcElement: SrcElement;
}

const EnumElement = ({ srcElement, isFirst, isLast, toUpperReqHandler, oneStepMovementReqHandler, onImgDoubleClick, delReqHandler }: EnumElementProps) => {
  // 우클릭 컨텍스트 메뉴 상태 (화면 좌표)
  const [menu, setMenu] = useState<{ x: number; y: number; e: React.MouseEvent } | null>(null);

  const hasMenu = (toUpperReqHandler || oneStepMovementReqHandler || delReqHandler) && !!srcElement?.fileSrc;

  const openMenu = (e: React.MouseEvent) => {
    if (!hasMenu) return;
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, e });
  };
  const closeMenu = () => setMenu(null);

  // 메뉴 열림 시 외부 클릭 / ESC / 스크롤로 닫기
  useEffect(() => {
    if (!menu) return;
    const onDown = () => closeMenu();
    const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && closeMenu();
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onDown, true);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onDown, true);
    };
  }, [menu]);

  const run = (fn?: () => void) => {
    if (fn) fn();
    closeMenu();
  };

  return (
    <div className={'enumElement'}>
      <div className={'element_container'}>
        <div className={'element_wrapper'}>
          {srcElement?.fileSrc ? (
            <div
              className={'img_wrapper'}
              onDoubleClick={(e) => {
                if (onImgDoubleClick) onImgDoubleClick({ ...e, srcElement: srcElement });
              }}
              onContextMenu={openMenu}
            >
              <img src={srcElement.fileSrc} />
            </div>
          ) : (
            <div className={'unknown_messaging_wrapper'}>
              <p>알수 없음!</p>
            </div>
          )}
        </div>
      </div>

      {/* 우클릭 컨텍스트 메뉴 (상위 transform 영향 배제 위해 body 로 portal) */}
      {menu &&
        srcElement &&
        createPortal(
          <ul
            className={'imgContextMenu'}
            style={{ position: 'fixed', top: menu.y, left: menu.x, zIndex: 2000 }}
            onMouseDown={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            {toUpperReqHandler && <li onClick={() => run(() => toUpperReqHandler({ ...menu.e, srcElement } as ToUpperReqEvent))}>맨 위로</li>}
            {oneStepMovementReqHandler && !isFirst && (
              <li onClick={() => run(() => oneStepMovementReqHandler({ ...menu.e, srcElement, direction: 'up' } as OneStepMovementReqEvent))}>위로</li>
            )}
            {oneStepMovementReqHandler && !isLast && (
              <li onClick={() => run(() => oneStepMovementReqHandler({ ...menu.e, srcElement, direction: 'down' } as OneStepMovementReqEvent))}>아래로</li>
            )}
            {delReqHandler && (
              <li className={'danger'} onClick={() => run(() => delReqHandler({ ...menu.e, srcElement } as DelReqHandlerEvent))}>
                삭제
              </li>
            )}
          </ul>,
          document.body,
        )}
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
                isFirst={index === 0}
                isLast={index === srcInfo.srcElements.length - 1}
                toUpperReqHandler={
                  srcElement.fileSeq != undefined && srcElement.fileSeq != 1
                    ? (event) => {
                        onToUpperReqEmerged(event);
                      }
                    : undefined
                }
                oneStepMovementReqHandler={oneStepMovementReqEmerged}
                onImgDoubleClick={callBack?.onImgDoubleClick}
                delReqHandler={callBack?.delReqHandler}
              />
            ))}
        </div>
      </div>
      <div className={'bottom'}>{children}</div>
    </div>
  );
};

export default SrcEnumerator;
