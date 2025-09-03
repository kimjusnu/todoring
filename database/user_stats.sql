-- 사용자 통계 테이블
CREATE TABLE IF NOT EXISTS public.user_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    login_count INTEGER DEFAULT 0,
    last_login_at TIMESTAMPTZ,
    total_todos INTEGER DEFAULT 0,
    completed_todos INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 로그인 시 통계 업데이트 함수
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_stats (user_id, last_login_at, login_count)
    VALUES (NEW.id, NOW(), 1)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        last_login_at = NOW(),
        login_count = user_stats.login_count + 1,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 로그인 이벤트 트리거 (Supabase Auth 이벤트 사용)
-- 이는 Supabase Dashboard의 Database → Functions에서 설정해야 함

-- RLS 정책
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats" ON public.user_stats
    FOR SELECT USING (auth.uid() = user_id);

-- 관리자용 통계 뷰
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT 
    u.email,
    p.full_name,
    p.friend_code,
    us.login_count,
    us.last_login_at,
    us.total_todos,
    us.completed_todos,
    u.created_at as user_created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_stats us ON u.id = us.user_id;
