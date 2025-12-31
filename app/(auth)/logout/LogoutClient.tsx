'use client';

import { useEffect } from 'react';
import { authApi } from '../../../libs';

/**
 * (client side)LogoutClient
 * */
const LogoutClient = () => {
  useEffect(() => {
    const logout = async () => {
      try {
        await authApi.get('/auth/logoutAuto');
        location.href = '/login';
      } catch (error) {
        console.error('Logout failed:', error);
      }
    };

    logout();
  }, []);

  return <></>;
};

export default LogoutClient;
