'use client';

import React, { useEffect, useState } from 'react';
import { PopupLayout } from '../../PopupLayout';
import { PopupContent } from '../../PopupContent';
import { PopupFooter } from '../../PopupFooter';
import { authApi } from '../../../../libs';
import { toastError, toastSuccess } from '../../../ToastMessage';
import type { NoticeItem } from '../../../../app/(app)/market/Notice/NoticeMng';

interface Props {
  open: boolean;
  item: NoticeItem;
  onClose: () => void;
  onSuccess: () => void;
}

const NoticeMngModPop = ({ open, item, onClose, onSuccess }: Props) => {
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle(item.title ?? '');
  }, [open, item]);

  const handleClose = () => onClose();

  const handleSave = async () => {
    if (!title.trim()) { toastError('제목을 입력해주세요.'); return; }
    const { data } = await authApi.put('/noticeMng/update', {
      id: item.id,
      title,
    });
    if (data?.resultCode === 200) {
      toastSuccess('수정되었습니다.');
      onSuccess();
    } else {
      toastError(data?.resultMessage ?? '수정 중 오류가 발생했습니다.');
    }
  };

  return (
    <PopupLayout
      width={600}
      open={open}
      title="공지사항 수정"
      onClose={handleClose}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn btnPurple" onClick={handleSave}>저장</button>
            <button className="btn" onClick={handleClose}>닫기</button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <table className="formTable">
          <tbody>
            <tr>
              <th>제목 *</th>
              <td>
                <input
                  className="inputBox"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목을 입력하세요"
                  style={{ width: '100%' }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </PopupContent>
    </PopupLayout>
  );
};

export default NoticeMngModPop;
