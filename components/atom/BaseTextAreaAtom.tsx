import React from 'react';

export interface BaseTextAreaAtomProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  type?: 'text' | 'number' | 'email' | 'password';
  ref?: React.Ref<HTMLTextAreaElement>;
}

/**
 * antd Input.TextArea 제거 → native textarea 로 교체.
 * 기존 `.formBox textarea` scss 가 그대로 스타일링하므로 외형은 유지됨.
 */
export const BaseTextAreaAtom = ({ ref, type, autoSize, ...props }: BaseTextAreaAtomProps & { autoSize?: unknown }) => {
  return <textarea {...props} ref={ref} autoComplete="off" />;
};
