import React from 'react';
import styles from '../../../styles/popup/popup.module.scss';
import { CustomInput } from '../../CustomInput';
import { DropDown } from '../../DropDown';
import SearchBar from '../../search/SearchBar';


interface Props {
  className: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const PopupSearchType = (props: Props) => {
  return (
    <div className={props.className} style={props.style}>
      {props.children}
    </div>
  );
};

PopupSearchType.Input = CustomInput;
PopupSearchType.DropDown = DropDown;
PopupSearchType.Bar = SearchBar;
