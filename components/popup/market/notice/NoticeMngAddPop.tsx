'use client';

import React, { useState } from 'react';
import { PopupLayout } from '../../PopupLayout';
import { PopupContent } from '../../PopupContent';
import { PopupFooter } from '../../PopupFooter';
import { authApi } from '../../../../libs';
import { toastError, toastSuccess } from '../../../ToastMessage';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const NoticeMngAddPop = ({ open, onClose, onSuccess }: Props) => {
  const [title, setTitle] = useState('');
  const [noticeCntn, setNoticeCntn] = useState('');

  const handleClose = () => {
    setTitle('');
    setNoticeCntn('');
    onClose();
  };

  const handleSave = async () => {
    if (!title.trim()) { toastError('제목을 입력해주세요.'); return; }
    const { data } = await authApi.post('/noticeMng/create', {
      noticeCd: '2',
      title,
      noticeCntn: noticeCntn || null,
    });
    if (data?.resultCode === 200) {
      toastSuccess('등록되었습니다.');
      onSuccess();
    } else {
      toastError(data?.resultMessage ?? '등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <PopupLayout
      width={600}
      open={open}
      title="공지사항 등록"
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
            <tr>
              <th>내용</th>
              <td>
                <textarea
                  className="inputBox"
                  value={noticeCntn}
                  onChange={(e) => setNoticeCntn(e.target.value)}
                  placeholder="내용을 입력하세요"
                  rows={8}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </PopupContent>
    </PopupLayout>
  );
};

export default NoticeMngAddPop;
