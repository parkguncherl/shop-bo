'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * antd Modal 제거용 경량 심(shim).
 * antd Modal 과 동일한 DOM 구조/클래스명(`ant-modal-*`)을 렌더하여
 * 기존 팝업 scss(.popUpGroup, .popBody, .ant-modal-* 오버라이드)와
 * react-draggable(handle=".ant-modal-header")이 그대로 동작하게 함.
 * 레이아웃 기본 CSS 는 globals.css 의 `.ant-modal-*` 규칙이 제공.
 */
export interface ModalShimProps {
  open?: boolean;
  onCancel?: (e: React.MouseEvent | React.KeyboardEvent) => void;
  width?: number | string;
  height?: number;
  centered?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  closeIcon?: React.ReactNode;
  closable?: boolean;
  maskClosable?: boolean;
  keyboard?: boolean;
  destroyOnHidden?: boolean;
  modalRender?: (content: React.ReactNode) => React.ReactNode;
  children?: React.ReactNode;
}

const hasFooter = (footer: React.ReactNode) => footer != null && footer !== true && footer !== false;

// 모달이 열릴 때마다 증가하는 전역 z-index seed. 나중에 열린(중첩) 모달이 항상 위에 오도록 보장.
let zSeed = 1000;

export const Modal = ({
  open = false,
  onCancel,
  width,
  centered = true,
  className = '',
  style,
  title,
  footer,
  closeIcon,
  closable = true,
  maskClosable = false,
  modalRender,
  children,
}: ModalShimProps) => {
  const [mounted, setMounted] = useState(false);
  const [zIndex, setZIndex] = useState(1000);
  useEffect(() => setMounted(true), []);

  // 열릴 때마다 더 높은 z-index 부여 (중첩 모달이 부모 위에 오도록)
  useEffect(() => {
    if (open) {
      zSeed += 10;
      setZIndex(zSeed);
    }
  }, [open]);

  if (!mounted || !open) return null;

  const content = (
    <div className="ant-modal-content">
      {closable && (
        <button
          type="button"
          className="ant-modal-close"
          aria-label="Close"
          onClick={(e) => onCancel?.(e)}
        >
          <span className="ant-modal-close-x">{closeIcon ?? '×'}</span>
        </button>
      )}
      {title != null && (
        <div className="ant-modal-header">
          <div className="ant-modal-title">{title}</div>
        </div>
      )}
      <div className="ant-modal-body">{children}</div>
      {hasFooter(footer) && <div className="ant-modal-footer">{footer}</div>}
    </div>
  );

  return createPortal(
    <div className="ant-modal-root">
      <div className="ant-modal-mask" style={{ zIndex }} />
      <div
        className={`ant-modal-wrap ${centered ? 'ant-modal-centered' : ''}`}
        style={{ zIndex }}
        onClick={(e) => {
          if (maskClosable && e.target === e.currentTarget) {
            onCancel?.(e);
          }
        }}
      >
        <div className={`ant-modal ${className}`} style={{ width, ...style }}>
          {modalRender ? modalRender(content) : content}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
