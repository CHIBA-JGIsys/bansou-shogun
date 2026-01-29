// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

/**
 * 認証ミドルウェア
 *
 * 保護されたルートへのアクセスを制御
 * 未認証ユーザーはログインページにリダイレクト
 * 権限不足の場合は403エラー
 *
 * TODO: 開発中は一時的に無効化
 */

// 開発中は認証をバイパス
export function middleware() {
  return NextResponse.next()
}

// export default withAuth(
//   function middleware(req) {
//     const token = req.nextauth.token
//     const pathname = req.nextUrl.pathname

//     // 設定画面は管理者のみ
//     if (pathname.startsWith('/settings') && token?.role !== 'ADMIN') {
//       return NextResponse.redirect(new URL('/dashboard?error=Unauthorized', req.url))
//     }

//     return NextResponse.next()
//   },
//   {
//     callbacks: {
//       authorized: ({ token }) => !!token,
//     },
//   }
// )

/**
 * ミドルウェアを適用するパス
 * 認証が必要なルートを指定
 */
export const config = {
  matcher: [
    // 認証が必要なページ
    '/dashboard/:path*',
    '/customers/:path*',
    '/deals/:path*',
    '/products/:path*',
    '/tasks/:path*',
    '/trash/:path*',
    '/settings/:path*',
    // APIルート（auth以外）
    '/api/((?!auth).)*',
  ],
}
