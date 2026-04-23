import React, { useEffect, useRef, useState } from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { PopupLayout } from '../PopupLayout';
import CanvasByKonva, { CanvasByKonvaRef } from '../../drawing/CanvasByKonva';
import useFilters from '../../../hooks/useFilters';
import { CustomColorPicker } from '../../CustomColorPicker';
import { toastError, toastSuccess } from '../../ToastMessage';
import { useCommonStore } from '../../../stores';
import { ConfirmModal } from '../../ConfirmModal';
import { Search } from '../../content';
import { useMutation } from '@tanstack/react-query';

import icoUndo from '../../../public/images/ico_undo.svg';
import icoRedo from '../../../public/images/ico_redo.svg';

export interface ImgPropsOnEditPop {
  imgFileId?: number;
  imgFileName?: string;
  imgSrc?: string;
  seq?: number;
}
interface ImgEditPopProps {
  open: boolean;
  onClose: () => void;
  onImgFileUpdated?: () => Promise<void>;
  imgProps?: ImgPropsOnEditPop;
}

/** konva 기반 컴포넌트를 통한 이미지 편집 팝업, 이미지 인자가 제공되지 아니하는 경우 free form */
const ImgEditPop = ({ open, onClose, onImgFileUpdated, imgProps }: ImgEditPopProps) => {
  const topWrapperRef = useRef<HTMLDivElement>(null);
  const canvasByKonvaRef = useRef<CanvasByKonvaRef>(null);
  const topSearchWrapperRef = useRef<HTMLDivElement>(null);

  const [updateImageFile] = useCommonStore((s) => [s.updateImageFile]);

  const [preview, setPreview] = useState(false);
  const [colorPickerOpened, setColorPickerOpened] = useState(false);
  const [updateConfOpened, setUpdateConfOpened] = useState(false);

  //const [imgOnKonva, setImgOnKonva] = useState<ImgOnCanvasByKonva | undefined>(undefined);

  const [filters, onChangeFilters] = useFilters({
    textColor: '#000000',
    textScale: undefined,
    lineColor: '#FF4A00',
    lineWidth: undefined,
  });

  const { mutate: updateImageFileMutate } = useMutation({
    mutationFn: updateImageFile,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('컨텐츠가 정상 수정되었습니다.');
          if (onImgFileUpdated) await onImgFileUpdated();
          onCloseCommon();
        } else {
          toastError(`컨텐츠 수정 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const onCloseCommon = () => {
    if (onClose) onClose();
  };

  // useEffect(() => {
  //   setImgOnKonva(imgProps != undefined ? { imgFileName: imgProps.imgFileName, imgSrc: imgProps.imgSrc } : undefined);
  // }, [imgProps]);

  return (
    <div className="imgPopBox">
      <PopupLayout
        width={930}
        open={open}
        isEscClose={true}
        title={'이미지 수정'}
        onClose={onCloseCommon}
        footer={
          <PopupFooter>
            <div className="btnArea between">
              <div className="left">
                <button
                  className="btn btnBlue"
                  onClick={() => {
                    canvasByKonvaRef.current?.customs.api.addNewText();
                  }}
                >
                  새로운 글 추가
                </button>

                <button
                  className="btn btnBlue"
                  onClick={() => {
                    canvasByKonvaRef.current?.customs.api.addNewDimensionLine();
                  }}
                >
                  새로운 치수선 추가
                </button>

                <button
                  className={'btn ' + (!preview ? 'btnBlue' : '')}
                  onClick={() => {
                    setPreview(!preview);
                  }}
                >
                  {!preview ? '미리보기' : '편집'}
                </button>
                <button
                  className="btn btnBlue"
                  disabled={!preview}
                  onClick={() => {
                    canvasByKonvaRef.current.customs.api.exportAsFile().then((file: File | null) => {
                      if (file == null) {
                        toastError('어떠한 수정사항도 없이 저장할 수 없습니다');
                        return;
                      }
                      setUpdateConfOpened(true);
                    });
                  }}
                >
                  저장
                </button>
              </div>
              <div className="right">
                <button className="btn" onClick={onCloseCommon}>
                  닫기
                </button>
              </div>
            </div>
          </PopupFooter>
        }
      >
        <PopupContent>
          <div className="searchBox" ref={topSearchWrapperRef}>
            <div className="searchArea">
              <div className={'type_2'}>
                <CustomColorPicker
                  title={'텍스트 색상'}
                  name={'textColor'}
                  color={filters.textColor}
                  onColorChangeCompleted={(name, color) => {
                    onChangeFilters(name, color.hex);
                  }}
                  wrapperRef={topSearchWrapperRef}
                  onColorPickerOpened={() => setColorPickerOpened(true)}
                  onColorPickerClosed={() => setColorPickerOpened(false)}
                />
                <CustomColorPicker
                  title={'줄(라인) 색상'}
                  name={'lineColor'}
                  color={filters.lineColor}
                  onColorChangeCompleted={(name, color) => {
                    onChangeFilters(name, color.hex);
                  }}
                  colorPickerCoordinates={{
                    left: 360,
                  }}
                  wrapperRef={topSearchWrapperRef}
                />
                <Search.DropDown
                  title={'줄 너비'}
                  name={'lineWidth'}
                  codeUpper={'10040'}
                  value={filters.lineWidth}
                  onChange={(name, value) => {
                    onChangeFilters(name, Number(value));
                  }}
                />
                <Search.DropDown
                  title={'텍스트 크기'}
                  name={'textScale'}
                  codeUpper={'10050'}
                  value={filters.textScale}
                  onChange={(name, value) => {
                    onChangeFilters(name, Number(value));
                  }}
                />
                <dl>
                  <dt>
                    <label>{'뒤로(혹은 앞으로)가기'}</label>
                  </dt>
                  <dd>
                    <div className={`formBox`}>
                      <div style={{ padding: '3px' }}>
                        <img
                          src={icoUndo.src}
                          style={{ width: '15px', height: '15px' }}
                          onClick={() => {
                            canvasByKonvaRef.current.customs.api.undo();
                          }}
                        />
                      </div>
                      <div style={{ padding: '3px' }}>
                        <img
                          src={icoRedo.src}
                          style={{ width: '15px', height: '15px' }}
                          onClick={() => {
                            canvasByKonvaRef.current.customs.api.redo();
                          }}
                        />
                      </div>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className={'imgEditPop'} ref={topWrapperRef}>
            <CanvasByKonva
              wrapperRef={topWrapperRef}
              img={imgProps}
              //img={imgOnKonva}
              ref={canvasByKonvaRef}
              preview={preview}
              textConfig={{
                color: filters.textColor,
                scale: filters.textScale,
              }}
              lineConfig={{
                color: filters.lineColor,
                width: filters.lineWidth,
              }}
              preventDrawing={colorPickerOpened}
            />
          </div>
        </PopupContent>
      </PopupLayout>
      <ConfirmModal
        open={updateConfOpened}
        onClose={() => setUpdateConfOpened(false)}
        onConfirm={() => {
          canvasByKonvaRef.current.customs.api.exportAsFile().then((file: File | null) => {
            if (file == null) {
              // 기본 fallback
              console.error('파일을 저장할 수 없음');
              return;
            }

            if (imgProps == undefined || imgProps.imgSrc == undefined) {
              // 배경 이미지가 부재한 경우, 즉 free form 화이트보드인 경우
              // if (imgProps) {
              //   if (!imgProps?.imgFileId) {
              //     console.error('이미지 파일 식별자(fileId)를 찾을 수 없음');
              //     return;
              //   }
              //   if (!imgProps.seq) {
              //     console.error('이미지의 순서(seq) 정보를 찾을 수 없음');
              //     return;
              //   }
              //   updateImageFileMutate({ fileId: imgProps.imgFileId, fileSeq: imgProps.seq, uploadFile: file });
              // }
            } else {
              if (!imgProps?.imgFileId) {
                console.error('이미지 파일 식별자(fileId)를 찾을 수 없음');
                return;
              }
              if (!imgProps.seq) {
                console.error('이미지의 순서(seq) 정보를 찾을 수 없음');
                return;
              }
              updateImageFileMutate({ fileId: imgProps.imgFileId, fileSeq: imgProps.seq, uploadFile: file });
            }
          });
        }}
        title={'수정된 이미지로 기존 이미지를 대체하시겠습니까?'}
      />
    </div>
  );
};

export default ImgEditPop;
