"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface Deployment {
  id: string;
  status: string;
  url: string | null;
  providerDeploymentId?: string | null;
  createdAt?: string;
}

interface Project {
  id: string;
  name: string;
  repositoryUrl: string | null;
  defaultBranch: string;
  provider: string;
  deployments: Deployment[];
  domains: Array<{ id: string; domain: string; status: string; isPrimary: boolean }>;
}

export default function CloudProjectPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [domain, setDomain] = useState("");
  const [logs, setLogs] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/cloud/projects", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Unable to load project");
    setProject((data.projects ?? []).find((item: Project) => item.id === params.id) ?? null);
    setLoading(false);
  }

  useEffect(() => {
    void load().catch((error) => {
      setMessage(error instanceof Error ? error.message : "Unable to load project");
      setLoading(false);
    });
  }, [params.id]);

  const latest = useMemo(() => project?.deployments?.[0], [project]);

  async function refresh() {
    if (!latest?.id) return;
    await fetch(`/api/cloud/deployments/${latest.id}`, { cache: "no-store" });
    await load();
  }

  async function restart() {
    setBusy("restart");
    setMessage("");
    try {
      const response = await fetch(`/api/cloud/projects/${params.id}/restart`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Restart failed");
      setMessage("Restart requested.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Restart failed");
    } finally {
      setBusy("");
    }
  }

  async function loadLogs() {
    if (!latest?.id) return;
    setBusy("logs");
    setMessage("");
    try {
      const response = await fetch(`/api/cloud/deployments/${latest.id}/logs`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Logs unavailable");
      setLogs(data.logs ?? "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Logs unavailable");
    } finally {
      setBusy("");
    }
  }

  async function connectDomain() {
    setBusy("domain");
    setMessage("");
    try {
      const response = await fetch(`/api/cloud/projects/${params.id}/domains`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, isPrimary: project?.domains.length === 0 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to connect domain");
      setDomain("");
      setMessage("Domain connected.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to connect domain");
    } finally {
      setBusy("");
    }
  }

  if (loading) return <main className="min-h-screen p-8">Loading project…</main>;
  if (!project) return <main className="min-h-screen p-8">Project not found.</main>;

  return (
    <main className="min-h-screen bg-white p-8 text-black dark:bg-black dark:text-white sm:p-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <Link href="/cloud" className="text-sm opacity-60 underline">← Developer Cloud</Link>
        <header>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest opacity-50">Project</p>
              <h1 className="mt-1 text-4xl font-bold">{project.name}</h1>
              <p className="mt-2 text-sm opacity-60">{project.repositoryUrl} · {project.defaultBranch} · {project.provider}</p>
            </div>
            <span className="rounded-full border px-3 py-1 text-xs">{latest?.status ?? "new"}</span>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <button onClick={() => void refresh()} className="rounded-xl border px-4 py-3 text-sm font-medium">Refresh status</button>
          <button onClick={() => void restart()} disabled={busy !== ""} className="rounded-xl border px-4 py-3 text-sm font-medium disabled:opacity-40">{busy === "restart" ? "Restarting…" : "Restart service"}</button>
          <button onClick={() => void loadLogs()} disabled={busy !== "" || !latest?.id} className="rounded-xl border px-4 py-3 text-sm font-medium disabled:opacity-40">{busy === "logs" ? "Loading logs…" : "View deployment logs"}</button>
        </section>

        {latest?.url ? <a href={latest.url} target="_blank" rel="noreferrer" className="block rounded-2xl border p-5 text-sm underline">Open live deployment: {latest.url}</a> : null}
        {message ? <div className="rounded-xl border p-4 text-sm opacity-70">{message}</div> : null}

        <section className="rounded-2xl border p-6">
          <h2 className="text-lg font-semibold">Custom domain</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="app.example.com" className="min-w-0 flex-1 rounded-xl border bg-transparent px-4 py-3" />
            <button onClick={() => void connectDomain()} disabled={!domain || busy !== ""} className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-black">Connect</button>
          </div>
          {project.domains.length ? <div className="mt-4 space-y-2">{project.domains.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"><span>{item.domain}</span><span className="text-xs opacity-50">{item.status}{item.isPrimary ? " · primary" : ""}</span></div>)}</div> : <p className="mt-3 text-sm opacity-50">No custom domains connected.</p>}
        </section>

        {logs ? <section className="rounded-2xl border p-6"><h2 className="text-lg font-semibold">Latest deployment logs</h2><pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-black p-4 text-xs text-white">{logs}</pre></section> : null}

        <section className="rounded-2xl border p-6">
          <h2 className="text-lg font-semibold">Deployment history</h2>
          <div className="mt-4 space-y-3">{project.deployments.map((deployment) => <div key={deployment.id} className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-sm font-medium">{deployment.status}</div><div className="text-xs opacity-50">{deployment.providerDeploymentId ?? deployment.id}</div></div>{deployment.url ? <a href={deployment.url} target="_blank" rel="noreferrer" className="text-sm underline">Open</a> : null}</div>)}</div>
        </section>
      </div>
    </main>
  );
}
