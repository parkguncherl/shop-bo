import React, { DetailedHTMLProps, InputHTMLAttributes, useEffect, useRef, useState } from 'react';

interface NativeInputProps extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  ref?: React.RefObject<HTMLInputElement>;
}

/**
 * 26-01-27(park junsung)
 * 기본 input 태그에서 광범위하게 사용될 몇몇 기능을 일부 추가한 atom
 * */
const NativeInputAtom = ({ ref, value, onChange, ...props }: NativeInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const mirrorRef = useRef<HTMLSpanElement>(null);

  const resolvedInputRef: React.RefObject<HTMLInputElement> = ref ?? inputRef; // ref undefined 일 시 정의된 기본 참조 사용

  const syncWidth = (value: string) => {
    if (!resolvedInputRef.current || !mirrorRef.current) return;
    mirrorRef.current.textContent = value || ' '; // 비어있을 때 대비
    resolvedInputRef.current.style.width = `${mirrorRef.current.offsetWidth}px`;
  };

  useEffect(() => {
    if (value) {
      syncWidth(value.toString());
    }
  }, [value]);

  return (
    <>
      <input
        {...props}
        ref={resolvedInputRef}
        onChange={(e) => {
          syncWidth(e.target.value.toString());
          if (onChange) {
            onChange(e);
          }
        }}
        value={value}
        style={{ boxSizing: 'content-box' }}
      />

      <span
        ref={mirrorRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          whiteSpace: 'pre',
          font: 'inherit',
          padding: '0 4px',
        }}
      />
    </>
  );
};

export default NativeInputAtom;
