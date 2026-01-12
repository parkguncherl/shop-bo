'use client';

import React, { useEffect, useState } from 'react';
import { authApi } from '../../libs';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ApiResponseListLeftMenu, LeftMenu } from '../../generated';
import Loading from '../Loading';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { DEFAULT_ADD_HOURE } from '../../libs/const';
import { useRouter, usePathname } from 'next/navigation';
import { toastError } from '../ToastMessage';

interface IMenu {
  menuNm?: string;
  menuCd?: string;
  iconClassName?: string;
  menuUri?: string;
  items?: Array<IMenu>;
}

const hasChildren = (item: IMenu) => {
  const { items: children } = item;

  if (children === undefined || children.constructor !== Array || children.length == 0) {
    return false;
  } else {
    return true;
  }
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
    <li className={''}>
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

export const LeftNavChildren = ({ closed = false }: Props) => {
  const router = useRouter();

  const [menuList, setMenuList] = useState<LeftMenu[]>([]);
  const [nowTime, setNowTime] = useState(new Date());
  const { data: session, update: updateSession } = useSession();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      now.setHours(now.getHours() - (session?.user?.addTime ? session?.user?.addTime : DEFAULT_ADD_HOURE));
      //setDelaytime(now);
      setNowTime(new Date());
    }, 1000);

    return () => clearInterval(timer); // clean up
  }, []);

  const sessions = useSession();
  const {
    data: menus,
    isFetching,
    isSuccess: isMenuListFetchSuccess,
  } = useQuery({
    queryKey: ['/menu/leftMenu'],
    queryFn: () => authApi.get<ApiResponseListLeftMenu>('/menu/leftMenu'),
    enabled: sessions.status === 'authenticated',
  });

  useEffect(() => {
    if (isMenuListFetchSuccess) {
      const { resultCode, body, resultMessage } = menus.data;
      if (resultCode == 200) {
        setMenuList(body || []);
      } else {
        toastError(resultMessage);
      }
    }
  }, [menus, isMenuListFetchSuccess]);

  if (isFetching) {
    return <Loading />;
  }

  return (
    <aside>
      <ul>
        <li
          className="ico_user"
          onClick={() => {
            router.push('/mypage');
          }}
        >
          {session?.user?.userNm || ''}
        </li>
        <li className="ico_date">
          <div>
            <span>{format(nowTime, 'M/d(EEE) HH:mm:ss', { locale: ko })}</span>
          </div>
        </li>
      </ul>
      <nav>
        <ul>
          {menuList.map((item, key) => (
            <MenuItem key={key} item={item} />
          ))}
        </ul>
      </nav>
    </aside>
  );
};
