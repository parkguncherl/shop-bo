'use client';
import { useRouter } from 'next/navigation';

/**
 * (client side)NoAuthClient
 * */
const NoAuthClient = () => {
  const router = useRouter();
  return (
    <div>
      <div>
        <div></div>
        <dl>
          <dt>
            {'접근 권한이'} <span>{'없습니다.'}</span>
          </dt>
          <dd>{'해당 페이지에 접근할 수 없습니다. 관리자에게 문의하세요.'}</dd>
        </dl>
        <div className={'btn_box_group center'}>
          <div className={'btn_box'}>
            <button className={'btn_grayline'} onClick={() => router.back()}>
              {'이전 페이지로 이동'}
            </button>
          </div>
          <div className={'btn_box'}>
            <button className={'btnPurple'} onClick={() => router.push('/', undefined)}>
              {'홈 바로가기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoAuthClient;
