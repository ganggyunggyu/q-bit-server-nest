# Q-bit API 명세서

> Base URL: `http://localhost:8080`
> Swagger: `http://localhost:8080/api`

---

## 데이터 모델

### User (사용자)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `_id` | `ObjectId` | O | MongoDB ID |
| `kakaoId` | `string` | O | 카카오 고유 ID |
| `email` | `string` | X | 이메일 |
| `displayName` | `string` | X | 표시 이름 |
| `remindType` | `enum` | X | 알림 타입: `"default"` \| `"minimal"` \| `"often"` |
| `remindCerts` | `ObjectId[]` | X | 리마인드 설정한 자격증 ID 목록 |

---

### Cert (자격증)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `_id` | `ObjectId` | O | MongoDB ID |
| `code` | `string` | O | 자격증 코드 (예: `"EE001"`) |
| `name` | `string` | O | 자격증명 (예: `"전기기사"`) |
| `category` | `string` | X | 대분류 (예: `"전기·전자"`) |
| `subCategory` | `string` | X | 중분류 (예: `"전기"`) |
| `type` | `string` | X | 자격 유형 (예: `"국가기술자격"`) |
| `grade` | `string` | X | 등급 (예: `"기사"`, `"산업기사"`, `"기능사"`) |
| `agency` | `string` | X | 시행기관 (예: `"한국산업인력공단"`) |
| `description` | `string` | X | 설명 |
| `schedule` | `CertSchedule[]` | X | 시험 일정 목록 |

#### CertSchedule (시험 일정)

| 필드 | 타입 | 설명 |
|------|------|------|
| `round` | `string` | 회차 (예: `"2025년 제1회"`) |
| `writtenRegStart` | `string` | 필기 접수 시작일 (`YYYYMMDD`) |
| `writtenRegEnd` | `string` | 필기 접수 종료일 (`YYYYMMDD`) |
| `writtenExamStart` | `string` | 필기 시험 시작일 (`YYYYMMDD`) |
| `writtenExamEnd` | `string` | 필기 시험 종료일 (`YYYYMMDD`) |
| `writtenResultDate` | `string` | 필기 합격 발표일 (`YYYYMMDD`) |
| `practicalRegStart` | `string` | 실기 접수 시작일 (`YYYYMMDD`) |
| `practicalRegEnd` | `string` | 실기 접수 종료일 (`YYYYMMDD`) |
| `practicalExamStart` | `string` | 실기 시험 시작일 (`YYYYMMDD`) |
| `practicalExamEnd` | `string` | 실기 시험 종료일 (`YYYYMMDD`) |
| `practicalResultDate` | `string` | 실기 합격 발표일 (`YYYYMMDD`) |

#### 응답 시 추가 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `daysLeft` | `number \| null` | 다음 시험까지 남은 일수 (없으면 `null`) |
| `hasSchedule` | `boolean` | 일정 데이터 보유 여부 |

---

### Todo (할 일)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `_id` | `ObjectId` | O | MongoDB ID |
| `userId` | `ObjectId` | O | 사용자 ID |
| `date` | `Date` | O | 할 일 날짜 |
| `title` | `string` | O | 제목 (1-255자) |
| `description` | `string` | X | 상세 설명 (최대 1000자) |
| `isCompleted` | `boolean` | X | 완료 여부 (기본값: `false`) |
| `createdAt` | `Date` | O | 생성일 (자동) |
| `updatedAt` | `Date` | O | 수정일 (자동) |

---

### Memo (메모)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `_id` | `ObjectId` | O | MongoDB ID |
| `userId` | `ObjectId` | O | 사용자 ID |
| `scheduledDate` | `Date` | O | 메모 날짜 |
| `content` | `string` | O | 메모 내용 (최대 1000자) |
| `createDate` | `Date` | X | 생성일 |

---

## API 엔드포인트

### Auth (인증)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| `GET` | `/auth/kakao/callback` | 카카오 로그인 콜백 | X |
| `GET` | `/auth/me` | 내 정보 조회 | O |
| `POST` | `/auth/refresh-token` | accessToken 재발급 | X (refreshToken 쿠키) |
| `POST` | `/auth/join` | 회원가입 (온보딩 후) | X |
| `DELETE` | `/auth/logout` | 로그아웃 | X |

#### POST /auth/join - Request Body

```typescript
{
  user: {
    kakaoId: string;
    email: string;
    displayName: string;
    remindType?: "default" | "minimal" | "often";
    interestedCerts?: string[];  // ObjectId[]
  }
}
```

---

