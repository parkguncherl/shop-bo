'use client';

import { useState } from 'react';

/**
 * date: 2026-04-03
 * user: park junsung
 * desc: 좌측 메뉴(nav) 영역을 관할하는 클라이언트 컴포넌트
 * */
const Navs = () => {
  // const sessions = useSession();
  //
  // const { data: menus } = useQuery({
  //   queryKey: ['/menu/leftMenu'],
  //   queryFn: () => authApi.get<ApiResponseListLeftMenu>('/menu/leftMenu'),
  //   enabled: sessions.status === 'authenticated',
  // });

  //const menuList = menus?.data?.resultCode === 200 ? menus.data.body || [] : [];

  const [dropped, setDropped] = useState(false); // true 일 시 메뉴 펼쳐짐

  return (
    <div className={'navs'}>
      {!dropped ? (
        <div className={'navBar'}>
          <div className={'bars'} onClick={() => setDropped(true)}>
            <div className={'bar'}></div>
            <div className={'bar'}></div>
            <div className={'bar'}></div>
          </div>
        </div>
      ) : (
        <div></div>
      )}
    </div>
    // <ul>
    //   {menuList.map((item, key) => (
    //     <MenuItem key={key} item={item} />
    //   ))}
    // </ul>
  );
};

export default Navs;
