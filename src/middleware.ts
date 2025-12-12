import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // 공개 경로 (로그인 없이 접근 가능)
  if (path.startsWith('/api/auth') || path === '/login') {
    return NextResponse.next()
  }

  // 로그인 상태 확인 (쿠키 체크)
  const token = request.cookies.get('auth-token')?.value

  // 토큰이 없고, 보호된 경로로 접근 시 -> 로그인 페이지로 리다이렉트
  if (!token && path !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 토큰이 있는데 로그인 페이지로 접근 시 -> 메인으로 리다이렉트
  if (token && path === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// 미들웨어가 적용될 경로 설정
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) -> 단, api/auth는 위에서 예외처리함
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

