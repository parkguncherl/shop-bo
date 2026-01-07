import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/** 인증 없이 접근 가능한 경로 모음 */
const PUBLIC_PATHS = ['/login', '/logout', '/noAuth'];

/** 본 proxy 영역에서는 토큰의 존재 여부만을 확인 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // public path 인 경우 proxy 적용 생략
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return;
  }

  //console.log('req: ', req);
  // const jwtToken = await getToken({
  //   req,
  //   secret: process.env.NEXT_AUTH_SECRET,
  // });
  // if (pathname?.startsWith('/login')) {
  //   if (jwtToken) {
  //     // 토큰 존재 여부만 확인, 존재할 시 리다이렉트
  //     return NextResponse.redirect(new URL(`/`, req.url));
  //   }
  // }
}

export const config = {
  matcher: ['/:path*'],
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
