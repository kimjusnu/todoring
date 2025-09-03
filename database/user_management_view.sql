-- 사용자 관리용 뷰 (비밀번호 제외)
CREATE OR REPLACE VIEW user_management AS
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at as user_created_at,
    u.last_sign_in_at,
    p.full_name,
    p.friend_code,
    p.created_at as profile_created_at,
    CASE 
        WHEN u.email_confirmed_at IS NOT NULL THEN '인증됨'
        ELSE '미인증'
    END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;

-- RLS 정책 설정
ALTER VIEW user_management SET (security_invoker = true);

-- 관리자만 접근 가능하도록 정책 설정
CREATE POLICY "Admin can view user management" ON user_management
    FOR SELECT USING (
        -- 여기에 관리자 권한 체크 로직 추가
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE email = 'admin@yourdomain.com' -- 관리자 이메일
        )
    );
