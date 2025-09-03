"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/shared/config/supabase";
import type { User } from "@supabase/supabase-js";

export const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // 프로필 정보 로드
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          setProfile(profileData);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // 인증 상태 변화 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setProfile(profileData);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 온보딩과 로그인 페이지에서는 헤더 숨기기
  if (pathname === "/onboarding" || pathname === "/login") {
    return null;
  }

  const handleSignOut = async () => {
    try {
      console.log("Starting sign out process...");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      console.log("Sign out completed successfully");
      // 로그아웃 후 온보딩 페이지로 강제 리다이렉트
      window.location.href = "/onboarding";
    } catch (error) {
      console.error("Sign out error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      alert("로그아웃 중 오류가 발생했습니다: " + errorMessage);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/"
            className="text-xl font-bold text-gray-900 hover:text-gray-700"
          >
            투두링 📝
          </Link>

          <nav className="flex items-center space-x-4">
            {loading ? (
              <div className="text-sm text-gray-500">로딩 중...</div>
            ) : user ? (
              <>
                <span className="text-sm text-gray-600">
                  {profile?.full_name || user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                로그인
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
