'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const CurTime = () => {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="brief_user_info" onClick={() => router.push('/mypage')}>
      {session?.user?.userNm || ''}
    </div>
  );
};

export default CurTime;
