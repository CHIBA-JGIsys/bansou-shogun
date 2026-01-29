# CRM Application

営業活動を効率化するためのCRM（顧客関係管理）アプリケーション。
顧客管理、案件管理、タスク管理、商品管理などの機能を提供する。

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 14 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| データベース | PostgreSQL (Supabase) |
| ORM | Prisma |
| 認証 | NextAuth.js |
| 状態管理 | TanStack Query (React Query) |
| UIコンポーネント | Radix UI |
| ドラッグ&ドロップ | dnd-kit |
| グラフ | Recharts |

## 主要機能

### 顧客管理
- 顧客情報の登録・編集・削除
- クライアント・紹介者の区分管理
- 業種・事業規模での分類
- 主担当・副担当の設定
- 連絡ツール（メール、電話、Chatwork、Slack、LINE、Zoom）の管理

### 案件管理
- 案件の登録・編集・削除
- 進捗管理（リード → 初回面談 → 明細待ち → 明細取得済み）
- 顧客種別（新規/既存/紹介）の管理
- 営業担当・事務担当の割当

### 商材管理
- 商材の登録・編集・削除
- 商材種別（単発/ストック）の管理
- 進捗管理（交渉 → 提案 → 口頭承諾 → 契約）
- 確度（A/B/C/D）の設定
- 金額管理（見込み金額、確定金額、月額金額）
- 商材ごとのTODO管理

### タスク管理
- タスクの登録・編集・削除
- ステータス管理（未着手/進行中/完了）
- タスクタイプ（見積作成、契約書作成、請求書発行、納品対応、その他）
- 案件・商材への紐づけ
- 担当者割当・期日管理

### ダッシュボード
- 月次売上目標と実績の可視化
- 案件・商材の進捗状況
- 今日のタスク一覧

### 設定・管理機能
- ユーザー管理（招待制）
- 月次目標設定
- TODOテンプレート管理
- カスタムフィールド定義
- Webhook設定（送信・受信）

### ゴミ箱
- 削除したデータの一時保管
- 復元機能

## ディレクトリ構成

```
crm-app/
├── prisma/                    # Prismaスキーマ・マイグレーション
│   ├── schema.prisma          # データベーススキーマ定義
│   ├── migrations/            # マイグレーションファイル
│   └── seed.ts                # シードデータスクリプト
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (dashboard)/       # ダッシュボード関連ページ
│   │   │   ├── customers/     # 顧客管理
│   │   │   ├── deals/         # 案件管理
│   │   │   ├── products/      # 商品管理
│   │   │   ├── tasks/         # タスク管理
│   │   │   ├── settings/      # 設定
│   │   │   └── trash/         # ゴミ箱
│   │   └── api/               # API Routes
│   ├── components/            # Reactコンポーネント
│   │   ├── ui/                # 汎用UIコンポーネント
│   │   ├── dashboard/         # ダッシュボード用
│   │   ├── kanban/            # カンバンボード用
│   │   ├── settings/          # 設定画面用
│   │   └── providers/         # Context Providers
│   ├── hooks/                 # カスタムフック
│   ├── lib/                   # ユーティリティ・ライブラリ
│   │   ├── prisma.ts          # Prismaクライアント
│   │   ├── supabase.ts        # Supabaseクライアント
│   │   ├── auth.ts            # 認証設定
│   │   └── validation.ts      # バリデーション
│   ├── types/                 # TypeScript型定義
│   └── __tests__/             # テストファイル
├── .env.example               # 環境変数テンプレート
└── package.json               # 依存関係・スクリプト
```

## データモデル概要

### 主要エンティティ

| エンティティ | 説明 |
|-------------|------|
| User | ユーザー（管理者/営業/事務） |
| Customer | 顧客（クライアント/紹介者） |
| Deal | 案件 |
| Product | 商材（単発/ストック） |
| Task | タスク |

### エンティティ関連図

```
User (ユーザー)
  │
  ├── mainCustomers (主担当顧客)
  ├── subCustomers (副担当顧客)
  ├── salesDeals (営業担当案件)
  ├── officeDeals (事務担当案件)
  ├── salesProducts (営業担当商材)
  ├── officeProducts (事務担当商材)
  └── assignedTasks (担当タスク)

Customer (顧客)
  │
  ├── deals (案件)
  ├── referrer (紹介者)
  └── referrals (紹介先)

Deal (案件)
  │
  ├── customer (顧客)
  ├── products (商材)
  └── tasks (タスク)

Product (商材)
  │
  ├── deal (案件)
  ├── todos (商材TODO)
  └── tasks (タスク)

Task (タスク)
  │
  ├── deal (案件)
  └── product (商材)
```

### 補助エンティティ

| エンティティ | 説明 |
|-------------|------|
| FieldDefinition | カスタムフィールド定義 |
| ProductTodo | 商材ごとのTODOアイテム |
| TodoTemplate | TODOテンプレート |
| MonthlyTarget | 月次売上目標 |
| WebhookSend | 送信Webhook設定 |
| WebhookReceive | 受信Webhook設定 |

## 認証方式

### NextAuth.js による認証

本アプリケーションはNextAuth.jsを使用し、以下の認証方式に対応：

| 方式 | 説明 |
|------|------|
| Google OAuth | Googleアカウントでのログイン |
| Credentials | メールアドレス + パスワード |

### 招待制認証

- 新規ユーザーは管理者による招待が必要
- 招待されたユーザーのみがアカウントを作成可能
- `User.invitedAt` で招待日時を管理

### ユーザーロール

| ロール | 説明 | 権限 |
|--------|------|------|
| ADMIN | 管理者 | 全機能へのアクセス、ユーザー管理、設定変更 |
| SALES | 営業担当 | 顧客・案件・商材・タスクの操作 |
| OFFICE | 事務担当 | 限定的な操作権限 |

## 環境変数

`.env.local` に設定が必要な環境変数：

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ○ | Supabase プロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ○ | Supabase 匿名キー |
| `DATABASE_URL` | ○ | PostgreSQL接続文字列（Pooler経由） |
| `DIRECT_URL` | ○ | PostgreSQL直接接続（マイグレーション用） |
| `NEXTAUTH_URL` | ○ | アプリケーションURL |
| `NEXTAUTH_SECRET` | ○ | NextAuth秘密鍵（32文字以上） |
| `GOOGLE_CLIENT_ID` | - | Google OAuth クライアントID |
| `GOOGLE_CLIENT_SECRET` | - | Google OAuth シークレット |

詳細は `.env.example` を参照。

## テストユーザー

シードデータ投入後、以下のテストユーザーでログイン可能：

| ロール | メールアドレス | パスワード |
|--------|---------------|-----------|
| 管理者 | admin@example.com | password123 |
| 営業 | sales@example.com | password123 |
| 事務 | office@example.com | password123 |
