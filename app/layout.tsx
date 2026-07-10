import React from 'react';
import RootProvider from '../provider/root/rootProvider';
import GlobalErrorBoundary from './globalErrorBoundary';
import { Metadata } from 'next';

// 정적 css 파일 목록
import '../styles/global.scss';
// Tailwind CSS v4 + shadcn/ui 기반 스타일 (preflight 제외 → 기존 antd/scss 화면에 영향 없음)
import './globals.css';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

/**
 * (server side)RootLayout
 * 해당 애플리케이션의 DOM 중 최상위 영역, 해당 영역에서 전역 provider 제공
 * */
export const metadata: Metadata = {
  title: 'MAPSIGGUN',
  icons: { icon: '/favicon_logo.svg' },
};
const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className={'wms'}>
        {/* todo PrintScripts 는 추후 해당 스크립트를 요하는 컴포넌트 각각에서의 사용이 더 안전, 현재는 기존 page 라우팅과 유사하게 전역적으로 선언하였으나 추후 리팩터링 하여야 */}
        {/*<PrintScripts />*/}
        <RootProvider>
          <GlobalErrorBoundary>{children}</GlobalErrorBoundary>
        </RootProvider>
      </body>
    </html>
  );
};
export default layout;
