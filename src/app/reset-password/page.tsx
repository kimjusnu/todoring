"use client";

import dynamic from "next/dynamic";

const ResetPasswordPage = dynamic(
  () =>
    import("@/pages/auth/ui/ResetPasswordPage").then((mod) => ({
      default: mod.default,
    })),
  { ssr: false }
);

export default function ResetPassword() {
  return <ResetPasswordPage />;
}
