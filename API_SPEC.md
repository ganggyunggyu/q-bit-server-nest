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

### PassedCert (합격 기록)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `_id` | `ObjectId` | O | MongoDB ID |
| `userId` | `ObjectId` | O | 사용자 ID |
| `certId` | `ObjectId` | O | 자격증 ID (Cert 참조) |
| `passedDate` | `Date` | O | 합격일 |
| `score` | `number` | X | 점수 (0-100) |
| `type` | `enum` | O | 합격 유형: `"written"` \| `"practical"` \| `"final"` |
| `memo` | `string` | X | 메모 (최대 500자) |
| `createdAt` | `Date` | O | 생성일 (자동) |
| `updatedAt` | `Date` | O | 수정일 (자동) |

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
| `GET` | `/cert/search` | 자격증 필터 검색 | X |
| `GET` | `/cert/search/keyword?q=검색어` | 자격증명 검색 (Atlas Search) | X |
| `GET` | `/cert/popular` | 인기 자격증 5개 (랜덤 셔플) | X |
| `GET` | `/cert/upcoming?limit=3` | 시험 임박 자격증 (7일 이내) | X |
| `GET` | `/cert/remind/list` | 내 리마인드 자격증 목록 | O |
| `GET` | `/cert/:id` | 자격증 상세 조회 | X |
| `POST` | `/cert/remind/:id` | 리마인드 추가 | O |
| `DELETE` | `/cert/remind/:id` | 리마인드 제거 | O |
| `GET` | `/cert/schedule/status` | 일정 데이터 현황 조회 | X |
| `POST` | `/cert/schedule/sync` | Q-net API 일정 동기화 (관리자) | X |

#### GET /cert/search - 필터 검색

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `keyword` | `string` | X | 자격증명 키워드 (부분 일치, 대소문자 무시) |
| `agency` | `string` | X | 운영기관 (예: `"한국산업인력공단"`) |
| `grade` | `string` | X | 등급 (예: `"기사"`, `"산업기사"`, `"기능사"`) |
| `category` | `string` | X | 대분류 (예: `"정보통신"`, `"건설"`) |
| `subCategory` | `string` | X | 중분류 |

**예시:**
```
GET /cert/search?keyword=정보처리&grade=기사
GET /cert/search?category=정보통신
GET /cert/search?agency=한국산업인력공단&grade=기능사
```

**Response:**
```typescript
Cert[]  // daysLeft, hasSchedule 포함
```

#### GET /cert/search/keyword - Atlas Search 검색

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `q` | `string` | O | 검색 키워드 |
| `limit` | `number` | X | 최대 결과 개수 (기본값: 10) |

**예시:**
```
GET /cert/search/keyword?q=전기&limit=5
```

**특징:**
- MongoDB Atlas Search 인덱스 사용
- 오타 허용, 유사어 검색 지원
- 빠른 full-text 검색

#### GET /cert/popular - 인기 자격증

**특징:**
- 실제 사용자 데이터 기반 인기도 계산
- `합격 기록 수(passedCount)` + `리마인드 수(remindCount)` = `인기도(popularity)`
- 인기도 높은 순으로 상위 5개 반환

**Response:**
```typescript
[
  {
    _id: string;
    name: string;
    grade: string;
    category: string;
    hasSchedule: boolean;
    daysLeft: number | null;
    popularity: number;    // 총 인기도 (passedCount + remindCount)
    passedCount: number;   // 합격 기록 수
    remindCount: number;   // 리마인드 설정한 사용자 수
  }
]
```

#### GET /cert/upcoming - 시험 임박 자격증

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `limit` | `number` | X | 최대 결과 개수 (기본값: 3) |

**특징:**
- 필기시험 시작일 기준 7일 이내 자격증
- daysLeft가 작은 순으로 정렬

#### GET /cert/schedule/status - 일정 현황

