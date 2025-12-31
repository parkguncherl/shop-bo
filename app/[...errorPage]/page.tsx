import ErrorPageClient from './ErrorPageClient';
import styles from '../../styles/error.module.scss';

/**
 * (server side)ErrorPage
 * */
const ErrorPage = () => {
  return <ErrorPageClient styles={styles} />;
};

export default ErrorPage;
