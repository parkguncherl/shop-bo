import React from 'react';

type Props = {
  label?: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children?: React.ReactNode;
};

/**
 * antd Checkbox 제거 → native checkbox.
 * onChange 는 native ChangeEvent(e.target.checked) 를 전달.
 */
export const CheckBox = ({ label, checked, onChange, children }: Props) => {
  return (
    <label className="checkBox" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
      <input type="checkbox" checked={!!checked} onChange={onChange} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} />
      <span>
        {label} {children}
      </span>
    </label>
  );
};
