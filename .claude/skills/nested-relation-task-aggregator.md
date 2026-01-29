# nested-relation-task-aggregator

ネストしたリレーションからタスクを集約し、関連元情報付きで表示するパターン。

## 概要

多階層のリレーション（例：顧客→案件→商材→タスク）から、末端のエンティティ（タスク）を抽出し、フラットなリストとして表示する。各タスクには関連元の情報（どの案件・商材に属するか）を付与する。

## 使用場面

- 顧客詳細ページで、その顧客に関連する全タスクを一覧表示したい
- 親エンティティの詳細ページで、子孫エンティティを集約表示したい
- 複数階層にまたがるデータを横断的に検索・表示したい

## 多階層リレーションの構造例

```
顧客（Customer）
  └── 案件（Deal）[]
        ├── タスク（Task）[]           ← 案件直下のタスク
        └── 商材（Product）[]
              └── タスク（Task）[]     ← 商材配下のタスク
```

## TypeScript型定義

```typescript
// 基本のタスク型
interface TaskItem {
  id: string
  name: string
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
  taskType: string | null
  dueDate: string | null
  assignee: { id: string; name: string } | null
}

// 商材（タスクを含む）
interface ProductItem {
  id: string
  name: string
  tasks: TaskItem[]
}

// 案件（タスクと商材を含む）
interface DealItem {
  id: string
  name: string
  progress: string
  tasks: TaskItem[]
  products: ProductItem[]
}

// 親エンティティ（案件リストを含む）
interface ParentEntity {
  id: string
  name: string
  deals: DealItem[]
}

// 集約後のタスク型（関連元情報付き）
interface AggregatedTask extends TaskItem {
  dealId: string
  dealName: string
  source: string  // 表示用の関連元ラベル
}
```

## flatMapを使った集約パターン

### 基本パターン：2階層のタスク集約

```typescript
// 案件直下のタスクを抽出
const dealTasks = parent.deals.flatMap((deal) =>
  (deal.tasks || []).map((task) => ({
    ...task,
    dealId: deal.id,
    dealName: deal.name,
    source: `案件: ${deal.name}`,
  }))
)

// 商材配下のタスクを抽出（3階層）
const productTasks = parent.deals.flatMap((deal) =>
  (deal.products || []).flatMap((product) =>
    (product.tasks || []).map((task) => ({
      ...task,
      dealId: deal.id,
      dealName: deal.name,
      source: `商材: ${product.name}`,
    }))
  )
)

// 全タスクを統合
const allTasks: AggregatedTask[] = [...dealTasks, ...productTasks]
```

### ポイント

1. **null/undefined 対策**: `(deal.tasks || [])` で空配列フォールバック
2. **関連元情報の付与**: `source` フィールドで表示用ラベルを追加
3. **型の拡張**: スプレッド演算子で元のプロパティを保持しつつ追加

## 楽観的UI更新への対応

ネストしたリレーションの楽観的UI更新は複雑になりがち。専用の更新関数を作成する。

```typescript
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED'

// ネストしたリレーション内のタスクを更新するヘルパー関数
const updateTaskInParent = (
  prev: ParentEntity | null,
  taskId: string,
  newStatus: TaskStatus
): ParentEntity | null => {
  if (!prev) return prev

  return {
    ...prev,
    deals: prev.deals.map((deal) => ({
      ...deal,
      // 案件直下のタスクを更新
      tasks: deal.tasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      ),
      // 商材配下のタスクを更新
      products: (deal.products || []).map((product) => ({
        ...product,
        tasks: product.tasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        ),
      })),
    })),
  }
}
```

### 楽観的UI更新の実装例

```typescript
const handleTaskStatusToggle = async (
  taskId: string,
  currentStatus: TaskStatus
) => {
  const newStatus: TaskStatus =
    currentStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED'

  // 楽観的UI更新
  setParent((prev) => updateTaskInParent(prev, taskId, newStatus))

  try {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })

    if (!res.ok) {
      // 失敗時はロールバック
      setParent((prev) => updateTaskInParent(prev, taskId, currentStatus))
    }
  } catch (error) {
    console.error('Failed to update task status:', error)
    // ロールバック
    setParent((prev) => updateTaskInParent(prev, taskId, currentStatus))
  }
}
```

## 表示コンポーネント例

```tsx
{allTasks.map((task) => (
  <div key={task.id} className="flex items-center gap-3 p-3 border rounded">
    {/* チェックボックス */}
    <button onClick={() => handleTaskStatusToggle(task.id, task.status)}>
      {task.status === 'COMPLETED' ? (
        <CheckCircle2 className="h-5 w-5 text-green-500" />
      ) : (
        <Circle className="h-5 w-5 text-gray-300" />
      )}
    </button>

    {/* タスク情報 */}
    <div className="flex-1">
      <div className={task.status === 'COMPLETED' ? 'line-through' : ''}>
        {task.name}
      </div>
      <div className="text-sm text-gray-500">
        <span className="text-gray-400">{task.source}</span>
        {task.dueDate && <span> • 期限: {formatDate(task.dueDate)}</span>}
        {task.assignee && <span> • {task.assignee.name}</span>}
      </div>
    </div>

    {/* ステータスバッジ */}
    <StatusBadge status={task.status} />
  </div>
))}
```

## 応用：ソート・フィルタリング

```typescript
// ステータスでソート（未完了を上に）
const sortedTasks = [...allTasks].sort((a, b) => {
  const order = { TODO: 0, IN_PROGRESS: 1, COMPLETED: 2 }
  return order[a.status] - order[b.status]
})

// 期限でフィルタリング（今週期限のみ）
const thisWeekTasks = allTasks.filter((task) => {
  if (!task.dueDate) return false
  const due = new Date(task.dueDate)
  const now = new Date()
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  return due >= now && due <= weekLater
})

// 関連元でグルーピング
const tasksBySource = allTasks.reduce((acc, task) => {
  const key = task.source
  if (!acc[key]) acc[key] = []
  acc[key].push(task)
  return acc
}, {} as Record<string, AggregatedTask[]>)
```

## チェックリスト

- [ ] 型定義に関連元情報（source, parentId等）を追加
- [ ] flatMapで多階層を展開
- [ ] null/undefinedのフォールバック処理
- [ ] 楽観的UI更新用のヘルパー関数を作成
- [ ] ロールバック処理を実装
- [ ] 表示コンポーネントで関連元を表示
