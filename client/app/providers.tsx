"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function Providers({ children }: Props) {
  return (
    <SessionProvider>
      {/* This is where the Robot's Global State will eventually sit */}
      {children}
    </SessionProvider>
  );
}