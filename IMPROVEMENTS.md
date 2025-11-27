# 코드 개선점 분석 보고서

> 분석일: 2025-11-26
> 분석 대상: q-bit-server-nest 전체 프로젝트

## 요약

- 🔴 Critical: 3건
- 🟠 High: 6건
- 🟡 Medium: 7건
- 🟢 Low: 4건

---

## 🔴 Critical Issues

### [CRIT-001] JWT Secret 하드코딩 - 심각한 보안 취약점

**위치**: `src/auth/auth.module.ts:21`

**문제**:
JWT 모듈 설정에서 secret이 `'secret'`으로 하드코딩되어 있음. 공격자가 이 값을 알면 임의의 JWT 토큰을 생성하여 모든 인증을 우회할 수 있음.

**현재 코드**:
```typescript
JwtModule.register({
  // secret: process.env.JWT_SECRET,
  secret: 'secret',
  signOptions: { expiresIn: '1h' },
}),
```

**영향**:
- 인증 시스템 완전 우회 가능
- 모든 사용자 계정 탈취 가능
- 데이터 유출/변조 위험

**해결 방안**:
```typescript
JwtModule.registerAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    secret: configService.get<string>('JWT_SECRET'),
    signOptions: { expiresIn: '1h' },
  }),
  inject: [ConfigService],
}),
```

**검증 방법**:
- `.env` 파일에 `JWT_SECRET` 값 설정 확인
- 서버 시작 시 JWT_SECRET 미설정 에러 발생 여부 확인

---

### [CRIT-002] CORS origin: true + credentials: true 보안 취약점

**위치**: `src/main.ts:30-33`

**문제**:
`origin: true`는 모든 도메인의 요청을 허용하고, `credentials: true`는 쿠키 전송을 허용. 이 조합은 CSRF 공격에 취약함.

**현재 코드**:
```typescript
app.enableCors({
  origin: true,
  credentials: true,
});
```

**영향**:
- CSRF 공격에 취약
- 악의적인 사이트에서 인증된 요청 가능
- 쿠키 탈취 가능성

**해결 방안**:
```typescript
app.enableCors({
  origin: configService.get<string>('ALLOWED_ORIGINS')?.split(',') || [
    'http://localhost:5173',
    'https://q-bit.app', // 실제 도메인
  ],
  credentials: true,
});
```

**검증 방법**:
- 허용되지 않은 origin에서 요청 시 CORS 에러 발생 확인
- `curl -H "Origin: http://evil.com" -I http://localhost:8080/auth/me`

---

### [CRIT-003] kakaoSignup 응답 미전송 버그

**위치**: `src/auth/auth.controller.ts:141-167`

**문제**:
`@Res()` 데코레이터를 사용하면 NestJS의 자동 응답 처리가 비활성화됨. 하지만 `res.send()`나 `res.json()` 없이 `return` 문만 사용하여 클라이언트가 응답을 받지 못하고 타임아웃됨.

**현재 코드**:
```typescript
async kakaoSignup(
  @Body() body: { user: JoinUserRequest },
  @Res() res: Response,
) {
  const user = await this.authService.join(body.user);
  // ... 쿠키 설정 ...
  return {  // 응답이 전송되지 않음!
    message: '회원가입 완료',
    user,
  };
}
```

**영향**:
- 회원가입 API가 작동하지 않음
- 클라이언트 타임아웃 발생
- 사용자 경험 심각한 저하

**해결 방안**:
```typescript
async kakaoSignup(
  @Body() body: { user: JoinUserRequest },
  @Res() res: Response,
) {
  const user = await this.authService.join(body.user);
  const { accessToken, refreshToken } = this.authService.getJWT(
    user._id!.toString(),
  );

  const cookieOptions: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  };

  res.cookie('accessToken', accessToken, cookieOptions);
  res.cookie('refreshToken', refreshToken, cookieOptions);

  return res.status(201).json({
    message: '회원가입 완료',
    user,
  });
}
```

**검증 방법**:
- 회원가입 API 호출 후 응답 수신 확인
- `curl -X POST http://localhost:8080/auth/join -d '...'`

---

## 🟠 High Priority Issues

### [HIGH-001] UserService.findById 반환값 undefined 누락

**위치**: `src/user/user.service.ts:20-26`

**문제**:
user가 없을 경우 명시적 반환이 없어 `undefined`가 암묵적으로 반환됨. 타입 안전성과 가독성 저하.

**현재 코드**:
```typescript
async findById(userId: string) {
  const user = await this.userModel.findById(userId).exec();
  if (user) {
    return user;
  }
  // user가 없으면 undefined 암묵적 반환
}
```

