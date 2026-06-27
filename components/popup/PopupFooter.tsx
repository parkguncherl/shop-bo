import React from 'react';
import styles from '../../styles/popup/popup.module.scss';

interface Props {
  children: React.ReactNode;
}

export const PopupFooter = (props: Props) => {
  return <div className="popupFooter">{props.children}</div>;
};
