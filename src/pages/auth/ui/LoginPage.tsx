"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/lib/AuthContext";

export const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [lastSignupEmail, setLastSignupEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { user, signIn, signUp, resendEmail } = useAuth();
  const router = useRouter();

  // 이미 로그인된 사용자는 홈으로 리다이렉트
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  // 쿨다운 타이머 관리
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // 차단 상태 확인
    if (isBlocked) {
      setError(
        "너무 많은 로그인 시도로 인해 잠시 차단되었습니다. 30초 후 다시 시도해주세요."
      );
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    if (!isLogin && !fullName.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        // 로그인 성공 시 실패 횟수 초기화
        setFailedAttempts(0);
        router.push("/");
      } else {
        const signUpResult = await signUp(email, password, fullName.trim());

        // 회원가입 결과에 따라 다른 메시지 표시
        if (signUpResult?.user && !signUpResult?.session) {
          setSuccessMessage(
            "회원가입이 완료되었습니다! 이메일을 확인하여 계정을 활성화해주세요."
          );
          setLastSignupEmail(email); // 재발송을 위해 이메일 저장
        } else if (signUpResult?.session) {
          setSuccessMessage(
            "회원가입이 완료되었습니다! 자동으로 로그인되었습니다."
          );
        } else {
          setSuccessMessage("회원가입이 완료되었습니다!");
        }

        setIsLogin(true); // 로그인 탭으로 전환
        setPassword("");
        setConfirmPassword("");
        setFullName("");
      }
    } catch (err: any) {
      // 로그인 실패는 정상적인 상황이므로 콘솔 에러를 줄임
      if (err.message?.includes("Invalid login credentials")) {
        console.log("Login attempt failed: Invalid credentials");
      } else {
        console.error("Auth error:", err);
      }

      // Supabase 에러 메시지를 한국어로 변환
      let errorMessage = "오류가 발생했습니다.";

      if (err.message) {
        if (err.message.includes("Invalid login credentials")) {
          errorMessage = "이메일 또는 비밀번호가 잘못되었습니다.";
        } else if (err.message.includes("Email not confirmed")) {
          errorMessage =
            "이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.";
        } else if (err.message.includes("User already registered")) {
          errorMessage = "이미 가입된 이메일입니다.";
        } else if (err.message.includes("Password should be at least")) {
          errorMessage = "비밀번호는 최소 6자 이상이어야 합니다.";
        } else if (err.message.includes("Unable to validate email address")) {
          errorMessage = "유효하지 않은 이메일 주소입니다.";
        } else if (err.message.includes("Signup is disabled")) {
          errorMessage = "현재 회원가입이 비활성화되어 있습니다.";
        } else if (err.message.includes("Email rate limit exceeded")) {
          errorMessage =
            "이메일 발송 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);

      // 로그인 실패 시에만 카운트 증가
      if (
        isLogin &&
        err.message &&
        err.message.includes("Invalid login credentials")
      ) {
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);

        // 3번 실패 시 30초 차단
        if (newFailedAttempts >= 3) {
          setIsBlocked(true);
          setError(
            "3번 연속 로그인에 실패했습니다. 30초 후 다시 시도해주세요."
          );

          // 30초 후 차단 해제
          setTimeout(() => {
            setIsBlocked(false);
            setFailedAttempts(0);
          }, 30000);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!lastSignupEmail || resendCooldown > 0) return;

    setResendLoading(true);
    setError("");

    try {
      await resendEmail(lastSignupEmail);
      setSuccessMessage(
        "인증 이메일을 다시 발송했습니다! 이메일을 확인해주세요."
      );
      setResendCooldown(60); // 60초 쿨다운 시작
    } catch (err: any) {
      console.error("Resend email error:", err);

      // 모든 에러에 대해 60초 쿨다운 적용
      setResendCooldown(60);
      setError("보안상 60초 후에 다시 시도할 수 있습니다.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">투두링</h1>
          <p className="text-gray-600">할 일을 효율적으로 관리하세요</p>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="mb-6">
            <div className="flex border-b">
              <button
                className={`flex-1 py-2 px-4 text-center ${
                  isLogin
                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => {
                  setIsLogin(true);
                  setError(""); // 탭 변경 시 에러 메시지 초기화
                  setSuccessMessage(""); // 성공 메시지도 초기화
                  setFailedAttempts(0); // 실패 횟수도 초기화
                  setIsBlocked(false); // 차단 상태도 초기화
                  // 회원가입 전용 필드들 초기화
                  setConfirmPassword("");
                  setFullName("");
                }}
              >
                로그인
              </button>
              <button
                className={`flex-1 py-2 px-4 text-center ${
                  !isLogin
                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => {
                  setIsLogin(false);
                  setError(""); // 탭 변경 시 에러 메시지 초기화
                  setSuccessMessage(""); // 성공 메시지도 초기화
                  setFailedAttempts(0); // 실패 횟수도 초기화
                  setIsBlocked(false); // 차단 상태도 초기화
                }}
              >
                회원가입
              </button>
            </div>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={
                    isLogin ? "비밀번호를 입력하세요" : "6자 이상 입력하세요"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* 회원가입일 때만 이름 입력 */}
            {!isLogin && (
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  이름 *
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="이름을 입력하세요"
                />
              </div>
            )}

            {/* 회원가입일 때만 비밀번호 확인 */}
            {!isLogin && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  비밀번호 확인
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="비밀번호를 다시 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 성공 메시지 */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      회원가입 완료
                    </h3>
                    <div className="mt-1 text-sm text-green-700">
                      {successMessage}
                    </div>
                    <div className="mt-2 text-xs text-green-600">
                      💡 이메일 인증 후 로그인할 수 있습니다
                    </div>
                    <div className="mt-3 text-xs text-green-700 space-y-1">
                      <div>
                        📧 <strong>이메일이 오지 않나요?</strong>
                      </div>
                      <div className="ml-4">
                        • 스팸함을 확인해보세요
                        <br />
                        • 5-10분 정도 소요될 수 있습니다
                        <br />• 이메일 주소를 다시 확인해주세요
                      </div>
                      {lastSignupEmail && (
                        <div className="mt-3 space-x-2">
                          <button
                            onClick={handleResendEmail}
                            disabled={resendLoading || resendCooldown > 0}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {resendLoading
                              ? "발송 중..."
                              : resendCooldown > 0
                              ? `다시 시도 (${resendCooldown}초)`
                              : "이메일 다시 보내기"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {isLogin ? "로그인 실패" : "회원가입 실패"}
                    </h3>
                    <div className="mt-1 text-sm text-red-700">{error}</div>
                    {isLogin && failedAttempts > 0 && !isBlocked && (
                      <div className="mt-2 text-xs text-red-600">
                        실패 횟수: {failedAttempts}/3 (3회 실패 시 30초 차단)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isBlocked}
              className={`w-full py-2 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                isLogin
                  ? "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                  : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
              }`}
            >
              {loading
                ? isLogin
                  ? "로그인 중..."
                  : "회원가입 중..."
                : isBlocked
                ? "잠시 차단됨"
                : isLogin
                ? "로그인"
                : "회원가입"}
            </button>
          </form>
        </div>

        {/* 홈으로 돌아가기 */}
        <div className="text-center">
          <button
            onClick={() => router.push("/")}
            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            ← 홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};
