# 자격증 API 문서 (Certification API Documentation)

## Base URL
```
http://localhost:8080/cert
```

**개발 환경**: `http://localhost:8080`
**운영 환경**: 배포 도메인에 따라 변경

---

## 📌 GET 엔드포인트

### 1. 자격증 검색 (쿼리 기반)

**기본 검색 API - 여러 조건 조합 가능**

```
GET /cert/search
```

**Query Parameters (모두 선택사항):**
| 파라미터 | 타입 | 설명 | 예시 |
|---------|------|------|------|
| `keyword` | string | 자격증명 키워드 | `정보처리` |
| `agency` | string | 운영기관 | `한국산업인력공단` |
| `grade` | string | 등급 | `기사`, `기술사`, `산업기사`, `기능사` |
| `category` | string | 대분류 | `정보통신` |
| `subCategory` | string | 중분류 | `정보기술` |

**Request Example:**
```bash
# 모든 자격증 조회
GET /cert/search

# 정보처리 관련 기사급 자격증 검색
GET /cert/search?keyword=정보처리&grade=기사

# 한국산업인력공단의 기사급 자격증
GET /cert/search?agency=한국산업인력공단&grade=기사
```

**Response:**
```json
[
  {
    "_id": "683c20625af8b0548b647eca",
    "code": "1320",
    "name": "정보처리기사",
    "category": "정보통신",
    "subCategory": "정보기술",
    "type": "국가기술자격",
    "grade": "기사",
    "agency": "한국산업인력공단",
    "description": "정보시스템의 생명주기 전반에 걸친 프로젝트 업무를 수행하는 직무",
    "schedule": [
      {
        "round": "2025년 1회",
        "writtenRegStart": "2025-01-20",
        "writtenRegEnd": "2025-01-23",
        "writtenExamStart": "2025-03-02",
        "writtenExamEnd": "2025-03-02",
        "writtenResultDate": "2025-03-19",
        "practicalRegStart": "2025-03-24",
        "practicalRegEnd": "2025-03-27",
        "practicalExamStart": "2025-05-10",
        "practicalExamEnd": "2025-05-24",
        "practicalResultDate": "2025-06-18"
      }
    ],
    "createdAt": "2025-05-29T12:00:00.000Z",
    "updatedAt": "2025-05-29T12:00:00.000Z"
  }
]
```

---

### 2. 자격증명 검색 (Atlas Search)

**빠른 자격증명 검색 - 자동완성에 적합**

```
GET /cert/search/keyword
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 | 기본값 |
|---------|------|------|------|--------|
| `q` | string | ✅ | 검색 키워드 | - |
| `limit` | number | ❌ | 최대 결과 개수 | 10 |

**Request Example:**
```bash
# 기본 검색 (10개)
GET /cert/search/keyword?q=정보

# 최대 5개만
GET /cert/search/keyword?q=기사&limit=5
```

**Response:**
```json
[
  {
    "_id": "683c20625af8b0548b647eca",
    "code": "1320",
    "name": "정보처리기사",
    "grade": "기사",
    "agency": "한국산업인력공단"
  },
  {
    "_id": "683c20615af8b0548b647eb9",
    "code": "1310",
    "name": "정보보안기사",
    "grade": "기사",
    "agency": "한국산업인력공단"
  }
]
```

---

### 3. 인기 자격증 조회

**주요 분야 기사급 자격증 추천 5개**

```
GET /cert/popular
```

**선정 기준:**
- 등급: 기사급만 선정
- 분야: 정보통신, 건설, 전기·전자, 기계, 화공, 안전관리 등 주요 6개 분야
- 우선순위: 시험일정이 있는 자격증 우선
- 랜덤: 매 요청마다 다른 5개 반환 (최대 20개 중 랜덤 선택)

**Query Parameters:** 없음

**Response:**
```json
[
  {
    "_id": "683c20625af8b0548b647eca",
    "name": "정보처리기사",
    "grade": "기사",
    "hasSchedule": true,
    "daysLeft": 45
  },
  {
    "_id": "683c205e5af8b0548b647dfb",
    "name": "전기기사",
    "grade": "기사",
    "hasSchedule": true,
    "daysLeft": 30
  },
  {
    "_id": "683c205c5af8b0548b647dab",
    "name": "토목기사",
    "grade": "기사",
    "hasSchedule": false,
    "daysLeft": null
  }
]
```

**Response 필드 설명:**
- `hasSchedule`: 시험일정 등록 여부
- `daysLeft`: D-day (시험까지 남은 일수, 일정 없으면 null)

---

### 4. 시험 임박 자격증

**시험일정이 일주일 미만인 자격증**

```
GET /cert/upcoming
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 | 기본값 |
|---------|------|------|------|--------|
| `limit` | number | ❌ | 최대 결과 개수 | 3 |

**Request Example:**
```bash
# 기본 (3개)
GET /cert/upcoming

# 5개까지
GET /cert/upcoming?limit=5
```

