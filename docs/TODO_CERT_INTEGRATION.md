# Todo-자격증 연동 가이드

## 📌 개요

Todo 항목에 자격증을 연결할 수 있도록 `certId` 필드가 추가되었습니다.
이를 통해 사용자가 특정 자격증 공부를 위한 Todo를 생성하고, 리마인드된 자격증별로 Todo를 필터링할 수 있습니다.

---

## 🔧 변경사항

### 1. Todo Schema 업데이트

```typescript
// src/todo/schema/todo.schema.ts
@Schema({ timestamps: true })
export class Todo {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Cert' })  // ✅ 추가됨
  certId?: Types.ObjectId;
}
```

### 2. DTO 업데이트

#### CreateTodoItemDto
```typescript
export class CreateTodoItemDto {
  title: string;
  description?: string;
  isCompleted?: boolean;

  certId?: string;  // ✅ 추가됨 (MongoDB ObjectId string)
}
```

#### UpdateTodoDto
```typescript
export class UpdateTodoDto {
  date?: string;
  title?: string;
  description?: string;
  isCompleted?: boolean;

  certId?: string;  // ✅ 추가됨
}
```

---

## 🚀 프론트엔드 사용 가이드

### 1. 자격증 연결하여 Todo 생성

```typescript
// POST /todo
const createTodoWithCert = async () => {
  const response = await fetch('/todo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      date: '2025-12-05',
      todos: [
        {
          title: '정보처리기사 운영체제 1장 공부',
          description: '프로세스 스케줄링 개념 정리',
          certId: '683c20625af8b0548b647eca',  // 정보처리기사 ID
        },
        {
          title: '정보처리기사 실습 문제 풀이',
          certId: '683c20625af8b0548b647eca',
        },
        {
          title: '일반 운동하기',
          // certId 없음 - 자격증과 무관한 Todo
        },
      ],
    }),
  });
};
```

---

### 2. 자격증별 Todo 필터링 (프론트엔드 로직)

```typescript
interface Todo {
  _id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  date: string;
  certId?: string;  // 자격증 ID (선택)
}

// 모든 Todo 조회
const todos = await fetch('/todo', {
  headers: { 'Authorization': `Bearer ${token}` },
}).then(res => res.json());

// 특정 자격증에 대한 Todo만 필터링
const certId = '683c20625af8b0548b647eca';  // 정보처리기사
const certTodos = todos.filter((todo: Todo) => todo.certId === certId);

// 자격증 없는 일반 Todo
const generalTodos = todos.filter((todo: Todo) => !todo.certId);
```

---

### 3. 홈 화면 구성 예시

```tsx
// 홈 화면: 리마인드 자격증 + 연관 Todo 표시

function HomePage() {
  const { data: remindCerts } = useQuery(['certs', 'remind'], getMyRemindCerts);
  const { data: todos } = useQuery(['todos'], getAllTodos);

  return (
    <div>
      <h2>내 자격증</h2>
      {remindCerts?.map(cert => {
        // 해당 자격증과 연결된 Todo 개수
        const certTodoCount = todos?.filter(
          todo => todo.certId === cert._id
        ).length || 0;

        return (
          <CertCard
            key={cert._id}
            cert={cert}
            todoCount={certTodoCount}  // "진행중인 Todo 3개"
          />
        );
      })}
    </div>
  );
}
```

---

### 4. Todo 작성 시 자격증 선택 UI

```tsx
// Todo 작성 폼

function TodoCreateForm({ date }: { date: string }) {
  const [selectedCertId, setSelectedCertId] = useState<string | null>(null);
  const { data: remindCerts } = useQuery(['certs', 'remind'], getMyRemindCerts);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    await fetch('/todo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        todos: [
          {
            title: formData.title,
            description: formData.description,
            certId: selectedCertId || undefined,  // 선택 안 하면 undefined
          }
        ]
      })
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Todo 제목"
        required
      />

      <textarea placeholder="설명 (선택)" />

      {/* 자격증 선택 (선택사항) */}
      <div>
        <label>연관 자격증 (선택)</label>
        <select
          value={selectedCertId || ''}
          onChange={e => setSelectedCertId(e.target.value || null)}
        >
          <option value="">없음</option>
          {remindCerts?.map(cert => (
            <option key={cert._id} value={cert._id}>
              {cert.name} {cert.daysLeft ? `(D-${cert.daysLeft})` : ''}
            </option>
          ))}
        </select>
      </div>

      <button type="submit">Todo 추가</button>
    </form>
  );
}
```

---

### 5. 자격증 상세 페이지: 연관 Todo 표시

```tsx
// 자격증 상세 페이지

function CertDetailPage({ certId }: { certId: string }) {
  const { data: cert } = useQuery(['cert', certId], () => getCertById(certId));
  const { data: allTodos } = useQuery(['todos'], getAllTodos);

  // 이 자격증과 연결된 Todo만 필터링
  const relatedTodos = allTodos?.filter(todo => todo.certId === certId) || [];

  return (
    <div>
      <h1>{cert?.name}</h1>
      <p>D-{cert?.daysLeft}</p>

      <section>
        <h2>관련 Todo ({relatedTodos.length}개)</h2>
        {relatedTodos.map(todo => (
          <TodoItem key={todo._id} todo={todo} />
        ))}
      </section>
    </div>
  );
}
```

---

## 📊 데이터 구조 예시

