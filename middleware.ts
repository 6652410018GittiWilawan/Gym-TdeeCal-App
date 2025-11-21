import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Routes ที่ต้อง login
  const protectedRoutes = ['/Dashboard', '/Program', '/Addfood', '/UpdateProfile', '/Tdeecal']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Routes ที่ไม่ต้อง login (public routes)
  const publicRoutes = ['/', '/Login', '/Register']
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route
  )

  // ตรวจสอบว่ามี Supabase auth cookie หรือไม่
  // Supabase เก็บ session ใน cookie ที่มีชื่อ pattern: sb-<project-ref>-auth-token
  const allCookies = request.cookies.getAll()
  const hasAuthCookie = allCookies.some(cookie => {
    const name = cookie.name.toLowerCase()
    // ตรวจสอบ cookie ที่เกี่ยวข้องกับ Supabase auth
    return name.includes('auth-token') || 
           name.includes('supabase') || 
           name.startsWith('sb-') ||
           name.includes('access-token') ||
           name.includes('refresh-token')
  })

  // ถ้าเป็น protected route แต่ไม่มี auth cookie
  // ให้ผ่านไปก่อน (client-side จะตรวจสอบ session จาก localStorage)
  // แต่ถ้าเป็น route อื่นที่ไม่ใช่ Login/Register ก็ให้ redirect ไป Login
  if (isProtectedRoute && !hasAuthCookie) {
    // ถ้าไม่ใช่ Login หรือ Register route ให้ redirect
    if (!request.nextUrl.pathname.startsWith('/Login') && !request.nextUrl.pathname.startsWith('/Register')) {
      const redirectUrl = new URL('/Login', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // ถ้ามี auth cookie และพยายามเข้า Login/Register ให้ redirect ไป Dashboard
  if (hasAuthCookie && (request.nextUrl.pathname === '/Login' || request.nextUrl.pathname === '/Register')) {
    return NextResponse.redirect(new URL('/Dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
