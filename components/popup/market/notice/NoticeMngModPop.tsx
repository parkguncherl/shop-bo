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
import type { NoticeItem } from '../../../../app/(app)/market/Notice/NoticeMng';

interface Props {
  open: boolean;
  item: NoticeItem;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormFields {
  title: string;
  moveUri?: string;
  gesiYn: string;
}

const NoticeMngModPop = ({ open, item, onClose, onSuccess }: Props) => {
  const getFileUrl = useCommonStore((s) => s.getFileUrl);
  const [fileId, setFileId] = useState<number | undefined>();
  const [imgPreviewUrl, setImgPreviewUrl] = useState('');
  const [filePopOpen, setFilePopOpen] = useState(false);

  const { control, handleSubmit, reset } = useForm<FormFields>({
    defaultValues: { title: '', moveUri: '', gesiYn: 'N' },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      title: item.title ?? '',
      moveUri: item.moveUri ?? '',
      gesiYn: item.gesiYn ?? 'N',
    });
    setFileId(item.fileId);
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

  const handleClose = () => onClose();

  const onValid: SubmitHandler<FormFields> = async (form) => {
    const { data } = await authApi.put('/noticeMng/update', {
      id: item.id,
      title: form.title,
      moveUri: form.moveUri || null,
      gesiYn: form.gesiYn,
      fileId: fileId ?? null,
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
        width={600}
        open={open}
        title="공지사항 수정"
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
              <PopupFormType className="type2">
                <FormDropDown<FormFields>
                  control={control}
                  name="gesiYn"
                  title="게시 여부"
                  options={[
                    { key: 0, value: 'Y', label: '게시' },
                    { key: 1, value: 'N', label: '미게시' },
                  ]}
                />
                <div className="inputWrap">
                  <dl>
                    <dt>이미지</dt>
                    <dd>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {imgPreviewUrl && (
                          <img src={imgPreviewUrl} alt="미리보기" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid #e0e0e0' }} />
                        )}
                        <button className="btn btnGray" type="button" onClick={() => setFilePopOpen(true)}>
                          {fileId ? '이미지 변경' : '이미지 등록'}
                        </button>
                      </div>
                    </dd>
                  </dl>
                </div>
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

export default NoticeMngModPop;
