import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import type { Adapter } from 'next-auth/adapters'

/**
 * NextAuth.js 認証設定
 *
 * 【認証方式】
 * - 招待制：管理者が招待したユーザーのみログイン可能
 * - 新規登録（サインアップ）機能は無効化
 * - Google認証も招待済みユーザーのみ許可
 * - 招待されていないメールアドレスでのログインは拒否
 *
 * 【権限（Role）】
 * - ADMIN: 全機能 + ユーザー管理 + 設定画面
 * - SALES: 顧客・案件・商材・タスクのCRUD（削除不可）
 * - OFFICE: 閲覧中心、タスク完了操作可
 *
 * 【開発環境】
 * - Credentials Provider でメール/パスワードログインが可能
 * - テストユーザー: admin@example.com / password123
 */

// Providers配列を構築
const providers = []

// Google Provider（クライアントIDが設定されている場合のみ）
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

// Credentials Provider（開発環境のみ）
if (process.env.NODE_ENV === 'development' || process.env.ENABLE_CREDENTIALS === 'true') {
  providers.push(
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'メールアドレス', type: 'email' },
        password: { label: 'パスワード', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('メールアドレスとパスワードを入力してください')
        }

        // ユーザーを検索
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          throw new Error('メールアドレスまたはパスワードが正しくありません')
        }

        // 招待済みチェック
        if (!user.invitedAt) {
          throw new Error('招待されていないユーザーです')
        }

        // 論理削除チェック
        if (user.deletedAt) {
          throw new Error('このアカウントは無効化されています')
        }

        // パスワードチェック（passwordHashフィールドを使用）
        const passwordHash = (user as unknown as { passwordHash?: string }).passwordHash
        if (!passwordHash) {
          throw new Error('パスワードが設定されていません。管理者に連絡してください')
        }

        const isValidPassword = await bcrypt.compare(credentials.password, passwordHash)
        if (!isValidPassword) {
          throw new Error('メールアドレスまたはパスワードが正しくありません')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    })
  )
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,

  providers,

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    /**
     * サインイン時のコールバック
     * 招待済みユーザーのみログインを許可
     */
    async signIn({ user, account }) {
      // Credentials Providerの場合はauthorizeで既にチェック済み
      if (account?.provider === 'credentials') {
        return true
      }

      if (!user.email) {
        return false
      }

      // 既存ユーザーか確認
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      })

      // 招待済みユーザーのみ許可（invitedAtが設定されている）
      if (!existingUser || !existingUser.invitedAt) {
        // 未招待のユーザーはログイン拒否
        return '/login?error=NotInvited'
      }

      // 論理削除されたユーザーは拒否
      if (existingUser.deletedAt) {
        return '/login?error=AccountDisabled'
      }

      return true
    },

    /**
     * JWT生成時のコールバック
     * ユーザーのroleをトークンに含める
     */
    async jwt({ token, user, trigger, session }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, role: true, name: true },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
          token.name = dbUser.name
        }
      }

      // セッション更新時
      if (trigger === 'update' && session) {
        token.name = session.name
      }

      return token
    },

    /**
     * セッション生成時のコールバック
     * JWTの情報をセッションに含める
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as 'ADMIN' | 'SALES' | 'OFFICE'
      }
      return session
    },
  },

  events: {
    /**
     * サインイン成功時のイベント
     */
    async signIn({ user }) {
      if (user.email) {
        // 最終ログイン日時を更新（必要に応じて）
        await prisma.user.update({
          where: { email: user.email },
          data: { updatedAt: new Date() },
        })
      }
    },
  },
}

/**
 * 権限チェックヘルパー関数
 */
export function hasPermission(
  userRole: 'ADMIN' | 'SALES' | 'OFFICE',
  requiredRole: 'ADMIN' | 'SALES' | 'OFFICE'
): boolean {
  const roleHierarchy = { ADMIN: 3, SALES: 2, OFFICE: 1 }
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * 管理者権限チェック
 */
export function isAdmin(role: 'ADMIN' | 'SALES' | 'OFFICE'): boolean {
  return role === 'ADMIN'
}

/**
 * 削除権限チェック（ADMINのみ）
 */
export function canDelete(role: 'ADMIN' | 'SALES' | 'OFFICE'): boolean {
  return role === 'ADMIN'
}

/**
 * パスワードハッシュ生成（ユーザー作成時に使用）
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

/**
 * パスワード検証
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}
