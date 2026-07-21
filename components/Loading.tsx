'use client';

import styles from '@/styles/loading.module.scss';
import { useEffect } from 'react';

const Loading = () => {
  useEffect(() => {
    // 스크롤 없애기
    if (typeof window !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
    // 컴포넌트 언마운트 시 스크롤 원상 복구
    return () => {
      if (typeof window !== 'undefined') {
        document.body.style.overflow = 'auto';
      }
    };
  }, []);

  return (
    <div className={styles.loadingBox}>
      <div className={styles.boxArea}></div>
    </div>
  );
};

export default Loading;
