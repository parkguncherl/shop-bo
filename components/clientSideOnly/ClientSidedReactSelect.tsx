'use client';

import dynamic from 'next/dynamic';

/**
 * 서버 사이드 랜더링 값과의 부조화로 인하여 별도 컴포넌트로 처리된 react-select
 * 동적 임포팅 처리하여 서버 사이드에서의 랜더링을 방지하고 컴포넌트가 브라우저에서 마운트되는 시점에 임포팅, 사용 가능
 * */
const ClientSidedReactSelect = dynamic(() => import('react-select'), { ssr: false });

export default ClientSidedReactSelect;
