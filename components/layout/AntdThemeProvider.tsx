'use client';

import { useSession } from 'next-auth/react';
import { ConfigProvider, theme } from 'antd';
import { useEffect, useState } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';

export default function AntdThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(session?.user?.tema === 'dark');
  }, [session]);

  return (
    <ThemeContext value={isDark}>
      <ConfigProvider
        theme={{
          algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: isDark
            ? {
                colorBgContainer: '#252538',
                colorBgElevated: '#1e1e30',
                colorBorder: 'rgba(255,255,255,0.45)',
                colorText: '#d0d0e0',
                colorTextPlaceholder: '#555570',
                colorPrimary: '#7c3aed',
              }
            : {},
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext>
  );
}
