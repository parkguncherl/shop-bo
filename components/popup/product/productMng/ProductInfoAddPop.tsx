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
import { ProductMngRequestInsertProduct, ProductMngRequestInsertProductDet, ProductMngResponseProductInfo } from '../../../../generated';
import { useProductMngStore } from '../../../../stores/product/useProductMngStore';
import FormDropDown from '../../../form/FormDropDown';
import FormDatePicker from '../../../form/FormDatePicker';
import dayjs from 'dayjs';

/** form 영역 입력 인터페이스 */
export interface ProductInfoCreateFields {
  // id?: number;
  // prodNm: string;
  // prodTp: string;
  // prodDetTp: string;
  // composition: string;
  // repFileId?: number;
  // detailFileId?: number;
  // sizeFileId?: number;
  // etcFileId?: number;
  // makeYmd: string;
  // orgAmt: number;
  // sellAmt: number;
  // discountRate?: number;
  // // isSpring?: string;
  // // isSummer?: string;
  // // isAutumn?: string;
  // // isWinter?: string;
  id?: number;
  product?: ProductCreateFields;
  productDet: ProductDetCreateFields;
}
export interface ProductCreateFields extends ProductMngRequestInsertProduct {
  // prodNm: string;
  // prodTp: string;
  // prodDetTp: string;
  // composition: string;
  // // repFileId?: number;
  // // detailFileId?: number;
  // // sizeFileId?: number;
  // // etcFileId?: number;
  // makeYmd: string;
  // orgAmt: number;
  // sellAmt: number;
  // discountRate?: number;
  weather: ('spring' | 'summer' | 'autumn' | 'winter')[];
  // isSpring?: string;
  // isSummer?: string;
  // isAutumn?: string;
  // isWinter?: string;
}
export interface ProductDetCreateFields extends ProductMngRequestInsertProductDet {
  // productDetSeq: number;
  // productDetSize: string;
  // productDetColor: string;
  // skuDiscountRate: number;
  // //fileId?: number;
  // sleepYn: string;
}

interface ProductContentShowPopProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  productInfo?: ProductMngResponseProductInfo;
}

/**
 * components/popup/product/productMng/ProductInfoAddPop.tsx
 * desc: 품목정보 추가 팝업
 * Date: 2026/03/17
 * Author: park junsung
 * */