**Response:**
```json
[
  {
    "_id": "683c20625af8b0548b647eca",
    "name": "정보처리기사",
    "grade": "기사",
    "daysLeft": 5,
    "nextExamDate": "2025-12-05"
  },
  {
    "_id": "683c205e5af8b0548b647dfb",
    "name": "전기기사",
    "grade": "기사",
    "daysLeft": 3,
    "nextExamDate": "2025-12-03"
  }
]
```

---

### 5. 내 리마인드 자격증 리스트 🔒

**사용자가 설정한 알림 자격증 조회 (인증 필요)**

```
GET /cert/remind/list
```

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
[
  {
    "_id": "664a84ffb1d6e9b54a7d8a12",
    "code": "1320",
    "name": "정보처리기사",
    "agency": "한국산업인력공단",
    "grade": "기사",
    "hasSchedule": true,
    "daysLeft": 45
  }
]
```

---

### 6. 자격증 상세 조회

**특정 자격증의 전체 정보 조회**

```
GET /cert/:id
```

**Path Parameters:**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `id` | string | 자격증 MongoDB ObjectId |

**Request Example:**
```bash
GET /cert/683c20625af8b0548b647eca
```

**Response:**
```json
{
  "_id": "683c20625af8b0548b647eca",
  "code": "1320",
  "name": "정보처리기사",
  "category": "정보통신",
  "subCategory": "정보기술",
  "type": "국가기술자격",
  "grade": "기사",
  "agency": "한국산업인력공단",
  "description": "정보시스템의 생명주기 전반에 걸친 프로젝트 업무를 수행하는 직무",
  "schedule": [
    {
      "round": "2025년 1회",
      "writtenRegStart": "2025-01-20",
      "writtenRegEnd": "2025-01-23",
      "writtenExamStart": "2025-03-02",
      "writtenExamEnd": "2025-03-02",
      "writtenResultDate": "2025-03-19",
      "practicalRegStart": "2025-03-24",
      "practicalRegEnd": "2025-03-27",
      "practicalExamStart": "2025-05-10",
      "practicalExamEnd": "2025-05-24",
      "practicalResultDate": "2025-06-18"
    }
  ],
  "createdAt": "2025-05-29T12:00:00.000Z",
  "updatedAt": "2025-05-29T12:00:00.000Z"
}
```

---

### 7. 일정 데이터 현황

**시험일정 등록 현황 통계**

```
GET /cert/schedule/status
```

**Response:**
```json
{
  "total": 178,
  "withSchedule": 120,
  "withoutSchedule": 58,
  "percentage": 67
}
```

**필드 설명:**
- `total`: 전체 자격증 수
- `withSchedule`: 일정 있는 자격증 수
- `withoutSchedule`: 일정 없는 자격증 수
- `percentage`: 일정 등록 비율 (%)

---

## 🔐 POST/DELETE 엔드포인트

### 8. 리마인드 자격증 추가 🔒

```
POST /cert/remind/:id
```

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Path Parameters:**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `id` | string | 자격증 ObjectId |

**Response:**
```json
{
  "message": "추가 완료"
}
```

---

### 9. 리마인드 자격증 제거 🔒

```
DELETE /cert/remind/:id
```

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Path Parameters:**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `id` | string | 자격증 ObjectId |

**Response:**
```json
{
  "message": "제거 완료"
}
```

---

### 10. 일정 동기화 (관리자)

**Q-net API에서 시험일정 가져오기**

```
POST /cert/schedule/sync
```

**Response:**
```json
{
  "updated": 150,
  "notFound": 28
}
```

**필드 설명:**
- `updated`: 업데이트된 자격증 수
- `notFound`: API에서 찾지 못한 자격증 수

---

## 📊 데이터 구조

### Cert (자격증)

```typescript
interface Cert {
  _id: string;                    // MongoDB ObjectId
  code: string;                   // 자격증 코드 (Q-net 기준)
  name: string;                   // 자격증명
  category?: string;              // 대분류 (예: 정보통신)
  subCategory?: string;           // 중분류 (예: 정보기술)
  type?: string;                  // 종류 (예: 국가기술자격)
  grade?: string;                 // 등급 (기술사/기사/산업기사/기능사)
  agency?: string;                // 운영기관
  description?: string;           // 자격증 설명
  schedule?: CertSchedule[];      // 시험일정 배열
  createdAt: string;              // 생성일 (ISO 8601)
  updatedAt: string;              // 수정일 (ISO 8601)
}
```

### CertSchedule (시험일정)

```typescript
interface CertSchedule {
  round: string;                  // 회차 (예: "2025년 1회")
  writtenRegStart?: string;       // 필기 접수 시작일
  writtenRegEnd?: string;         // 필기 접수 종료일
  writtenExamStart?: string;      // 필기 시험 시작일
  writtenExamEnd?: string;        // 필기 시험 종료일
  writtenResultDate?: string;     // 필기 합격발표일
  practicalRegStart?: string;     // 실기 접수 시작일
  practicalRegEnd?: string;       // 실기 접수 종료일
  practicalExamStart?: string;    // 실기 시험 시작일
  practicalExamEnd?: string;      // 실기 시험 종료일
  practicalResultDate?: string;   // 실기 합격발표일
}
```

---

## 🚀 사용 예시 (React + TanStack Query)

```typescript
import { useQuery } from '@tanstack/react-query';

