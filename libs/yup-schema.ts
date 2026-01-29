// C:\work\shop-frontend\libs\yup-schema.ts

import * as yup from 'yup';
import { DropDownOption } from '../types/DropDownOptions';
import { AccountRequestCreateFields, AccountRequestUnLockFields, AccountRequestUpdateFields } from '../components/popup/system/accountMng';
import { CodeRequestCreateFields, CodeRequestUpdateFields } from '../components/popup/system/codeMng';
import { MenuFormData, MenuRequestCreateFields } from '../components/popup/system/menuMng';
import { LoginVerificationFields } from '../app/(auth)/login/LoginClient';
import { ProductContentsFields } from '../app/(app)/product/Contents/ProductContents';

export interface MenuRequestParams {
  menuCd?: string;
  upMenuCd?: string;
  menuUriTitle?: string;
}

type RetailRequestCreateFields = RetailRequestCreate & {
  workingDays: DropDownOption[];
};

export const YupSchema = {
  LoginVerificationRequest: (params: LoginVerificationFields) =>
    yup.object().shape({
      loginId: yup.string().required('아이디를 입력하세요.').min(2, '아이디를 올바르게 입력하세요.'),
      //.matches(/^[A-Za-z0-9_.-]+@[A-Za-z0-9-]+\.[A-Za-z0-9-]+/, '이메일 형식이 올바르지 않습니다.'),
      password: yup.string().required('비밀번호를 입력하세요.'),
      //        .matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,24}$/, t('올바르지 않은 비밀번호입니다.'),
      isMobileLogin: yup.string().required('모바일 여부.'),
    }),
  MenuRequest: (params: MenuRequestParams): yup.ObjectSchema<MenuRequestCreateFields> =>
    yup.object({
      menuCd: yup
        .string()
        .required('코드를 입력하세요.')
        .test('type', params.upMenuCd === 'TOP' ? '코드는 2자리의 대문자로 입력하세요.' : '코드는 2~4자리의 대문자와 숫자로 입력하세요.', (v) =>
          /^[A-Z0-9]*$/.test(v),
        )
        .min(2, params.upMenuCd === 'TOP' ? '코드는 2자리의 대문자로 입력하세요.' : '코드는 2~4자리로 입력하세요.')
        .max(params.upMenuCd === 'TOP' ? 2 : 4, params.upMenuCd === 'TOP' ? '코드는 2자리의 대문자로 입력하세요.' : '코드는 2~4자리로 입력하세요.')
        .strict(true)
        .uppercase('영문은 대문자만 입력 가능합니다.'),
      menuNm: yup.string().required('이름을 입력하세요.').min(2, '2~30자리로 입력하세요.').max(30, '2~30자리로 입력하세요.'),
      menuUri:
        params.upMenuCd === 'TOP' || params.menuCd === params.upMenuCd
          ? yup.string().required('ICO를 입력하세요.').max(100, '100자 이내로 입력하세요.')
          : yup.string().required('URI를 입력하세요.').max(100, '100자 이내로 입력하세요.'),
    }) as yup.ObjectSchema<MenuRequestCreateFields>,
  MenuRequestForUpdate: (params: MenuRequestParams): yup.ObjectSchema<MenuFormData> =>
    yup.object({
      menuCd: yup
        .string()
        .required('코드를 입력하세요.')
        .test('type', params.upMenuCd === 'TOP' ? '코드는 2자리의 대문자로 입력하세요.' : '코드는 2~4자리의 대문자와 숫자로 입력하세요.', (v) =>
          /^[A-Z0-9]*$/.test(v),
        )
        .min(2, params.upMenuCd === 'TOP' ? '코드는 2자리의 대문자로 입력하세요.' : '코드는 2~4자리로 입력하세요.')
        .max(params.upMenuCd === 'TOP' ? 2 : 4, params.upMenuCd === 'TOP' ? '코드는 2자리의 대문자로 입력하세요.' : '코드는 2~4자리로 입력하세요.')
        .strict(true)
        .uppercase('영문은 대문자만 입력 가능합니다.'),
      menuNm: yup.string().required('이름을 입력하세요.').min(2, '2~30자리로 입력하세요.').max(30, '2~30자리로 입력하세요.'),
      menuUri:
        params.upMenuCd === 'TOP' || params.menuCd === params.upMenuCd
          ? yup.string().required('ICO를 입력하세요.').max(100, '100자 이내로 입력하세요.')
          : yup.string().required('URI를 입력하세요.').max(100, '100자 이내로 입력하세요.'),
    }) as yup.ObjectSchema<MenuFormData>,
  AccountRequest: (): yup.ObjectSchema<AccountRequestCreateFields> =>
    yup.object({
      loginId: yup
        .string()
        .required('ID(e-mail 또는 ID)을 입력하세요.' || '')
        .max(100, '100자 이내로 입력하세요.' || ''),
      //.matches(/^[0-9a-zA-Z]([-_\\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i, '유효한 이메일 양식이 아닙니다.' || ''),
      userNm: yup
        .string()
        .required('이름을 입력하세요.' || '')
        .max(30, '30자 이내로 입력하세요.' || ''),
      phoneNo: yup
        .string()
        .required('휴대전화 번호를 입력하세요.' || '')
        .min(10, '10~11자리로 - 없이 입력하세요.' || '')
        .max(11, '10~11자리로 - 없이 입력하세요.' || '')
        .matches(/^[0-9*]+$/, '휴대전화 번호 양식에 맞게 입력하세요.' || ''),
      authCd: yup.string().required('권한을 선택하세요.' || ''),
      useYn: yup.string().required('상태를 선택하세요.' || ''),
      belongNm: yup
        .string()
        .notRequired()
        .max(30, '30자 이내로 입력하세요.' || ''),
      deptNm: yup
        .string()
        .notRequired()
        .max(30, '30자 이내로 입력하세요.' || ''),
      positionNm: yup
        .string()
        .notRequired()
        .max(30, '30자 이내로 입력하세요.' || ''),
    }) as yup.ObjectSchema<AccountRequestCreateFields>,
  AccountRequestForUpdate: (): yup.ObjectSchema<AccountRequestUpdateFields> =>
    yup.object({
      loginId: yup
        .string()
        .required('ID(e-mail 또는 ID)을 입력하세요.' || '')
        .max(100, '100자 이내로 입력하세요.' || ''),
      //.matches(/^[0-9a-zA-Z]([-_\\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i, '유효한 이메일 양식이 아닙니다.' || ''),
      userNm: yup
        .string()
        .required('이름을 입력하세요.' || '')
        .max(30, '30자 이내로 입력하세요.' || ''),
      phoneNo: yup
        .string()
        .required('휴대전화 번호를 입력하세요.' || '')
        .min(10, '10~11자리로 - 없이 입력하세요.' || '')
        .max(11, '10~11자리로 - 없이 입력하세요.' || '')
        .matches(/^[0-9*]+$/, '휴대전화 번호 양식에 맞게 입력하세요.' || ''),
      authCd: yup.string().required('권한을 선택하세요.' || ''),
      useYn: yup.string().required('상태를 선택하세요.' || ''),
      belongNm: yup
        .string()
        .notRequired()
        .max(30, '30자 이내로 입력하세요.' || ''),
      deptNm: yup
        .string()
        .notRequired()
        .max(30, '30자 이내로 입력하세요.' || ''),
      positionNm: yup
        .string()
        .notRequired()
        .max(30, '30자 이내로 입력하세요.' || ''),
    }) as yup.ObjectSchema<AccountRequestUpdateFields>,

  AccountUnLockRequest: (): yup.ObjectSchema<AccountRequestUnLockFields> =>
    yup.object({
      loginPass: yup.string().required('비밀번호를 입력하세요.'),
    }) as yup.ObjectSchema<AccountRequestUnLockFields>,

  CodeRequest: (): yup.ObjectSchema<CodeRequestCreateFields> =>
    yup.object({
      codeUpper: yup.string().required('상위코드명을 입력하세요.').max(25, '25자 이내로 입력하세요.'),
      codeCd: yup.string().required('코드를 입력하세요.').max(20, '20자 이내로 입력하세요.'),
      codeNm: yup.string().required('이름을 입력하세요.').max(300, '300자 이내로 입력하세요.'),
      codeDesc: yup.string().notRequired().max(300, '300자 이내로 입력하세요.'),
      codeEtc1: yup.string().notRequired().max(300, '300자 이내로 입력하세요.'),
      codeEtc2: yup.string().notRequired().max(300, '300자 이내로 입력하세요.'),
      codeOrder: yup
        .number()
        .transform((_, originalValue) => {
          if (typeof originalValue === 'string') {
            const cleaned = originalValue.replace(/,/g, '');
            return cleaned === '' ? undefined : Number(cleaned);
          }
          return originalValue;
        })
        .typeError('순서를 입력하세요.')
        .test('type', '순서는 숫자로 입력하세요.', (v) => v === undefined || !isNaN(Number(v)))
        .notRequired(), // required() → notRequired()로 변경
      delYn: yup.string().required('필수값(사용여부)'),
      codeEngNm: yup.string().nullable(), // 추가
      codeEtcInfo: yup.string().nullable(), // 추가
      codeEtcEngInfo: yup.string().nullable(), // 추가
    }) as yup.ObjectSchema<CodeRequestCreateFields>,

  CodeRequestForUpdate: (): yup.ObjectSchema<CodeRequestUpdateFields> =>
    yup.object({
      id: yup.number().required('아이디는 필수 key 입니다. '),
      codeUpper: yup.string().required('상위코드명을 입력하세요.').max(25, '25자 이내로 입력하세요.'),
      codeCd: yup.string().required('코드를 입력하세요.').max(20, '20자 이내로 입력하세요.'),
      codeNm: yup.string().required('이름을 입력하세요.').max(300, '300자 이내로 입력하세요.'),
      codeDesc: yup.string().notRequired().max(300, '300자 이내로 입력하세요.'),
      codeEtc1: yup.string().notRequired().max(300, '300자 이내로 입력하세요.'),
      codeEtc2: yup.string().notRequired().max(300, '300자 이내로 입력하세요.'),
      codeOrder: yup
        .number()
        .transform((_, originalValue) => {
          if (typeof originalValue === 'string') {
            const cleaned = originalValue.replace(/,/g, '');
            return cleaned === '' ? undefined : Number(cleaned);
          }
          return originalValue;
        })
        .typeError('순서를 입력하세요.')
        .test('type', '순서는 숫자로 입력하세요.', (v) => v === undefined || !isNaN(Number(v)))
        .notRequired(), // required() → notRequired()로 변경
      delYn: yup.string().required('필수값(사용여부)'),
      codeEngNm: yup.string().nullable(), // 추가
      codeEtcInfo: yup.string().nullable(), // 추가
      codeEtcEngInfo: yup.string().nullable(), // 추가
    }) as yup.ObjectSchema<CodeRequestUpdateFields>,
  MypageChangePasswordRequest: () =>
    yup.object().shape({
      rePassword: yup.string().required('현재 비밀번호를 입력하세요.'),
      modPassword: yup.string().required('변경 비밀번호를 입력하세요.'),
      //.matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,24}$/, '올바르지 않은 비밀번호입니다.'),
      reModpassword: yup.string().required('변경 비밀번호 확인을 입력하세요.'),
      //.matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,24}$/, '올바르지 않은 비밀번호입니다.'),
    }),

  RetailRegRequest: (): yup.ObjectSchema<RetailRequestCreateFields> =>
    yup
      .object({
        sellerNm: yup.string().required('판매처명을 입력하세요').max(30, '30자 이내'),
        compNm: yup.string().notRequired(),
        compNo: yup.string().notRequired(),
        ceoNm: yup.string().notRequired(),
        ceoTelNo: yup.string().notRequired(),
        personNm: yup.string().notRequired(),
        personTelNo: yup.string().notRequired(),
        sellerAddr: yup.string().notRequired(),
        snsId: yup.string().notRequired(),
        gubun1: yup.string().notRequired(),
        gubun2: yup.string().notRequired(),
        etcScrCntn: yup.string().notRequired(),
        etcChitCntn: yup.string().notRequired(),
        compPrnCd: yup.string().notRequired(),
        remainYn: yup.string().notRequired(),
        vatYn: yup.string().notRequired(),
        regYmd: yup.string().notRequired(),
        workingDays: yup
          .array()
          .of(
            yup.object({
              key: yup.number().required(),
              value: yup.string().required(),
              label: yup.string().required(),
            }),
          )
          .notRequired(),
      })
      .noUnknown(false) as yup.ObjectSchema<RetailRequestCreateFields>,

  ProductContentsRequest: (): yup.ObjectSchema<ProductContentsFields> =>
    yup.object({
      title: yup.string().required('제목은 반드시 입력하셔야 합니다.'),
      content: yup.array().of(
        yup
          .object({
            id: yup.number().required(),
            partialContent: yup.string().notRequired(),
            fileInfo: yup
              .object({
                fileTitle: yup.string().required('파일(이미지) 제목은 필수값입니다.'),
                fileSrcUrl: yup.string().required('파일 리소스를 찾을 수 없습니다.'),
              })
              .notRequired(),
          })
          .required(),
      ),
    }) as yup.ObjectSchema<ProductContentsFields>,
};
