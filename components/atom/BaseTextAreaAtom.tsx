import React from 'react';
import { Input } from 'antd';
import { TextAreaProps } from 'antd/es/input';

export interface BaseTextAreaAtomProps extends TextAreaProps {
  type?: 'text' | 'number' | 'email' | 'password';
  ref?: React.Ref<HTMLTextAreaElement>;
}

export const BaseTextAreaAtom = ({ ref, ...props }: BaseTextAreaAtomProps) => {
  const { TextArea } = Input;
  return (
    <>
      <TextArea {...props} ref={ref} autoComplete={'off'}></TextArea>
    </>
  );
};
