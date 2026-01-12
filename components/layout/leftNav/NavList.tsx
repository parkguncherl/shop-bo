'use client';

import React, { useEffect, useState } from 'react';
import { ApiResponseListLeftMenu, LeftMenu } from '../../../generated';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { toastError } from '../../ToastMessage';
import { useSession } from 'next-auth/react';

interface IMenu {
  menuNm?: string;
  menuCd?: string;
  iconClassName?: string;
  menuUri?: string;
  items?: Array<IMenu>;
}
interface Props {}

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
      <Link href={item.menuUri || ''}>
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

/**
 * nav 태그 이하에서 사용 가능한 고수준 client side 컴포넌트
 * */
const NavList = () => {
  const sessions = useSession();

  const [menuList, setMenuList] = useState<LeftMenu[]>([]);

  const { data: menus, isSuccess: isMenuListFetchSuccess } = useQuery({
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

  return (
    <ul>
      {menuList.map((item, key) => (
        <MenuItem key={key} item={item} />
      ))}
    </ul>
  );
};

export default NavList;
