"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/shared/lib/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/shared/config/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { updatePassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // URL 파라미터에서 에러 확인
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const error = urlParams.get("error");
    const errorCode = urlParams.get("error_code");
    const errorDescription = urlParams.get("error_description");

    if (error) {
      console.log("URL error detected:", {
        error,
        errorCode,
        errorDescription,
      });

      if (errorCode === "otp_expired") {
        setError(
          "비밀번호 재설정 링크가 만료되었습니다. 새로운 링크를 요청해주세요."
        );
      } else if (errorCode === "access_denied") {
        setError(
          "비밀번호 재설정 링크가 유효하지 않습니다. 새로운 링크를 요청해주세요."
        );
      } else if (errorDescription) {
        // 영어 에러 메시지를 한국어로 번역
        let koreanMessage = "";
        if (errorDescription.includes("Email link is invalid or has expired")) {
          koreanMessage = "이메일 링크가 유효하지 않거나 만료되었습니다.";
        } else if (errorDescription.includes("for security purposes")) {
          koreanMessage = "보안상의 이유로 링크가 차단되었습니다.";
        } else if (errorDescription.includes("link has already been used")) {
          koreanMessage = "이미 사용된 링크입니다.";
        } else {
          koreanMessage = "비밀번호 재설정 중 오류가 발생했습니다.";
        }
        setError(`${koreanMessage} 새로운 링크를 요청해주세요.`);
      } else {
        setError(
          "비밀번호 재설정 중 오류가 발생했습니다. 새로운 링크를 요청해주세요."
        );
      }
      return;
    }

    // 현재 세션 확인
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session check error:", error);
          setError("세션 확인에 실패했습니다.");
          return;
        }

        if (session) {
          console.log("Valid session found:", session);
          setMessage("새 비밀번호를 입력해주세요.");
        } else {
          console.log("No session found");
          setError(
            "유효하지 않은 비밀번호 재설정 링크입니다. 링크가 만료되었거나 이미 사용되었을 수 있습니다."
          );
        }
      } catch (err) {
        console.error("Session check error:", err);
        setError("세션 확인에 실패했습니다.");
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    // 세션 확인
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setError("세션이 만료되었습니다. 다시 비밀번호 재설정을 요청해주세요.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      setLoading(false);
      return;
    }

    try {
      console.log("Starting password update...");
      console.log("Current session before update:", session);

      // 타임아웃 추가 (10초)
      const updatePromise = updatePassword(password);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("비밀번호 변경 요청이 시간 초과되었습니다.")),
          10000
        )
      );

      const result = await Promise.race([updatePromise, timeoutPromise]);
      console.log("Password update successful, result:", result);
      setMessage("비밀번호가 성공적으로 변경되었습니다.");

      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error: any) {
      console.error("Password update error:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        code: error.code,
      });

      // 영어 에러 메시지를 한국어로 번역
      let koreanMessage = "비밀번호 변경에 실패했습니다.";

      if (error.message) {
        if (
          error.message.includes(
            "New password should be different from the old password"
          )
        ) {
          koreanMessage = "새 비밀번호는 기존 비밀번호와 달라야 합니다.";
        } else if (error.message.includes("Password should be at least")) {
          koreanMessage = "비밀번호는 최소 6자 이상이어야 합니다.";
        } else if (error.message.includes("Invalid password")) {
          koreanMessage = "유효하지 않은 비밀번호입니다.";
        } else if (error.message.includes("Password is too weak")) {
          koreanMessage =
            "비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.";
        } else {
          koreanMessage = error.message;
        }
      }

      setError(koreanMessage);
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            새 비밀번호 설정
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            새로운 비밀번호를 입력해주세요.
            <br />
            <span className="text-xs text-gray-500">
              기존 비밀번호와 다른 비밀번호를 사용해주세요.
            </span>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                새 비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="새 비밀번호 (기존과 다른 비밀번호, 최소 6자)"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호 확인"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {message && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">{message}</div>
              <div className="text-xs text-green-600 mt-1">
                3초 후 로그인 페이지로 이동합니다.
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || !!error}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "변경 중..." : "비밀번호 변경"}
            </button>
          </div>

          <div className="text-center space-y-2">
            <Link
              href="/forgot-password"
              className="block font-medium text-blue-600 hover:text-blue-500"
            >
              새로운 비밀번호 재설정 링크 요청
            </Link>
            <Link
              href="/login"
              className="block font-medium text-gray-600 hover:text-gray-500"
            >
              로그인 페이지로 돌아가기
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