### Cert (자격증)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| `GET` | `/cert/search` | 자격증 검색 | X |
| `GET` | `/cert/search/keyword?q=검색어` | 자격증명 검색 (Atlas Search) | X |
| `GET` | `/cert/popular` | 인기 자격증 5개 | X |
| `GET` | `/cert/upcoming` | 시험 임박 자격증 | X |
| `GET` | `/cert/remind/list` | 내 리마인드 자격증 목록 | O |
| `GET` | `/cert/:id` | 자격증 상세 조회 | X |
| `POST` | `/cert/remind/:id` | 리마인드 추가 | O |
| `DELETE` | `/cert/remind/:id` | 리마인드 제거 | O |

#### GET /cert/search - Query Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `keyword` | `string` | 자격증명 키워드 |
| `agency` | `string` | 운영기관 |
| `grade` | `string` | 등급 |
| `category` | `string` | 대분류 |
| `subCategory` | `string` | 중분류 |

---

### Todo (할 일)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| `POST` | `/todo` | Todo 생성 | O |
| `GET` | `/todo` | Todo 목록 조회 | O |
| `GET` | `/todo/date?date=YYYY-MM-DD` | 특정 날짜 Todo 조회 | O |
| `GET` | `/todo/week?sunday=YYYY-MM-DD` | 주간 Todo 조회 | O |
| `GET` | `/todo/month?year=YYYY&month=M` | 월간 Todo 조회 | O |
| `GET` | `/todo/exists?date=YYYY-MM-DD` | 해당 날짜 Todo 존재 여부 | O |
| `GET` | `/todo/:id` | 특정 Todo 조회 | O |
| `PATCH` | `/todo/:id` | Todo 수정 | O |
| `PATCH` | `/todo/:id/complete` | Todo 완료 상태 토글 | O |
| `DELETE` | `/todo/:id` | Todo 삭제 | O |

#### POST /todo - Request Body

```typescript
{
  date: string;  // "YYYY-MM-DD"
  todos: [
    {
      title: string;
      description?: string;
      isCompleted?: boolean;
    }
  ]
}
```

#### PATCH /todo/:id - Request Body

```typescript
{
  date?: string;  // "YYYY-MM-DD"
  title?: string;
  description?: string;
  isCompleted?: boolean;
}
```

#### PATCH /todo/:id/complete - Request Body

```typescript
{
  isCompleted: boolean;
}
```

#### GET /todo/week, /todo/month - Response

```typescript
[
  {
    scheduledDate: Date;
    scheduledDateStr: string;  // "YYYY-MM-DD"
    todos: Todo[];
  }
]
```

---

### Memo (메모)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| `POST` | `/memo` | 메모 생성/업데이트 (같은 날짜면 덮어씀) | O |
| `GET` | `/memo` | 전체 메모 조회 | O |
| `GET` | `/memo/date?date=YYYY-MM-DD` | 특정 날짜 메모 조회 | O |
| `PATCH` | `/memo/:id` | 메모 수정 | O |
| `DELETE` | `/memo/:id` | 메모 삭제 | O |

#### POST /memo - Request Body

```typescript
{
  scheduledDate: string;  // "YYYY-MM-DD"
  content: string;
}
```

#### PATCH /memo/:id - Request Body

```typescript
{
  scheduledDate?: string;
  content?: string;
}
```

---

## 인증 방식

- **Cookie 기반 JWT 인증**
- `accessToken`: 1시간 유효
- `refreshToken`: 7일 유효
- 인증이 필요한 API는 쿠키에 `accessToken` 필요

---

## 에러 응답

```typescript
{
  statusCode: number;
  message: string;
  error?: string;
}
```

| 상태 코드 | 설명 |
|-----------|------|
| `400` | Bad Request - 잘못된 요청 |
| `401` | Unauthorized - 인증 필요 |
| `404` | Not Found - 리소스 없음 |
| `500` | Internal Server Error |

---

## TypeScript 타입 정의

```typescript
// User
interface User {
  _id: string;
  kakaoId: string;
  email?: string;
  displayName?: string;
  remindType?: 'default' | 'minimal' | 'often';
  remindCerts: string[];
}

// Cert
interface CertSchedule {
  round: string;
  writtenRegStart?: string;
  writtenRegEnd?: string;
  writtenExamStart?: string;
  writtenExamEnd?: string;
  writtenResultDate?: string;
  practicalRegStart?: string;
  practicalRegEnd?: string;
  practicalExamStart?: string;
  practicalExamEnd?: string;
  practicalResultDate?: string;
}

interface Cert {
  _id: string;
  code: string;
  name: string;
  category?: string;
  subCategory?: string;
  type?: string;
  grade?: string;
  agency?: string;
  description?: string;
  schedule?: CertSchedule[];
  // 응답 시 추가
  daysLeft: number | null;
  hasSchedule: boolean;
}

// Todo
interface Todo {
  _id: string;
  userId: string;
  date: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TodoGroup {
  scheduledDate: string;
  scheduledDateStr: string;
  todos: Todo[];
}

// Memo
interface Memo {
  _id: string;
  userId: string;
  scheduledDate: string;
  content: string;
  createDate: string;
}
```
