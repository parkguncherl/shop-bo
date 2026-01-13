'use client';

import React from 'react';
import { useSession } from 'next-auth/react';

const CurTime = () => {
  const { data: session } = useSession();
  //const router = useRouter();

  return (
    <div
      className="brief_user_info"
      onClick={() => {
        // todo
      }}
    >
      {session?.user?.userNm || ''}
    </div>
  );
};

export default CurTime;
