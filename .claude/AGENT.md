# Q-bit Server - NestJS 개발 가이드

## 프로젝트 개요

- **타입**: NestJS REST API
- **패키지 매니저**: yarn
- **데이터베이스**: MongoDB (Mongoose)
- **포트**: 8080
- **API 문서**: `/api` (Swagger)

## 기술 스택

### 프레임워크

- NestJS 11
- TypeScript 5.7
- Node.js (ES2023 타겟)

### 데이터베이스

- MongoDB + Mongoose
- Prisma (설치됨, 미사용)

### 인증

- JWT (Passport)
- Kakao OAuth

### 유틸리티

- class-validator (DTO 검증)
- class-transformer (변환)
- es-toolkit (유틸)
- AWS SDK (파일 업로드 등)

### 개발 도구

- SWC (빠른 컴파일)
- Jest (테스트)
- ESLint + Prettier

## 디렉토리 구조

```
src/
├── main.ts              # 앱 진입점
├── app.module.ts        # 루트 모듈
├── app.controller.ts    # 기본 컨트롤러
├── app.service.ts       # 기본 서비스
│
├── auth/                # 인증 모듈
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   └── auth.service.ts
│
├── user/                # 사용자 모듈
│   ├── user.module.ts
│   ├── user.controller.ts
│   ├── user.service.ts
│   ├── schema/          # Mongoose 스키마
│   ├── dto/             # DTO 정의
│   └── decorator/       # 커스텀 데코레이터
│
├── cert/                # 자격증 모듈
│   ├── cert.module.ts
│   ├── cert.controller.ts
│   ├── cert.service.ts
│   └── schema/
│
├── todo/                # 할 일 모듈
│   ├── todo.module.ts
│   ├── todo.controller.ts
│   ├── todo.service.ts
│   ├── schema/
│   └── dto/
│
├── memo/                # 메모 모듈
│   ├── memo.module.ts
│   ├── memo.controller.ts
│   ├── memo.service.ts
│   ├── schema/
│   └── dto/
│
├── guard/               # 가드
│   └── jwt-auth.guard.ts
│
└── strategy/            # Passport 전략
    ├── jwt.strategy.ts
    └── kakao.strategy.ts
```

## 주요 모델

### User

- kakaoId: 카카오 ID (unique)
- email: 이메일
- displayName: 표시 이름
- remindType: 알림 타입 (default/minimal/often)
- remindCerts: 관심 자격증 목록

### Todo

- userId: 사용자 참조
- date: 날짜
- title: 제목
- description: 설명
- isCompleted: 완료 여부

### Memo

- userId: 사용자 참조
- date: 날짜
- contents: 내용

## 개발 규칙

### 모듈 구조

- 기능별 모듈 분리
- Controller → Service → Repository 패턴
- DTO로 입력 검증

### 코드 스타일

- 구조분해할당 필수
- DTO에 class-validator 데코레이터 적용
- Swagger 문서화 (@ApiTags, @ApiOperation 등)

### 인증

- JWT Bearer 토큰 사용
- JwtAuthGuard로 보호
- @GetUser() 데코레이터로 사용자 정보 획득

## 실행 명령어

```bash
# 개발 서버
yarn start:dev

# 프로덕션 빌드
yarn build

# 프로덕션 실행
yarn start:prod

# 테스트
yarn test

# E2E 테스트
yarn test:e2e

# 린트
yarn lint

# 포맷팅
yarn format
```

## 환경 변수

`.env` 파일 필요:

```
MONGODB_URI=mongodb://...
JWT_SECRET=your-secret
KAKAO_CLIENT_ID=...
KAKAO_CLIENT_SECRET=...
KAKAO_CALLBACK_URL=...
```

## API 엔드포인트

Swagger 문서: `http://localhost:8080/api`

### 주요 엔드포인트

- `POST /auth/kakao` - 카카오 로그인
- `GET /user` - 사용자 정보
- `GET /todo` - 할 일 목록
- `POST /todo` - 할 일 생성
- `GET /memo` - 메모 목록
- `POST /memo` - 메모 생성
- `GET /cert` - 자격증 목록
