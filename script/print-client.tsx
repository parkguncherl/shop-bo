'use client';

import Script from 'next/script';

/**
 * 기존 page 라우터에서 전역으로 사용되던 script 영역을 분리
 * 문서 권장사항에 따라 해당 스크립트가 요구되는 영역에서 국소적으로 사용하도록 하여야, 또한 랜더링 과정과 독립적(context independent)
 * 이에 따라 클라이언트 랜더링 처리(서버 사이드에서 script 가 사용될 시 이는 적절치 않음)
 * */
export default function PrintScripts() {
  return (
    <>
      <Script src="/js/jquery-3.7.1.min.js" strategy="beforeInteractive" />
      <Script src="/js/printThis.min.js" strategy="afterInteractive" />
    </>
  );
}
