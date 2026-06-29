import React from 'react';

interface Props {
  children: React.ReactNode;
  rowData?: [any];
}

export const Table = (props: Props) => {
  return <div className="gridBox">{props.children}</div>;
};
