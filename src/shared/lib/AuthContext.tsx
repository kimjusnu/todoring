"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/shared/config/supabase";
import { profileApi, type Profile } from "@/shared/api/profileApi";
import type { User, AuthResponse } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<AuthResponse["data"]>;
  signOut: () => Promise<void>;
  resendEmail: (email: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 초기 세션 확인
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        if (session?.user) {
          const userProfile = await profileApi.getProfile();
          setProfile(userProfile);
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 인증 상태 변화 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        const userProfile = await profileApi.getProfile();
        setProfile(userProfile);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        // 로그인 실패는 정상적인 상황이므로 에러 레벨을 조정
        if (error.message?.includes("Invalid login credentials")) {
          console.log("Login failed: Invalid credentials");
        } else {
          console.error("SignIn error:", error);
        }
        setError(error.message);
        throw error;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "로그인 중 오류가 발생했습니다."
      );
      throw err;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<AuthResponse["data"]> => {
    console.log("Starting signup process for:", email);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          name: fullName,
        },
      },
    });

    console.log("Signup response:", { data, error });

    if (error) {
      console.error("Signup error:", error);
      throw error;
    }

    if (data.user && !data.session) {
      console.log("User created but needs email confirmation");
    } else if (data.session) {
      console.log("User created and automatically signed in");
    }

    return data;
  };

  const signOut = async () => {
    console.log("AuthContext: Starting signOut...");

    try {
      // 타임아웃을 추가하여 5초 후에는 강제로 진행
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("SignOut timeout")), 5000)
      );

      const result = (await Promise.race([signOutPromise, timeoutPromise])) as {
        error?: any;
      };
      console.log("AuthContext: signOut response:", result);

      if (result?.error) {
        console.error("AuthContext: signOut error:", result.error);
        throw result.error;
      }
    } catch (error) {
      console.warn("AuthContext: signOut failed or timed out:", error);
      // 에러가 발생해도 로컬 상태는 초기화
    }

    // 로컬 상태 강제 초기화
    setUser(null);
    setProfile(null);
    setLoading(false);

    console.log("AuthContext: signOut completed (local state cleared)");
  };

  const resendEmail = async (email: string) => {
    console.log("Resending confirmation email to:", email);

    const { data, error } = await supabase.auth.resend({
      type: "signup",
      email: email,
    });

    console.log("Resend email response:", { data, error });

    if (error) {
      console.error("Resend email error:", error);
      throw error;
    }

    // void를 반환하도록 수정
    return;
  };

  const resetPassword = async (email: string) => {
    console.log("Sending password reset email to:", email);

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error("Password reset error:", error);
      throw error;
    }

    console.log("Password reset email sent:", data);
  };

  const updatePassword = async (newPassword: string) => {
    console.log("AuthContext: Starting password update for current user");

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      console.log("AuthContext: updateUser response:", { data, error });

      if (error) {
        console.error("AuthContext: Password update error:", error);
        throw error;
      }

      console.log("AuthContext: Password updated successfully:", data);
    } catch (error) {
      console.error("AuthContext: updatePassword caught error:", error);
      throw error;
    }
  };

  const value = {
    user,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resendEmail,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