**Response:**
```typescript
{
  total: number;        // 전체 자격증 수
  withSchedule: number; // 일정 있는 자격증 수
  withoutSchedule: number; // 일정 없는 자격증 수
  percentage: number;   // 일정 보유율 (%)
}
```

#### POST /cert/schedule/sync - Q-net 일정 동기화

한국산업인력공단 공공 API에서 시험 일정을 가져와 DB 업데이트

**Response:**
```typescript
{
  updated: number;   // 업데이트된 자격증 수
  notFound: number;  // 매칭 실패한 자격증 수
}
```

---

### Todo (할 일)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| `POST` | `/todo` | Todo 생성 | O |
| `GET` | `/todo` | Todo 목록 조회 | O |
| `GET` | `/todo/date?date=YYYY-MM-DD` | 특정 날짜 Todo 조회 | O |
| `GET` | `/todo/week?sunday=YYYY-MM-DD` | 주간 Todo 조회 | O |
| `GET` | `/todo/month?year=YYYY&month=M` | 월간 Todo 조회 | O |
| `GET` | `/todo/yearly/:year` | 연간 투두 요약 (히트맵용) | O |
| `GET` | `/todo/streak` | 연속 학습일(스트릭) 조회 | O |
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

#### GET /todo/yearly/:year - Response

```typescript
{
  year: number;
  data: DailyTodoSummary[];
  stats: YearlyStats;
}

interface DailyTodoSummary {
  date: string;           // 'YYYY-MM-DD'
  totalCount: number;     // 해당 날짜의 전체 투두 수
  completedCount: number; // 완료된 투두 수
  percentage: number;     // 완료율 (0-100)
}

interface YearlyStats {
  totalDays: number;      // 투두가 있었던 총 일수
  totalTodos: number;     // 총 투두 개수
  completedTodos: number; // 완료된 투두 개수
  averageRate: number;    // 평균 완료율
}
```

**특징:**
- 투두가 없는 날짜는 응답에 포함하지 않음
- 히트맵 렌더링에 최적화된 형식

#### GET /todo/streak - Response

```typescript
{
  currentStreak: number;      // 현재 연속 학습일
  longestStreak: number;      // 최장 연속 학습일
  lastActiveDate: string | null;   // 마지막 학습일 ('YYYY-MM-DD')
  streakStartDate: string | null;  // 현재 스트릭 시작일 ('YYYY-MM-DD')
}
```

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `date` | `string` | X | 기준 날짜 (기본값: 오늘) |

**특징:**
- 하루라도 투두를 완료하면 학습일로 인정
- 오늘 또는 어제 완료 기록이 있어야 currentStreak 카운트

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

### PassedCert (합격 기록)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| `POST` | `/passed-cert` | 합격 기록 등록 | O |
| `GET` | `/passed-cert` | 내 합격 기록 목록 조회 | O |
| `GET` | `/passed-cert/:id` | 합격 기록 상세 조회 | O |
| `PATCH` | `/passed-cert/:id` | 합격 기록 수정 | O |
| `DELETE` | `/passed-cert/:id` | 합격 기록 삭제 | O |

#### POST /passed-cert - Request Body

```typescript
{
  certId: string;           // 자격증 ID (ObjectId)
  passedDate: string;       // 합격일 "YYYY-MM-DD"
  score?: number;           // 점수 (0-100, 선택)
  type: 'written' | 'practical' | 'final'; // 필기/실기/최종
  memo?: string;            // 메모 (최대 500자, 선택)
}
```

#### GET /passed-cert - Query Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `certId` | `string` | X | 자격증 ID로 필터링 |
| `type` | `string` | X | 합격 유형으로 필터링 (`written`, `practical`, `final`) |

#### GET /passed-cert - Response

```typescript
[
  {
    _id: string;
    userId: string;
    certId: {
      _id: string;
      name: string;
      jmNm: string;
    };
    passedDate: string;
    score?: number;
    type: 'written' | 'practical' | 'final';
    memo?: string;
    createdAt: string;
    updatedAt: string;
  }
]
```

