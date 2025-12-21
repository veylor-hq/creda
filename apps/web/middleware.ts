import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/signin', '/signup']
const DEFAULT_AUTH_REDIRECT = '/dashboard'
const DEFAULT_GUEST_REDIRECT = '/signin'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('access_token')

  const isPublic = PUBLIC_ROUTES.some(route =>
    pathname.startsWith(route)
  )

  const isProtected = pathname.startsWith('/dashboard') ||
                      pathname.startsWith('/profile') ||
                      pathname.startsWith('/logout')

  if (!token && isProtected) {
    return NextResponse.redirect(
      new URL(DEFAULT_GUEST_REDIRECT, request.url)
    )
  }

  if (token && isPublic) {
    return NextResponse.redirect(
      new URL(DEFAULT_AUTH_REDIRECT, request.url)
    )
  }

  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(token ? DEFAULT_AUTH_REDIRECT : DEFAULT_GUEST_REDIRECT, request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/:path*'],
}
