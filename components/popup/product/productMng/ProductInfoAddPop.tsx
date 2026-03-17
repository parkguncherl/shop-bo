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
import { ProductMngRequestInsertProduct, ProductMngResponseProductInfo } from '../../../../generated';
import { useProductMngStore } from '../../../../stores/product/useProductMngStore';
import FormDropDown from '../../../form/FormDropDown';
import FormDatePicker from '../../../form/FormDatePicker';

/** form 영역 입력 인터페이스 */
export interface ProductInfoCreateFields {
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
  weather: 'spring' | 'summer' | 'autumn' | 'winter';
  // isSpring?: string;
  // isSummer?: string;
  // isAutumn?: string;
  // isWinter?: string;
  productDet: ProductDetCreateFields;
}
export interface ProductDetCreateFields {
  productDetSeq: number;
  productDetSize: string;
  productDetColor: string;
  skuDiscountRate: number;
  fileId?: number;
  sleepYn: string;
}

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
    getValues,
    setValue,
    clearErrors,
    formState: { errors, isValid },
  } = useForm<ProductInfoCreateFields>({
    resolver: yupResolver(YupSchema.InsertProductInfoRequest()),
    mode: 'onChange',
    defaultValues: {
      productDet: {
        skuDiscountRate: 0,
        sleepYn: 'N',
      },
    },
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

  useEffect(() => {
    if (!open) {
      clearErrors();
    }
  }, [open]);

  // 입력이 유효한 경우
  const onValid: SubmitHandler<ProductInfoCreateFields> = (data, event) => {
    let insertProductInfoReqObj: ProductMngRequestInsertProduct | undefined = undefined;
    switch (data.weather) {
      case 'spring': {
        insertProductInfoReqObj = { ...data, isSpring: 'Y' };
        break;
      }
      case 'summer': {
        insertProductInfoReqObj = { ...data, isSummer: 'Y' };
        break;
      }
      case 'autumn': {
        insertProductInfoReqObj = { ...data, isAutumn: 'Y' };
        break;
      }
      case 'winter': {
        insertProductInfoReqObj = { ...data, isWinter: 'Y' };
        break;
      }
    }

    if (insertProductInfoReqObj == undefined) {
      console.error('입력 폼에 의한 값을 요청 객체에 할당하는 과정에서 문제 발생, 점검!');
    }

    console.log('insertProductInfoReqObj: ', insertProductInfoReqObj);
  };

  // 유효하지 않은 경우
  const onInvalid: SubmitErrorHandler<ProductInfoCreateFields> = (errors, event) => {
    if (errors) {
      toastError('문제가 되는 영역 혹은 누락된 영역을 수정 및 추가한 후 재시도하십시요.');
    }
  };

  return (
    <div className="imgPopBox">
      <PopupLayout
        width={900}
        open={open}
        isEscClose={true}
        title={!getValues('id') ? '상품정보 추가' : selectedProductInfoData?.prodNm + ' 이하 상세정보 추가'}
        onClose={onClose}
        footer={
          <PopupFooter>
            <div className="btnArea between">
              <div className="left">
                <button
                  className="btn btn_blue"
                  onClick={() => {
                    // todo
                    handleSubmit(onValid, onInvalid)(); // 함수를 반환하므로 다음과 같이, 호출하여야
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
            {!getValues('id') && (
              <PopupFormGroup title={'상품정보'}>
                <PopupFormType className={'type2'}>
                  <FormInput<ProductInfoCreateFields> control={control} name={'prodNm'} label={'상품명'} placeholder={'제목'} />
                  <FormDropDown<ProductInfoCreateFields> control={control} name={'prodTp'} title={'상품유형'} codeUpper={'90010'} />
                </PopupFormType>
                <PopupFormType className={'type2'}>
                  <FormDropDown<ProductInfoCreateFields> control={control} name={'prodDetTp'} title={'상품상세유형'} codeUpper={'90011'} />
                  <FormInput<ProductInfoCreateFields> control={control} name={'composition'} label={'혼용율'} />
                </PopupFormType>
                <PopupFormType className={'type2'}>
                  <FormDatePicker<ProductInfoCreateFields> control={control} name={'makeYmd'} title={'제조일자'} />
                  <FormInput<ProductInfoCreateFields> control={control} name={'discountRate'} label={'할인율'} inputType={'number'} />
                </PopupFormType>
                <PopupFormType className={'type2'}>
                  <FormInput<ProductInfoCreateFields> control={control} name={'orgAmt'} label={'원가'} inputType={'number'} />
                  <FormInput<ProductInfoCreateFields> control={control} name={'sellAmt'} label={'판매가'} inputType={'number'} />
                </PopupFormType>
                <PopupFormType className={'type1'}>
                  <FormDropDown<ProductInfoCreateFields>
                    control={control}
                    name={'weather'}
                    title={'계절'}
                    options={[
                      { key: 0, value: 'spring', label: '봄' },
                      { key: 1, value: 'summer', label: '여름' },
                      { key: 2, value: 'autumn', label: '가을' },
                      { key: 3, value: 'winter', label: '겨울' },
                    ]}
                  />
                </PopupFormType>
              </PopupFormGroup>
            )}
            <PopupFormGroup title={'상세'}>
              <PopupFormType className={'type2'}>
                <FormInput<ProductInfoCreateFields>
                  control={control}
                  name={'productDet.productDetSize'}
                  label={'상품상세 사이즈'}
                  inputType={'label'}
                  placeholder={'(상세)사이즈'}
                />
                <FormInput<ProductInfoCreateFields>
                  control={control}
                  name={'productDet.productDetColor'}
                  label={'상품상세 컬러'}
                  inputType={'label'}
                  placeholder={'(상세)컬러'}
                />
              </PopupFormType>
              <PopupFormType className={'type2'}>
                <FormInput<ProductInfoCreateFields>
                  control={control}
                  name={'productDet.skuDiscountRate'}
                  label={'스큐 할인율'}
                  inputType={'number'}
                  placeholder={'스큐단위 할인율'}
                />
                <FormDropDown<ProductInfoCreateFields>
                  control={control}
                  name={'productDet.sleepYn'}
                  title={'휴면여부'}
                  options={[
                    { key: 0, value: 'Y', label: '휴면' },
                    { key: 1, value: 'N', label: '활성화' },
                  ]}
                />
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
          // handleSubmit(onValid, onInvalid)(); // 함수를 반환하므로 다음과 같이, 호출하여야
        }}
        onClose={() => {
          setOpenAddConf(false);
        }}
      />
    </div>
  );
};

export default ProductInfoAddPop;
