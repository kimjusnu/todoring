-- 임시로 RLS 비활성화 (테스트용)
-- 주의: 프로덕션에서는 절대 사용하지 마세요!

-- 1. profiles 테이블 RLS 일시 비활성화
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. 모든 정책 삭제
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own friend code" ON public.profiles;
DROP POLICY IF EXISTS "Users can view friend codes for connection" ON public.profiles;
DROP POLICY IF EXISTS "Users can search by friend code" ON public.profiles;

-- 3. user_connections 테이블도 RLS 비활성화 (있다면)
ALTER TABLE public.user_connections DISABLE ROW LEVEL SECURITY;

-- 4. user_connections 정책도 삭제
DROP POLICY IF EXISTS "Users can view own connections" ON public.user_connections;
DROP POLICY IF EXISTS "Users can create connections" ON public.user_connections;
DROP POLICY IF EXISTS "Users can update own connections" ON public.user_connections;

