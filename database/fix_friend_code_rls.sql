-- 친구코드 접근을 위한 RLS 정책 수정

-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own friend code" ON public.profiles;
DROP POLICY IF EXISTS "Users can view friend codes for connection" ON public.profiles;

-- 2. 새로운 정책 추가
-- 자신의 프로필은 언제든 볼 수 있음
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- 친구코드로 사용자 찾기는 모든 인증된 사용자가 가능
CREATE POLICY "Users can search by friend code" ON public.profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- 3. user_connections 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS public.user_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    connected_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    connection_type TEXT DEFAULT 'friend' CHECK (connection_type IN ('friend', 'family', 'colleague')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    permissions TEXT DEFAULT 'read_only' CHECK (permissions IN ('read_only', 'read_write', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, connected_user_id)
);

-- 4. user_connections 테이블 RLS 활성화
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

-- 5. user_connections 테이블 정책
CREATE POLICY "Users can view own connections" ON public.user_connections
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

CREATE POLICY "Users can create connections" ON public.user_connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections" ON public.user_connections
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

