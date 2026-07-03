'use client';

import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { PopupLayout } from '../../PopupLayout';
import { PopupContent } from '../../PopupContent';
import { PopupFooter } from '../../PopupFooter';
import PopupFormBox from '../../content/PopupFormBox';
import PopupFormGroup from '../../content/PopupFormGroup';
import PopupFormType from '../../content/PopupFormType';
import FormInput from '../../../form/FormInput';
import FormDropDown from '../../../form/FormDropDown';
import { authApi } from '../../../../libs';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { FileUploadPop } from '../../common/FileUploadPop';
import { useCommonStore } from '../../../../stores';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormFields {
  title: string;
  moveUri?: string;
  gesiYn: string;
}

const NoticeMngAddPop = ({ open, onClose, onSuccess }: Props) => {
  const getFileUrl = useCommonStore((s) => s.getFileUrl);
  const [fileId, setFileId] = useState<number | undefined>();
  const [imgPreviewUrl, setImgPreviewUrl] = useState('');
  const [filePopOpen, setFilePopOpen] = useState(false);

  const { control, handleSubmit, reset } = useForm<FormFields>({
    defaultValues: { title: '', moveUri: '', gesiYn: 'N' },
  });

  useEffect(() => {
    if (!open) {
      reset({ title: '', moveUri: '', gesiYn: 'N' });
      setFileId(undefined);
      setImgPreviewUrl('');
    }
  }, [open]);

  const handleClose = () => onClose();

  const onValid: SubmitHandler<FormFields> = async (form) => {
    const { data } = await authApi.post('/noticeMng/create', {
      noticeCd: '2',
      title: form.title,
      moveUri: form.moveUri || null,
      gesiYn: form.gesiYn,
      fileId: fileId ?? null,
    });
    if (data?.resultCode === 200) {
      toastSuccess('등록되었습니다.');
      onSuccess();
    } else {
      toastError(data?.resultMessage ?? '등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <>
      <PopupLayout
        width={600}
        open={open}
        title="공지사항 등록"
        onClose={handleClose}
        footer={
          <PopupFooter>
            <div className="btnArea between">
              <div className="left">
                <button className="btn btnPurple" onClick={handleSubmit(onValid, () => toastError('필수 항목을 확인해주세요.'))}>저장</button>
              </div>
              <div className="right">
                <button className="btn" onClick={handleClose}>닫기</button>
              </div>
            </div>
          </PopupFooter>
        }
      >
        <PopupContent>
          <PopupFormBox>
            <PopupFormGroup title="공지사항 정보">
              <PopupFormType className="type1">
                <FormInput<FormFields> control={control} name="title" label="제목" placeholder="제목을 입력하세요" required />
              </PopupFormType>
              <PopupFormType className="type1">
                <FormInput<FormFields> control={control} name="moveUri" label="이동 URL" placeholder="이미지 클릭 시 이동할 URL (선택)" />
              </PopupFormType>
              <PopupFormType className="type1">
                <FormDropDown<FormFields>
                  control={control}
                  name="gesiYn"
                  title="게시 여부"
                  options={[
                    { key: 0, value: 'Y', label: '게시' },
                    { key: 1, value: 'N', label: '미게시' },
                  ]}
                />
              </PopupFormType>
              <PopupFormType className="type1">
                <dl>
                  <dt><label>이미지</label></dt>
                  <dd>
                    <div className="formBox" style={{ display: 'flex', alignItems: 'center' }}>
                      <button className="btn" type="button" style={{ whiteSpace: 'nowrap' }} onClick={() => setFilePopOpen(true)}>
                        {fileId ? '이미지 변경' : '이미지 등록'}
                      </button>
                    </div>
                    {imgPreviewUrl && (
                      <div style={{ position: 'relative', width: 120, marginTop: 8 }}>
                        <img src={imgPreviewUrl} alt="미리보기" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 4, border: '1px solid #e0e0e0', display: 'block' }} />
                        <button
                          type="button"
                          onClick={() => { setFileId(undefined); setImgPreviewUrl(''); }}
                          style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer', lineHeight: '20px', textAlign: 'center', padding: 0 }}
                          aria-label="이미지 삭제"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </dd>
                </dl>
              </PopupFormType>
            </PopupFormGroup>
          </PopupFormBox>
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

export default NoticeMngAddPop;
