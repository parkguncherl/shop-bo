import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { PopupContent } from '../PopupContent';
import { PopupFooter } from '../PopupFooter';
import { authApi } from '../../../libs';
import { toastError, toastSuccess } from '../../ToastMessage';
import { CommonResponseFileDown } from '../../../generated';
import { PopupLayout } from '../PopupLayout';

interface LimitationOnImg {
  maxWidth?: number;
  maxHeight?: number;
}
interface FileUploadPopProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (fileInfo: CommonResponseFileDown) => void;
  onlyImg?: boolean;
  fileId?: number;
  limOnImg?: LimitationOnImg;
  imageFileWidth?: number; // 백앤드에서 재조정 요청코자 하는 너비
  imageFileHeight?: number; // 백앤드에서 재조정 요청코자 하는 높이
}

export const FileUploadPop = ({ open, onClose, onSuccess, onlyImg = false, fileId, limOnImg, imageFileWidth, imageFileHeight }: FileUploadPopProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  /** 공통 스토어 - State */
  const [file, setFile] = useState<File | undefined>();
  const [filePreview, setFilePreview] = useState<string | undefined>();
  const [isDragging, setIsDragging] = useState(false);
  const [limOnImgAsState, setLimOnImgAsState] = useState<LimitationOnImg | undefined>(undefined);

  useEffect(() => {
    setLimOnImgAsState(limOnImg); // 추후 필요한 조건에 따라 내부 상태는 외부에서 전달된 상태와 독립적으로 관리 가능
  }, [limOnImg]);

  // 파일 추가 동작 공통함수
  const passedFileCommonHandler = (file: File | undefined) => {
    if (file == undefined) {
      return;
    }

    // 이미지 파일 한정 속성이 참인 경우의 이미지 여부 검증 영역
    if (onlyImg && !file.type.startsWith('image/')) {
      toastError('이미지 파일 이외의 파일은 업로드할 수 없습니다.');
      return;
    }

    // 이미지 파일 관련 규제가 주어질 시
    // if (limOnImgAsState) {
    // todo
    // }
    if (file) {
      setFile(file);
      readImage(file);
    }
  };

  // 닫힘 콜백 공통 영역 핸들링
  const onCloseCommonHandler = () => {
    // state 초기화
    setFile(undefined);
    setFilePreview(undefined);
    setIsDragging(false);

    onClose();
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    passedFileCommonHandler(selectedFile); // 공통 함수 처리
  };

  const handleUpload = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!fileId) {
      console.error('업로드하고자 하는 file 영역의 식별자를 찾을 수 없음');
      return;
    }

    if (file) {
      const formData = new FormData();
      formData.append('uploadFile', file);
      formData.append('fileId', fileId ? fileId.toString() : '0'); // FormData의 append 메서드는 두 번째 파라미터가 string 또는 Blob(파일)이어야 합니다.
      if (imageFileWidth && imageFileHeight) {
        formData.append('imageFileWidth', imageFileWidth ? imageFileWidth.toString() : '0');
        formData.append('imageFileHeight', imageFileHeight ? imageFileHeight.toString() : '0');
      }

      authApi
        .post('/common/file/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data', // form Data 형식으로 요청 인자를 보내므로 반드시 명시!
          },
        })
        .then((response) => {
          if (response.data.resultCode === 200) {
            if (onSuccess) {
              onSuccess(response.data.body);
            }
            toastSuccess('업로드되었습니다.');
            onCloseCommonHandler();
          } else {
            toastError(response.data.resultMessage);
            onCloseCommonHandler();
            throw new Error(response.data.resultMessage);
          }
        })
        .catch((error) => {
          console.error(error);
          toastError(error.message);
        });
    } else {
      toastError('선택된 파일이 없습니다.');
    }
  };

  // 드래그 앤 드롭
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
    if (e.dataTransfer.files) {
      setIsDragging(true);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    setIsDragging(false);
    passedFileCommonHandler(droppedFile); // 공통 함수 처리
  };

  // 미리보기
  const readImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      if (e.target?.result) {
        setFilePreview(String(e.target.result));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setFile(undefined);
    setFilePreview(undefined);
  };

  //const uniqueId = `fileInp-${Math.random().toString(36).substr(2, 9)}`; // 고유한 id 생성 // todo substr deprecated 된 관계로 아래와 같이 대체
  const uniqueId = `fileInp-${Math.random().toString(36).slice(2, 11)}`; // 고유한 id 생성

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
            <button className={'btn'} onClick={handleUpload}>
              {onlyImg ? '이미지 업로드' : '파일 업로드'}
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
          className={`fileBoxDiv one ${file ? 'hide' : ''} ${isDragging ? 'isDragging' : ''}`}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <input ref={inputRef} type="file" id={uniqueId} onChange={handleFileInputChange} style={{ display: 'none' }} />
          <div className="">
            <span className="ico_upload"></span>
            {onlyImg ? '이미지를 드래그 하거나 클릭해주세요' : '파일을 드래그 하거나 클릭해주세요'}
            <label htmlFor={uniqueId}>{onlyImg ? '이미지 업로드' : '파일 업로드'}</label>
          </div>
          {file && (
            <ul className="imagePreview">
              <li>
                {filePreview && (
                  <div className="img">
                    <img src={filePreview} alt="파일 미리보기" />
                  </div>
                )}
                <div className="info">
                  <span>{file.name}</span>
                  <button onClick={handleRemoveFile}>삭제</button>
                </div>
              </li>
            </ul>
          )}
        </div>
      </PopupContent>
    </PopupLayout>
  );
};
