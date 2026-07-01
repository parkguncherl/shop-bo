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
    background-color: #1e1e30 !important;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.55), 0 8px 40px rgba(0,0,0,0.65) !important;
    outline: none !important;
  }
  .ant-modal-header {
    background-color: #1e1e30 !important;
    border-bottom: 1px solid rgba(255,255,255,0.12) !important;
    margin-bottom: 0 !important;
    padding: 20px 50px 15px !important;
  }
  .ant-modal-body {
    background-color: #1e1e30 !important;
  }
  .ant-modal-footer {
    background-color: #1e1e30 !important;
    border-top: 1px solid rgba(255,255,255,0.12) !important;
    margin-top: 0 !important;
  }
  .ant-modal-title,
  .ant-modal-title *,
  .ant-modal-header .popupHeader h3,
  .popupHeader h3,
  .popupHeader h3 * {
    color: #d0d0e0 !important;
  }
  .ant-modal-close {
    color: #888899 !important;
  }
  .ant-modal-close:hover {
    background-color: rgba(255,255,255,0.08) !important;
  }

  /* ── DatePicker Ant Design primary 변수 → 퍼플 ── */
  .ant-picker-dropdown,
  .ant-picker-panel-container {
    --ant-color-primary: #5b21b6;
    --ant-color-primary-hover: #7c3aed;
    --ant-color-primary-active: #4c1d95;
    --ant-color-primary-bg: rgba(91,33,182,0.2);
    --ant-color-primary-bg-hover: rgba(91,33,182,0.3);
    --ant-color-primary-border: #7c3aed;
    --ant-color-info: #5b21b6;
    --ant-color-info-bg: rgba(91,33,182,0.2);
  }

  /* ── DatePicker input ── */
  .ant-picker {
    background-color: #252538 !important;
    border-color: rgba(255,255,255,0.45) !important;
  }
  .ant-picker-input input {
    color: #d0d0e0 !important;
    background-color: transparent !important;
  }
  .ant-picker-input input::placeholder {
    color: #888899 !important;
  }
  .ant-picker-separator,
  .ant-picker-suffix {
    color: #888899 !important;
  }
  .ant-picker:hover,
  .ant-picker-focused {
    border-color: rgba(255,255,255,0.7) !important;
  }
  .ant-picker-focused {
    background: #252538 !important;
  }
  .ant-picker .ant-picker-input,
  .ant-picker-range .ant-picker-input,
  .ant-picker-range .ant-picker-input-active {
    background: transparent !important;
  }
  .ant-picker-active-bar {
    background: #7c3aed !important;
  }

  /* ── DatePicker dropdown panel ── */
  .ant-picker-dropdown .ant-picker-panel-container {
    background-color: #1e1e30 !important;
    border: 1px solid #333350 !important;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
  }
  .ant-picker-dropdown .ant-picker-panel {
    background-color: #1e1e30 !important;
    border-color: #333350 !important;
  }
  .ant-picker-dropdown .ant-picker-header {
    background-color: #252538 !important;
    border-bottom: 1px solid #333350 !important;
    color: #d0d0e0 !important;
  }
  .ant-picker-dropdown .ant-picker-header button {
    color: #888899 !important;
  }
  .ant-picker-dropdown .ant-picker-header button:hover {
    color: #d0d0e0 !important;
  }
  .ant-picker-dropdown .ant-picker-header-view button {
    color: #d0d0e0 !important;
  }
  .ant-picker-dropdown .ant-picker-header-view button:hover {
    color: #a78bfa !important;
  }
  .ant-picker-dropdown .ant-picker-content th {
    color: #888899 !important;
  }
  .ant-picker-dropdown .ant-picker-cell {
    color: #555570 !important;
  }
  .ant-picker-dropdown .ant-picker-cell-in-view {
    color: #d0d0e0 !important;
  }
  .ant-picker-dropdown .ant-picker-cell:hover .ant-picker-cell-inner {
    background-color: #2a2a42 !important;
  }
  .ant-picker-dropdown .ant-picker-cell-selected .ant-picker-cell-inner,
  .ant-picker-dropdown .ant-picker-cell-range-start .ant-picker-cell-inner,
  .ant-picker-dropdown .ant-picker-cell-range-end .ant-picker-cell-inner,
  .ant-picker-dropdown td.ant-picker-cell-range-start .ant-picker-cell-inner,
  .ant-picker-dropdown td.ant-picker-cell-range-end .ant-picker-cell-inner,
  .ant-picker-dropdown td.ant-picker-cell-selected .ant-picker-cell-inner {
    background: transparent !important;
    background-color: transparent !important;
    box-shadow: inset 0 0 0 2px rgba(255,255,255,0.75) !important;
    color: #ffffff !important;
    font-weight: 700 !important;
  }
  .ant-picker-dropdown .ant-picker-cell-today .ant-picker-cell-inner::before {
    border-color: #a78bfa !important;
  }
  .ant-picker-dropdown .ant-picker-cell-in-range .ant-picker-cell-inner {
    background: transparent !important;
  }
  .ant-picker-dropdown .ant-picker-cell-in-range::before,
  .ant-picker-dropdown .ant-picker-cell-range-start:not(.ant-picker-cell-range-start-single)::before,
  .ant-picker-dropdown .ant-picker-cell-range-end:not(.ant-picker-cell-range-end-single)::before,
  .ant-picker-dropdown .ant-picker-range-wrapper .ant-picker-cell-in-range::before,
  .ant-picker-dropdown .ant-picker-range-wrapper .ant-picker-cell-range-start::before,
  .ant-picker-dropdown .ant-picker-range-wrapper .ant-picker-cell-range-end::before {
    background: rgba(91,33,182,0.25) !important;
  }
  .ant-picker-dropdown .ant-picker-cell-range-hover::before,
  .ant-picker-dropdown .ant-picker-cell-range-hover-start::before,
  .ant-picker-dropdown .ant-picker-cell-range-hover-end::before {
    background: rgba(91,33,182,0.4) !important;
    border-color: #7c3aed !important;
  }

  /* ── DatePicker 날짜 툴팁 ── */
  .ant-picker-dropdown [class*="ant-picker"][class*="date-panel"] .ant-picker-cell:hover + div,
  .ant-picker-panel-container [class*="tooltip"],
  .ant-tooltip .ant-tooltip-inner {
    background-color: #252538 !important;
    color: #d0d0e0 !important;
  }
  .ant-tooltip .ant-tooltip-arrow::before {
    background-color: #252538 !important;
  }
  .ant-picker-dropdown .ant-picker-footer {
    background-color: #1e1e30 !important;
    border-top: 1px solid #333350 !important;
  }
  .ant-picker-dropdown .ant-picker-today-btn {
    color: #a78bfa !important;
  }
  .ant-picker-dropdown .ant-picker-today-btn:hover {
    color: #c4b5fd !important;
  }
  .ant-picker-dropdown .ant-picker-decade-panel,
  .ant-picker-dropdown .ant-picker-year-panel,
  .ant-picker-dropdown .ant-picker-quarter-panel,
  .ant-picker-dropdown .ant-picker-month-panel,
  .ant-picker-dropdown .ant-picker-week-panel,
  .ant-picker-dropdown .ant-picker-date-panel,
  .ant-picker-dropdown .ant-picker-time-panel {
    background-color: #1e1e30 !important;
  }
  .ant-picker-dropdown .ant-picker-time-panel-column > li.ant-picker-time-panel-cell .ant-picker-time-panel-cell-inner {
    color: #d0d0e0 !important;
  }
  .ant-picker-dropdown .ant-picker-time-panel-column > li.ant-picker-time-panel-cell-selected .ant-picker-time-panel-cell-inner {
    background-color: #2d1b69 !important;
  }
  .ant-picker-range-arrow::before {
    background-color: #252538 !important;
  }

  /* ── 주간 모드 선택된 주 row 배경 ── */
  .ant-picker-dropdown .ant-picker-week-panel-row-selected,
  .ant-picker-dropdown .ant-picker-week-panel-row-selected:hover {
    --ant-color-primary-bg: rgba(91,33,182,0.25) !important;
  }
  .ant-picker-dropdown .ant-picker-week-panel-row-selected td,
  .ant-picker-dropdown .ant-picker-week-panel-row-selected:hover td {
    background-color: rgba(91,33,182,0.25) !important;
  }
  .ant-picker-dropdown .ant-picker-week-panel-row-selected td::before,
  .ant-picker-dropdown .ant-picker-week-panel-row-selected:hover td::before {
    background-color: rgba(91,33,182,0.25) !important;
  }
  .ant-picker-dropdown .ant-picker-week-panel-row-selected td.ant-picker-cell-week,
  .ant-picker-dropdown .ant-picker-week-panel-row-selected:hover td.ant-picker-cell-week {
    color: #a78bfa !important;
  }
  .ant-picker-dropdown .ant-picker-week-panel-row-selected td .ant-picker-cell-inner,
  .ant-picker-dropdown .ant-picker-week-panel-row-selected:hover td .ant-picker-cell-inner {
    color: #d0d0e0 !important;
    background-color: transparent !important;
  }
  .ant-picker-dropdown .ant-picker-week-panel-row-selected td.ant-picker-cell-selected .ant-picker-cell-inner,
  .ant-picker-dropdown .ant-picker-week-panel-row-selected td.ant-picker-cell-range-start .ant-picker-cell-inner,
  .ant-picker-dropdown .ant-picker-week-panel-row-selected td.ant-picker-cell-range-end .ant-picker-cell-inner,
  .ant-picker-dropdown .ant-picker-week-panel .ant-picker-cell-selected .ant-picker-cell-inner,
  .ant-picker-dropdown .ant-picker-week-panel .ant-picker-cell-range-start .ant-picker-cell-inner,
  .ant-picker-dropdown .ant-picker-week-panel .ant-picker-cell-range-end .ant-picker-cell-inner {
    background: transparent !important;
    background-color: transparent !important;
    box-shadow: inset 0 0 0 2px rgba(255,255,255,0.75) !important;
    color: #ffffff !important;
    font-weight: 700 !important;
  }

  /* ── DatePicker 확인(ok) 버튼 ── */
  .ant-picker-dropdown .ant-picker-ok .ant-btn,
  .ant-picker-dropdown .ant-picker-ok button {
    background-color: #5b21b6 !important;
    border-color: #5b21b6 !important;
    color: #fff !important;
  }
  .ant-picker-dropdown .ant-picker-ok .ant-btn:hover,
  .ant-picker-dropdown .ant-picker-ok button:hover {
    background-color: #7c3aed !important;
    border-color: #7c3aed !important;
  }

  /* ── DatePicker 월/연/연대 패널 셀 (SCSS background:#fff 오버라이드) ── */
  .ant-picker-panel-layout .ant-picker-panel div[class*="ant-picker-"][class*="-panel"].ant-picker-month-panel .ant-picker-body .ant-picker-content tbody tr td .ant-picker-cell-inner,
  .ant-picker-panel-layout .ant-picker-panel div[class*="ant-picker-"][class*="-panel"].ant-picker-year-panel .ant-picker-body .ant-picker-content tbody tr td .ant-picker-cell-inner,
  .ant-picker-panel-layout .ant-picker-panel div[class*="ant-picker-"][class*="-panel"].ant-picker-decade-panel .ant-picker-body .ant-picker-content tbody tr td .ant-picker-cell-inner {
    background-color: #252538 !important;
    color: #888899 !important;
  }
  .ant-picker-panel-layout .ant-picker-panel div[class*="ant-picker-"][class*="-panel"].ant-picker-month-panel .ant-picker-body .ant-picker-content tbody tr td.ant-picker-cell-in-view .ant-picker-cell-inner,
  .ant-picker-panel-layout .ant-picker-panel div[class*="ant-picker-"][class*="-panel"].ant-picker-year-panel .ant-picker-body .ant-picker-content tbody tr td.ant-picker-cell-in-view .ant-picker-cell-inner,
  .ant-picker-panel-layout .ant-picker-panel div[class*="ant-picker-"][class*="-panel"].ant-picker-decade-panel .ant-picker-body .ant-picker-content tbody tr td.ant-picker-cell-in-view .ant-picker-cell-inner {
    color: #d0d0e0 !important;
  }
  .ant-picker-panel-layout .ant-picker-panel div[class*="ant-picker-"][class*="-panel"].ant-picker-month-panel .ant-picker-body .ant-picker-content tbody tr td:hover .ant-picker-cell-inner,
  .ant-picker-panel-layout .ant-picker-panel div[class*="ant-picker-"][class*="-panel"].ant-picker-year-panel .ant-picker-body .ant-picker-content tbody tr td:hover .ant-picker-cell-inner,
  .ant-picker-panel-layout .ant-picker-panel div[class*="ant-picker-"][class*="-panel"].ant-picker-decade-panel .ant-picker-body .ant-picker-content tbody tr td:hover .ant-picker-cell-inner {
    background-color: #2a2a42 !important;
    color: #d0d0e0 !important;
  }

  /* ── DatePicker 헤더 네비 화살표 SVG 반전 (검은 SVG → 밝게) ── */
  .ant-picker-dropdown .ant-picker-header button.ant-picker-header-prev-btn::before,
  .ant-picker-dropdown .ant-picker-header button.ant-picker-header-super-prev-btn::before,
  .ant-picker-dropdown .ant-picker-header button.ant-picker-header-next-btn::before,
  .ant-picker-dropdown .ant-picker-header button.ant-picker-header-super-next-btn::before {
    filter: invert(1) !important;
  }

  /* ── DatePicker 확인 버튼 (typeBox) ── */
  .ant-picker-dropdown .typeBox {
    background-color: #1e1e30 !important;
    border-top: 1px solid #333350 !important;
  }
  .ant-picker-dropdown .typeBox button {
    background-color: #2d1b69 !important;
    color: #d0d0e0 !important;
    border: 1px solid #5b21b6 !important;
    border-radius: 4px !important;
    padding: 2px 12px !important;
    cursor: pointer !important;
  }
  .ant-picker-dropdown .typeBox button:hover {
    background-color: #5b21b6 !important;
    color: #fff !important;
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
