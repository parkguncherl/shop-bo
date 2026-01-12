'use client';

import React from 'react';
import { useSession } from 'next-auth/react';

/**
 * 재고정보 메인 페이지 컴포넌트
 * SKU단위와 LOC단위 보기를 전환할 수 있는 메인 컴포넌트
 */
const MobileAsn: React.FC = () => {
  // 세션 정보
  const session = useSession();
  return (
    <div>
      <nav>
        <button>프필트</button>
        <button>김예솔</button>
        <button>경번사</button>
      </nav>

      <div>
        <input type="text" placeholder="김예솔" />
      </div>

      <main>
        <button>경번사</button>
        <button>생산처 2</button>
        <button>생산처 3</button>
        <button>생산처 4</button>
        <button>생산처 5</button>
        <button>생산처 6</button>
        <button>생산처 7</button>
        <button>생산처 8</button>
        <button>생산처 9</button>
        <button>생산처 10</button>
        <div>...</div>
        <button>생물보기 </button>
      </main>

      <footer>
        <button>일반 발주</button>
        <button>수산 발주</button>
      </footer>
    </div>
  );
};

export default React.memo(MobileAsn);
