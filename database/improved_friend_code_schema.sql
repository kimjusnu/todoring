-- 개선된 친구코드 스키마
-- 사용자별 고유 친구코드를 profiles 테이블에 저장

-- 1. profiles 테이블에 친구코드 컬럼 추가
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS friend_code TEXT UNIQUE;

-- 2. 친구코드 생성 함수
CREATE OR REPLACE FUNCTION generate_friend_code() RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        -- 8자리 랜덤 코드 생성 (대문자 + 숫자)
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- 중복 확인
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE friend_code = code) INTO exists;
        
        -- 중복되지 않으면 반환
        IF NOT exists THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. 사용자 생성 시 자동으로 친구코드 생성하는 트리거 함수 수정
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username, full_name, friend_code)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        generate_friend_code()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 기존 사용자들에게 친구코드 부여 (한 번만 실행)
UPDATE public.profiles 
SET friend_code = generate_friend_code() 
WHERE friend_code IS NULL;

-- 5. 친구코드로 사용자 찾는 함수
CREATE OR REPLACE FUNCTION get_user_by_friend_code(code TEXT) 
RETURNS TABLE(user_id UUID, email TEXT, full_name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.email, p.full_name
    FROM public.profiles p
    WHERE p.friend_code = code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS 정책 추가
CREATE POLICY "Users can view own friend code" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view friend codes for connection" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_connections uc
            WHERE (uc.user_id = auth.uid() AND uc.connected_user_id = id)
               OR (uc.connected_user_id = auth.uid() AND uc.user_id = id)
        )
    );
