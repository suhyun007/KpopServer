# K-popCall Server

Next.js 14 기반의 백엔드 서버입니다.

## 🛠️ 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-3.5-turbo
- **Deployment**: Vercel
- **Package Manager**: npm

## 설치 및 실행

### 의존성 설치
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 서버 실행
npm start
```
### Vercel 배포

1. [Vercel](https://vercel.com)에 가입하고 로그인
2. GitHub/GitLab/Bitbucket에서 프로젝트 import
3. 자동으로 배포됩니다

또는 Vercel CLI 사용:

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

## API 엔드포인트

- `GET /` - 서버 상태 확인
- `GET /health` - 헬스 체크
- `GET /api/status` - API 상태 확인
- `GET /api/users` - 사용자 목록 (준비 중)
- `GET /api/calls` - 통화 목록 (준비 중)

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   └── popular/
│   │       └── route.ts          # API 엔드포인트
│   ├── globals.css               # 전역 스타일
│   ├── layout.tsx                # 루트 레이아웃
│   └── page.tsx                  # 메인 페이지
├── components/                   # 재사용 가능한 컴포넌트
├── lib/                         # 유틸리티 함수
└── types/                       # TypeScript 타입 정의
```

## 🧪 테스트

```bash
# 테스트 실행
npm test

# 테스트 커버리지 확인
npm run test:coverage
```