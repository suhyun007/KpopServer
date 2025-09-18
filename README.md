# K-popCall Server

Express.js 기반의 백엔드 서버입니다.

## 설치 및 실행

### 의존성 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```

### 프로덕션 서버 실행
```bash
npm start
```

## API 엔드포인트

- `GET /` - 서버 상태 확인
- `GET /health` - 헬스 체크
- `GET /api/status` - API 상태 확인
- `GET /api/users` - 사용자 목록 (준비 중)
- `GET /api/calls` - 통화 목록 (준비 중)

## 폴더 구조

```
server/
├── index.js          # 메인 서버 파일
├── config.js         # 설정 파일
├── routes/           # 라우트 파일들
│   └── api.js       # API 라우트
├── controllers/      # 컨트롤러 (미래 사용)
├── middleware/       # 미들웨어 (미래 사용)
├── models/          # 데이터 모델 (미래 사용)
├── utils/           # 유틸리티 함수 (미래 사용)
└── package.json     # 의존성 관리
```

## 환경 변수

서버 실행을 위해 다음 환경 변수를 설정할 수 있습니다:

- `PORT`: 서버 포트 (기본값: 3000)
- `NODE_ENV`: 환경 설정 (development/production)
