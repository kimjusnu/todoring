# 투두링 (TodoRing) 📝

> 캘린더 기반의 직관적인 할 일 관리 애플리케이션

투두링은 Supabase와 Next.js를 활용하여 개발된 현대적인 할 일 관리 도구입니다. 캘린더를 중심으로 한 직관적인 UI와 강력한 기능들을 제공합니다.

## ✨ 주요 기능

### 🔐 인증 시스템

- **회원가입/로그인**: 이메일 기반 인증
- **이메일 인증**: 회원가입 시 이메일 확인
- **비밀번호 재설정**: 이메일을 통한 비밀번호 재설정
- **프로필 관리**: 사용자 이름 및 기본 정보 관리

### 📅 캘린더 기반 할 일 관리

- **월별 캘린더**: 직관적인 달력 인터페이스
- **날짜별 할 일**: 각 날짜에 할 일 미리보기
- **우선순위 설정**: 낮음/보통/높음 3단계 우선순위
- **완료 상태 관리**: 체크박스를 통한 완료/미완료 토글

### 🎯 할 일 관리

- **CRUD 기능**: 할 일 생성, 조회, 수정, 삭제
- **다중 할 일 추가**: 텍스트 영역에서 여러 줄로 한 번에 추가
- **우선순위 변경**: 드래그 앤 드롭 또는 툴팁으로 우선순위 변경
- **날짜별 필터링**: 특정 날짜의 할 일만 조회

### 👥 친구/연인과 일정 공유

- **초대 코드 시스템**: 8자리 고유 코드로 친구 초대
- **연결 타입**: 친구/연인/가족 관계 설정
- **권한 관리**: 읽기 전용/편집 가능 권한 설정
- **공유 설정**: 전체/새로운/완료된 할일 공유 옵션
- **실시간 동기화**: 공유된 할일 실시간 업데이트

### 🎨 사용자 경험

- **온보딩**: 신규 사용자를 위한 가이드
- **반응형 디자인**: 모바일/데스크톱 최적화
- **직관적인 UI**: 깔끔하고 사용하기 쉬운 인터페이스
- **실시간 업데이트**: 변경사항 즉시 반영

## 🛠 기술 스택

### Frontend

- **Next.js 14**: React 기반 풀스택 프레임워크
- **TypeScript**: 타입 안전성 보장
- **Tailwind CSS**: 유틸리티 퍼스트 CSS 프레임워크
- **React Hooks**: 상태 관리 및 사이드 이펙트 처리

### Backend & Database

- **Supabase**: Backend-as-a-Service
  - PostgreSQL 데이터베이스
  - 실시간 인증 시스템
  - Row Level Security (RLS)
- **Supabase Auth**: 사용자 인증 및 세션 관리

### 아키텍처

- **FSD (Feature-Sliced Design)**: 확장 가능한 프로젝트 구조
- **컴포넌트 기반**: 재사용 가능한 UI 컴포넌트

## 🚀 시작하기

### 필수 요구사항

- Node.js 18.0 이상
- pnpm (권장) 또는 npm
- Supabase 계정

### 설치 및 실행

1. **저장소 클론**

```bash
git clone https://github.com/kimjusnu/todoring.git
cd todoring
```

2. **의존성 설치**

```bash
pnpm install
# 또는
npm install
```

3. **환경 변수 설정**
   `.env.local` 파일을 생성하고 Supabase 설정을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **데이터베이스 설정**
   `database/schema.sql` 파일의 SQL을 Supabase SQL Editor에서 실행하세요.
   공유 기능을 사용하려면 `database/shared_calendar_schema.sql`도 함께 실행하세요.

5. **개발 서버 실행**

```bash
pnpm dev
# 또는
npm run dev
```

6. **브라우저에서 확인**
   [http://localhost:3000](http://localhost:3000)에서 애플리케이션을 확인할 수 있습니다.

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js 앱 라우터
│   ├── globals.css        # 전역 스타일
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 홈페이지
├── pages/                 # 페이지 컴포넌트
│   ├── auth/              # 인증 관련 페이지
│   ├── home/              # 메인 홈페이지
│   └── onboarding/        # 온보딩 페이지
├── widgets/               # 위젯 (복합 UI 컴포넌트)
│   ├── calendar/          # 캘린더 위젯
│   ├── daily-todos/       # 일일 할 일 위젯
│   └── header/            # 헤더 위젯
├── features/              # 기능 단위 컴포넌트
│   └── todo/              # 할 일 관련 기능
├── entities/              # 비즈니스 엔티티
│   └── user/              # 사용자 엔티티
└── shared/                # 공유 리소스
    ├── api/               # API 클라이언트
    ├── config/            # 설정 파일
    └── lib/               # 유틸리티 라이브러리
```

## 🗄 데이터베이스 스키마

### profiles 테이블

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### todos 테이블

```sql
CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🎯 주요 기능 사용법

### 할 일 추가

1. 캘린더에서 원하는 날짜 클릭
2. 모달에서 할 일 입력
3. 우선순위 설정 (낮음/보통/높음)
4. 저장 버튼 클릭

### 여러 할 일 한 번에 추가

1. 할 일 추가 모달 열기
2. 텍스트 영역에 여러 줄로 할 일 입력
3. 각 줄이 개별 할 일로 저장됨

### 우선순위 변경

1. 기존 할 일의 우선순위 배지 클릭
2. 툴팁에서 원하는 우선순위 선택

### 날짜별 할 일 조회

1. 캘린더에서 날짜 클릭
2. 하단에 해당 날짜의 모든 할 일 표시
3. 화살표 버튼으로 이전/다음 날 이동

### 친구와 일정 공유하기

1. 헤더의 "👥 공유" 버튼 클릭
2. "내 초대코드" 탭에서 새 초대코드 생성
3. 생성된 8자리 코드를 친구에게 전달
4. 친구는 "초대코드 입력" 탭에서 코드 입력하여 연결
5. "⚙️ 설정" 버튼에서 공유 옵션 조정

## 🔧 개발 가이드

### 새로운 기능 추가

1. `src/features/` 디렉토리에 기능별 폴더 생성
2. UI 컴포넌트와 비즈니스 로직 분리
3. API 호출은 `src/shared/api/`에서 관리

### 스타일링

- Tailwind CSS 클래스 사용
- CSS 변수를 통한 테마 관리
- 반응형 디자인 고려

### 상태 관리

- React Context API 사용
- 로컬 상태는 useState/useEffect 활용
- 전역 상태는 Context Provider 패턴

## 📱 모바일 지원

- 반응형 디자인으로 모든 디바이스 지원
- 터치 친화적인 UI
- 모바일 브라우저 최적화

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 연락처

- 프로젝트 링크: [https://github.com/kimjusnu/todoring](https://github.com/kimjusnu/todoring)
- 이슈 리포트: [GitHub Issues](https://github.com/kimjusnu/todoring/issues)

## 🙏 감사의 말

- [Next.js](https://nextjs.org/) - React 프레임워크
- [Supabase](https://supabase.com/) - Backend-as-a-Service
- [Tailwind CSS](https://tailwindcss.com/) - CSS 프레임워크
- [Feature-Sliced Design](https://feature-sliced.design/) - 아키텍처 방법론

---

⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요!
