import React, { useEffect, useState } from 'react';

interface Props {
  title?: string;
  name: string;
  value?: boolean; // Switch 상태 값
  disabled?: boolean;
  onChange?: (name: string, value: boolean) => void;
  onEnter?: () => void;
  required?: boolean;
  filters?: object;
  wrapperClassNames?: string;
  keyDownEvent?: (e: React.KeyboardEvent) => void;
  checkedLabel: string; // checked 상태일 때 텍스트
  uncheckedLabel: string; // unchecked 상태일 때 텍스트
}

/**
 * antd Segmented/Switch 제거 → native 버튼 기반 세그먼트(title 있을 때) / 토글(없을 때).
 * 다크모드 `.formBox button.segBtn--active` 스타일을 재사용.
 */
const CustomSwitchComponent = ({
  title,
  name,
  value = false,
  disabled,
  onChange,
  required = false,
  wrapperClassNames,
  checkedLabel,
  uncheckedLabel,
}: Props) => {
  const [checked, setChecked] = useState(value);

  useEffect(() => {
    setChecked(value);
  }, [value]);

  const activeKey = checked ? checkedLabel : uncheckedLabel;

  const onSeg = (key: string) => {
    const next = key === checkedLabel;
    setChecked(next);
    onChange?.(name, next);
  };

  const onToggle = () => {
    const next = !checked;
    setChecked(next);
    onChange?.(name, next);
  };

  if (title) {
    return (
      <dl className={wrapperClassNames}>
        <dt>
          <label>{title}</label>
          {required && <span className="req">*</span>}
        </dt>
        <dd>
          <div className="formBox">
            <div className="segBox" style={{ display: 'inline-flex', border: '1px solid var(--dark-border, #ddd)', borderRadius: 4, overflow: 'hidden' }}>
              {[checkedLabel, uncheckedLabel].map((opt) => {
                const on = activeKey === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={disabled}
                    className={on ? 'segBtn segBtn--active' : 'segBtn'}
                    onClick={() => onSeg(opt)}
                    style={{
                      padding: '4px 14px',
                      border: 'none',
                      cursor: 'pointer',
                      background: on ? 'var(--purple, #5b21b6)' : 'var(--dark-surface, #fff)',
                      color: on ? '#fff' : 'var(--dark-text, #333)',
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </dd>
      </dl>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={checked ? 'toggleSwitch on' : 'toggleSwitch'}
      style={{
        padding: '3px 12px',
        borderRadius: 12,
        border: 'none',
        cursor: 'pointer',
        minWidth: 60,
        background: checked ? 'var(--purple, #5b21b6)' : '#bbb',
        color: '#fff',
        fontSize: 12,
      }}
    >
      {checked ? checkedLabel : uncheckedLabel}
    </button>
  );
};

export const CustomSwitch = React.memo(
  CustomSwitchComponent,
  (prev, next) =>
    prev.value === next.value &&
    prev.disabled === next.disabled &&
    prev.checkedLabel === next.checkedLabel &&
    prev.uncheckedLabel === next.uncheckedLabel &&
    prev.title === next.title &&
    prev.wrapperClassNames === next.wrapperClassNames,
);
CustomSwitch.displayName = 'CustomSwitch';