### Todo 응답 예시
```json
{
  "_id": "675abc123def456789012345",
  "userId": "664a84ffb1d6e9b54a7d8a12",
  "date": "2025-12-05T00:00:00.000Z",
  "title": "정보처리기사 운영체제 공부",
  "description": "프로세스 스케줄링 정리",
  "isCompleted": false,
  "certId": "683c20625af8b0548b647eca",  // ✅ 자격증 ID
  "createdAt": "2025-11-29T10:00:00.000Z",
  "updatedAt": "2025-11-29T10:00:00.000Z"
}
```

---

## 🎨 UI/UX 권장사항

### 1. 홈 화면 자격증 카드
```
┌─────────────────────────────────┐
│ 📋 정보처리기사                  │
│ D-45                            │
│                                 │
│ 🟢 진행중인 Todo 5개            │
│ ✅ 완료한 Todo 12개             │
│                                 │
│ [상세보기]                      │
└─────────────────────────────────┘
```

### 2. Todo 작성 시 자격증 선택 (간편 UI)
```
┌─────────────────────────────────┐
│ Todo 추가                        │
│                                 │
│ 제목: [________________]         │
│                                 │
│ 자격증 선택 (선택)               │
│ ○ 없음                          │
│ ○ 📋 정보처리기사 (D-45)         │
│ ○ ⚡ 전기기사 (D-30)            │
│                                 │
│ [추가하기]                       │
└─────────────────────────────────┘
```

### 3. 자격증 상세 - Todo 탭
```
┌─────────────────────────────────┐
│ 정보처리기사                     │
│ D-45 | 기사급 | 한국산업인력공단  │
├─────────────────────────────────┤
│ [일정] [관련 Todo] [정보]        │
├─────────────────────────────────┤
│                                 │
│ 관련 Todo (5개)                  │
│                                 │
│ □ 운영체제 1장 공부 (12/05)      │
│ □ 실습 문제 풀이 (12/06)         │
│ ✅ 데이터베이스 정리 (12/04)     │
│                                 │
│ [+ Todo 추가]                    │
└─────────────────────────────────┘
```

---

## 🔍 필터링 및 정렬 예시

### 자격증별 Todo 그룹화
```typescript
function groupTodosByCert(todos: Todo[], certs: Cert[]) {
  const grouped = {
    general: [] as Todo[],  // certId 없는 일반 Todo
    certs: {} as Record<string, { cert: Cert, todos: Todo[] }>,
  };

  todos.forEach(todo => {
    if (!todo.certId) {
      grouped.general.push(todo);
    } else {
      if (!grouped.certs[todo.certId]) {
        const cert = certs.find(c => c._id === todo.certId);
        if (cert) {
          grouped.certs[todo.certId] = { cert, todos: [] };
        }
      }
      grouped.certs[todo.certId]?.todos.push(todo);
    }
  });

  return grouped;
}

// 사용 예시
const groupedTodos = groupTodosByCert(todos, remindCerts);

// 렌더링
{Object.entries(groupedTodos.certs).map(([certId, { cert, todos }]) => (
  <div key={certId}>
    <h3>{cert.name} (D-{cert.daysLeft})</h3>
    {todos.map(todo => <TodoItem key={todo._id} todo={todo} />)}
  </div>
))}

{groupedTodos.general.length > 0 && (
  <div>
    <h3>일반 Todo</h3>
    {groupedTodos.general.map(todo => <TodoItem key={todo._id} todo={todo} />)}
  </div>
)}
```

---

## ✅ 체크리스트

프론트엔드 작업 시 확인할 사항:

- [ ] Todo 생성 시 자격증 선택 UI 구현
- [ ] 홈 화면에 리마인드 자격증 상단 표시
- [ ] 자격증 카드에 연관 Todo 개수 표시
- [ ] 자격증 상세 페이지에 관련 Todo 탭 추가
- [ ] Todo 리스트를 자격증별로 그룹화하여 표시
- [ ] certId가 없는 일반 Todo도 별도 표시
- [ ] Todo 수정 시에도 자격증 선택/해제 가능하도록 구현

---

## 🚨 주의사항

1. **certId는 선택사항**
   - 모든 Todo가 자격증과 연결될 필요는 없음
   - 일반 Todo는 `certId` 없이 생성 가능

2. **삭제된 자격증 처리**
   - 자격증이 삭제되어도 Todo는 유지됨
   - 프론트에서 certId에 해당하는 자격증이 없으면 "삭제된 자격증" 표시

3. **리마인드 해제된 자격증**
   - 리마인드에서 제거해도 certId는 유지됨
   - 기존에 작성한 Todo는 그대로 유지

4. **MongoDB ObjectId 형식**
   - certId는 24자리 hex string
   - 예: `"683c20625af8b0548b647eca"`

---

## 📞 API 명세

기존 Todo API는 그대로 사용하되, certId 필드만 추가:

```typescript
// POST /todo
{
  "date": "2025-12-05",
  "todos": [
    {
      "title": "정보처리기사 공부",
      "certId": "683c20625af8b0548b647eca"  // ✅ 추가
    }
  ]
}

// PATCH /todo/:id
{
  "title": "제목 수정",
  "certId": "683c20625af8b0548b647eca"  // ✅ 추가 (변경 가능)
}
```

전체 API 문서: [docs/CERT_API.md](./CERT_API.md)

---

이제 프론트에서 리마인드 자격증을 홈 상단에 띄우고, Todo 작성 시 간편하게 자격증을 선택할 수 있어!
