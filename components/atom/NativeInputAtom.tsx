import React, { DetailedHTMLProps, InputHTMLAttributes, useEffect, useRef, useState } from 'react';

interface NativeInputProps extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  ref?: React.RefObject<HTMLInputElement>;
}

/**
 * 26-01-27(park junsung)
 * 기본 input 태그에서 광범위하게 사용될 몇몇 기능을 일부 추가한 atom
 * */
const NativeInputAtom = ({ ref, value, onChange, placeholder, ...props }: NativeInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const mirrorRef = useRef<HTMLSpanElement>(null);

  const resolvedInputRef: React.RefObject<HTMLInputElement> = ref ?? inputRef; // ref undefined 일 시 정의된 기본 참조 사용

  const syncWidth = (value: string | undefined, placeholder: string | undefined) => {
    if (!resolvedInputRef.current || !mirrorRef.current) return;
    mirrorRef.current.textContent = value || placeholder || ' '; // 비어있을 때 대비
    resolvedInputRef.current.style.width = `${mirrorRef.current.offsetWidth}px`;
  };

  useEffect(() => {
    syncWidth(value?.toString(), placeholder);
  }, [value, placeholder]);

  return (
    <>
      <input
        {...props}
        ref={resolvedInputRef}
        onChange={(e) => {
          syncWidth(e.target.value.toString(), placeholder);
          if (onChange) {
            onChange(e);
          }
        }}
        value={value}
        style={{ boxSizing: 'content-box' }}
        placeholder={placeholder}
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
