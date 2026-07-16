import React, { ReactElement, ReactNode } from 'react';
import { IComponentProps } from '../types/IComponentProps';

type ButtonStyle = IComponentProps;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyle {
  children: ReactNode;
  loading?: boolean;
}

export const Button = ({ className, children, ...props }: ButtonProps): ReactElement => {
  return (
    <button
      type={'button'}
      //className={cx(className)}
      className={className}
      {...props}
      onClick={(e) => {
        if (props.onClick) {
          props.onClick(e);
        }
        (e.target as HTMLButtonElement).blur();
      }}
    >
      {children}
    </button>
  );
};
