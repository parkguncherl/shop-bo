import React from 'react';
import { DropDownOption } from '../../types/DropDownOptions';
import DropDownAtom from '../atom/DropDownAtom';

interface Props {
  title?: string;
  name: string;
  options?: DropDownOption[];
  value?: string;
  onChangeOptions?: (name: string, value: string | number) => void;
  onReset?: () => void;
}

export const TitleCategory = ({ title = '전체', name, options, value = 'TOP', onChangeOptions, onReset }: Props) => {
  return (
    <div className="titleCategoryBox">
      <div className="labelWrap">
        <span className="txt" dangerouslySetInnerHTML={{ __html: title }} onClick={onReset}></span>
        <span className="arrow"></span>
      </div>
      <DropDownAtom value={value} options={options} name={name} onChangeOptions={onChangeOptions} dropDownStyle={{ width: '150px' }} />
    </div>
  );
};