**영향**:
- 타입 추론 불가
- 호출부에서 null 체크 누락 가능성

**해결 방안**:
```typescript
async findById(userId: string): Promise<UserDocument | null> {
  return this.userModel.findById(userId).exec();
}
```

**검증 방법**:
- TypeScript 컴파일 시 타입 체크
- 호출부에서 null 체크 강제

---

### [HIGH-002] Todo create에서 기존 데이터 삭제 후 재생성

**위치**: `src/todo/todo.service.ts:14-31`

**문제**:
같은 날짜의 Todo를 생성할 때 기존 데이터를 전부 삭제 후 재생성. 트랜잭션 없이 수행되어 중간에 실패하면 데이터 손실.

**현재 코드**:
```typescript
async create(userId: string, dto: CreateTodoDto): Promise<Todo[]> {
  const { date, todos } = dto;
  await this.todoModel.deleteMany({ userId, date });
  const createdTodos = await Promise.all(
    todos.map((t) => this.todoModel.create({...})),
  );
  return createdTodos;
}
```

**영향**:
- 데이터 손실 가능성
- 동시성 문제 발생 가능

**해결 방안**:
```typescript
async create(userId: string, dto: CreateTodoDto): Promise<Todo[]> {
  const { date, todos } = dto;
  const session = await this.todoModel.db.startSession();

  try {
    session.startTransaction();
    await this.todoModel.deleteMany({ userId, date }, { session });
    const createdTodos = await this.todoModel.insertMany(
      todos.map((t) => ({ userId, date, ...t })),
      { session }
    );
    await session.commitTransaction();
    return createdTodos;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

**검증 방법**:
- 중간 실패 시나리오 테스트
- 동시 요청 테스트

---

### [HIGH-003] process.env 직접 참조 - ConfigService 미사용

**위치**:
- `src/auth/auth.service.ts:27-28`
- `src/auth/auth.controller.ts:61-62,67-68,154,178`

**문제**:
NestJS에서는 환경변수 접근 시 ConfigService를 사용해야 함. process.env 직접 접근은 테스트 어렵고 일관성 없음.

**현재 코드**:
```typescript
secret: process.env.JWT_SECRET,
secure: process.env.NODE_ENV === 'production',
```

**영향**:
- 단위 테스트 시 mocking 어려움
- 환경변수 타입 검증 불가

**해결 방안**:
```typescript
// auth.service.ts
constructor(
  @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  private readonly jwtService: JwtService,
  private readonly configService: ConfigService,  // 주입
) {}

getJWT(userId: string) {
  const payload = { sub: userId };
  const secret = this.configService.get<string>('JWT_SECRET');
  const accessToken = this.jwtService.sign(payload, {
    secret,
    expiresIn: '1h',
  });
  // ...
}
```

**검증 방법**:
- ConfigService 의존성 주입 확인
- 테스트에서 ConfigService mock 적용

---

### [HIGH-004] 프로덕션 코드에 console.log 남아있음

**위치**:
- `src/auth/auth.controller.ts:70-74,128`
- `src/todo/todo.service.ts:67-68`

**문제**:
디버깅용 console.log가 프로덕션 코드에 남아있음. 보안 정보(토큰) 노출 및 성능 저하.

**현재 코드**:
```typescript
console.log(accessToken, refreshToken, process.env.NODE_ENV === 'production');
console.log('새 accessToken 발급:', accessToken);
console.log(scheduledDate);
```

**영향**:
- 토큰 등 민감 정보 로그 노출
- 성능 저하
- 프로덕션 로그 오염

**해결 방안**:
```typescript
// 삭제하거나 Logger 사용
import { Logger } from '@nestjs/common';

private readonly logger = new Logger(AuthController.name);

// 필요한 경우만 로깅 (토큰은 절대 로깅하지 않음)
this.logger.debug(`Token refreshed for user: ${userId}`);
```

**검증 방법**:
- `git grep "console.log"` 결과 없음 확인
- ESLint no-console 규칙 적용

---

### [HIGH-005] 동적 라우트 순서 문제 - /remind/list가 :id로 매칭

**위치**: `src/cert/cert.controller.ts:116, 126`

**문제**:
`@Get(':id')`가 `@Get('/remind/list')`보다 먼저 정의되어 `/remind/list` 요청이 `remind`를 id로 인식하여 매칭됨.

**현재 코드**:
```typescript
@Get(':id')  // 먼저 정의됨
async getCertById(@Param('id') id: string) { }

@Get('/remind/list')  // 나중에 정의됨
async getMyRemindCerts() { }
```

**영향**:
- `/cert/remind/list` API 작동 안함
- `remind`를 MongoDB ObjectId로 파싱 시도하여 에러 발생

**해결 방안**:
```typescript
// 구체적인 경로를 먼저 정의
@Get('remind/list')
async getMyRemindCerts() { }

