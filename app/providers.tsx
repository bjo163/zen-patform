"use client";

import { Toaster } from "sonner";
import { ModalProvider } from "@/components/modal/provider";

// SessionProvider is intentionally kept out of the root layout. Public pages
// (/, /login) must not initialize NextAuth's client runtime before the auth
// configuration is available. Authenticated server actions/pages use the
// server-side session helpers from lib/auth directly.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster className="dark:hidden" />
      <Toaster theme="dark" className="hidden dark:block" />
      <ModalProvider>{children}</ModalProvider>
    </>
  );
}
