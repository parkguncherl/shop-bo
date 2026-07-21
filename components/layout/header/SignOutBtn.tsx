'use client';

import React, { useState } from 'react';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useRouter } from 'next/navigation';

/**
 * 헤더 영역 의존적!
 * 사용자의 로그아웃 의사를 핸들링하는 역할 담당
 * 의사 전달 시 컨펌 후 리다이렉트(실 동작은 리다이렉트된 영역의 클라이언트 영역에서 처리)
 * */
const SignOutBtn = () => {
  const router = useRouter();

  const [idelForUserResponse, setIdelForUserResponse] = useState(false);
  return (
    <>
      <button
        onClick={() => {
          setIdelForUserResponse(true);
        }}
      ></button>
      <ConfirmModal
        className={'logout'}
        title={'로그아웃 하시겠습니까?'}
        confirmText={'로그아웃'}
        open={idelForUserResponse}
        onConfirm={() => router.push('/logout')}
        onClose={() => {
          setIdelForUserResponse(false);
        }}
      />
    </>
  );
};

export default SignOutBtn;
