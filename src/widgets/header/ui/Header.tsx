"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/shared/lib/AuthContext";

export const Header = () => {
  const { user, profile, loading, signOut } = useAuth();
  const pathname = usePathname();

  // 온보딩과 로그인 페이지에서는 헤더 숨기기
  if (pathname === "/onboarding" || pathname === "/login") {
    return null;
  }

  const handleSignOut = async () => {
    try {
      console.log("Starting sign out process...");
      await signOut();
      console.log("Sign out completed successfully");
      // 로그아웃 후 온보딩 페이지로 강제 리다이렉트
      window.location.href = "/onboarding";
    } catch (error) {
      console.error("Sign out error:", error);
      alert("로그아웃 중 오류가 발생했습니다: " + error.message);
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
