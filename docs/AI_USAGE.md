# xAI Grok API 사용 가이드

## 환경 설정

`.env` 파일에 xAI API 키 추가:

```env
XAI_API_KEY=your-xai-api-key-here
```

API 키 발급: https://console.x.ai

---

## API 엔드포인트

### 1. 텍스트 생성

```
POST /ai/generate
Content-Type: application/json
```

**Request Body:**
```json
{
  "prompt": "What is the meaning of life, the universe, and everything?",
  "systemMessage": "You are Grok, a highly intelligent, helpful AI assistant."
}
```

**Response:**
```json
{
  "text": "The answer is 42, according to The Hitchhiker's Guide to the Galaxy..."
}
```

### 2. 채팅

```
POST /ai/chat
Content-Type: application/json
```

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello, Grok!" },
    { "role": "assistant", "content": "Hello! How can I help you today?" },
    { "role": "user", "content": "Tell me a joke" }
  ]
}
```

**Response:**
```json
{
  "text": "Why did the AI go to therapy? Because it had too many unresolved issues!"
}
```

### 3. AI 자격증 추천 (★ 주요 기능)

```
POST /ai/recommend
Content-Type: application/json
```

사용자 정보를 바탕으로 AI가 맞춤형 자격증을 추천합니다.

**Request Body:**
```json
{
  "age": 25,
  "education": "대졸",
  "field": "IT",
  "experience": "1년 미만",
  "goal": "취업 준비",
  "additionalInfo": "프론트엔드 개발자로 취업하고 싶어요"
}
```

**모든 필드는 선택사항입니다.** 최소한의 정보로도 추천 가능합니다.

**Response:**
```json
{
  "recommendations": [
    {
      "certId": "507f1f77bcf86cd799439011",
      "name": "정보처리기사",
      "reason": "IT 분야 취업을 준비하시는 분께 가장 기본이 되는 국가기술자격입니다.",
      "difficulty": "medium",
      "expectedPeriod": "3-6개월",
      "matchScore": 95
    },
    {
      "certId": "507f1f77bcf86cd799439012",
      "name": "웹디자인기능사",
      "reason": "프론트엔드 개발에 필요한 UI/UX 감각을 키울 수 있습니다.",
      "difficulty": "easy",
      "expectedPeriod": "1-2개월",
      "matchScore": 85
    }
  ],
  "summary": "IT 분야에서 프론트엔드 개발자로 취업을 목표로 하시는 분께 총 2개의 자격증을 추천드립니다.",
  "aiMessage": "꾸준히 학습하시면 좋은 결과 있으실 겁니다!"
}
```

**Response 필드 설명:**
- `certId`: 자격증 고유 ID (DB ObjectId)
- `name`: 자격증 이름
- `reason`: AI가 분석한 추천 이유
- `difficulty`: `easy` | `medium` | `hard`
- `expectedPeriod`: 예상 준비 기간
- `matchScore`: 사용자 매칭 점수 (0-100, 높을수록 적합)
- `summary`: 전체 추천 요약
- `aiMessage`: 사용자에게 전하는 격려 메시지

---

## 서비스 사용 (다른 모듈에서)

```typescript
import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';

@Injectable()
export class YourService {
  constructor(private readonly aiService: AiService) {}

  async example() {
    // 텍스트 생성
    const result = await this.aiService.generateText(
      'Explain quantum computing in simple terms',
      'You are a helpful teacher who explains complex topics simply.'
    );

    console.log(result); // AI generated text
  }
}
```

---

## 사용 가능 모델

현재 `grok-beta` 모델을 사용하고 있습니다.

다른 모델 사용 시 `ai.service.ts`에서 모델명 변경:

```typescript
const result = await generateText({
  model: xai('grok-4'),  // 또는 다른 모델
  // ...
});
```

---

## 주의사항

1. **API 키 보안**: `.env` 파일을 절대 커밋하지 마세요
2. **비용**: Grok API 사용에 따라 비용이 발생할 수 있습니다
3. **Rate Limiting**: API 호출 제한이 있을 수 있습니다

---

## 테스트

```bash
# 서버 실행
npm run start:dev

# API 테스트 (curl)
curl -X POST http://localhost:8080/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hello, Grok!",
    "systemMessage": "You are a friendly assistant."
  }'
```

---

## Swagger 문서

서버 실행 후 http://localhost:8080/api 에서 Swagger UI를 통해 API를 테스트할 수 있습니다.
