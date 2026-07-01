'use client';

import { createContext, useContext } from 'react';

export const ThemeContext = createContext<boolean>(false);

export const useDarkMode = () => useContext(ThemeContext);
