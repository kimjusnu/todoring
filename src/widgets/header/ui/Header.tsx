"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/shared/config/supabase";
import { useToast } from "@/shared/lib/ToastContext";
import { ConnectionManager, SharingSettingsModal } from "@/features/connection";
import type { User } from "@supabase/supabase-js";

export const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isConnectionManagerOpen, setIsConnectionManagerOpen] = useState(false);
  const [isSharingSettingsOpen, setIsSharingSettingsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { addToast } = useToast();

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
      addToast({
        type: "error",
        title: "로그아웃 실패",
        message: errorMessage,
      });
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">투두링</span>
          </Link>

          <nav className="flex items-center space-x-2">
            {loading ? (
              <div className="text-sm text-gray-500">로딩 중...</div>
            ) : user ? (
              <>
                <button
                  onClick={() => setIsConnectionManagerOpen(true)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  title="친구와 일정 공유하기"
                >
                  공유
                </button>
                <button
                  onClick={() => setIsSharingSettingsOpen(true)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  title="공유 설정 관리"
                >
                  설정
                </button>
                <div className="h-4 w-px bg-gray-300 mx-2"></div>
                <span className="text-sm font-medium text-gray-900">
                  {profile?.full_name || user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                로그인
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* 연결 관리 모달 */}
      <ConnectionManager
        isOpen={isConnectionManagerOpen}
        onClose={() => setIsConnectionManagerOpen(false)}
      />

      {/* 공유 설정 모달 */}
      <SharingSettingsModal
        isOpen={isSharingSettingsOpen}
        onClose={() => setIsSharingSettingsOpen(false)}
      />
    </header>
  );
};
