import React from 'react';
import styles from '../../styles/layout/layout.module.scss';
import { Header } from '../../components/layout/Header';
import NavList from '../../components/layout/leftNav/NavList';
import CurTime from '../../components/layout/leftNav/CurTime';
import BriefUserInfo from '../../components/layout/leftNav/BriefUserInfo';

/**
 * (server side)AppLayout
 * 실 동작 영역(app)의 최상위 레이아웃
 * */
const layout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={`appLayout ${styles.layout}`}>
      <Header />
      <div className={`container ${styles.container}`}>
        <aside>
          <ul>
            <li className="ico_user">
              <BriefUserInfo />
            </li>
            <li className="ico_date">
              <CurTime />
            </li>
          </ul>
          <nav>
            <NavList />
          </nav>
        </aside>
        <div className={`content ${styles.content}`}>{children}</div>
      </div>
    </div>
  );
};
export default layout;
