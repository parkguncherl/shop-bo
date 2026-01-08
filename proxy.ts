import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/** 인증 없이 접근 가능한 경로 모음 */
const PUBLIC_PATHS = ['/login', '/logout', '/noAuth'];

/** 본 proxy 영역에서는 토큰의 존재 여부만을 확인 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /**
   * 배포 환경(HTTPS): __Secure-next-auth.session-token
   * 개발 환경(HTTP): next-auth.session-token
   * */
  const hasToken = req.cookies.has('next-auth.session-token') || req.cookies.has('__Secure-next-auth.session-token');

  console.log('proxy: ', pathname);
  // 토큰 부재 상태에서 공공 경로가 아닌 경로로 향하는 경우
  // if (!hasToken && !PUBLIC_PATHS.includes(pathname)) {
  //   return NextResponse.redirect(new URL('/login', req.url));
  // }
  //
  // // 토큰이 존재하는 상태에서 로그인 경로로 향하는 경우
  // if (hasToken && pathname == '/login') {
  //   return NextResponse.redirect(new URL('/', req.url));
  // }

  return NextResponse.next();
  // const jwtToken = await getToken({
  //   req,
  //   secret: process.env.NEXT_AUTH_SECRET,
  // });
  // if (pathname?.startsWith('/login')) {
  //   if (jwtToken == null) {
  //     // 토큰 존재 여부만 확인, 존재할 시 리다이렉트
  //     return NextResponse.redirect(new URL(`/`, req.url));
  //   }
  // }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|\\.well-known).*)'],
};

// export default withAuth({
//   pages: {
//     signIn: '/login',
//   },
//   secret: process.env.NEXT_AUTH_SECRET,
//   callbacks: {
//     async authorized({ token, req }) {
//       const pathname = req.nextUrl.pathname;
//       const t = await getToken({
//         req,
//         secret: process.env.NEXT_AUTH_SECRET,
//       });
//       if (t) {
//         return true;
//       } else {
//         return false;
//       }
//     },
//   },
// });
//
