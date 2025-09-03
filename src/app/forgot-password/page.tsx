"use client";

import dynamic from "next/dynamic";

const ForgotPasswordPage = dynamic(
  () =>
    import("@/pages/auth/ui/ForgotPasswordPage").then((mod) => ({
      default: mod.default,
    })),
  { ssr: false }
);

export default function ForgotPassword() {
  return <ForgotPasswordPage />;
}