// 1. 자격증 검색
const useSearchCerts = (keyword?: string, grade?: string) => {
  return useQuery({
    queryKey: ['certs', 'search', keyword, grade],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (grade) params.append('grade', grade);

      const res = await fetch(`/cert/search?${params}`);
      return res.json();
    },
  });
};

// 2. 인기 자격증
const usePopularCerts = () => {
  return useQuery({
    queryKey: ['certs', 'popular'],
    queryFn: async () => {
      const res = await fetch('/cert/popular');
      return res.json();
    },
  });
};

// 3. 자격증 상세
const useCertDetail = (id: string) => {
  return useQuery({
    queryKey: ['cert', id],
    queryFn: async () => {
      const res = await fetch(`/cert/${id}`);
      return res.json();
    },
    enabled: !!id,
  });
};

// 4. 내 리마인드 리스트 (인증 필요)
const useMyRemindCerts = (token: string) => {
  return useQuery({
    queryKey: ['certs', 'remind'],
    queryFn: async () => {
      const res = await fetch('/cert/remind/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return res.json();
    },
    enabled: !!token,
  });
};
```

---

## 📝 일정 없는 자격증 처리

### hasSchedule 필드 활용

API 응답에서 `hasSchedule` 필드를 통해 일정 데이터 존재 여부를 확인할 수 있습니다.

```typescript
// 프론트엔드 처리 예시
function renderScheduleStatus(cert: Cert) {
  if (!cert.hasSchedule) {
    return {
      status: 'preparing',
      message: '일정 준비중',
      description: '해당 자격증의 시험 일정은 현재 준비중입니다.'
    };
  }

  if (cert.daysLeft === null) {
    return {
      status: 'no_upcoming',
      message: '예정된 시험 없음',
      description: '현재 예정된 시험 일정이 없습니다.'
    };
  }

  return {
    status: 'active',
    message: `D-${cert.daysLeft}`,
    description: `다음 시험까지 ${cert.daysLeft}일 남았습니다.`
  };
}
```

### UI 표시 권장 사항

| hasSchedule | daysLeft | UI 표시 |
|-------------|----------|---------|
| `false` | - | "일정 준비중" 배지 |
| `true` | `null` | "예정된 시험 없음" |
| `true` | `N` | "D-N" 또는 "N일 남음" |

### 컴포넌트 예시

```tsx
// ScheduleBadge.tsx
interface ScheduleBadgeProps {
  hasSchedule: boolean;
  daysLeft: number | null;
}

function ScheduleBadge({ hasSchedule, daysLeft }: ScheduleBadgeProps) {
  if (!hasSchedule) {
    return (
      <span className="badge badge-gray">
        📅 일정 준비중
      </span>
    );
  }

  if (daysLeft === null) {
    return (
      <span className="badge badge-gray">
        예정된 시험 없음
      </span>
    );
  }

  const urgency = daysLeft <= 7 ? 'urgent' : daysLeft <= 30 ? 'warning' : 'normal';

  return (
    <span className={`badge badge-${urgency}`}>
      D-{daysLeft}
    </span>
  );
}
```

---

## 🐛 에러 처리

### 공통 에러 형식

```json
{
  "statusCode": 404,
  "message": "자격증을 찾을 수 없습니다",
  "error": "Not Found"
}
```

### 에러 코드

| Status Code | 설명 |
|-------------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 (파라미터 오류) |
| 401 | 인증 필요 (토큰 없음/만료) |
| 404 | 자격증을 찾을 수 없음 |
| 500 | 서버 내부 오류 |

---

## 📌 참고사항

### 인증 (Authentication)
- 🔒 표시가 있는 엔드포인트는 JWT 토큰 필요
- Header 형식: `Authorization: Bearer {accessToken}`

### 날짜 형식
- 모든 날짜는 `YYYY-MM-DD` 형식 (예: `2025-03-02`)
- `createdAt`, `updatedAt`은 ISO 8601 형식

### Pagination
- 현재 페이지네이션은 미구현
- `limit` 파라미터로 결과 개수 제한 가능

### CORS
- `ALLOWED_ORIGINS` 환경변수에 프론트엔드 도메인 등록 필요
- 기본값: `http://localhost:5173`, `http://localhost:3000`

### Swagger UI
- 개발 서버 실행 후 `http://localhost:8080/api` 접속
- 전체 API 명세 및 테스트 가능

### 일정 데이터 출처
- 한국산업인력공단 Q-net API
- 관리자가 수동으로 동기화 (`POST /cert/schedule/sync`)
