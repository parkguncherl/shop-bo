import React from 'react';
// import { Layout } from '../../components/layout/Layout';
// import { getServerSession } from 'next-auth';
// import { authOptions } from './api/auth/[...nextauth]/route';
import styles from '../../styles/layout/layout.module.scss';
import { Header } from '../../components/layout/Header';
import { LeftNav } from '../../components/layout/LeftNav';

/**
 * (server side)AppLayout
 * 실 동작 영역(app)의 최상위 레이아웃
 * */
const layout = async ({ children }: { children: React.ReactNode }) => {
  //const session = await getServerSession(authOptions);
  //return <Layout>{children}</Layout>;
  return (
    <div className={`wmsLayout ${styles.layout}`}>
      <Header />
      <div className={`container ${styles.container}`}>
        <LeftNav />
        <div className={`content ${styles.content}`}>{children}</div>
      </div>
    </div>
  );
};
export default layout;
