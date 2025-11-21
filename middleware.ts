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
  // Supabase เก็บ session ใน localStorage ไม่ใช่ cookies ดังนั้น middleware จะไม่เห็น
  // แต่ client-side จะตรวจสอบและ redirect ไป Login ถ้าไม่มี session
  // ไม่ต้อง block ที่ middleware เพราะ Supabase ใช้ localStorage

  // ถ้ามี auth cookie และพยายามเข้า Login/Register ให้ redirect ไป UpdateProfile
  if (hasAuthCookie && (request.nextUrl.pathname === '/Login' || request.nextUrl.pathname === '/Register')) {
    return NextResponse.redirect(new URL('/UpdateProfile', request.url))
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
