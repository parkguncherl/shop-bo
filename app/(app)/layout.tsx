import React from 'react';
import stylesForLayout from '@/styles/layout/layout.module.scss';
import stylesForHeader from '@/styles/layout/header.module.scss';

import NavList from '@/components/layout/leftNav/NavList';
import BriefUserInfo from '@/components/layout/leftNav/BriefUserInfo';
import Link from 'next/link';
import SignOutBtn from '@/components/layout/header/SignOutBtn';
import HistoryBox from '@/components/layout/header/tab/HistoryBox';
import FavoriteBox from '@/components/layout/header/tab/FavoriteBox';
import AuthStatusChecker from '@/components/layout/header/AuthStatusChecker';
import ThemeApplier from '@/components/layout/ThemeApplier';
import ThemeProvider from '@/components/layout/ThemeProvider';

/**
 * (server side)AppLayout
 * 실 동작 영역(app)의 최상위 레이아웃
 * */
const layout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <div className={`appLayout ${stylesForLayout.layout}`}>
        <ThemeApplier />
        <header className={`${stylesForHeader.header}`}>
          <AuthStatusChecker />
          <div className={stylesForHeader.left}>
            <h1>
              <Link href={'/'} style={{ display: 'flex', alignItems: 'center', color: '#fff', fontSize: '18px', fontWeight: 700, letterSpacing: '2px' }}>
                {'MAPSIGGUN'}
              </Link>
            </h1>
          </div>

          <div className={'historyTab'}>
            <HistoryBox />
          </div>
          <div>
            <FavoriteBox />
          </div>

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
            </ul>
            <nav>
              <NavList />
            </nav>
          </aside>
          <div className={`content ${stylesForLayout.content}`}>{children}</div>
        </div>
      </div>
    </ThemeProvider>
  );
};
export default layout;
