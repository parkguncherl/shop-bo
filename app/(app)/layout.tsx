import React from 'react';
import stylesForLayout from '../../styles/layout/layout.module.scss';
import stylesForHeader from '../../styles/layout/header.module.scss';

//import { Header } from '../../components/layout/Header'; todo
import NavList from '../../components/layout/leftNav/NavList';
import CurTime from '../../components/layout/leftNav/CurTime';
import BriefUserInfo from '../../components/layout/leftNav/BriefUserInfo';
import Link from 'next/link';
//import { TabMenu } from '../../components/layout/TabMenu'; todo
import SignOutBtn from '../../components/layout/header/SignOutBtn';
import HistoryBox from '../../components/layout/header/tab/HistoryBox';
import FavoriteBox from '../../components/layout/header/tab/FavoriteBox';
import AuthStatusChecker from '../../components/layout/header/AuthStatusChecker';

/**
 * (server side)AppLayout
 * 실 동작 영역(app)의 최상위 레이아웃
 * */
const layout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={`appLayout ${stylesForLayout.layout}`}>
      <header className={`${stylesForHeader.header}`}>
        <AuthStatusChecker />
        <div className={stylesForHeader.left}>
          <h1>
            <Link href={'/'}>{'logo'}</Link>
          </h1>
        </div>

        <div className={'historyTab'}>
          <HistoryBox />
        </div>
        <div>
          <FavoriteBox />
        </div>
        {/*<TabMenu />*/}

        <div className={stylesForHeader.right}>
          <SignOutBtn />
        </div>
      </header>
      <div className={`container ${stylesForLayout.container}`}>
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
        <div className={`content ${stylesForLayout.content}`}>{children}</div>
      </div>
    </div>
  );
};
export default layout;
