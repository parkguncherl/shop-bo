import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { Menu } from '../../../generated';
import { useMypageStore } from '../../../stores';

type ICellRendererType = ICellRendererParams;

interface Props extends ICellRendererType {
  title: string;
  styles: React.CSSProperties;
  onClick: () => void;
  data: Menu;
}

/** mypage - 사용자 권한관리 : 권한 Cell Renderer*/
export const UserAuthsCellRenderer = ({ title, styles, onClick, data }: Props) => {
  const [openModal] = useMypageStore((s) => [s.openModal]);

  return (
    <div
      style={{
        padding: '2px',
        fontSize: '11px',
        fontWeight: '300',
        margin: '0 auto',
        ...styles,
      }}
      onClick={() => {
        openModal('USER_AUTH_MOD');
      }}
    >
      <button className={'tblBtn'} onClick={onClick} style={{ width: '100%' }}>
        {title || '미리보기'}
      </button>
    </div>
  );
};
