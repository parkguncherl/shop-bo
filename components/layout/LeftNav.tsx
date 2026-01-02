import React, { useEffect, useRef, useState } from 'react';
import { authApi } from '../../libs';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ApiResponseListLeftMenu } from '../../generated';
import Loading from '../Loading';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { DEFAULT_ADD_HOURE } from '../../libs/const';
import { useRouter, usePathname } from 'next/navigation';

interface IMenu {
  menuNm?: string;
  menuCd?: string;
  iconClassName?: string;
  menuUri?: string;
  items?: Array<IMenu>;
}

const hasChildren = (item: IMenu) => {
  const { items: children } = item;

  if (children === undefined) {
    return false;
  }

  if (children.constructor !== Array) {
    return false;
  }

  if (!children.length) {
    return false;
  }

  return true;
};

const MenuItem = ({ item }: { item: IMenu }) => {
  return hasChildren(item) ? <MultiLevel item={item} /> : <SingleLevel item={item} />;
};

/** 단독 메뉴 */
const SingleLevel = ({ item }: { item: IMenu }) => {
  return (
    <li>
      <Link
        href={item.menuUri || ''}
        onClick={async () => {
          closeSideMenu();
        }}
      >
        <span className={item.iconClassName}></span>
        <strong>{item.menuNm}</strong>
      </Link>
    </li>
  );
};

/** 하위 메뉴가 있는 메뉴 */
const MultiLevel = ({ item }: { item: IMenu }) => {
  const { items: children } = item;
  const router = useRouter();
  const isSelected = false;

  const bigUri = !item.menuUri ? '' : item.menuUri;

  // if (router.pathname) {
  //   if (bigUri == router.pathname.split('/')[1]) {
  //     isSelected = true;
  //   }
  // }
  // url 직접 들어왔을때 대메뉴 활성화 끝

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const aSide = e.currentTarget;

    // parentNode가 Element인지 확인하는 타입 가드 함수
    const isElement = (node: Node): node is Element => {
      return node.nodeType === node.ELEMENT_NODE;
    };

    const parent = aSide.parentNode;
    if (parent && isElement(parent)) {
      if (parent.classList.contains('on')) {
        parent.classList.remove('on');
      } else {
        // 모든 nav li 요소의 'on' 클래스를 제거
        if (typeof window !== 'undefined') {
          document.querySelectorAll('nav li').forEach((item: Element) => {
            item.classList.remove('on');
          });
          parent.classList.add('on');
        }
      }
    }
  };

  return (
    <li className={`${isSelected ? 'on' : ''}`}>
      <Link href={''} onClick={(e) => handleClick(e)}>
        <span className={item.iconClassName}></span>
        <strong>{item.menuNm}</strong>
      </Link>
      <ul>
        {children?.map((child, key) => (
          <ChildLevel key={key} item={child} />
        ))}
      </ul>
    </li>
  );
};

/** 메뉴 닫기 */
const closeSideMenu = () => {
  if (typeof window !== 'undefined') {
    const openSideMenu = document.querySelectorAll('nav li.on');

    for (let i = 0; i < openSideMenu.length; i++) {
      openSideMenu[i].classList.remove('on');
    }
  }
};

/** 하위 메뉴 링크 */
const ChildLevel = ({ item }: { item: IMenu }) => {
  const router = useRouter();
  const pathname = usePathname();

  const lastUri = !item.menuUri ? '' : item.menuUri;
  let isSelected = false;

  if (pathname && pathname.indexOf('_') > -1) {
    if (pathname.substring(0, pathname.indexOf('_')) == lastUri) {
      isSelected = false;
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // const openHeader = document.getElementsByClassName(`${headerStyles.menu_slide_btn} ${headerStyles.on}`);

    const aSide: HTMLAnchorElement = e.currentTarget;
    //aSide.parentNode?.parentNode?.classList.remove('on');
  };

  useEffect(() => {
    closeSideMenu();

    if (typeof window !== 'undefined') {
      const openHeader = document.getElementsByClassName(`${pathname.split('/')[2]}`);

      // 마이페이지는 제외
      if (pathname !== '/mypageForWms') {
        for (let i = 0; i < openHeader.length; i++) {
          openHeader[i].parentNode?.parentNode?.parentElement?.classList.add('on');
        }
      }
    }
  }, [pathname]);

  return (
    <li>
      <Link
        className={`${isSelected ? 'on' : ''} ${lastUri.split('/')[2]}`}
        href={pathname === lastUri ? '#' : lastUri}
        onClick={(e) => {
          if (pathname === lastUri) {
            router.push(item.menuUri || '');
          }
        }}
      >
        {item.menuNm}
      </Link>
    </li>
  );
};

interface Props {
  closed?: boolean;
}

export const LeftNav = ({ closed = false }: Props) => {
  const [nowTime, setNowTime] = useState(new Date());
  const [delayTime, setDelaytime] = useState(new Date());
  const { data: session, update: updateSession } = useSession();
  // 센터관련
  const initialCenters = [''];
  const centerRef = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      now.setHours(now.getHours() - (session?.user?.addTime ? session?.user?.addTime : DEFAULT_ADD_HOURE));
      setDelaytime(now);
      setNowTime(new Date());
    }, 1000);
  }, []);

  const sessions = useSession();
  const { data: menus, isFetching } = useQuery({
    queryKey: ['/menu/leftMenu'],
    queryFn: () => authApi.get<ApiResponseListLeftMenu>('/menu/leftMenu'),
    enabled: sessions.status === 'authenticated',
  });

  useEffect(() => {
    console.log('menus: ', menus, 'sessions: ', sessions);
  }, [menus, sessions]);

  if (isFetching) {
    return <Loading />;
  }

  return (
    <aside className={`${closed ? 'on' : ''}`}>
      <ul>
        <li
          className="ico_user"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/mypage/mypageForWms';
            }
          }}
        >
          {session?.user?.userNm || ''}
        </li>
        <li className="ico_date">
          <div>
            <span>{format(delayTime, 'M/d')}</span>
            <span>{format(nowTime, 'M/d(EEE) HH:mm:ss', { locale: ko })}</span>
          </div>
        </li>
      </ul>
      <nav>
        <ul>{menus && menus.data?.body?.map((item, key) => <MenuItem key={key} item={item} />)}</ul>
      </nav>
    </aside>
  );
};
