import Image from "next/image";
import LoginButton from "./login-button";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <main className="mx-5 sm:mx-auto sm:w-full sm:max-w-md">
      <section className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm dark:border-stone-800 dark:bg-black sm:p-10">
        <div className="text-center">
          <Image
            alt="Zen Platform"
            width={100}
            height={100}
            className="mx-auto h-12 w-auto rounded-xl"
            src="/logo.png"
          />
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Developer Cloud
          </p>
          <h1 className="mt-2 font-cal text-3xl font-bold text-stone-950 dark:text-white">
            Welcome to Zen Platform
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-stone-600 dark:text-stone-400">
            Sign in to deploy projects, monitor deployments, and manage your cloud workspace.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-sm">
          <Suspense
            fallback={
              <div className="my-2 h-11 w-full animate-pulse rounded-xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-900" />
            }
          >
            <LoginButton />
          </Suspense>
        </div>
      </section>

      <p className="mt-4 text-center text-xs text-stone-500 dark:text-stone-600">
        Secure developer access · Zen Platform
      </p>
    </main>
  );
}
