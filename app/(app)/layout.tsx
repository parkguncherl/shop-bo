import React from 'react';
import { Layout } from '../../components/layout/Layout';

/**
 * (server side)AppLayout
 * 실 동작 영역(app)의 최상위 레이아웃
 * */
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return <Layout>{children}</Layout>;
};
export default AppLayout;
