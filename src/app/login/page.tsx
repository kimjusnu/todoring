"use client";

import dynamic from "next/dynamic";

const LoginPage = dynamic(
  () => import("@/pages/auth").then((mod) => ({ default: mod.default })),
  {
    ssr: false,
  }
);

export default function Login() {
  return <LoginPage />;
}
