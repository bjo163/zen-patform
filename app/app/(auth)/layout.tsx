import { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Login | Zen Platform",
  description: "Sign in to manage your projects on Zen Platform Developer Cloud.",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-white py-12 text-stone-950 dark:bg-black dark:text-white sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
