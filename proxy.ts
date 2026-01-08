import { NextRequest, NextResponse } from 'next/server';

/** 인증 없이 접근 가능한 경로 모음 */
const PUBLIC_PATHS = ['/login', '/logout', '/noAuth'];

/**
 * 본 proxy 영역에서는 토큰의 존재 여부만을 확인
 * 토큰의 유효성 검사 및 백앤드 영역과의 동기화는 여전히 클라이언트의 책임
 * */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /**
   * 배포 환경(HTTPS): __Secure-next-auth.session-token
   * 개발 환경(HTTP): next-auth.session-token
   * */
  const hasToken = req.cookies.has('next-auth.session-token') || req.cookies.has('__Secure-next-auth.session-token');

  // 토큰 부재 상태에서 공공 경로가 아닌 경로로 향하는 경우
  if (!hasToken && !PUBLIC_PATHS.includes(pathname)) {
    console.log('redirected because of trying to access to private path without access token'); // 접근 거부
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 토큰이 존재하는 상태에서 로그인 경로로 향하는 경우
  if (hasToken && pathname == '/login') {
    console.log('redirected because of trying to access to public path with access token'); // 접근 거부
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|\\.well-known).*)'], // 예약 경로, 및 _next, 이미지 등의 리소스 경로 제외
};
