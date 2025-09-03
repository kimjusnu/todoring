"use client";

import { useState } from "react";
import { useAuth } from "@/shared/lib/AuthContext";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await resetPassword(email);
      setMessage("비밀번호 재설정 링크가 이메일로 전송되었습니다.");
    } catch (error: any) {
      console.error("Password reset error:", error);

      // 영어 에러 메시지를 한국어로 번역
      let koreanMessage = "비밀번호 재설정 요청에 실패했습니다.";

      if (error.message) {
        if (
          error.message.includes(
            "For security purposes, you can only request this after"
          )
        ) {
          // "For security purposes, you can only request this after 16 seconds." 같은 메시지 처리
          const match = error.message.match(/after (\d+) seconds/);
          if (match) {
            const seconds = match[1];
            koreanMessage = `보안상의 이유로 ${seconds}초 후에 다시 요청해주세요.`;
          } else {
            koreanMessage = "보안상의 이유로 잠시 후에 다시 요청해주세요.";
          }
        } else if (error.message.includes("Email rate limit exceeded")) {
          koreanMessage =
            "이메일 발송 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
        } else if (error.message.includes("Invalid email")) {
          koreanMessage = "유효하지 않은 이메일 주소입니다.";
        } else if (error.message.includes("User not found")) {
          koreanMessage = "등록되지 않은 이메일 주소입니다.";
        } else if (error.message.includes("Email not confirmed")) {
          koreanMessage = "이메일 인증이 완료되지 않은 계정입니다.";
        } else {
          koreanMessage = error.message;
        }
      }

      setError(koreanMessage);
    } finally {
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
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            비밀번호 찾기
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를
            보내드립니다.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              이메일 주소
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="이메일 주소"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {message && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">{message}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "전송 중..." : "비밀번호 재설정 링크 보내기"}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              로그인 페이지로 돌아가기
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
