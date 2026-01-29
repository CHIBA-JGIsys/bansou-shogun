import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  /**
   * セッションのユーザー型を拡張
   * roleを追加してアクセス制御に使用
   */
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: 'ADMIN' | 'SALES' | 'OFFICE'
    }
  }

  /**
   * User型を拡張
   */
  interface User {
    role: 'ADMIN' | 'SALES' | 'OFFICE'
  }
}

declare module 'next-auth/jwt' {
  /**
   * JWT型を拡張
   */
  interface JWT {
    id: string
    role: 'ADMIN' | 'SALES' | 'OFFICE'
  }
}
