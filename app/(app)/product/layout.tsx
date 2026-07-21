import React from 'react';
import '@/styles/layout/product/srcEnumerator.scss';

/**
 * (server side)product layout
 * product 경로 이하에 대한 전역 스타일링 등 제공 가능
 * */

const layout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
export default layout;
