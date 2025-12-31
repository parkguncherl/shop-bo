import React from 'react';
import PrintScripts from '../script/print-client';
import RootProvider from '../provider/root/rootProvider';
import GlobalErrorBoundary from './globalErrorBoundary';
import { Metadata } from 'next';

// 정적 css 파일 목록
import '../styles/global.scss';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

/**
 * 최상단 layout 영역
 * 해당 애플리케이션의 DOM 중 최상위 영역, 해당 영역에서
 * */
export const metadata: Metadata = {
  title: 'BINBLUR',
};
const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body>
        {/* todo PrintScripts 는 추후 해당 스크립트를 요하는 컴포넌트 각각에서의 사용이 더 안전, 현재는 기존 page 라우팅과 유사하게 전역적으로 선언하였으나 추후 리팩터링 하여야 */}
        <PrintScripts />
        <RootProvider>
          <GlobalErrorBoundary>{children}</GlobalErrorBoundary>
        </RootProvider>
      </body>
    </html>
  );
};
export default RootLayout;
