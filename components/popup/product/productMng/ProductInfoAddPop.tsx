import React, { useEffect, useState } from 'react';
import { PopupFooter } from '../../PopupFooter';
import { PopupContent } from '../../PopupContent';
import { PopupLayout } from '../../PopupLayout';
import PopupFormBox from '../../content/PopupFormBox';
import PopupFormGroup from '../../content/PopupFormGroup';
import PopupFormType from '../../content/PopupFormType';
import FormInput from '../../../form/FormInput';
import { SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '../../../../libs';
import { toastError, toastSuccess } from '../../../ToastMessage';
import { ConfirmModal } from '../../../ConfirmModal';
import { ProductMngResponseProductInfo } from '../../../../generated';
import { useProductMngStore } from '../../../../stores/product/useProductMngStore';

export type ProductInfoCreateFields = {
  id?: number;
  prodNm: string;
  prodTp: string;
  prodDetTp: string;
  composition: string;
  repFileId?: number;
  detailFileId?: number;
  sizeFileId?: number;
  etcFileId?: number;
  makeYmd: string;
  orgAmt: number;
  sellAmt: number;
  discountRate?: number;
  isSpring?: string;
  isSummer?: string;
  isAutumn?: string;
  isWinter?: string;
};

interface ProductContentShowPopProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  selectedProductInfoData?: ProductMngResponseProductInfo;
}

/**
 * components/popup/product/productMng/ProductInfoAddPop.tsx
 * desc: 상품정보 추가 팝업
 * Date: 2026/03/17
 * Author: park junsung
 * */
const ProductInfoAddPop = ({ open, onClose, onSuccess, selectedProductInfoData }: ProductContentShowPopProps) => {
  /** 공통 스토어 - State */
  const [insertProductInfo] = useProductMngStore((s) => [s.insertProductInfo]);

  /** 팝업 내부 local state */
  const [openAddConf, setOpenAddConf] = useState(false);

  /** 상품 내용 입력 서식 */
  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors, isValid },
  } = useForm<ProductInfoCreateFields>({
    resolver: yupResolver(YupSchema.InsertProductInfoRequest()),
    mode: 'onChange',
  });

  /** 상품컨텐츠 추가 요청 처리 동작 캐싱 */
  const { mutate: insertProductInfoMutate } = useMutation(insertProductInfo, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          if (onSuccess) onSuccess();
        } else {
          toastError(`컨텐츠 저장 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  useEffect(() => {
    setValue('id', selectedProductInfoData?.id); // 외부의 selectedProductInfoData 변경 시점에 id 존재 여부에 따른 동기화 보장 todo 콘솔 로그로 확인 후 백앤드 인서트 테스트할 것
  }, [selectedProductInfoData]);

  // 입력이 유효한 경우
  const onValid: SubmitHandler<ProductInfoCreateFields> = (data, event) => {};

  // 유효하지 않은 경우
  const onInvalid: SubmitErrorHandler<ProductInfoCreateFields> = (errors, event) => {
    if (errors) {
      toastError('문제가 되는 영역을 수정한 후 재시도하십시요.');
    }
  };

  return (
    <div className="imgPopBox">
      <PopupLayout
        width={900}
        open={open}
        isEscClose={true}
        title={!selectedProductInfoData?.id ? '상품정보 추가' : selectedProductInfoData?.prodNm + ' 이하 상세정보 추가'}
        onClose={onClose}
        footer={
          <PopupFooter>
            <div className="btnArea between">
              <div className="left">
                <button
                  className="btn btn_blue"
                  onClick={() => {
                    // todo
                    setOpenAddConf(true);
                  }}
                >
                  저장
                </button>
              </div>
              <div className="right">
                <button
                  className="btn"
                  onClick={() => {
                    onClose();
                  }}
                >
                  닫기
                </button>
              </div>
            </div>
          </PopupFooter>
        }
      >
        <PopupContent>
          <PopupFormBox className={''}>
            {!selectedProductInfoData?.id && (
              <PopupFormGroup title={'상품정보'}>
                <PopupFormType className={'type2'}>
                  <FormInput<ProductInfoCreateFields> control={control} name={'prodNm'} label={'제목'} inputType={'label'} placeholder={'제목'} />
                  <FormInput<ProductInfoCreateFields> control={control} name={'prodTp'} label={'제목'} inputType={'label'} placeholder={'제목'} />
                </PopupFormType>
              </PopupFormGroup>
            )}
            <PopupFormGroup title={'상세'}>
              <PopupFormType className={'type2'}>
                <FormInput<ProductInfoCreateFields> control={control} name={'prodNm'} label={'제목'} inputType={'label'} placeholder={'제목'} />
                <FormInput<ProductInfoCreateFields> control={control} name={'prodTp'} label={'제목'} inputType={'label'} placeholder={'제목'} />
              </PopupFormType>
              <PopupFormType className={'type2'}>
                <FormInput<ProductInfoCreateFields> control={control} name={'prodDetTp'} label={'제목'} inputType={'label'} placeholder={'제목'} />
                <FormInput<ProductInfoCreateFields> control={control} name={'composition'} label={'제목'} inputType={'label'} placeholder={'제목'} />
              </PopupFormType>
            </PopupFormGroup>
          </PopupFormBox>
        </PopupContent>
      </PopupLayout>
      <ConfirmModal
        open={openAddConf}
        title={'저장 하시겠습니까?'}
        confirmText={'저장'}
        onConfirm={() => {
          handleSubmit(onValid, onInvalid)(); // 함수를 반환하므로 다음과 같이, 호출하여야
        }}
        onClose={() => {
          setOpenAddConf(false);
        }}
      />
    </div>
  );
};

export default ProductInfoAddPop;