@Get(':id')  // 동적 라우트는 마지막에
async getCertById(@Param('id') id: string) { }
```

**검증 방법**:
- `GET /cert/remind/list` 호출 시 정상 응답 확인
- Swagger에서 라우트 목록 확인

---

### [HIGH-006] refreshAccessToken에서 secure: false 하드코딩

**위치**: `src/auth/auth.controller.ts:121-125`

**문제**:
다른 쿠키 설정에서는 `process.env.NODE_ENV === 'production'`을 사용하는데, 이 부분만 `secure: false`로 하드코딩됨.

**현재 코드**:
```typescript
const cookieOptions: CookieOptions = {
  sameSite: 'lax',
  secure: false,  // 프로덕션에서도 false!
  httpOnly: true,
};
```

**영향**:
- 프로덕션 환경에서 HTTP를 통한 쿠키 전송 가능
- 중간자 공격(MITM)에 취약

**해결 방안**:
```typescript
const cookieOptions: CookieOptions = {
  sameSite: 'lax',
  secure: this.configService.get<string>('NODE_ENV') === 'production',
  httpOnly: true,
};
```

**검증 방법**:
- 프로덕션 환경에서 쿠키 Secure 플래그 확인
- Chrome DevTools > Application > Cookies에서 확인

---

## 🟡 Medium Priority Issues

### [MED-001] 중복 코드 - 날짜 범위 계산 로직

**위치**:
- `src/todo/todo.service.ts:38-43, 88-108`
- `src/memo/memo.service.ts:39-60, 121-142`

**문제**:
날짜의 시작(00:00:00)과 끝(23:59:59)을 계산하는 로직이 여러 곳에 중복됨.

**현재 코드**:
```typescript
// TodoService
const start = new Date(Date.UTC(..., 0, 0, 0, 0));
const end = new Date(Date.UTC(..., 23, 59, 59, 999));

// MemoService - 동일한 로직 반복
const start = new Date(Date.UTC(..., 0, 0, 0, 0));
const end = new Date(Date.UTC(..., 23, 59, 59, 999));
```

**해결 방안**:
```typescript
// src/common/utils/date.utils.ts
export const getDateRange = (date: Date) => {
  const start = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    0, 0, 0, 0
  ));
  const end = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    23, 59, 59, 999
  ));
  return { start, end };
};
```

---

### [MED-002] AuthService와 UserService 책임 중복

**위치**:
- `src/auth/auth.service.ts:15-23`
- `src/user/user.service.ts:12-18`

**문제**:
`findByKakaoId`, 카카오 유저 생성 로직이 두 서비스에 중복 존재.

**현재 코드**:
```typescript
// AuthService
async findByKakaoId(kakaoId: string): Promise<UserDocument | null> { }
async registerKakaoUser(user): Promise<UserDocument> { }

// UserService
async findByKakaoId(kakaoId: string): Promise<User | null> { }
async createKakaoUser(user: newUser): Promise<User> { }
```

**해결 방안**:
UserService에만 유저 관련 로직 유지, AuthService는 UserService 호출.

---

### [MED-003] Cert 스키마에서 any[] 타입 사용

**위치**: `src/cert/schema/cert.schema.ts:45`

**문제**:
schedule 필드가 `any[]` 타입으로 정의되어 타입 안전성 없음.

**현재 코드**:
```typescript
@Prop({ type: [Object] })
schedule?: any[];
```

**해결 방안**:
```typescript
// schedule.interface.ts
interface Schedule {
  docexamdt: string;  // 필기시험일 YYYYMMDD
  pracexamdt?: string; // 실기시험일
  docregstartdt?: string;
  docregenddt?: string;
}

