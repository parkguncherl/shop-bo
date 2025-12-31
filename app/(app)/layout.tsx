import React from 'react';
import { Layout } from '../../components/layout/Layout';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return <Layout>{children}</Layout>;
  //return children;
};
export default AppLayout;
