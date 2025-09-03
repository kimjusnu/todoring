"use client";

import dynamic from "next/dynamic";

const HomePage = dynamic(
  () => import("@/pages/home").then((mod) => ({ default: mod.default })),
  {
    ssr: false,
  }
);

export default function Home() {
  return <HomePage />;
}
