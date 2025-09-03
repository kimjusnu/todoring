-- 친구의 일정을 읽기 전용으로 공유하는 스키마

-- 1. todos 테이블에 owner 정보 추가 (친구의 일정인지 구분하기 위해)
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;

-- 2. 기존 todos의 owner_id를 user_id로 설정
UPDATE public.todos SET owner_id = user_id WHERE owner_id IS NULL;

-- 3. todos 테이블 RLS 정책 수정 - 친구의 일정도 읽을 수 있도록
DROP POLICY IF EXISTS "Users can view own todos" ON public.todos;
CREATE POLICY "Users can view own and friends todos" ON public.todos
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = owner_id OR
        EXISTS (
            SELECT 1 FROM public.user_connections uc
            WHERE (uc.user_id = auth.uid() AND uc.connected_user_id = owner_id AND uc.status = 'accepted')
               OR (uc.connected_user_id = auth.uid() AND uc.user_id = owner_id AND uc.status = 'accepted')
        )
    );

-- 4. todos 생성/수정/삭제는 본인 것만 가능하도록 제한
DROP POLICY IF EXISTS "Users can create todos" ON public.todos;
CREATE POLICY "Users can create own todos" ON public.todos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own todos" ON public.todos;
CREATE POLICY "Users can update own todos" ON public.todos
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own todos" ON public.todos;
CREATE POLICY "Users can delete own todos" ON public.todos
    FOR DELETE USING (auth.uid() = user_id);

-- 5. 친구의 일정을 조회하는 함수
CREATE OR REPLACE FUNCTION get_friends_todos()
RETURNS TABLE(
    id UUID,
    title TEXT,
    completed BOOLEAN,
    priority TEXT,
    due_date DATE,
    user_id UUID,
    owner_id UUID,
    is_shared BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    owner_name TEXT,
    owner_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.completed,
        t.priority,
        t.due_date,
        t.user_id,
        t.owner_id,
        t.is_shared,
        t.created_at,
        t.updated_at,
        p.full_name as owner_name,
        p.email as owner_email
    FROM public.todos t
    JOIN public.profiles p ON t.owner_id = p.id
    WHERE EXISTS (
        SELECT 1 FROM public.user_connections uc
        WHERE (uc.user_id = auth.uid() AND uc.connected_user_id = t.owner_id AND uc.status = 'accepted')
           OR (uc.connected_user_id = auth.uid() AND uc.user_id = t.owner_id AND uc.status = 'accepted')
    )
    ORDER BY t.due_date ASC, t.priority DESC, t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 모든 할일을 조회하는 함수 (본인 + 친구)
CREATE OR REPLACE FUNCTION get_all_todos()
RETURNS TABLE(
    id UUID,
    title TEXT,
    completed BOOLEAN,
    priority TEXT,
    due_date DATE,
    user_id UUID,
    owner_id UUID,
    is_shared BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    owner_name TEXT,
    owner_email TEXT,
    is_own_todo BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.completed,
        t.priority,
        t.due_date,
        t.user_id,
        t.owner_id,
        t.is_shared,
        t.created_at,
        t.updated_at,
        p.full_name as owner_name,
        p.email as owner_email,
        (t.user_id = auth.uid()) as is_own_todo
    FROM public.todos t
    JOIN public.profiles p ON t.owner_id = p.id
    WHERE t.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.user_connections uc
        WHERE (uc.user_id = auth.uid() AND uc.connected_user_id = t.owner_id AND uc.status = 'accepted')
           OR (uc.connected_user_id = auth.uid() AND uc.user_id = t.owner_id AND uc.status = 'accepted')
    )
    ORDER BY t.due_date ASC, t.priority DESC, t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 특정 날짜의 모든 할일을 조회하는 함수 (본인 + 친구)
CREATE OR REPLACE FUNCTION get_todos_by_date(target_date DATE)
RETURNS TABLE(
    id UUID,
    title TEXT,
    completed BOOLEAN,
    priority TEXT,
    due_date DATE,
    user_id UUID,
    owner_id UUID,
    is_shared BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    owner_name TEXT,
    owner_email TEXT,
    is_own_todo BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.completed,
        t.priority,
        t.due_date,
        t.user_id,
        t.owner_id,
        t.is_shared,
        t.created_at,
        t.updated_at,
        p.full_name as owner_name,
        p.email as owner_email,
        (t.user_id = auth.uid()) as is_own_todo
    FROM public.todos t
    JOIN public.profiles p ON t.owner_id = p.id
    WHERE t.due_date = target_date
    AND (t.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.user_connections uc
        WHERE (uc.user_id = auth.uid() AND uc.connected_user_id = t.owner_id AND uc.status = 'accepted')
           OR (uc.connected_user_id = auth.uid() AND uc.user_id = t.owner_id AND uc.status = 'accepted')
    ))
    ORDER BY t.priority DESC, t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
