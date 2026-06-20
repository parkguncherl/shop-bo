import ModalLayout from './ModalLayout';
import React, { PropsWithChildren } from 'react';
import { PopupFooter } from './popup';
import styled from 'styled-components';
import Image from 'next/image';
import ConfirmIcon from '../public/ico/ico_confirm.svg';

interface Props {
  dispTitle?: string;
  open: boolean;
  width?: number;
  style?: React.CSSProperties;
  onConfirm?: () => void;
  onClose?: () => void;
  isLoading?: boolean;
}
export function DeleteConfirmModal({ dispTitle, open, width, style, onConfirm, onClose, isLoading }: PropsWithChildren<Props>) {
  return (
    <ModalLayout
      open={open}
      title={''}
      width={width ?? 500}
      footer={
        <PopupFooter>
          <div className={'btnArea'}>
            {isLoading ? (
              <button className={'btn'}>{'처리중'}</button>
            ) : (
              <button className={'btn btnBlue'} onClick={onConfirm}>
                {'확인'}
              </button>
            )}
          </div>
          <div className={'btnArea'}>
            <button className={'btn'} onClick={onClose}>
              {'취소'}
            </button>
          </div>
        </PopupFooter>
      }
      onClose={onClose}
    >
      <Container>
        <Image src={ConfirmIcon} alt={''} style={{ width: 50, height: 50, marginBottom: '10px' }} />
        <div style={{ whiteSpace: 'pre-wrap', textAlign: 'center' }}>{dispTitle || '삭제하시겠습니까?'}</div>
      </Container>
    </ModalLayout>
  );
}

const Container = styled.div`
  display: flex;
  align-items: center;
  height: 100px;
  justify-content: space-around;
  flex-direction: column;
`;
