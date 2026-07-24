import React, { useRef, useState } from 'react';
import { useCodeStore } from '@/stores';
import { PopupContent } from '@/components/popup/PopupContent';
import { PopupSearchBox, PopupSearchType } from '@/components/popup/content';
import { PopupFooter } from '@/components/popup/PopupFooter';
import { authApi } from '@/libs';
import { toastError, toastSuccess } from '@/components/ToastMessage';
import { useQueryClient } from '@tanstack/react-query';
import { Utils } from '@/libs/utils';
import { PopupLayout } from '@/components/popup/PopupLayout';

export const CodeExcelUploadPop = () => {
  /** 코드관리 스토어 - State */
  const modalType = useCodeStore((s) => s.modalType);
  const closeModal = useCodeStore((s) => s.closeModal);

  /** 코드관리 스토어 - API */
  const excelTemplate = useCodeStore((s) => s.excelTemplate);
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | undefined>();
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile);
  };

  const handleUpload = (e: React.MouseEvent) => {
    e.preventDefault();
    const formData = new FormData();
    if (file) {
      if (Utils.isNotAllowedFileMaxSize(file)) {
        toastError('파일 사이즈가 50MB를 초과하였습니다.');
        return;
      }

      formData.append('uploadFile', file);

      authApi
        .post('/code/excel-upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        .then((response) => {
          if (response.data.resultCode === 200) {
            toastSuccess('업로드되었습니다.');
            queryClient.invalidateQueries({ queryKey: ['/code/paging'] });
            queryClient.invalidateQueries({ queryKey: ['/code/dropdown/TOP'] });
            closeModal('EXCEL');
          } else {
            toastError(response.data.resultMessage);
            closeModal('EXCEL');
            throw new Error(response.data.resultMessage);
          }
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      toastError('선택된 파일이 없습니다.');
      return;
    }
  };

  /** 엑셀 템플릿 다운로드 버튼 클릭 시 */
  const excelTemplateFn = () => {
    excelTemplate();
  };

  return (
    <PopupLayout
      width={600}
      isEscClose={true}
      open={modalType.type === 'EXCEL' && modalType.active}
      title={'엑셀 파일 업로드'}
      onClose={() => closeModal('EXCEL')}
      footer={
        <PopupFooter>
          <div className={'btnArea'}>
            <button className={'btn'} onClick={excelTemplateFn}>
              {'엑셀 템플릿 다운로드'}
            </button>
            <button className={'btn'} onClick={handleUpload}>
              {'엑셀 업로드'}
            </button>
            <button className={'btn'} onClick={() => closeModal('EXCEL')}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <PopupSearchBox>
          <PopupSearchType className={'type_1'}>
            <dl>
              <dt>
                <label>{'업로드 파일'}</label>
              </dt>
              <dd>
                <div className={'form_box'}>
                  <input ref={inputRef} type={'file'} onChange={handleFileInputChange} />
                </div>
              </dd>
            </dl>
          </PopupSearchType>
        </PopupSearchBox>
      </PopupContent>
    </PopupLayout>
  );
};
