import LoginClient from './LoginClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../(app)/api/auth/[...nextauth]/route';
import Loading from '../../../components/Loading';

/**
 * (server side)Login page
 * */
const page = async () => {
  const session = await getServerSession(authOptions);
  if (session == null) {
    return <LoginClient />;
  }
};

export default page;
