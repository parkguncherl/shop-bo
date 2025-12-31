import Index from './Index';
import { Metadata } from 'next';

/**
 * (server side)IndexPage
 * */

export const metadata: Metadata = {
  title: 'Binblur',
};
const IndexPage = () => {
  return <Index />;
};

export default IndexPage;
