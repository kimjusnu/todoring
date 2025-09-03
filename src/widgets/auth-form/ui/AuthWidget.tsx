"use client";

import { useState } from "react";
import { LoginForm, SignUpForm } from "@/features/auth";

export const AuthWidget = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md mx-auto">
      <div className="mb-6">
        <div className="flex border-b">
          <button
            className={`flex-1 py-2 px-4 text-center ${
              isLogin
                ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setIsLogin(true)}
          >
            로그인
          </button>
          <button
            className={`flex-1 py-2 px-4 text-center ${
              !isLogin
                ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setIsLogin(false)}
          >
            회원가입
          </button>
        </div>
      </div>

      {isLogin ? <LoginForm /> : <SignUpForm />}
    </div>
  );
};