// todo 현재 상세정보 추가 영역은 그리드를 통한 상세 목록으로 마이그레이션이 진행 중, 이후 해당 form 을 통한 추가 영역이 전적으로 불필요하다 판단될 시 조건부 영역 제거, 간소화
const ProductInfoAddPop = ({ open, onClose, onSuccess, productInfo }: ProductContentShowPopProps) => {
  /** 공통 스토어 - State */
  const [insertProductInfo] = useProductMngStore((s) => [s.insertProductInfo]);

  /** 팝업 내부 local state */
  const [openAddConf, setOpenAddConf] = useState<{ open: boolean; stored?: ProductMngRequestInsertProduct }>({ open: false });

  /** 품목 내용 입력 서식 */
  const {
    handleSubmit,
    control,
    reset,
    clearErrors,
    //formState: { errors, isValid },
  } = useForm<ProductInfoCreateFields>({
    // resolver: yupResolver(YupSchema.InsertProductInfoRequest(productInfo?.id)), todo
    resolver: yupResolver(YupSchema.InsertProductInfoRequest()),
    mode: 'onChange',
    defaultValues: {
      productDet: {
        skuDiscountRate: 0,
        sleepYn: 'N',
      },
    },
  });

  /** 품목컨텐츠 추가 요청 처리 동작 캐싱 */
  const { mutate: insertProductInfoMutate } = useMutation({
    mutationFn: insertProductInfo,
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
    if (!open) {
      // 닫힘 시점 동작
      reset({
        productDet: {
          skuDiscountRate: 0,
          sleepYn: 'N',
        },
      }); // 초기화
      clearErrors(); // 에러 상태 초기화
    }
  }, [open]);

  // 입력이 유효한 경우
  const onValid: SubmitHandler<ProductInfoCreateFields> = (data, event) => {
    if (productInfo && !productInfo.id) {
      console.error('품목정보는 전달되었으나 유효한 식별자를 찾을 수 없음');
      return;
    }
    if (productInfo?.id) {
      // 품목상세정보만 추가하는 경우
      const insertProductInfoReqObj: ProductMngRequestInsertProduct = {
        id: productInfo.id,

        productDet: {
          // productId 는 백앤드에서 할당
          productDetSize: data.productDet?.productDetSize,
          productDetColor: data.productDet?.productDetColor,
          skuDiscountRate: data.productDet?.skuDiscountRate,
          sleepYn: data.productDet?.sleepYn,
        },
      };

      setOpenAddConf({
        open: true,
        stored: insertProductInfoReqObj,
      });
    } else {
      // id 부재 --> 품목정보 또한 추가
      let insertProductInfoReqObj: ProductMngRequestInsertProduct = {
        ...data.product,
        makeYmd: dayjs(data.product?.makeYmd).format('YYYY-MM-DD'), // localDate 형식에 적합하도록 변환
        productDet: data.productDet,
      };

      if ((data.product as ProductCreateFields).weather.includes('spring')) {
        insertProductInfoReqObj = {
          ...insertProductInfoReqObj,
          isSpring: 'Y',
        };
      }
      if ((data.product as ProductCreateFields).weather.includes('summer')) {
        insertProductInfoReqObj = {
          ...insertProductInfoReqObj,
          isSummer: 'Y',
        };
      }
      if ((data.product as ProductCreateFields).weather.includes('autumn')) {
        insertProductInfoReqObj = {
          ...insertProductInfoReqObj,
          isAutumn: 'Y',
        };
      }
      if ((data.product as ProductCreateFields).weather.includes('winter')) {
        insertProductInfoReqObj = {
          ...insertProductInfoReqObj,
          isWinter: 'Y',
        };
      }

      setOpenAddConf({
        open: true,
        stored: insertProductInfoReqObj,
      });
    }
  };

  // 유효하지 않은 경우
  const onInvalid: SubmitErrorHandler<ProductInfoCreateFields> = (errors, event) => {
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
        title={productInfo?.id ? productInfo?.prodNm + ' 이하 상세정보 추가' : '품목정보 추가'}
        onClose={onClose}
        footer={
          <PopupFooter>
            <div className="btnArea between">
              <div className="left">
                <button
                  className="btn btn_blue"
                  onClick={() => {
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
            {!productInfo?.id && (
              <PopupFormGroup title={'품목정보'}>
                <PopupFormType className={'type2'}>
                  <FormInput<ProductInfoCreateFields> control={control} name={'product.prodNm'} label={'품목명'} placeholder={'제목'} />
                  <FormDropDown<ProductInfoCreateFields> control={control} name={'product.prodTp'} title={'품목유형'} codeUpper={'90010'} />
                </PopupFormType>
                <PopupFormType className={'type2'}>
                  <FormDropDown<ProductInfoCreateFields> control={control} name={'product.prodDetTp'} title={'품목상세유형'} codeUpper={'90011'} />
                  <FormInput<ProductInfoCreateFields> control={control} name={'product.composition'} label={'혼용율'} />
                </PopupFormType>
                <PopupFormType className={'type2'}>
                  <FormDatePicker<ProductInfoCreateFields> control={control} name={'product.makeYmd'} title={'제조일자'} />
                  <FormInput<ProductInfoCreateFields> control={control} name={'product.discountRate'} label={'할인율'} />
                </PopupFormType>
                <PopupFormType className={'type2'}>
                  <FormInput<ProductInfoCreateFields> control={control} name={'product.orgAmt'} label={'원가'} />
                  <FormInput<ProductInfoCreateFields> control={control} name={'product.sellAmt'} label={'판매가'} />
                </PopupFormType>
                <PopupFormType className={'type1'}>
                  <FormDropDown<ProductInfoCreateFields>
                    control={control}
                    name={'product.weather'}
                    title={'계절'}
                    multiple={true}
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
                  label={'품목 사이즈'}
                  inputType={'label'}
                  placeholder={'사이즈'}
                />
                <FormInput<ProductInfoCreateFields>
                  control={control}
                  name={'productDet.productDetColor'}
                  label={'품목 컬러'}
                  inputType={'label'}
                  placeholder={'컬러'}
                />
              </PopupFormType>
              <PopupFormType className={'type2'}>
                <FormInput<ProductInfoCreateFields> control={control} name={'productDet.skuDiscountRate'} label={'품목 할인율'} placeholder={'품목 할인율'} />
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
        open={openAddConf.open}
        title={'저장 하시겠습니까?'}
        confirmText={'저장'}
        onConfirm={() => {
          if (openAddConf.stored) {
            insertProductInfoMutate(openAddConf.stored);
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

export default ProductInfoAddPop;