#### PATCH /passed-cert/:id - Request Body

```typescript
{
  passedDate?: string;      // 합격일 "YYYY-MM-DD"
  score?: number;           // 점수 (0-100)
  type?: 'written' | 'practical' | 'final';
  memo?: string;            // 메모 (최대 500자)
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

### AI (인공지능)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| `POST` | `/ai/generate` | Grok AI 텍스트 생성 | X |
| `POST` | `/ai/chat` | Grok AI 채팅 | X |
| `POST` | `/ai/recommend` | AI 자격증 추천 | X |
| `POST` | `/ai/weekly-report` | AI 주간 리포트 | O |

#### POST /ai/weekly-report - Request Body

```typescript
{
  sundayDate?: string;  // 주의 시작일 (일요일). 미입력 시 이번 주. "YYYY-MM-DD"
  refresh?: boolean;    // true면 기존 리포트 무시하고 새로 생성 (기본값: false)
}
```

#### POST /ai/weekly-report - Response

```typescript
{
  weekStart: string;           // "YYYY-MM-DD"
  weekEnd: string;             // "YYYY-MM-DD"
  totalTodos: number;          // 전체 투두 수
  completedTodos: number;      // 완료된 투두 수
  weeklyCompletionRate: number; // 주간 완료율 (%)
  dailyStats: DailyStats[];    // 일별 통계
  summary: string;             // AI 주간 요약
  achievements: string[];      // 잘한 점 목록
  improvements: string[];      // 개선할 점 목록
  nextWeekSuggestions: string[]; // 다음 주 추천 활동
  encouragement: string;       // 격려 메시지
}

interface DailyStats {
  date: string;        // "YYYY-MM-DD"
  total: number;       // 전체 투두 수
  completed: number;   // 완료된 투두 수
  completionRate: number; // 완료율 (%)
}
```

**주의사항:**
- `refresh: false` (기본값): 해당 주에 이미 생성된 리포트가 있으면 캐시된 리포트 반환
- `refresh: true`: 기존 리포트 무시하고 AI가 새로 분석하여 생성 (DB에 덮어씀)
- 투두가 없는 주는 기본 메시지 반환 (AI 호출 안 함)

#### POST /ai/recommend - Request Body

```typescript
{
  age?: string;           // 나이
  education?: string;     // 학력
  field?: string;         // 관심 분야
  experience?: string;    // 경력
  goal?: string;          // 목표
  additionalInfo?: string; // 추가 정보
}
```

#### POST /ai/recommend - Response

```typescript
{
  recommendations: CertRecommendation[];
  summary: string;      // 전체 추천 요약
  aiMessage?: string;   // 사용자에게 전하는 메시지
}

interface CertRecommendation {
  certId: string;         // 자격증 ID
  name: string;           // 자격증 이름
  reason: string;         // 추천 이유
  difficulty: 'easy' | 'medium' | 'hard';
  expectedPeriod: string; // 예상 준비 기간
  matchScore: number;     // 적합도 (0-100)
}
```

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

// PassedCert
type PassedCertType = 'written' | 'practical' | 'final';

interface PassedCert {
  _id: string;
  userId: string;
  certId: string | { _id: string; name: string; jmNm: string };
  passedDate: string;
  score?: number;
  type: PassedCertType;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

// Weekly Report
interface DailyStats {
  date: string;
  total: number;
  completed: number;
  completionRate: number;
}

interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  totalTodos: number;
  completedTodos: number;
  weeklyCompletionRate: number;
  dailyStats: DailyStats[];
  summary: string;
  achievements: string[];
  improvements: string[];
  nextWeekSuggestions: string[];
  encouragement: string;
}

// AI Recommendation
interface CertRecommendation {
  certId: string;
  name: string;
  reason: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedPeriod: string;
  matchScore: number;
}

interface RecommendResponse {
  recommendations: CertRecommendation[];
  summary: string;
  aiMessage?: string;
}
```
