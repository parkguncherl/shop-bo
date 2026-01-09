import React from 'react';
// import { Layout } from '../../components/layout/Layout';
// import { getServerSession } from 'next-auth';
// import { authOptions } from './api/auth/[...nextauth]/route';
import styles from '../../styles/layout/layout.module.scss';
import { Header } from '../../components/layout/Header';
import { LeftNav } from '../../components/layout/LeftNav';
import { LeftNavChildren } from '../../components/layout/LeftNavClient';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

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
        <LeftNavChildren />
        <div className={`content ${styles.content}`}>{children}</div>
      </div>
    </div>
  );

  // <aside className={`${closed ? 'on' : ''}`}>
  //   <ul>
  //     <li
  //       className="ico_user"
  //       onClick={() => {
  //         router.push('/mypage');
  //       }}
  //     >
  //       {session?.user?.userNm || ''}
  //     </li>
  //     <li className="ico_date">
  //       <div>
  //         <span>{format(nowTime, 'M/d(EEE) HH:mm:ss', { locale: ko })}</span>
  //       </div>
  //     </li>
  //   </ul>
  //   <nav>
  //     <ul>
  //       {menuList.map((item, key) => (
  //         <MenuItem key={key} item={item} />
  //       ))}
  //     </ul>
  //   </nav>
  // </aside>
};
export default layout;
