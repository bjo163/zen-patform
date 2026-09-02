"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Cloud,
  Edit3,
  Github,
  Globe,
  LayoutDashboard,
  Menu,
  Newspaper,
  Settings,
  X,
} from "lucide-react";
import {
  useParams,
  usePathname,
  useSelectedLayoutSegments,
} from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { getSiteFromPostId } from "@/lib/actions";
import Image from "next/image";

const externalLinks = [
  { name: "GitHub", href: "https://github.com/bjo163/zen-patform", icon: <Github width={18} /> },
];

export default function Nav({ children }: { children: ReactNode }) {
  const segments = useSelectedLayoutSegments();
  const { id } = useParams() as { id?: string };
  const [siteId, setSiteId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (segments[0] === "post" && id) {
      void getSiteFromPostId(id).then((value) => setSiteId(value ?? null));
    } else {
      setSiteId(null);
    }
  }, [segments, id]);

  useEffect(() => {
    setShowSidebar(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = showSidebar ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showSidebar]);

  const tabs = useMemo(() => {
    if (segments[0] === "site" && id) {
      return [
        { name: "Back to All Sites", href: "/sites", icon: <ArrowLeft width={18} /> },
        { name: "Posts", href: `/site/${id}`, isActive: segments.length === 2, icon: <Newspaper width={18} /> },
        { name: "Analytics", href: `/site/${id}/analytics`, isActive: segments.includes("analytics"), icon: <BarChart3 width={18} /> },
        { name: "Settings", href: `/site/${id}/settings`, isActive: segments.includes("settings"), icon: <Settings width={18} /> },
      ];
    }
    if (segments[0] === "post" && id) {
      return [
        { name: "Back to All Posts", href: siteId ? `/site/${siteId}` : "/sites", icon: <ArrowLeft width={18} /> },
        { name: "Editor", href: `/post/${id}`, isActive: segments.length === 2, icon: <Edit3 width={18} /> },
        { name: "Settings", href: `/post/${id}/settings`, isActive: segments.includes("settings"), icon: <Settings width={18} /> },
      ];
    }
    return [
      { name: "Overview", href: "/", isActive: segments.length === 0, icon: <LayoutDashboard width={18} /> },
      { name: "Developer Cloud", href: "/cloud", isActive: segments[0] === "cloud", icon: <Cloud width={18} /> },
      { name: "Sites", href: "/sites", isActive: segments[0] === "sites", icon: <Globe width={18} /> },
      { name: "Settings", href: "/settings", isActive: segments[0] === "settings", icon: <Settings width={18} /> },
    ];
  }, [segments, id, siteId]);

  return (
    <>
      <button
        type="button"
        aria-label={showSidebar ? "Close navigation" : "Open navigation"}
        aria-expanded={showSidebar}
        aria-controls="dashboard-sidebar"
        className="fixed right-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white shadow-sm transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 dark:border-stone-700 dark:bg-black dark:hover:bg-stone-900 sm:hidden"
        onClick={() => setShowSidebar((value) => !value)}
      >
        {showSidebar ? <X width={19} /> : <Menu width={19} />}
      </button>

      {showSidebar ? (
        <button
          type="button"
          aria-label="Close navigation backdrop"
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px] sm:hidden"
          onClick={() => setShowSidebar(false)}
        />
      ) : null}

      <aside
        id="dashboard-sidebar"
        aria-label="Primary navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-[18rem] flex-col justify-between border-r border-stone-200 bg-stone-50 p-4 shadow-xl transition-transform duration-200 dark:border-stone-800 dark:bg-stone-950 sm:w-60 sm:translate-x-0 sm:shadow-none ${showSidebar ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="grid gap-5">
          <div className="flex items-center gap-2 rounded-xl px-2 py-1.5">
            <Link href="/" aria-label="Go to overview" className="rounded-lg p-1.5 hover:bg-stone-200 dark:hover:bg-stone-800">
              <Image src="/logo.png" width={26} height={26} alt="Developer Cloud" className="rounded-md" />
            </Link>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-stone-900 dark:text-white">Developer Cloud</div>
              <div className="text-[11px] text-stone-500">Control plane</div>
            </div>
          </div>

          <nav className="grid gap-1" aria-label="Workspace">
            {tabs.map(({ name, href, isActive, icon }) => (
              <Link
                key={name}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${isActive ? "bg-stone-200 text-stone-950 dark:bg-stone-800 dark:text-white" : "text-stone-600 hover:bg-stone-100 hover:text-stone-950 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-white"}`}
              >
                {icon}
                <span>{name}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <div className="grid gap-1">
            {externalLinks.map(({ name, href, icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-10 items-center justify-between rounded-xl px-3 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-white"
              >
                <span className="flex items-center gap-3">{icon}<span>{name}</span></span>
                <span aria-hidden="true" className="text-xs">↗</span>
              </a>
            ))}
          </div>
          <div className="my-3 border-t border-stone-200 dark:border-stone-800" />
          {children}
        </div>
      </aside>
    </>
  );
}
