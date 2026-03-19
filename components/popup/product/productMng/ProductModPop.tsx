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
import { ProductMngRequestUpdateProduct, ProductMngResponseProductInfo } from '../../../../generated';
import { useProductMngStore } from '../../../../stores/product/useProductMngStore';
import FormDropDown from '../../../form/FormDropDown';
import FormDatePicker from '../../../form/FormDatePicker';
import dayjs from 'dayjs';

/** form 영역 입력 인터페이스 */
export interface ProductModFields {
  prodNm: string;
  prodTp: string;
  prodDetTp: string;
  composition: string;
  // repFileId?: number;
  // detailFileId?: number;
  // sizeFileId?: number;
  // etcFileId?: number;
  makeYmd: string;
  orgAmt: number;
  sellAmt: number;
  discountRate?: number;
  weather: 'spring' | 'summer' | 'autumn' | 'winter';
  // isSpring?: string;
  // isSummer?: string;
  // isAutumn?: string;
  // isWinter?: string;
}

interface ProductContentShowPopProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  productInfo?: ProductMngResponseProductInfo;
}

/**
 * components/popup/product/productMng/ProductModPop.tsx
 * desc: 상품정보 수정 팝업
 * Date: 2026/03/18
 * Author: park junsung
 * */
const ProductModPop = ({ open, onClose, onSuccess, productInfo }: ProductContentShowPopProps) => {
  /** 공통 스토어 - State */
  const [updateProduct] = useProductMngStore((s) => [s.updateProduct]);

  /** 팝업 내부 local state */
  const [openModConf, setOpenAddConf] = useState<{ open: boolean; stored?: ProductMngRequestUpdateProduct }>({ open: false });

  /** 상품 내용 입력 서식 */
  const {
    handleSubmit,
    control,
    setValue,
    reset,
    //formState: { errors, isValid },
  } = useForm<ProductModFields>({
    resolver: yupResolver(YupSchema.UpdateProductRequest()),
    mode: 'onChange',
  });

  const { mutate: updateProductMutate } = useMutation(updateProduct, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('수정되었습니다.');
          reset();
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
    if (productInfo) {
      Object.entries(productInfo).forEach(([key, value]) => {
        if (['isSpring', 'isSummer', 'isAutumn', 'isWinter'].includes(key)) {
          if (value == 'Y') {
            setValue('weather', key == 'isSpring' ? 'spring' : key == 'isSummer' ? 'summer' : key == 'isAutumn' ? 'autumn' : 'winter', {
              shouldValidate: true,
              shouldDirty: true,
            });
          }
        } else {
          setValue(key as keyof ProductModFields, value, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      });
    } else {
      reset(); // 초기화
    }
  }, [productInfo]);

  // 입력이 유효한 경우
  const onValid: SubmitHandler<ProductModFields> = (data, event) => {
    if (productInfo && !productInfo.id) {
      console.error('상품정보는 전달되었으나 유효한 식별자를 찾을 수 없음');
      return;
    }
    let updateProductInfoReqObj: ProductMngRequestUpdateProduct | undefined = undefined;
    switch (data.weather) {
      case 'spring': {
        updateProductInfoReqObj = {
          ...data,
          makeYmd: dayjs(data?.makeYmd).format('YYYY-MM-DD'), // localDate 형식에 적합하도록 변환
          isSpring: 'Y',
        };
        break;
      }
      case 'summer': {
        updateProductInfoReqObj = {
          ...data,
          makeYmd: dayjs(data?.makeYmd).format('YYYY-MM-DD'), // localDate 형식에 적합하도록 변환
          isSummer: 'Y',
        };
        break;
      }
      case 'autumn': {
        updateProductInfoReqObj = {
          ...data,
          makeYmd: dayjs(data?.makeYmd).format('YYYY-MM-DD'), // localDate 형식에 적합하도록 변환
          isAutumn: 'Y',
        };
        break;
      }
      case 'winter': {
        updateProductInfoReqObj = {
          ...data,
          makeYmd: dayjs(data?.makeYmd).format('YYYY-MM-DD'), // localDate 형식에 적합하도록 변환
          isWinter: 'Y',
        };
        break;
      }
    }
    if (updateProductInfoReqObj == undefined) {
      console.error('입력 폼에 의한 값을 요청 객체에 할당하는 과정에서 문제 발생, 점검!');
    }
    setOpenAddConf({
      open: true,
      stored: updateProductInfoReqObj,
    });
  };

  // 유효하지 않은 경우
  const onInvalid: SubmitErrorHandler<ProductModFields> = (errors, event) => {
    //console.error(errors, getValues('id'));
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
        title={'오리지널 상품명(' + productInfo?.prodNm + ') 의 정보를 수정'}
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
            <PopupFormGroup title={'상품정보'}>
              <PopupFormType className={'type2'}>
                <FormInput<ProductModFields> control={control} name={'prodNm'} label={'상품명'} placeholder={'제목'} />
                <FormDropDown<ProductModFields> control={control} name={'prodTp'} title={'상품유형'} codeUpper={'90010'} />
              </PopupFormType>
              <PopupFormType className={'type2'}>
                <FormDropDown<ProductModFields> control={control} name={'prodDetTp'} title={'상품상세유형'} codeUpper={'90011'} />
                <FormInput<ProductModFields> control={control} name={'composition'} label={'혼용율'} />
              </PopupFormType>
              <PopupFormType className={'type2'}>
                <FormDatePicker<ProductModFields> control={control} name={'makeYmd'} title={'제조일자'} />
                <FormInput<ProductModFields> control={control} name={'discountRate'} label={'할인율'} />
              </PopupFormType>
              <PopupFormType className={'type2'}>
                <FormInput<ProductModFields> control={control} name={'orgAmt'} label={'원가'} />
                <FormInput<ProductModFields> control={control} name={'sellAmt'} label={'판매가'} />
              </PopupFormType>
              <PopupFormType className={'type1'}>
                <FormDropDown<ProductModFields>
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
          </PopupFormBox>
        </PopupContent>
      </PopupLayout>
      <ConfirmModal
        open={openModConf.open}
        title={`${openModConf.stored?.prodNm} 을(를) 작성하신 값으로 수정 하시겠습니까?`}
        confirmText={'저장'}
        onConfirm={() => {
          if (openModConf.stored) {
            console.log('openModConf.stored: ', openModConf.stored);
            updateProductMutate(openModConf.stored);
          } else {
            toastError('저장하고자 하는 입력 결과를 찾을 수 없습니다.');
            console.error('저장하고자 하는 입력 결과를 찾을 수 없습니다.');
          }
        }}
        onClose={() => {
          setOpenAddConf({
            open: false,
          });
        }}
      />
    </div>
  );
};

export default ProductModPop;
