import React from 'react';
import { Layout } from '../../components/layout/Layout';
import styles from '../../styles/layout/layout.module.scss';
import { HeaderWms, LeftNav } from '../../components/layout';

/**
 * (server side)AppLayout
 * 실 동작 영역(app)의 최상위 레이아웃
 * */
const layout = ({ children }: { children: React.ReactNode }) => {
  return <Layout>{children}</Layout>;
  // <div className={`wmsLayout ${styles.layout}`}>
  //   {/*<HeaderWms closed={closed} toggle={() => setClosed(!closed)} />*/}
  //   <HeaderWms />
  //   <div className={`container ${styles.container} ${closed ? styles.on : ''}`}>
  //     <LeftNav />
  //     <div className={`content ${styles.content}`}>{children}</div>
  //   </div>
  // </div>;
};
export default layout;
