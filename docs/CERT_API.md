# 자격증 API 문서 (Frontend Integration Guide)

## 기본 정보

- **Base URL**: `http://localhost:8080` (개발) / `https://api.qbit.com` (운영)
- **인증**: Bearer Token (JWT) - 일부 API는 인증 필요
- **Content-Type**: `application/json`

---

## 자격증 모델 (Cert Schema)

```typescript
interface Cert {
  _id: string;           // MongoDB ObjectId
  code: string;          // 자격증 코드 (예: "1320")
  name: string;          // 자격증명 (예: "정보처리기사")
  category?: string;     // 대분류 (예: "정보통신")
  subCategory?: string;  // 중분류 (예: "정보기술")
  type?: string;         // 유형 (예: "국가기술자격")
  grade?: string;        // 등급 (예: "기사", "산업기사", "기능사")
  agency?: string;       // 시행기관 (예: "한국산업인력공단")
  description?: string;  // 설명
  schedule?: CertSchedule[];  // 시험 일정 배열

  // 계산된 필드 (API 응답에 포함)
  hasSchedule: boolean;  // 일정 데이터 존재 여부
  daysLeft: number | null;  // 다음 필기시험까지 남은 일수 (null이면 일정 없음)
}

interface CertSchedule {
  round: string;              // 회차 (예: "2025년 정기 기사 1회")
  writtenRegStart?: string;   // 필기 접수 시작 (YYYYMMDD)
  writtenRegEnd?: string;     // 필기 접수 종료
  writtenExamStart?: string;  // 필기 시험 시작일
  writtenExamEnd?: string;    // 필기 시험 종료일
  writtenResultDate?: string; // 필기 합격발표일
  practicalRegStart?: string; // 실기 접수 시작
  practicalRegEnd?: string;   // 실기 접수 종료
  practicalExamStart?: string;// 실기 시험 시작일
  practicalExamEnd?: string;  // 실기 시험 종료일
  practicalResultDate?: string; // 실기 합격발표일
}
```

---

## API 엔드포인트

### 1. 자격증 검색 (필터)

```
GET /cert/search
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| keyword | string | X | 자격증명 키워드 검색 |
| agency | string | X | 시행기관 필터 |
| grade | string | X | 등급 필터 (기술사, 기사, 산업기사, 기능사) |
| category | string | X | 대분류 필터 |
| subCategory | string | X | 중분류 필터 |

**응답 예시:**
```json
[
  {
    "_id": "683c20625af8b0548b647eca",
    "code": "1320",
    "name": "정보처리기사",
    "grade": "기사",
    "agency": "한국산업인력공단",
    "hasSchedule": true,
    "daysLeft": 45
  }
]
```

---

### 2. 자격증 검색 (Atlas Search)

```
GET /cert/search/keyword
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| q | string | O | 검색 키워드 |
| limit | number | X | 최대 결과 수 (기본: 10) |

**응답 예시:**
```json
[
  {
    "_id": "683c20625af8b0548b647eca",
    "name": "정보처리기사",
    "hasSchedule": true,
    "daysLeft": 30
  }
]
```

---

### 3. 인기 자격증 조회

```
GET /cert/popular
```

20대에게 인기 있는 자격증 5개를 랜덤하게 반환합니다.

**응답 예시:**
```json
[
  {
    "_id": "683c20625af8b0548b647eca",
    "name": "정보처리기사",
    "grade": "기사",
    "hasSchedule": true,
    "daysLeft": 45
  }
]
```

---

### 4. 임박 시험 조회

```
GET /cert/upcoming
```

일주일 내 시험이 있는 자격증을 반환합니다.

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| limit | number | X | 최대 결과 수 (기본: 3) |

---

### 5. 자격증 상세 조회

```
GET /cert/:id
```

**Path Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| id | string | O | 자격증 MongoDB ObjectId |

**응답 예시:**
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
  "schedule": [
    {
      "round": "2025년 정기 기사 1회",
      "writtenRegStart": "20250110",
      "writtenRegEnd": "20250116",
      "writtenExamStart": "20250208",
      "writtenExamEnd": "20250301",
      "writtenResultDate": "20250312"
    }
  ],
  "hasSchedule": true,
  "daysLeft": 45
}
```

---

### 6. 리마인드 자격증 목록 조회 (인증 필요)

```
GET /cert/remind/list
Authorization: Bearer {accessToken}
```

사용자가 설정한 리마인드 자격증 목록을 반환합니다.

---

### 7. 리마인드 자격증 추가 (인증 필요)

```
POST /cert/remind/:id
Authorization: Bearer {accessToken}
```

---

### 8. 리마인드 자격증 제거 (인증 필요)

```
DELETE /cert/remind/:id
Authorization: Bearer {accessToken}
```

---

### 9. 일정 데이터 현황 조회

```
GET /cert/schedule/status
```

자격증 일정 데이터 보유 현황을 확인합니다.

**응답 예시:**
```json
{
  "total": 178,
  "withSchedule": 120,
  "withoutSchedule": 58,
  "percentage": 67
}
```

---

## 일정 없는 자격증 처리 (준비중)

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

## 에러 응답

### 공통 에러 형식

```json
{
  "statusCode": 404,
  "message": "Cert with ID xxx not found",
  "error": "Not Found"
}
```

### 에러 코드

| Status Code | 설명 |
|-------------|------|
| 400 | 잘못된 요청 (파라미터 오류) |
| 401 | 인증 필요 (토큰 없음/만료) |
| 404 | 자격증을 찾을 수 없음 |
| 500 | 서버 내부 오류 |

---

## 참고 사항

1. **일정 데이터 출처**: 한국산업인력공단 Q-net API
2. **일정 업데이트 주기**: 관리자가 수동으로 동기화 (`POST /cert/schedule/sync`)
3. **날짜 형식**: `YYYYMMDD` (예: "20250208")
4. **Swagger 문서**: `http://localhost:8080/api` 에서 확인 가능