@Prop({ type: [Object] })
schedule?: Schedule[];
```

---

### [MED-004] userId 타입 불일치 (string vs Types.ObjectId)

**위치**:
- `src/todo/todo.controller.ts:43` - `{ _id: string }`
- `src/memo/memo.controller.ts:36` - `{ _id: Types.ObjectId }`
- 각 Service 메서드들

**문제**:
같은 역할의 필드가 모듈마다 다른 타입으로 사용됨.

**해결 방안**:
공통 User 타입 정의 후 일관되게 사용.

```typescript
// src/common/types/auth.types.ts
export interface AuthUser {
  _id: Types.ObjectId;
}
```

---

### [MED-005] hasEntryForDate에서 UTC 불일치

**위치**: `src/todo/todo.service.ts:216-222`

**문제**:
다른 메서드들은 `setUTCHours`를 사용하는데 이 메서드만 `setHours` 사용.

**현재 코드**:
```typescript
const start = new Date(date);
start.setHours(0, 0, 0, 0);  // 로컬 시간!
```

**해결 방안**:
```typescript
const start = new Date(Date.UTC(
  date.getUTCFullYear(),
  date.getUTCMonth(),
  date.getUTCDate(),
  0, 0, 0, 0
));
```

---

### [MED-006] Guard 사용 불일치

**위치**:
- Todo, Memo: `@UseGuards(AuthGuard('jwt'))`
- Cert: `@UseGuards(JwtAuthGuard)`

**문제**:
같은 역할의 가드를 다른 방식으로 사용.

**해결 방안**:
`JwtAuthGuard`로 통일.

---

### [MED-007] 빈 UserController

**위치**: `src/user/user.controller.ts`

**문제**:
아무 엔드포인트도 없는 빈 컨트롤러.

**해결 방안**:
사용하지 않으면 삭제하거나, 필요한 API 추가 (회원정보 수정 등).

---

## 🟢 Low Priority Issues

### [LOW-001] Import 순서 불일치

**위치**: 전역

**문제**:
NestJS 모듈 → 외부 라이브러리 → 내부 모듈 순서가 지켜지지 않는 곳들이 있음.

**해결 방안**:
ESLint `import/order` 규칙 적용.

---

### [LOW-002] Unused import Types

**위치**: `src/todo/todo.service.ts:6`

**문제**:
```typescript
import { Types } from 'mongoose';  // 사용되지 않음
```

**해결 방안**:
삭제 또는 ESLint `no-unused-vars` 규칙 적용.

---

### [LOW-003] JoinUserRequest는 class로 변환 권장

**위치**: `src/user/dto/user.dto.ts`

**문제**:
type alias 대신 class를 사용해야 class-validator 적용 가능.

**현재 코드**:
```typescript
export type JoinUserRequest = {
  kakaoId: string;
  // ...
};
```

**해결 방안**:
```typescript
export class JoinUserRequest {
  @IsString()
  @IsNotEmpty()
  kakaoId: string;

  @IsEmail()
  email: string;
  // ...
}
```

---

### [LOW-004] findWeekRangeFromSunday에서 UTC 불일치

**위치**: `src/todo/todo.service.ts:124-134`

**문제**:
start는 `getFullYear()`, `getMonth()` (로컬), end는 `getUTCFullYear()`, `getUTCMonth()` (UTC) 혼용.

**해결 방안**:
UTC 메서드로 통일.

---

## 개선 로드맵

### Phase 1: 긴급 수정 (Critical + High) - 보안 및 버그
1. [ ] CRIT-001: JWT Secret 환경변수로 이동
2. [ ] CRIT-002: CORS origin 화이트리스트 적용
3. [ ] CRIT-003: kakaoSignup 응답 전송 수정
4. [ ] HIGH-001: findById 반환 타입 수정
5. [ ] HIGH-002: Todo create 트랜잭션 적용
6. [ ] HIGH-003: process.env를 ConfigService로 교체
7. [ ] HIGH-004: console.log 제거/Logger 적용
8. [ ] HIGH-005: cert.controller 라우트 순서 수정
9. [ ] HIGH-006: secure 옵션 동적 처리

### Phase 2: 품질 개선 (Medium)
1. [ ] MED-001: 날짜 유틸 함수 추출
2. [ ] MED-002: AuthService/UserService 책임 분리
3. [ ] MED-003: Cert schedule 타입 정의
4. [ ] MED-004: userId 타입 통일
5. [ ] MED-005: hasEntryForDate UTC 수정
6. [ ] MED-006: Guard 사용 통일
7. [ ] MED-007: UserController 정리

### Phase 3: 리팩토링 (Low)
1. [ ] LOW-001: Import 순서 정리 (ESLint 규칙)
2. [ ] LOW-002: Unused import 제거
3. [ ] LOW-003: JoinUserRequest class 변환
4. [ ] LOW-004: findWeekRangeFromSunday UTC 통일

---

## 참고 사항

### 분석 방법론
- 파일별 정적 분석
- 데이터 흐름 추적
- 보안 취약점 검사 (OWASP Top 10 기준)
- NestJS 베스트 프랙티스 대비

### 추가 권장 사항
1. **테스트 커버리지 확대**: 현재 spec 파일들이 대부분 기본 템플릿 상태
2. **API 문서화 보완**: 일부 엔드포인트에 ApiResponse 누락
3. **에러 핸들링 표준화**: 전역 ExceptionFilter 적용 권장
4. **환경별 설정 분리**: development, staging, production 설정 분리
5. **Rate Limiting**: 인증 관련 API에 rate limiting 적용 필요
