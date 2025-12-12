import { NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // 1. 사용자 찾기
    const user = mockDb.users.find(u => u.email === email)

    // 2. 검증
    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // 3. 성공 응답 (비밀번호 제외)
    const { password: _, ...userWithoutPassword } = user
    
    // 실제로는 여기서 HTTP-only Cookie를 세팅해야 보안에 좋음
    const response = NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword
    })

    // 쿠키 설정 예시 (간단하게)
    response.cookies.set('auth-token', 'mock-jwt-token', {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    })

    return response

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

