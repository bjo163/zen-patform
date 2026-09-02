"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

interface Project {
  id: string;
  name: string;
  repositoryUrl: string | null;
  defaultBranch: string;
  provider: string;
  deployments: Array<{ id: string; status: string; url: string | null }>;
}

export default function CloudPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadProjects() {
    const response = await fetch("/api/cloud/projects", { cache: "no-store" });
    const data = await response.json();
    if (response.ok) setProjects(data.projects ?? []);
  }

  async function refreshDeployments(currentProjects: Project[]) {
    await Promise.all(
      currentProjects.flatMap((project) => {
        const latest = project.deployments?.[0];
        if (!latest?.id || ["running", "failed", "cancelled"].includes(latest.status)) return [];
        return [fetch(`/api/cloud/deployments/${latest.id}`, { cache: "no-store" }).catch(() => null)];
      }),
    );
    await loadProjects();
  }

  useEffect(() => {
    let active = true;
    const boot = async () => {
      const response = await fetch("/api/cloud/projects", { cache: "no-store" });
      const data = await response.json();
      if (active && response.ok) setProjects(data.projects ?? []);
    };
    void boot();
    const timer = setInterval(() => {
      if (active) void refreshDeployments(projects);
    }, 8000);
    return () => {
      active = false;
      clearInterval(timer);
    };
    // Polling is intentionally low-frequency for the MVP control plane.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects.length]);

  async function deploy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/cloud/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, repositoryUrl, branch }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Deployment failed");
      setMessage(`Deployment queued${data.deployment?.url ? `: ${data.deployment.url}` : "."}`);
      setName("");
      setRepositoryUrl("");
      setBranch("main");
      await loadProjects();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Deployment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white p-8 text-black dark:bg-black dark:text-white sm:p-12">
      <div className="mx-auto max-w-6xl space-y-10">
        <header>
          <p className="text-sm font-medium uppercase tracking-widest opacity-60">Developer Cloud</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Ship without managing servers.</h1>
          <p className="mt-3 max-w-2xl text-sm opacity-70">
            MVP control plane backed by Coolify. Connect a Git repository and create a production deployment.
          </p>
        </header>

        <section className="rounded-2xl border border-black/10 p-6 shadow-sm dark:border-white/10">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">New project</h2>
              <p className="text-sm opacity-60">GitHub/GitLab public repository for the first MVP.</p>
            </div>
            <span className="rounded-full border px-3 py-1 text-xs">Coolify</span>
          </div>

          <form onSubmit={deploy} className="grid gap-4 md:grid-cols-3">
            <input className="rounded-xl border bg-transparent px-4 py-3" value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" required />
            <input className="rounded-xl border bg-transparent px-4 py-3 md:col-span-2" value={repositoryUrl} onChange={(e) => setRepositoryUrl(e.target.value)} placeholder="https://github.com/owner/repository" type="url" required />
            <input className="rounded-xl border bg-transparent px-4 py-3" value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="main" />
            <div className="flex items-center gap-3 md:col-span-2">
              <button disabled={loading} className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-black">
                {loading ? "Deploying…" : "Deploy project"}
              </button>
              {message ? <span className="text-sm opacity-70">{message}</span> : null}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest opacity-50">Start selling</p>
              <h2 className="text-2xl font-bold">Launch plan</h2>
              <p className="mt-1 text-sm opacity-60">Simple starter offer for early customers. Billing hooks are ready to connect next.</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-2xl font-bold">Rp49k<span className="text-sm font-normal opacity-50"> / bulan</span></div>
              <div className="text-xs opacity-50">1 project · 512 MB RAM · 5 GB storage</div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Projects</h2>
            <span className="text-sm opacity-50">{projects.length} total</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const latest = project.deployments?.[0];
              return (
                <article key={project.id} className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      <p className="mt-1 truncate text-xs opacity-50">{project.repositoryUrl}</p>
                    </div>
                    <span className="rounded-full border px-2 py-1 text-[11px]">{latest?.status ?? "new"}</span>
                  </div>
                  <div className="mt-5 text-xs opacity-60">{project.defaultBranch} · {project.provider}</div>
                  {latest?.url ? <a href={latest.url} target="_blank" rel="noreferrer" className="mt-3 block truncate text-sm underline">{latest.url}</a> : null}
                  <Link href={`/cloud/${project.id}`} className="mt-4 inline-block text-sm font-medium underline">Open project →</Link>
                </article>
              );
            })}
            {!projects.length ? <div className="rounded-2xl border border-dashed p-8 text-sm opacity-60">No projects yet. Deploy the first one above.</div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
