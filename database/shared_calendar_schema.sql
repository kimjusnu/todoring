-- 친구/연인 간 일정 공유 기능을 위한 데이터베이스 스키마

-- 1. 사용자 연결 관계 테이블
CREATE TABLE IF NOT EXISTS public.user_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connected_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connection_type TEXT DEFAULT 'friend' CHECK (connection_type IN ('friend', 'partner', 'family')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  permissions TEXT DEFAULT 'read_only' CHECK (permissions IN ('read_only', 'read_write')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, connected_user_id)
);

-- 2. 초대 코드 테이블
CREATE TABLE IF NOT EXISTS public.connection_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  connection_type TEXT DEFAULT 'friend' CHECK (connection_type IN ('friend', 'partner', 'family')),
  permissions TEXT DEFAULT 'read_only' CHECK (permissions IN ('read_only', 'read_write')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 공유된 할일 테이블 (기존 todos 테이블 확장)
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS shared_with UUID[] DEFAULT '{}';
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. 공유 설정 테이블
CREATE TABLE IF NOT EXISTS public.sharing_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connected_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  share_all_todos BOOLEAN DEFAULT FALSE,
  share_future_todos BOOLEAN DEFAULT TRUE,
  share_completed_todos BOOLEAN DEFAULT FALSE,
  share_priority BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, connected_user_id)
);

-- RLS 정책 설정
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sharing_settings ENABLE ROW LEVEL SECURITY;

-- user_connections 테이블 정책
DROP POLICY IF EXISTS "Users can view own connections" ON public.user_connections;
CREATE POLICY "Users can view own connections" ON public.user_connections 
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

DROP POLICY IF EXISTS "Users can create connections" ON public.user_connections;
CREATE POLICY "Users can create connections" ON public.user_connections 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own connections" ON public.user_connections;
CREATE POLICY "Users can update own connections" ON public.user_connections 
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

DROP POLICY IF EXISTS "Users can delete own connections" ON public.user_connections;
CREATE POLICY "Users can delete own connections" ON public.user_connections 
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

-- connection_invites 테이블 정책
DROP POLICY IF EXISTS "Users can view own invites" ON public.connection_invites;
CREATE POLICY "Users can view own invites" ON public.connection_invites 
  FOR SELECT USING (auth.uid() = inviter_id OR auth.uid() = used_by);

DROP POLICY IF EXISTS "Users can create invites" ON public.connection_invites;
CREATE POLICY "Users can create invites" ON public.connection_invites 
  FOR INSERT WITH CHECK (auth.uid() = inviter_id);

DROP POLICY IF EXISTS "Users can update own invites" ON public.connection_invites;
CREATE POLICY "Users can update own invites" ON public.connection_invites 
  FOR UPDATE USING (auth.uid() = inviter_id);

-- sharing_settings 테이블 정책
DROP POLICY IF EXISTS "Users can view own sharing settings" ON public.sharing_settings;
CREATE POLICY "Users can view own sharing settings" ON public.sharing_settings 
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

DROP POLICY IF EXISTS "Users can create sharing settings" ON public.sharing_settings;
CREATE POLICY "Users can create sharing settings" ON public.sharing_settings 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sharing settings" ON public.sharing_settings;
CREATE POLICY "Users can update own sharing settings" ON public.sharing_settings 
  FOR UPDATE USING (auth.uid() = user_id);

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
DROP TRIGGER IF EXISTS update_user_connections_updated_at ON public.user_connections;
CREATE TRIGGER update_user_connections_updated_at 
  BEFORE UPDATE ON public.user_connections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sharing_settings_updated_at ON public.sharing_settings;
CREATE TRIGGER update_sharing_settings_updated_at 
  BEFORE UPDATE ON public.sharing_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 초대 코드 생성 함수
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    -- 8자리 랜덤 코드 생성 (대소문자 + 숫자)
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- 중복 확인
    SELECT COUNT(*) INTO exists_count 
    FROM public.connection_invites 
    WHERE invite_code = code AND expires_at > NOW();
    
    -- 중복이 없으면 반환
    IF exists_count = 0 THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 초대 코드 생성 트리거
CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_invite_code_trigger ON public.connection_invites;
CREATE TRIGGER set_invite_code_trigger
  BEFORE INSERT ON public.connection_invites
  FOR EACH ROW EXECUTE FUNCTION set_invite_code();

-- 기존 todos 테이블에 owner_id 설정 (기존 데이터용)
UPDATE public.todos 
SET owner_id = user_id 
WHERE owner_id IS NULL;

-- todos 테이블에 RLS 정책 추가 (공유된 할일 포함)
DROP POLICY IF EXISTS "Users can view shared todos" ON public.todos;
CREATE POLICY "Users can view shared todos" ON public.todos 
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = ANY(shared_with) OR
    (is_shared = TRUE AND auth.uid() IN (
      SELECT connected_user_id 
      FROM public.user_connections 
      WHERE user_id = todos.user_id AND status = 'accepted'
    ))
  );
