'use client';

import React, { useEffect, useState } from 'react';
import { ImageSwiper } from '@/components/ImageSwiper';
import { useForm, SubmitHandler } from 'react-hook-form';
import { PopupLayout } from '@/components/popup/PopupLayout';
import { PopupContent } from '@/components/popup/PopupContent';
import { PopupFooter } from '@/components/popup/PopupFooter';
import PopupFormBox from '@/components/popup/content/PopupFormBox';
import PopupFormGroup from '@/components/popup/content/PopupFormGroup';
import PopupFormType from '@/components/popup/content/PopupFormType';
import FormInput from '@/components/form/FormInput';
import FormDropDown from '@/components/form/FormDropDown';
import { authApi } from '@/libs';
import { toastError, toastSuccess } from '@/components/ToastMessage';
import { FileUploadPop } from '@/components/popup/common/FileUploadPop';
import { useCommonStore } from '@/stores';
import type { NoticeItem } from '@/app/(app)/market/Notice/NoticeMng';

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

interface FileDet {
  id: number;
  sysFileNm: string;
}

const NoticeMngModPop = ({ open, item, onClose, onSuccess }: Props) => {
  const getFileUrl = useCommonStore((s) => s.getFileUrl);
  const [fileId, setFileId] = useState<number | undefined>();
  const [fileDets, setFileDets] = useState<FileDet[]>([]);
  const [imgUrls, setImgUrls] = useState<string[]>([]);
  const [filePopOpen, setFilePopOpen] = useState(false);

  const { control, handleSubmit, reset } = useForm<FormFields>({
    defaultValues: { title: '', moveUri: '', gesiYn: 'N' },
  });

  const loadImages = async (fid: number) => {
    const { data } = await authApi.get(`/common/file/${fid}`);
    const list: FileDet[] = (data?.body ?? []).filter((f: FileDet) => f.id && f.sysFileNm);
    const urls = await Promise.all(list.map((f) => getFileUrl(f.sysFileNm)));
    setFileDets(list);
    setImgUrls(urls.filter(Boolean));
  };

  useEffect(() => {
    if (!open) return;
    reset({
      title: item.title ?? '',
      moveUri: item.moveUri ?? '',
      gesiYn: item.gesiYn ?? 'N',
    });
    setFileId(item.fileId);
    setFileDets([]);
    setImgUrls([]);

    if (item.fileId) {
      loadImages(item.fileId).catch(() => {});
    }
  }, [open, item]);

  const handleDeleteImage = async (index: number) => {
    const det = fileDets[index];
    if (!det) return;
    try {
      await authApi.delete(`/common/fileDeleteByKey/${det.id}`);
      const newDets = fileDets.filter((_, i) => i !== index);
      const newUrls = imgUrls.filter((_, i) => i !== index);
      setFileDets(newDets);
      setImgUrls(newUrls);
      if (newDets.length === 0) setFileId(undefined);
    } catch {
      toastError('이미지 삭제 중 오류가 발생했습니다.');
    }
  };

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
                <button className="btn btn_primary" onClick={handleSubmit(onValid, () => toastError('필수 항목을 확인해주세요.'))}>저장</button>
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
                        {fileId ? '이미지 추가' : '이미지 등록'}
                      </button>
                    </div>
                    <ImageSwiper images={imgUrls} width={140} height={140} onDelete={handleDeleteImage} />
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
        fileId={fileId}
        onClose={() => setFilePopOpen(false)}
        onSuccess={async (fileInfo) => {
          const resultFileId = (fileInfo?.fileId as unknown as number) ?? fileId;
          if (resultFileId) {
            setFileId(resultFileId);
            await loadImages(resultFileId);
          }
          setFilePopOpen(false);
        }}
      />
    </>
  );
};

export default NoticeMngModPop;
