import React from 'react';
import styles from '@/styles/popup/popup.module.scss';

interface Props {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const PopupSearchBox = (props: Props) => {
  return (
    <div className={props.className ?? styles.pop_search_box} style={props.style}>
      {props.children}
    </div>
  );
};
