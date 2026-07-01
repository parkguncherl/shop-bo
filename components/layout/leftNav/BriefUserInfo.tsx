'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { MyInfoPop } from '../../popup/mypage/MyInfoPop';

const BriefUserInfo = () => {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="brief_user_info" onClick={() => setOpen(true)} style={{ cursor: 'pointer' }}>
        {session?.user?.userNm || ''}
      </div>
      <MyInfoPop open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default BriefUserInfo;
