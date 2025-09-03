import type { User as SupabaseUser } from "@supabase/supabase-js";

export interface User extends SupabaseUser {
  // 필요한 경우 추가 사용자 정보를 여기에 확장
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
