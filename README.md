# q-bit-server-nest

Q-bit 서비스 백엔드 API 레포임냥.
NestJS + MongoDB 기반으로 자격증 탐색, 학습 Todo/메모 관리, 합격 기록, AI 추천/리포트 기능을 제공함냥.

### 프로젝트 개요

- **런타임**: Node.js 기반 NestJS 서버 (`8080` 포트)
- **인증 방식**: Kakao OAuth + JWT(쿠키 기반 `accessToken`/`refreshToken`)
- **주요 도메인**: `auth`, `cert`, `todo`, `memo`, `passed-cert`, `ai`
- **API 문서**: Swagger UI (`/api`)

### 주요 기능

- **인증/사용자**
  - 카카오 로그인 콜백 처리
  - JWT 쿠키 발급/재발급/로그아웃
- **자격증(`cert`)**
  - 자격증 검색/상세 조회
  - 인기 자격증/시험 임박 자격증 조회
  - 리마인드 자격증 추가/삭제/목록 조회
  - Q-net API 기반 시험 일정 동기화
- **Todo(`todo`)**
  - 일/주/월/연 단위 조회
  - 완료 토글, 스트릭 계산
  - 자격증(`certId`) 연동 Todo 지원
- **Memo(`memo`)**
  - 날짜별 메모 생성/조회/수정/삭제
- **합격 기록(`passed-cert`)**
  - 합격 기록 CRUD 및 필터 조회
- **AI(`ai`)**
  - 텍스트 생성/채팅
  - 맞춤 자격증 추천
  - 주간 Todo 리포트 생성 및 저장

### 기술 스택

| 구분 | 스택 |
| --- | --- |
| Language | TypeScript |
| Framework | NestJS 11 |
| Database | MongoDB + Mongoose |
| Auth | Passport (`passport-kakao`, `passport-jwt`), JWT |
| API Docs | Swagger (`@nestjs/swagger`) |
| AI | xAI Grok (`ai`, `@ai-sdk/xai`) |
| Validation | class-validator, class-transformer |
| Test | Jest, Supertest |

### 사전 준비

- **Node.js 20+** (Dockerfile 기준 `node:20-alpine`)
- **npm**
- **MongoDB 인스턴스** (로컬 또는 원격)
- **Kakao OAuth 앱 설정값** (`KAKAO_CLIENT_ID`, `KAKAO_CALLBACK_URL`)

### 설치 및 실행 방법

1. 저장소 클론

```bash
git clone <your-repo-url>
cd q-bit-server-nest
```

2. 환경 변수 파일 생성

macOS/Linux:
```bash
cp .env.example .env
```

Windows (PowerShell):
```powershell
Copy-Item .env.example .env
```

Windows (cmd):
```bat
copy .env.example .env
```

3. `.env` 값 설정

- 최소 필수: `MONGODB_URI`, `JWT_SECRET`, `KAKAO_CLIENT_ID`, `KAKAO_CALLBACK_URL`
- AI 기능 사용 시: `XAI_API_KEY`
- Q-net 일정 동기화 사용 시: `QNET_API_KEY`

4. 의존성 설치

```bash
npm ci
```

5. 개발 서버 실행

```bash
npm run dev
```

서버 실행 후 기본 주소:
- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/api`

### 빌드 방법

```bash
npm run build
```

빌드 결과물은 `dist/`에 생성됨냥.

### 테스트

기본 테스트 명령:

```bash
npm run test
npm run test:e2e
```

현재 기준(2026-02-17) 실행 결과:

| 명령어 | 결과 | 메모 |
| --- | --- | --- |
| `npm ci` | 성공 | 의존성 설치 완료 |
| `npm run build` | 성공 | `nest build` 정상 동작 |
| `npm run dev -- --help` | 성공 | dev 스크립트 옵션 확인 |
| `npm run test -- --runInBand` | 실패 | 일부 단위 테스트 타입/DI 오류 |
| `npm run test:e2e` | 실패 | `test/jest-e2e.json`의 정규식 이스케이프 오류 |

### 환경 변수

| 변수명 | 필수 | 설명 | 예시 |
| --- | --- | --- | --- |
| `MONGODB_URI` | Y | MongoDB 연결 문자열 | `mongodb://localhost:27017/qbit` |
| `JWT_SECRET` | Y | JWT 서명 시크릿 | `your-secure-jwt-secret-key-here` |
| `KAKAO_CLIENT_ID` | Y | Kakao OAuth Client ID | `your-kakao-client-id` |
| `KAKAO_CALLBACK_URL` | Y | Kakao OAuth 콜백 URL | `http://localhost:8080/auth/kakao/callback` |
| `CLIENT_URL` | N | 프론트엔드 URL | `http://localhost:5173` |
| `ALLOWED_ORIGINS` | N | CORS 허용 Origin(콤마 구분) | `http://localhost:5173,http://localhost:3000` |
| `NODE_ENV` | N | 실행 환경 | `development` |
| `QNET_API_KEY` | N | Q-net Open API 키 | `your-qnet-api-key-here` |
| `XAI_API_KEY` | N | xAI Grok API 키 | `your-xai-api-key-here` |

### 폴더 구조

```text
.
├── src
│   ├── ai              # AI 생성/추천/주간 리포트
│   ├── auth            # 인증 컨트롤러/서비스
│   ├── cert            # 자격증 검색/리마인드/일정 동기화
│   ├── memo            # 날짜별 메모
│   ├── passed-cert     # 합격 기록
│   ├── todo            # Todo/스트릭/기간별 조회
│   ├── strategy        # passport 전략(jwt, kakao)
│   └── user            # 사용자 도메인
├── docs                # 기능별 상세 문서
├── test                # e2e 설정/테스트
├── API_SPEC.md         # 전체 API 명세
└── .env.example        # 환경 변수 템플릿
```

### 추가 문서

- `API_SPEC.md`
- `docs/CERT_API.md`
- `docs/AI_USAGE.md`
- `docs/TODO_CERT_INTEGRATION.md`

### 라이선스

`package.json` 기준 현재 라이선스는 **UNLICENSED**임냥.
