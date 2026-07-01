'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

const DARK_ANT_STYLE_ID = 'dark-ant-override';

const darkAntStyles = `
  /* ── Select ── */
  .ant-select-selector {
    background: #252538 !important;
    background-color: #252538 !important;
    border-color: rgba(255,255,255,0.45) !important;
    color: #d0d0e0 !important;
  }
  .ant-select-selection-item,
  .ant-select-selection-placeholder,
  .ant-select-selection-search-input {
    color: #d0d0e0 !important;
  }
  .ant-select-arrow { color: #888899 !important; }
  .ant-select-dropdown {
    background-color: #252538 !important;
    border: 1px solid #333350 !important;
  }
  .ant-select-item {
    color: #d0d0e0 !important;
    background-color: #252538 !important;
  }
  .ant-select-item:hover,
  .ant-select-item-option-active {
    background-color: #2a2a3e !important;
  }
  .ant-select-item-option-selected {
    background-color: #2d1b69 !important;
    color: #a78bfa !important;
  }

  /* ── Modal ── */
  .ant-modal-content {
    background-color: #2a2a42 !important;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.55), 0 8px 40px rgba(0,0,0,0.65) !important;
    outline: none !important;
  }
  .ant-modal-header {
    background-color: #2a2a42 !important;
    border-bottom: 1px solid rgba(255,255,255,0.12) !important;
    margin-bottom: 0 !important;
  }
  .ant-modal-body {
    background-color: #2a2a42 !important;
  }
  .ant-modal-footer {
    background-color: #2a2a42 !important;
    border-top: 1px solid rgba(255,255,255,0.12) !important;
    margin-top: 0 !important;
  }
  .ant-modal-title {
    color: #d0d0e0 !important;
  }
  .ant-modal-close {
    color: #888899 !important;
  }
  .ant-modal-close:hover {
    background-color: rgba(255,255,255,0.08) !important;
  }
`;

function injectDarkStyle() {
  if (document.getElementById(DARK_ANT_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = DARK_ANT_STYLE_ID;
  style.textContent = darkAntStyles;
  document.head.appendChild(style);
}

function removeDarkStyle() {
  document.getElementById(DARK_ANT_STYLE_ID)?.remove();
}

export default function ThemeApplier() {
  const { data: session } = useSession();

  useEffect(() => {
    const tema = session?.user?.tema;

    if (tema === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      injectDarkStyle();

      // Ant Design이 나중에 <style> 태그를 삽입해도 우리 스타일을 맨 뒤로 이동
      const observer = new MutationObserver(() => {
        const el = document.getElementById(DARK_ANT_STYLE_ID);
        if (el && el !== document.head.lastElementChild) {
          document.head.appendChild(el);
        }
      });
      observer.observe(document.head, { childList: true });

      return () => observer.disconnect();
    } else {
      document.documentElement.removeAttribute('data-theme');
      removeDarkStyle();
    }
  }, [session]);

  return null;
}
