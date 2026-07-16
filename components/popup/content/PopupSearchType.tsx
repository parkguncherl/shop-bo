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
  // 호출부는 'type_1' 같은 리터럴을 넘기지만 popup.module.scss 는 CSS 모듈이라 클래스명이 해시된다.
  // 리터럴을 해시 클래스로 매핑해 의도한 레이아웃(type_N)이 실제로 적용되도록 한다.
  const mapped = props.className
    ?.split(' ')
    .filter(Boolean)
    .map((c) => styles[c] ?? c)
    .join(' ');

  return (
    <div className={mapped} style={props.style}>
      {props.children}
    </div>
  );
};

PopupSearchType.Input = CustomInput;
PopupSearchType.DropDown = DropDown;
PopupSearchType.Bar = SearchBar;
