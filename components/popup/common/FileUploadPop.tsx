import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { PopupContent } from '@/components/popup/PopupContent';
import { PopupFooter } from '@/components/popup/PopupFooter';
import { authApi } from '@/libs';
import { toastError, toastSuccess } from '@/components/ToastMessage';
import { CommonResponseFileDown } from '@/generated';
import { PopupLayout } from '@/components/popup/PopupLayout';

interface LimitationOnImg {
  maxWidth?: number;
  maxHeight?: number;
}

// 파일과 미리보기 URL을 함께 관리하기 위한 인터페이스
interface UploadFile {
  file: File;
  preview?: string;
  name: string;
}

interface FileUploadPopProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (fileInfo: CommonResponseFileDown) => void;
  onlyImg?: boolean;
  fileId?: number;
  limOnImg?: LimitationOnImg;
  // imageFileWidth?: number;
  // imageFileHeight?: number;
}

export const FileUploadPop = ({ open, onClose, onSuccess, onlyImg = false, fileId, limOnImg }: FileUploadPopProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const generatedId = useId();
  const uniqueId = `fileInp-${generatedId}`;

  /** 상태 관리 - 배열로 변경 */
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 닫힘 및 초기화 핸들러
  const onCloseCommonHandler = () => {
    // 메모리 누수 방지를 위한 ObjectURL 해제
    files.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setFiles([]);
    setIsDragging(false);
    onClose();
  };

  // 파일 검증 및 추가 공통 로직
  const processFiles = (selectedFiles: File[]) => {
    const validFiles: UploadFile[] = [];

    for (const file of selectedFiles) {
      if (onlyImg && !file.type.startsWith('image/')) {
        toastError(`${file.name}은(는) 이미지 파일이 아닙니다.`);
        continue;
      }

      validFiles.push({
        file,
        name: file.name,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      });
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  // 1. 클릭 업로드 핸들러
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
    // 동일 파일 재선택 가능하도록 초기화
    e.target.value = '';
  };

  // 2. 클립보드 붙여넣기 (Ctrl+V)
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const blob = item.getAsFile();
        if (blob) {
          const ext = item.type.split('/')[1] || 'png';
          const fileName = `clipboard_${Date.now()}.${ext === 'png' ? 'png' : 'png'}`;
          imageFiles.push(new File([blob], fileName, { type: 'image/png' }));
        }
      }
    }
    if (imageFiles.length > 0) processFiles(imageFiles);
  }, [processFiles]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [open, handlePaste]);

  // 3. 드래그 앤 드롭 핸들러
  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  // 3. 파일 개별 삭제
  const handleRemoveFile = (index: number) => {
    setFiles((prev) => {
      const target = prev[index];
      if (target.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // 4. 서버 전송
  const handleUpload = (e: React.MouseEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      toastError('선택된 파일이 없습니다.');
      return;
    }
    if (isUploading) return;

    const formData = new FormData();
    files.forEach((f) => {
      formData.append('uploadFiles', f.file);
    });

    if (fileId) {
      formData.append('fileId', fileId.toString());
    }

    setIsUploading(true);
    authApi
      .post('/common/imgfile/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((response) => {
        if (response.data.resultCode === 200) {
          const body = response.data.body;
          const first = Array.isArray(body) ? body[0] : body;
          if (onSuccess) onSuccess(first);
          toastSuccess('성공적으로 업로드되었습니다.');
          onCloseCommonHandler();
        } else {
          toastError(response.data.resultMessage);
        }
      })
      .catch((error) => {
        console.error(error);
        toastError('업로드 중 오류가 발생했습니다.');
      })
      .finally(() => {
        setIsUploading(false);
      });
  };

  return (
    <PopupLayout
      width={800}
      open={open}
      isEscClose={true}
      title={onlyImg ? '이미지 업로드' : '파일 및 이미지 업로드'}
      onClose={onCloseCommonHandler}
      footer={
        <PopupFooter>
          <div className={'btnArea'}>
            <button className={'btn'} onClick={handleUpload} disabled={isUploading} style={{ opacity: isUploading ? 0.6 : 1, cursor: isUploading ? 'not-allowed' : 'pointer' }}>
              {isUploading ? '업로드 중...' : (onlyImg ? '이미지 업로드' : '파일 업로드')}
            </button>
            <button className={'btn'} onClick={onCloseCommonHandler}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div
          className={`fileBoxDiv multi ${files.length > 0 ? 'hasFiles' : ''} ${isDragging ? 'isDragging' : ''}`}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <input
            ref={inputRef}
            type="file"
            id={uniqueId}
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            multiple // 멀티 선택 활성화
          />

          <div className="uploadPrompt">
            <span className="ico_upload"></span>
            <p>{onlyImg ? '이미지 드래그, 클릭, 또는 Ctrl+V로 붙여넣기' : '파일 드래그, 클릭, 또는 Ctrl+V로 붙여넣기'}</p>
            <label htmlFor={uniqueId} className="btn_upload_label">
              {onlyImg ? '이미지 선택' : '파일 선택'}
            </label>
          </div>

          {/* 2. 파일 목록 렌더링 부분 수정 */}
          {files.length > 0 && (
            <ul className="imagePreview" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {files.map((fileItem, index) => (
                <li key={`${fileItem.name}-${index}`} style={{ width: '120px' }}>
                  <div
                    className="thumb"
                    style={{
                      width: '120px',
                      height: '120px',
                      overflow: 'hidden',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                    }}
                  >
                    {fileItem.preview ? (
                      <img src={fileItem.preview} alt="미리보기" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ padding: '20px', textAlign: 'center' }}>No Image</div>
                    )}
                  </div>
                  <div className="info" style={{ marginTop: '5px' }}>
                    <span
                      className="name"
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fileItem.name}
                    </span>
                    <button type="button" onClick={() => handleRemoveFile(index)} style={{ fontSize: '11px', cursor: 'pointer' }}>
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopupContent>
    </PopupLayout>
  );
};
