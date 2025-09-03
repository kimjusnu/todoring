-- 대시보드용 뷰들

-- 1. 사용자 목록 (비밀번호 제외)
CREATE OR REPLACE VIEW dashboard_users AS
SELECT 
    u.id,
    u.email,
    p.full_name,
    p.friend_code,
    u.email_confirmed_at,
    u.created_at,
    u.last_sign_in_at,
    CASE 
        WHEN u.email_confirmed_at IS NOT NULL THEN '인증됨'
        ELSE '미인증'
    END as email_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- 2. 할일 통계
CREATE OR REPLACE VIEW dashboard_todo_stats AS
SELECT 
    p.full_name,
    p.email,
    COUNT(t.id) as total_todos,
    COUNT(CASE WHEN t.completed = true THEN 1 END) as completed_todos,
    COUNT(CASE WHEN t.completed = false THEN 1 END) as pending_todos,
    COUNT(CASE WHEN t.due_date::date = CURRENT_DATE THEN 1 END) as today_todos
FROM public.profiles p
LEFT JOIN public.todos t ON p.id = t.user_id
GROUP BY p.id, p.full_name, p.email
ORDER BY total_todos DESC;

-- 3. 친구 연결 통계
CREATE OR REPLACE VIEW dashboard_connections AS
SELECT 
    p1.full_name as user_name,
    p1.email as user_email,
    p2.full_name as connected_to,
    p2.email as connected_email,
    uc.connection_type,
    uc.status,
    uc.created_at
FROM public.user_connections uc
JOIN public.profiles p1 ON uc.user_id = p1.id
JOIN public.profiles p2 ON uc.connected_user_id = p2.id
ORDER BY uc.created_at DESC;

-- 4. 일일 활동 통계
CREATE OR REPLACE VIEW dashboard_daily_activity AS
SELECT 
    DATE(t.created_at) as activity_date,
    COUNT(*) as todos_created,
    COUNT(CASE WHEN t.completed = true THEN 1 END) as todos_completed
FROM public.todos t
WHERE t.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(t.created_at)
ORDER BY activity_date DESC;
