"use client";

import { useState } from "react";
import Link from "next/link";

export default function CTA() {
  const [closeCTA, setCloseCTA] = useState(false);

  return (
    <div
      className={`${
        closeCTA ? "h-14 lg:h-auto" : "h-60 sm:h-40 lg:h-auto"
      } fixed inset-x-0 bottom-5 mx-5 flex max-w-screen-xl flex-col items-center justify-between space-y-3 rounded-lg border-t-4 border-black bg-white px-5 pb-3 pt-0 drop-shadow-lg transition-all duration-150 ease-in-out lg:flex-row lg:space-y-0 lg:pt-3 xl:mx-auto dark:border-t-4 dark:border-stone-700 dark:bg-black dark:text-white`}
    >
      <button
        type="button"
        onClick={() => setCloseCTA((value) => !value)}
        aria-expanded={!closeCTA}
        aria-label={closeCTA ? "Expand product banner" : "Collapse product banner"}
        className={`${
          closeCTA ? "rotate-180" : "rotate-0"
        } absolute right-3 top-2 text-black transition-all duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 lg:hidden dark:text-white`}
      >
        <svg
          viewBox="0 0 24 24"
          width="30"
          height="30"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          shapeRendering="geometricPrecision"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div className="text-center lg:text-left">
        <p className="font-title text-lg text-black sm:text-2xl dark:text-white">
          Zen Platform Developer Cloud
        </p>
        <p
          className={`${
            closeCTA ? "hidden lg:block" : ""
          } mt-2 text-sm text-stone-700 lg:mt-0 dark:text-stone-300`}
        >
          Deploy from GitHub, manage projects and domains, and monitor deployments
          from one control plane.
        </p>
      </div>

      <div
        className={`${
          closeCTA ? "hidden lg:flex" : ""
        } flex w-full flex-col space-y-3 text-center sm:flex-row sm:space-x-3 sm:space-y-0 lg:w-auto`}
      >
        <Link
          className="flex-auto whitespace-nowrap rounded-md border border-stone-200 px-5 py-1 font-title text-lg text-black transition-all duration-150 ease-in-out hover:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 sm:py-3 dark:border-stone-700 dark:text-white dark:hover:border-white"
          href="/login"
        >
          Open Developer Cloud
        </Link>
        <a
          className="flex-auto whitespace-nowrap rounded-md border border-black bg-black px-5 py-1 font-title text-lg text-white transition-all duration-150 ease-in-out hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 sm:py-3 dark:border-white dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white"
          href="#pricing"
        >
          View pricing
        </a>
      </div>
    </div>
  );
}
