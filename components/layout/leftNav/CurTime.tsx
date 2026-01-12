'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import React, { useEffect, useState } from 'react';
import { DEFAULT_ADD_HOURE } from '../../../libs/const';
import { useSession } from 'next-auth/react';

/**
 * 시간 출력 영역을 별도 클라이언트 사이드 영역으로 분리
 * */
const CurTime = () => {
  const { data: session } = useSession();

  const [nowTime, setNowTime] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      now.setHours(now.getHours() - (session?.user?.addTime ? session?.user?.addTime : DEFAULT_ADD_HOURE));
      setNowTime(new Date());
    }, 1000);

    return () => clearInterval(timer); // clean up
  }, []);

  return (
    <div>
      <span>{nowTime && format(nowTime, 'M/d(EEE) HH:mm:ss', { locale: ko })}</span>
    </div>
  );
};

export default CurTime;
