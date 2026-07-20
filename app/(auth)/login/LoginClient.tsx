'use client';

import React, { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores';
import { signIn } from 'next-auth/react';
import { toastError, toastSuccess } from '../../../components';
import styles from '../../../styles/login.module.scss';
import { FindPassPop, FirstPassChangePop } from '../../../components/popup/system/login';
import FormInput from '../../../components/form/FormInput';
import { yupResolver } from '@hookform/resolvers/yup';
import { Timer, YupSchema } from '../../../libs';
import { LoginRequest, LoginResponse } from '../../../generated';
import { deleteCookie, getCookie, setCookie } from 'cookies-next';
import { CheckBox } from '../../../components/CheckBox';
import { LOCAL_STORAGE_WMS_HISTORY, Otp } from '../../../libs/const';
import { UAParser } from 'ua-parser-js';

export interface LoginVerificationFields {
  loginId: string;
  password: string;
  isMobileLogin: string;
  otpNo?: string;
  countryCode?: string;
}

/**
 * (client side)LoginClient
 * */
const LoginClient = () => {
  /** 전역 상태 */
  const [onVerification, modalType, onSendOtp, openModal] = useAuthStore((s) => [s.onVerification, s.modalType, s.onSendOtp, s.openModal, s.closeModal]);

  /** local state */
  const [otpNo, setOtpNo] = useState<string>('000000');
  const [changeType, setChangeType] = useState('F');
  const [validAccount, setVerification] = useState<boolean>(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [isWatingOtp, setIsWatingOtp] = useState(false);
  const [isLoginPassVisible, setIsLoginPassVisible] = useState(true); // 비밀번호 노출 여부(입력 시)

  const [persistTypedId, setPersistTypedId] = useState(false); // id 저장 여부
  const [time, setTime] = useState(Otp.duration);

  // 모바일 체크
  const [isMobileLogin, setIsMobileLogin] = useState<string>('N');
  const [deviceInfo, setDeviceInfo] = useState<{
    deviceType: string;
    os: string;
    browser: string;
  } | null>(null);

  useEffect(() => {
    // 최초 1회 동작 영역
    const parser = new UAParser();
    const result = parser.getResult();
    setPersistTypedId(!!getCookie('gguangggLocalStoriageId')); // 최초 시점에 브라우저에 체크 활성화 값이 존재하는지 확인

    setDeviceInfo({
      deviceType: result.device.type || 'desktop',
      os: result.os.name || 'Unknown',
      browser: result.browser.name || 'Unknown',
    });

    localStorage.removeItem(LOCAL_STORAGE_WMS_HISTORY); // 로그인 페이지 랜더링 시(proxy 차원의 제제 부재한 경우) 즉시 동작
  }, []);

  useEffect(() => {
    // 모바일 여부 변경
    if (deviceInfo && deviceInfo.deviceType === 'desktop') {
      setIsMobileLogin('N');
    } else {
      setIsMobileLogin('Y');
    }
  }, [deviceInfo]);

  const defaultValues: LoginVerificationFields = {
    loginId: (getCookie('gguangggLocalStoriageId') as string) || '',
    password: '',
    isMobileLogin: isMobileLogin,
  };

  const {
    handleSubmit,
    control,
    getValues,
    formState: { errors, isValid },
  } = useForm<LoginVerificationFields>({
    resolver: yupResolver(YupSchema.LoginVerificationRequest(defaultValues)), // 완료
    defaultValues,
    mode: 'onSubmit',
  });

  const { mutate: verificationMutate, isPending: verificationIsLoading } = useMutation({
    mutationKey: ['auth/verification'],
    mutationFn: onVerification,
    onSuccess: async (e) => {
      const { resultCode, body, resultMessage } = e.data;
      if (resultCode === 200) {
        if ((body as LoginResponse)?.user?.firstLoginYn == 'Y') {
          setChangeType('F');
          openModal('FIRST');
        } else {
          await loginFinal(isMobileLogin);
        }
      } else if (resultCode === 919) {
        setVerification(false);
        setIsWatingOtp(false);
        toastError('OTP 실패 횟수를 초과하였습니다.\n다시 로그인 해주세요.');
      } else {
        toastError(resultMessage);
      }
    },
  });

  const { mutate: sendOtpNoMutate, isPending: sendOtpNoIsLoading } = useMutation({
    mutationKey: ['auth/makeOtpNo'],
    mutationFn: onSendOtp,
    onSuccess: (e) => {
      const { resultCode, resultMessage } = e.data;
      if (resultCode === 200) {
        console.log('success opt send==');
      } else {
        toastError(resultMessage);
      }
    },
  });

  useEffect(() => {
    if (isWatingOtp) {
      const timer = new Timer(Otp.duration);
      timer.on('progress', (elapsed: number) => {
        setTime(Otp.duration - elapsed);
      });
      timer.on('finish', () => setIsWatingOtp(false));
      timer.start();
      return () => {
        timer.stop();
      };
    }
  }, [isWatingOtp]);

  // otp 번호 재전송
  const handleOtp = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
    }
    const { loginId, password } = getValues();
    sendOtpNoMutate({ loginId, password });
    toastSuccess('OTP 번호를 발송하였습니다.');
    setIsWatingOtp(true);
  };

  const handleLogin = async () => {
    if (validAccount) {
      if (isWatingOtp) {
        const { loginId, password } = getValues();
        if (otpNo) {
          verificationMutate({ loginId, password, otpNo });
        } else {
          toastError('인증번호를 입력하세요.');
        }
      } else {
        toastError('인증시간이 초과하였습니다.\n인증번호 다시받기 버튼을 클릭하여 인증번호를 받으시기 바랍니다.');
      }
    }
  };

  // 비번찾기
  const findPassFn = () => {
    openModal('FINDPASS');
  };

  /** 서버 연결 로그인(최종 절차) */
  const loginFinal = async (isMobileLogin: string) => {
    const { loginId, password } = getValues();
    const date = new Date();
    date.setDate(date.getDate() + 7); // 일

    // id 저장하기 버튼 체크
    if (persistTypedId) {
      setCookie('gguangggLocalStoriageId', loginId, { expires: date });
    } else {
      deleteCookie('gguangggLocalStoriageId');
    }

    /** 본 로그인 요청, 성공 시 즉시 리다이렉트 되므로 실패한 경우 이외에는 이후의 작성은 무의미 */
    const result = await signIn('credentials', {
      loginId,
      password,
      otpNo,
      isMobileLogin,
    });

    /** 실패한 경우 */
    if (result?.error) {
      return toastError(result.error);
    }
  };

  // 아이디, 비밀번호 정상 입력시
  const onValid: SubmitHandler<LoginRequest> = (data) => {
    const { loginId, password, isMobileLogin } = data;
    verificationMutate({ loginId, password, isMobileLogin });
  };

  /** 엔터키 이벤트 */
  const onKeyDownEnter = async (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // 1단계
      if (!validAccount) {
        await handleSubmit(onValid)();
      } else {
        // 2단계
        await handleLogin();
      }
    }
  };

  return (
    <div className={styles.login_box_group}>
      <div className={styles.login_box}>
        <form>
          <div className={styles.content}>
            <div className={styles.logo}>MAPSIGGUN</div>
            <div className={`${styles.login_inp} ${validAccount ? styles.id_pw_close : styles.id_pw_open}`}>
              <div className={styles.inp_id}>
                <FormInput<LoginVerificationFields>
                  control={control}
                  name={'loginId'}
                  onKeyDown={(e) => {
                    setIsCapsLockOn(e.getModifierState('CapsLock'));
                    onKeyDownEnter(e as unknown as KeyboardEvent);
                  }}
                  inputType={'login'}
                />
              </div>
              <div className={styles.inp_pw}>
                <FormInput<LoginVerificationFields>
                  control={control}
                  name={'password'}
                  type={isLoginPassVisible ? 'password' : 'text'}
                  onKeyDown={(e) => {
                    setIsCapsLockOn(e.getModifierState('CapsLock'));
                    onKeyDownEnter(e as unknown as KeyboardEvent);
                  }}
                  inputType={'login'}
                />
                <button
                  type={'button'}
                  className={`${styles.ico_eye} ${!isLoginPassVisible ? styles.on : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsLoginPassVisible(!isLoginPassVisible);
                  }}
                />
              </div>
              {isCapsLockOn && (
                <div className={styles.inp_txt}>
                  <span>{`CapsLock이 켜져 있습니다!`}</span>
                </div>
              )}
              <div className={styles.inp_certification}>
                <div className={styles.result_box}>
                  <label htmlFor={'inp_certification'}>{'인증번호 입력'}</label>
                  <input
                    type={'text'}
                    id={'inp_certification'}
                    value={otpNo || ''}
                    onChange={(e) => {
                      setOtpNo(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      onKeyDownEnter(e as unknown as KeyboardEvent);
                    }}
                    placeholder={'인증번호를 입력하세요.'}
                  />
                </div>
                {!isWatingOtp && (
                  <button onClick={handleOtp}>
                    {'인증번호'}
                    <br />
                    {'다시받기'}
                  </button>
                )}
              </div>
            </div>
            {isWatingOtp && (
              <div className={styles.inp_txt}>
                <span>
                  {'입력까지 남은시간'}[{Math.round(time / 1000)} {'초]입니다.'}
                </span>
              </div>
            )}
            <div className={`${styles.login_btn} login_btn`}>
              {!validAccount && (
                <div className={`${styles.chk_box}`}>
                  <span style={{ minWidth: 120 }}>
                    <CheckBox
                      checked={persistTypedId}
                      onChange={(e) => {
                        setPersistTypedId(e.target.checked);
                      }}
                    >
                      {'아이디 저장하기'}
                    </CheckBox>
                  </span>
                </div>
              )}
              <button className={styles.clickbtn} onClick={validAccount ? handleLogin : handleSubmit(onValid)} disabled={verificationIsLoading}>
                {'로그인'}
              </button>
              {!validAccount && (
                <div className={styles.etc_btn}>
                  <Link href={'#'} onClick={findPassFn}>
                    {'비밀번호 찾기'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </form>
        <div className={styles.login_footer}>COPYRIGHT 2024 © WISE NETWORK. ALL RIGHTS RESERVED.</div>
      </div>
      {modalType.type === 'FIRST' && modalType.active && <FirstPassChangePop loginId={getValues().loginId} country={'ko'} changeType={changeType} />}
      {modalType.type === 'FINDPASS' && modalType.active && <FindPassPop />}
    </div>
  );
};

export default LoginClient;
