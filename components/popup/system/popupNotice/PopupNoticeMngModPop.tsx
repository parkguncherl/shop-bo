'use client';

import React, { useEffect, useState } from 'react';
import { PopupLayout } from '../../PopupLayout';
import { PopupContent } from '../../PopupContent';
import { PopupFooter } from '../../PopupFooter';
import { authApi } from '../../../../libs';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { FileUploadPop } from '../../common/FileUploadPop';
import { useCommonStore } from '../../../../stores';
import type { PopupNoticeItem } from '../../../../app/(app)/system/popupNoticeMng/PopupNoticeMng';

interface Props {
  open: boolean;
  item: PopupNoticeItem;
  onClose: () => void;
  onSuccess: () => void;
}

const PopupNoticeMngModPop = ({ open, item, onClose, onSuccess }: Props) => {
  const getFileUrl = useCommonStore((s) => s.getFileUrl);
  const [title, setTitle] = useState('');
  const [fileId, setFileId] = useState<number | undefined>();
  const [imgPreviewUrl, setImgPreviewUrl] = useState<string>('');
  const [moveUri, setMoveUri] = useState('');
  const [gesiYn, setGesiYn] = useState('N');
  const [filePopOpen, setFilePopOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(item.title ?? '');
    setFileId(item.fileId);
    setMoveUri(item.moveUri ?? '');
    setGesiYn(item.gesiYn ?? 'N');
    setImgPreviewUrl('');

    if (item.fileId) {
      authApi.get(`/common/file/${item.fileId}`).then(({ data }) => {
        const fileList = data?.body ?? [];
        if (fileList.length > 0 && fileList[0].sysFileNm) {
          getFileUrl(fileList[0].sysFileNm).then((url: string) => setImgPreviewUrl(url));
        }
      }).catch(() => {});
    }
  }, [open, item]);

  const handleClose = () => {
    onClose();
  };

  const handleSave = async () => {
    if (!title.trim()) { toastError('제목을 입력해주세요.'); return; }
    if (!fileId) { toastError('이미지를 등록해주세요.'); return; }
    const { data } = await authApi.put('/popupNoticeMng/update', {
      id: item.id, title, fileId, moveUri: moveUri || null, gesiYn,
    });
    if (data?.resultCode === 200) {
      toastSuccess('수정되었습니다.');
      onSuccess();
    } else {
      toastError(data?.resultMessage ?? '수정 중 오류가 발생했습니다.');
    }
  };

  return (
    <>
      <PopupLayout
        width={520}
        open={open}
        title="팝업 공지사항 수정"
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
                <th>이미지 *</th>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {imgPreviewUrl && (
                      <img src={imgPreviewUrl} alt="미리보기" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid #e0e0e0' }} />
                    )}
                    <button className="btn btnGray" onClick={() => setFilePopOpen(true)}>
                      {fileId ? '이미지 변경' : '이미지 등록'}
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <th>이동 URL</th>
                <td>
                  <input
                    className="inputBox"
                    value={moveUri}
                    onChange={(e) => setMoveUri(e.target.value)}
                    placeholder="클릭 시 이동할 URL (선택)"
                    style={{ width: '100%' }}
                  />
                </td>
              </tr>
              <tr>
                <th>게시 여부</th>
                <td>
                  <input
                    type="checkbox"
                    checked={gesiYn === 'Y'}
                    style={{ width: 16, height: 16, accentColor: '#4f46e5', cursor: 'pointer' }}
                    onChange={(e) => setGesiYn(e.target.checked ? 'Y' : 'N')}
                  />
                  <span style={{ marginLeft: 6, fontSize: 13 }}>게시</span>
                </td>
              </tr>
            </tbody>
          </table>
        </PopupContent>
      </PopupLayout>

      <FileUploadPop
        open={filePopOpen}
        onlyImg={true}
        onClose={() => setFilePopOpen(false)}
        onSuccess={async (fileInfo) => {
          if (fileInfo?.fileId) setFileId(fileInfo.fileId as unknown as number);
          if (fileInfo?.sysFileNm) {
            const url = await getFileUrl(fileInfo.sysFileNm as unknown as string);
            setImgPreviewUrl(url);
          }
          setFilePopOpen(false);
        }}
      />
    </>
  );
};

export default PopupNoticeMngModPop;
