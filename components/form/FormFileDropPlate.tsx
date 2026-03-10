import { Control, FieldPathByValue, FieldValues, useController } from 'react-hook-form';
import React from 'react';

type FormFileDropPlateProps<TForm extends FieldValues> = {
  control: Control<TForm>;
  name: FieldPathByValue<TForm, FileDropPlateManagedFields>;
  label?: string;
};
export interface FileDropPlateManagedFields {
  file?: File;
  fileSrcUrl?: string; // 이미지 파일 출력을 위한 url
}

/**
 * components/form/FormCombineParagraphs.tsx
 * 최종 수정일 및 수정자: 26-03-10, park junsung
 * */
const FormFileDropPlate = <TForm extends FieldValues>({ control, name }: FormFileDropPlateProps<TForm>) => {
  /** react hook form 의 controller 는 현재 영역에서는 수정 대상 영역의 값(contentElement)에 한정되어 적용함(전역 적용하지 아니함) */
  const {
    field: { value: value, onChange: controlChange },
    fieldState: { error },
  } = useController<TForm, FieldPathByValue<TForm, FileDropPlateManagedFields>>({
    control,
    name,
  });

  // 드롭 이벤트
  const onDropEventHandler = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length != 0) {
      // 파일을 드롭한 경우 별도 콜백으로 처리하여 동작의 일관성 및 상태의 오염 방지
      e.preventDefault();
      e.stopPropagation();
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        //attachRequestInterruptCallBack(droppedFiles, contentElementOnTriggeredArea);
      }
    }
  };

  return (
    <div className={'file_drop_plate'}>
      <div className={'drop_plate_wrapper'} onDrop={onDropEventHandler}>
        {value != undefined && value.file && value.fileSrcUrl ? <img src={value.fileSrcUrl} /> : <div className={'plate'}></div>}
      </div>
    </div>
  );
};

export default FormFileDropPlate;
