import { createClient } from "@supabase/supabase-js";

// 하드코딩된 Supabase 설정
const supabaseUrl = "https://blofhrikqrfrcnycjnoz.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsb2ZocmlrcXJmcmNueWNqbm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NTk3NDUsImV4cCI6MjA3MjQzNTc0NX0.2-ndeQl9ZP3pNTVuAdwTt30ICwLQ8zJjMuko8eS86Zk";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
