import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { UserResponseSelectByLoginId } from '@/generated';
import { useAccountStore, useCommonStore } from '@/stores';
import { toastError } from '@/components/ToastMessage';

type ICellRendererType = ICellRendererParams;

export interface LockCellRenderProps extends ICellRendererType {
  //title: string;
  //styles: React.CSSProperties;
  onClick?: () => void;
  data: UserResponseSelectByLoginId;
}

// todo 전역 상태 의존을 걷어내고 params 전달 기반으로 수정함, 추후 구체적 동작 요구될시 이러한 조건 하에서 구현할 것
/** 시스템 - 계정관리 : 잠금해제 Cell Renderer*/
export const LockCellRender = ({ onClick, data }: LockCellRenderProps) => {
  //console.log('LockCellRender props:', title, onClick, data.lockYn); // 확인용 로그
  /** 공통 스토어 - State */
  const [menuUpdYn, menuExcelYn] = useCommonStore((s) => [s.menuUpdYn, s.menuExcelYn]);

  /** 계정관리 스토어 - State */
  //const [openModal, setSelectedUser] = useAccountStore((s) => [s.openModal, s.setSelectedUser]);
  const [openModal] = useAccountStore((s) => [s.openModal]);

  return (
    <div
      onClick={() => {
        if (!menuUpdYn) {
          toastError('접근 권한이 없습니다.');
          return;
        }
        //setSelectedUser(data);
        openModal('UNLOCK');
      }}
    >
      {data.lockYn == 'Y' && (
        <button className={'tblBtn'} onClick={onClick} style={{ width: '100%' }}>
          잠금해제
        </button>
      )}
    </div>
  );
};
