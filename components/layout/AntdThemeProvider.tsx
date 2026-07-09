'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';

/**
 * antd ConfigProvider 제거. 남은 antd 컴포넌트가 없으므로 테마 토큰 주입 불필요.
 * 다크모드는 [data-theme="dark"] + _dark.scss 로 처리되며, 여기서는 isDark 를
 * ThemeContext 로만 전달한다(useDarkMode 소비처 유지).
 */
export default function AntdThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(session?.user?.tema === 'dark');
  }, [session]);

  return <ThemeContext value={isDark}>{children}</ThemeContext>;
}
