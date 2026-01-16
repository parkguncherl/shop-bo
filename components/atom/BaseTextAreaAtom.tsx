import React, { TextareaHTMLAttributes } from 'react';

export interface BaseTextAreaAtomProps extends TextareaHTMLAttributes<any> {
  type?: 'text' | 'number' | 'email' | 'password';
  ref?: React.Ref<HTMLTextAreaElement>;
}

export const BaseTextAreaAtom = ({ ref, ...props }: BaseTextAreaAtomProps) => {
  return (
    <>
      <textarea {...props} ref={ref} autoComplete={'off'}></textarea>
    </>
  );
};
