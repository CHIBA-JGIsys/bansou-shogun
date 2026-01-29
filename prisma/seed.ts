/**
 * Prisma Seed Script
 * テスト用の初期データを作成
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // テスト用管理者ユーザーを作成
  const adminEmail = 'admin@example.com'
  const adminPassword = 'password123'
  const passwordHash = await bcrypt.hash(adminPassword, 12)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      invitedAt: new Date(),
    },
    create: {
      email: adminEmail,
      name: 'テスト管理者',
      passwordHash,
      role: 'ADMIN',
      invitedAt: new Date(),
    },
  })

  console.log(`✅ Admin user created/updated: ${admin.email}`)

  // テスト用営業担当ユーザーを作成
  const salesEmail = 'sales@example.com'
  const salesPassword = 'password123'
  const salesPasswordHash = await bcrypt.hash(salesPassword, 12)

  const sales = await prisma.user.upsert({
    where: { email: salesEmail },
    update: {
      passwordHash: salesPasswordHash,
      invitedAt: new Date(),
    },
    create: {
      email: salesEmail,
      name: 'テスト営業',
      passwordHash: salesPasswordHash,
      role: 'SALES',
      invitedAt: new Date(),
    },
  })

  console.log(`✅ Sales user created/updated: ${sales.email}`)

  // テスト用事務担当ユーザーを作成
  const officeEmail = 'office@example.com'
  const officePassword = 'password123'
  const officePasswordHash = await bcrypt.hash(officePassword, 12)

  const office = await prisma.user.upsert({
    where: { email: officeEmail },
    update: {
      passwordHash: officePasswordHash,
      invitedAt: new Date(),
    },
    create: {
      email: officeEmail,
      name: 'テスト事務',
      passwordHash: officePasswordHash,
      role: 'OFFICE',
      invitedAt: new Date(),
    },
  })

  console.log(`✅ Office user created/updated: ${office.email}`)

  console.log('')
  console.log('🎉 Seeding completed!')
  console.log('')
  console.log('テストユーザー情報:')
  console.log('┌──────────────────────────────────────────────┐')
  console.log('│ 管理者: admin@example.com / password123      │')
  console.log('│ 営業:   sales@example.com / password123      │')
  console.log('│ 事務:   office@example.com / password123     │')
  console.log('└──────────────────────────────────────────────┘')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
