'use client';

import { ErrorBoundary } from 'react-error-boundary';
import Error from 'next/error';
import { ErrorMessage } from '../components';
import React from 'react';

const GlobalErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary fallback={<Error statusCode={500} />} onError={async (e) => await ErrorMessage(e.stack)}>
      {children}
    </ErrorBoundary>
  );
};

export default GlobalErrorBoundary;
