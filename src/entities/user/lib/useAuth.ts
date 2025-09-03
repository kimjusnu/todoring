"use client";

import { useEffect } from "react";
import { useAuthStore } from "../model/store";
import { authApi } from "../api/authApi";

export const useAuth = () => {
  const { user, loading, error, setUser, setLoading, setError } =
    useAuthStore();

  useEffect(() => {
    let mounted = true;

    // 초기 세션 확인
    const checkSession = async () => {
      try {
        if (!mounted) return;
        setLoading(true);

        const session = await authApi.getCurrentSession();

        if (!mounted) return;
        setUser(session?.user ?? null);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        console.error("Auth error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "인증 확인 중 오류가 발생했습니다."
        );
        setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    // 인증 상태 변화 감지
    const {
      data: { subscription },
    } = authApi.onAuthStateChange((session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
      setError(null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // 빈 배열로 마운트 시에만 실행

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      await authApi.signIn({ email, password });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "로그인 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      await authApi.signUp({ email, password });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "회원가입 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authApi.signOut();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "로그아웃 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };
};
