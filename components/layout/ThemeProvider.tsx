'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { ThemeContext } from '@/contexts/ThemeContext';

/**
 * 테마(다크모드) 컨텍스트 제공자.
 * 다크모드는 [data-theme="dark"] + _dark.scss 로 처리되며, 여기서는 isDark 를
 * ThemeContext 로만 전달한다(useDarkMode 소비처 유지).
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(session?.user?.tema === 'dark');
  }, [session]);

  return <ThemeContext value={isDark}>{children}</ThemeContext>;
}
