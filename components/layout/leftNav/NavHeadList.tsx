import { useRouter } from 'next/navigation';
import React from 'react';
import { useSession } from 'next-auth/react';
import CurTime from './CurTime';

/**
 * 좌측 네비게이션 바의 상위 영역(헤더)를 이루는 클라이언트 사이드 영역
 * */
const NavHeadList = () => {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <>
      <li
        className="ico_user"
        onClick={() => {
          router.push('/mypage');
        }}
      >
        {session?.user?.userNm || ''}
      </li>
      <li className="ico_date">
        <CurTime />
      </li>
    </>
  );
};

export default NavHeadList;
