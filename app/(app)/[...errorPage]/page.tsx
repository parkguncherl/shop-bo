import ErrorPageClient from './ErrorPageClient';
import styles from '../../../styles/error.module.scss';

/**
 * (server side)Error page
 * */
const page = () => {
  return <ErrorPageClient styles={styles} />;
};

export default page;
